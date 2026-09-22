/**
 * signal-resolver.js
 *
 * Resuelve el valor de una propiedad de una funcionalidad (`marcha`, `parts_count`, etc.)
 * cuando esa propiedad no es un NodeId simple, sino una de estas formas calculadas:
 *
 *  - { type: 'expression', inputs: { alias: nodeId, ... }, expression: '...' }
 *      Fórmula matemática/lógica pura (sin memoria) sobre el valor actual de varios nodos.
 *      Evaluada con `expr-eval` (sandbox de expresiones, nunca eval()/Function() sobre JS real).
 *
 *  - { type: 'activityTimeout', watch: nodeId, afterSeconds: N }
 *      Para cuando NO existe una señal directa de marcha/paro: infiere el valor observando
 *      si `watch` (normalmente un contador) cambió en los últimos `afterSeconds` segundos.
 *      true mientras haya actividad reciente, false si se "congela" más de ese tiempo.
 *
 *  - { type: 'function', inputs: { alias: nodeId, ... }, code: '...' }
 *      Escape hatch avanzado: cuerpo de función JS ejecutado en un contexto aislado
 *      (Node vm, sin require/process/fs/red) con timeout corto. Para lo que de plano no
 *      entre en una expresión (ej. parsear un arreglo de protocolo de producción).
 *
 * Un valor de propiedad que sigue siendo un string/number simple (el caso de hoy) se
 * trata igual que siempre: es un NodeId, se busca su valor leído en `valuesByNodeId`.
 */

const { Parser } = require('expr-eval');
const vm = require('vm');

// Parser de expresiones compartido. Se deshabilita 'assignment' (=) para que una
// expresión nunca pueda "escribir" nada, solo leer y calcular.
const exprParser = new Parser({
  operators: {
    assignment: false,
  },
});

function isPlainNodeId(value) {
  return typeof value === 'string' || typeof value === 'number';
}

function isComputedConfig(value) {
  return value !== null && typeof value === 'object' && typeof value.type === 'string';
}

/**
 * Agrega a `into` (un Set) todos los NodeId reales que hacen falta leer del OPC UA
 * para poder resolver este valor de propiedad, sin importar si es un NodeId directo
 * o una configuración calculada.
 */
function collectNodeIdsForPropertyValue(value, into) {
  if (value == null) return;

  if (isPlainNodeId(value)) {
    const nodeId = String(value).trim();
    if (nodeId) into.add(nodeId);
    return;
  }

  if (!isComputedConfig(value)) return;

  const type = value.type.trim();
  if (type === 'expression' || type === 'function') {
    for (const nodeId of Object.values(value.inputs || {})) {
      const trimmed = String(nodeId || '').trim();
      if (trimmed) into.add(trimmed);
    }
  } else if (type === 'activityTimeout') {
    const trimmed = String(value.watch || '').trim();
    if (trimmed) into.add(trimmed);
  }
}

function buildInputsScope(inputsMap, valuesByNodeId) {
  const scope = {};
  for (const [alias, nodeId] of Object.entries(inputsMap || {})) {
    scope[alias] = valuesByNodeId[String(nodeId || '').trim()];
  }
  return scope;
}

function evaluateExpression(config, valuesByNodeId, logger) {
  const expressionText = String(config.expression || '').trim();
  if (!expressionText) return undefined;

  const scope = buildInputsScope(config.inputs, valuesByNodeId);

  try {
    const expr = exprParser.parse(expressionText);
    return expr.evaluate(scope);
  } catch (err) {
    if (logger) logger(`Expresión inválida "${expressionText}": ${err.message}`);
    return undefined;
  }
}

/**
 * Infiere un booleano de actividad: true si `watch` cambió de valor dentro de los
 * últimos `afterSeconds` segundos, false si se mantuvo congelado más tiempo que eso.
 *
 * `stateStore` es un Map persistente (vive en la instancia de BridgeRuntime, una entrada
 * por estación+funcionalidad+propiedad) donde se guarda { value, lastChangedAt }.
 */
function evaluateActivityTimeout(config, valuesByNodeId, now, stateKey, stateStore) {
  const watchNodeId = String(config.watch || '').trim();
  const afterMs = Math.max(0, Number(config.afterSeconds || 0)) * 1000;
  if (!watchNodeId || !stateStore || !stateKey) return undefined;

  const currentValue = valuesByNodeId[watchNodeId];
  const previous = stateStore.get(stateKey);

  let lastChangedAt = now;
  if (previous && previous.value === currentValue) {
    lastChangedAt = previous.lastChangedAt;
  }
  stateStore.set(stateKey, { value: currentValue, lastChangedAt });

  if (currentValue === undefined) return undefined;
  return (now - lastChangedAt) <= afterMs;
}

/**
 * Ejecuta código JS arbitrario (avanzado) en un contexto aislado, con timeout corto.
 * `inputs` es el único objeto visible dentro del código; no hay require/process/fs/red.
 * Cualquier excepción o timeout se captura y regresa `undefined` (esa propiedad
 * simplemente no se publica ese ciclo, nunca debe tumbar el loop de poll).
 */
function evaluateFunction(config, valuesByNodeId, logger) {
  const code = String(config.code || '');
  if (!code.trim()) return undefined;

  const inputs = buildInputsScope(config.inputs, valuesByNodeId);

  try {
    const sandbox = { inputs, __result: undefined };
    const context = vm.createContext(sandbox, {
      codeGeneration: { strings: false, wasm: false },
    });
    const script = new vm.Script(`__result = (function (inputs) {\n${code}\n})(inputs);`);
    script.runInContext(context, { timeout: 50 });
    return sandbox.__result;
  } catch (err) {
    if (logger) logger(`Función avanzada falló: ${err.message}`);
    return undefined;
  }
}

/**
 * Punto de entrada único: resuelve el valor final de una propiedad, sin importar
 * si viene de un NodeId directo o de una de las 3 configuraciones calculadas.
 */
function resolvePropertyValue({ value, valuesByNodeId, now = Date.now(), stateKey, stateStore, logger }) {
  if (value == null) return undefined;

  if (isPlainNodeId(value)) {
    const nodeId = String(value).trim();
    if (!nodeId) return undefined;
    return valuesByNodeId[nodeId];
  }

  if (!isComputedConfig(value)) return undefined;

  switch (value.type.trim()) {
    case 'expression':
      return evaluateExpression(value, valuesByNodeId, logger);
    case 'activityTimeout':
      return evaluateActivityTimeout(value, valuesByNodeId, now, stateKey, stateStore);
    case 'function':
      return evaluateFunction(value, valuesByNodeId, logger);
    default:
      return undefined;
  }
}

module.exports = {
  isPlainNodeId,
  isComputedConfig,
  collectNodeIdsForPropertyValue,
  resolvePropertyValue,
};
