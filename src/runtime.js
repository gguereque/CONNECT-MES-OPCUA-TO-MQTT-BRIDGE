const mqtt = require('mqtt');
const { OpcConnectionManager } = require('./opc-connection-manager');
const {
  AttributeIds,
  NodeClass,
} = require('node-opcua');

function toSqlDateTime(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    return ['1', 'true', 'on', 'run', 'marcha'].includes(lowered);
  }
  return false;
}

function normalizeInt(value, fallback = 0) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeOpcNodeId(nodeId) {
  const raw = String(nodeId || '').trim();
  return raw || 'RootFolder';
}

function nodeClassToString(nodeClass) {
  if (!nodeClass) return 'Unknown';
  if (typeof nodeClass === 'string') return nodeClass;
  if (typeof nodeClass.value === 'number' && NodeClass[nodeClass.value]) {
    return NodeClass[nodeClass.value];
  }
  if (typeof nodeClass.key === 'string') return nodeClass.key;
  if (typeof nodeClass.toString === 'function') return nodeClass.toString();
  return 'Unknown';
}

class BridgeRuntime {
  constructor(store) {
    this.store = store;

    this.mqttClient = null;
    this.opcManager = new OpcConnectionManager({
      info: (...args) => this.info(...args),
      warn: (...args) => this.warn(...args),
    });
    this.timer = null;
    this.opcReconnectTimer = null;
    this.opcReconnectIntervalMs = 15_000;

    this.settings = null;
    this.mappings = [];

    this.state = {
      startedAt: null,
      lastPollAt: null,
      mqttConnected: false,
      opcConnected: false,
      opcServers: {},
      lastError: null,
      pollIntervalMs: 1000,
      lastOpcAttemptAt: null,
      lastOpcSuccessAt: null,
    };

    this.lastNodeValues = new Map();
    this.lastPublishedAtByTrigger = new Map();
    this.lastOeeSignatureByStation = new Map();
    this.lastEstopStatusByStation = new Map();
    this.lastCustomSignatureByStation = new Map();
  }

  info(...args) {
    console.log('[bridge][info]', ...args);
  }

  warn(...args) {
    console.warn('[bridge][warn]', ...args);
  }

  error(...args) {
    console.error('[bridge][error]', ...args);
  }

  async start() {
    this.state.startedAt = new Date().toISOString();
    await this.reloadFromStore({ reconnect: true, restartTimer: true });
  }

  async stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.opcReconnectTimer) {
      clearInterval(this.opcReconnectTimer);
      this.opcReconnectTimer = null;
    }

    await this.disconnectOpc();
    this.disconnectMqtt();
  }

  getStatus() {
    const opcStatus = this.opcManager.getStatusSnapshot(this.settings);
    return {
      ...this.state,
      mappings: this.mappings.length,
      mqttUrl: this.settings?.mqtt?.url || '',
      opcServersConfigured: opcStatus.opcServersConfigured,
      opcServers: opcStatus.opcServers,
      opcConnected: opcStatus.opcConnected,
      opcRetryIntervalMs: this.opcReconnectIntervalMs,
    };
  }

  getOpcServersFromSettings() {
    return this.opcManager.getOpcServersFromSettings(this.settings);
  }

  getDefaultOpcServerId() {
    return this.opcManager.getDefaultOpcServerId(this.settings);
  }

  resolveOpcServerId(preferredServerId = '') {
    return this.opcManager.resolveOpcServerId(this.settings, preferredServerId);
  }

  async reloadFromStore({ reconnect = false, restartTimer = false } = {}) {
    this.settings = this.store.getConfig();
    this.mappings = this.store.getMappings();

    this.state.pollIntervalMs = Number(this.settings?.app?.pollIntervalMs || 1000);

    if (reconnect) {
      try {
        await this.reconnectClients();
      } catch (error) {
        // No abortar el reload: aun si OPC/MQTT fallan, hay que dejar el
        // polling y el retry loop de OPC corriendo para que se autorecupere.
        this.state.lastError = error.message;
        this.warn('Reconnect during reload failed:', error.message);
      }
    }

    if (restartTimer || this.timer) {
      this.startPolling();
    }

    this.startOpcReconnectLoop();

    this.info('Runtime reloaded', {
      mappings: this.mappings.length,
      pollIntervalMs: this.state.pollIntervalMs,
    });
  }

  async reconnectClients() {
    // Serializa llamadas concurrentes (p.ej. varios guardados de config seguidos):
    // sin esto, dos connectMqtt() en paralelo dejan un cliente huerfano cuyos
    // listeners viejos siguen pisando this.state.mqttConnected despues de conectar.
    this.reconnectChain = (this.reconnectChain || Promise.resolve())
      .catch(() => {})
      .then(() => this._reconnectClientsInner());
    return this.reconnectChain;
  }

  async _reconnectClientsInner() {
    this.disconnectMqtt();
    await this.disconnectOpc();

    await this.connectMqtt();
    await this.connectOpc();
  }

  async connectMqtt() {
    const mqttCfg = this.settings?.mqtt || {};
    if (!mqttCfg.url) {
      throw new Error('MQTT URL is required');
    }

    const client = mqtt.connect(mqttCfg.url, {
      username: mqttCfg.username || undefined,
      password: mqttCfg.password || undefined,
      clientId: mqttCfg.clientId || `connectmes-opcua-bridge-${Math.random().toString(16).slice(2, 8)}`,
      reconnectPeriod: 2000,
    });
    this.mqttClient = client;

    // Solo el cliente activo actual puede mutar el estado compartido.
    const isActive = () => this.mqttClient === client;

    client.on('connect', () => {
      if (!isActive()) return;
      this.state.mqttConnected = true;
      this.info(`MQTT connected: ${mqttCfg.url}`);
    });

    client.on('reconnect', () => {
      if (!isActive()) return;
      this.state.mqttConnected = false;
      this.warn('MQTT reconnecting...');
    });

    client.on('error', (err) => {
      if (!isActive()) return;
      this.state.mqttConnected = false;
      this.state.lastError = err.message;
      this.error('MQTT error:', err.message);
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('MQTT connection timeout')), 10_000);

      client.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      client.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  disconnectMqtt() {
    if (!this.mqttClient) return;
    const client = this.mqttClient;
    this.mqttClient = null;
    client.removeAllListeners();
    try {
      client.end(true);
    } catch (err) {
      this.warn('Error closing MQTT:', err.message);
    }
    this.state.mqttConnected = false;
  }

  stopOpcReconnectLoop() {
    if (this.opcReconnectTimer) {
      clearInterval(this.opcReconnectTimer);
      this.opcReconnectTimer = null;
    }
  }

  startOpcReconnectLoop() {
    const shouldKeepLoop = () => {
      if (!this.settings) return false;
      const opcStatus = this.opcManager.getStatusSnapshot(this.settings);
      const servers = Object.values(opcStatus.opcServers || {});
      return servers.some((server) => !server?.connected && server?.reason !== 'disabled');
    };

    this.stopOpcReconnectLoop();

    if (!this.settings || !this.opcManager.getOpcServersFromSettings(this.settings).some((server) => server.enabled && server.endpoint)) {
      return;
    }

    this.opcReconnectTimer = setInterval(async () => {
      try {
        this.state.lastOpcAttemptAt = new Date().toISOString();

        const snapshot = this.opcManager.getStatusSnapshot(this.settings);
        const disconnectedServers = Object.values(snapshot.opcServers || {}).filter((server) => server && !server.connected && server.reason !== 'disabled');

        if (disconnectedServers.length === 0) {
          this.stopOpcReconnectLoop();
          return;
        }

        const result = await this.opcManager.connectAll(this.settings);
        this.state.opcServers = result.opcServersState;
        this.state.opcConnected = result.opcConnected;

        if (result.opcConnected) {
          this.state.lastOpcSuccessAt = new Date().toISOString();
          this.state.lastError = null;
        }

        if (Object.values(result.opcServersState || {}).every((server) => !server || server.connected || server.reason === 'disabled')) {
          this.stopOpcReconnectLoop();
        }
      } catch (err) {
        this.state.lastError = err.message;
        this.warn('OPC reconnect retry failed:', err.message);
      }
    }, this.opcReconnectIntervalMs);
  }

  async connectOpc() {
    this.state.lastOpcAttemptAt = new Date().toISOString();

    const result = await this.opcManager.connectAll(this.settings);
    this.state.opcServers = result.opcServersState;
    this.state.opcConnected = result.opcConnected;

    if (this.state.opcConnected) {
      this.state.lastOpcSuccessAt = new Date().toISOString();
      this.stopOpcReconnectLoop();
      return;
    }

    this.startOpcReconnectLoop();
    throw new Error('No OPC servers connected. Verify OPC server configuration.');
  }

  async withOpcSession(serverId, task) {
    return this.opcManager.withSession(this.settings, serverId, task);
  }

  async disconnectOpc() {
    await this.opcManager.disconnectAll();
    const opcStatus = this.opcManager.getStatusSnapshot(this.settings);
    this.state.opcConnected = opcStatus.opcConnected;
    this.state.opcServers = opcStatus.opcServers;
  }

  startPolling() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    const intervalMs = Number(this.settings?.app?.pollIntervalMs || 1000);
    this.state.pollIntervalMs = intervalMs;

    this.timer = setInterval(async () => {
      try {
        await this.tick();
      } catch (err) {
        this.state.lastError = err.message;
        this.error('Polling cycle failed:', err.message);
      }
    }, intervalMs);

    this.info(`Polling started every ${intervalMs}ms`);
  }

  async readNodeValue(nodeId, serverId = '') {
    if (!nodeId) return undefined;

    return this.withOpcSession(serverId, async (session) => {
      const dataValue = await session.read(
        { nodeId, attributeId: AttributeIds.Value },
        0
      );

      if (!dataValue || dataValue.statusCode?.isNotGood?.()) {
        return undefined;
      }

      return dataValue.value?.value;
    });
  }

  async readNodeValueById(nodeId, serverId = '') {
    const targetNodeId = sanitizeOpcNodeId(nodeId);

    return this.withOpcSession(serverId, async (session, resolvedServerId) => {
      const dataValue = await session.read(
        { nodeId: targetNodeId, attributeId: AttributeIds.Value },
        0
      );

      const value = dataValue?.value?.value;
      return {
        serverId: resolvedServerId,
        nodeId: targetNodeId,
        value,
        dataType: dataValue?.value?.dataType ? String(dataValue.value.dataType) : null,
        sourceTimestamp: dataValue?.sourceTimestamp || null,
        serverTimestamp: dataValue?.serverTimestamp || null,
        statusCode: dataValue?.statusCode?.toString?.() || null,
      };
    });
  }

  async browseNode(nodeId = 'RootFolder', serverId = '') {
    const targetNodeId = sanitizeOpcNodeId(nodeId);

    return this.withOpcSession(serverId, async (session, resolvedServerId) => {
      const browseResult = await session.browse(targetNodeId);
      const refs = Array.isArray(browseResult?.references) ? browseResult.references : [];

      const children = refs.map((ref) => {
        const childNodeId = ref.nodeId?.toString?.() || String(ref.nodeId || '');
        return {
          nodeId: childNodeId,
          browseName: ref.browseName?.name || ref.displayName?.text || childNodeId,
          displayName: ref.displayName?.text || ref.browseName?.name || childNodeId,
          nodeClass: nodeClassToString(ref.nodeClass),
          typeDefinition: ref.typeDefinition?.toString?.() || null,
          isForward: Boolean(ref.isForward),
        };
      });

      return {
        serverId: resolvedServerId,
        nodeId: targetNodeId,
        referencesCount: children.length,
        children,
      };
    });
  }

  async readAllNodes(mapping) {
    const nodeIds = new Set();

    const functionalities = this.getFunctionalities(mapping);
    for (const feature of functionalities) {
      for (const nodeId of Object.values(feature.nodes || {})) {
        if (nodeId) nodeIds.add(nodeId);
      }

      const events = Array.isArray(feature.triggers) ? feature.triggers : [];
      for (const event of events) {
        if (event?.mode === 'onValueChanged' && event.triggerNodeId) {
          nodeIds.add(event.triggerNodeId);
        }
      }
    }

    const valuesByNodeId = {};
    const serverId = mapping.opcServerId || this.getDefaultOpcServerId();
    const nodesToRead = [...nodeIds].map((nodeId) => ({
      nodeId,
      attributeId: AttributeIds.Value,
    }));

    if (nodesToRead.length === 0) {
      return valuesByNodeId;
    }

    try {
      const dataValues = await this.withOpcSession(serverId, async (session) => session.read(nodesToRead, 0));
      nodesToRead.forEach((item, idx) => {
        const dataValue = dataValues?.[idx];
        valuesByNodeId[item.nodeId] = dataValue && !dataValue.statusCode?.isNotGood?.()
          ? dataValue.value?.value
          : undefined;
      });
    } catch (err) {
      for (const nodeId of nodeIds) {
        valuesByNodeId[nodeId] = undefined;
        this.warn(`Node read failed station ${mapping.stationId}, server ${serverId}, node ${nodeId}: ${err.message}`);
      }
    }

    return valuesByNodeId;
  }

  getNodeValueForProperty(mapping, valuesByNodeId, property, feature = null) {
    const nodeId = feature?.nodes?.[property] || mapping.nodes?.[property];
    if (!nodeId) return undefined;
    return valuesByNodeId[nodeId];
  }

  getFunctionalities(mapping) {
    if (Array.isArray(mapping.functionalities) && mapping.functionalities.length > 0) {
      return mapping.functionalities.map((feature, index) => ({
        id: String(feature.id || `feature-${index + 1}`),
        type: String(feature.type || 'custom'),
        name: String(feature.name || feature.type || `Feature ${index + 1}`),
        enabled: feature.enabled !== false,
        onlyOnChange: Boolean(feature.onlyOnChange),
        topic: String(feature.topic || ''),
        nodes: Object.fromEntries(
          Object.entries(feature.nodes || {}).filter(([, value]) => String(value || '').trim())
        ),
        triggers: Array.isArray(feature.triggers) && feature.triggers.length > 0
          ? feature.triggers.map((event) => ({
            mode: ['always', 'onValueChanged', 'intervalSeconds'].includes(event?.mode)
              ? event.mode
              : 'always',
            triggerNodeId: String(event?.triggerNodeId || ''),
            intervalSeconds: Number(event?.intervalSeconds || 0) || 0,
          }))
          : [{ mode: 'always', triggerNodeId: '', intervalSeconds: 0 }],
      }));
    }

    const oeeTrigger = mapping.triggers?.oee || {};
    const estopTrigger = mapping.triggers?.estop || {};
    return [
      {
        id: 'pieceCount',
        type: 'pieceCount',
        name: 'Piece Count',
        enabled: mapping.publish?.oee !== false,
        onlyOnChange: Boolean(mapping.publish?.oeeOnlyOnChange),
        topic: String(mapping.topics?.oee || ''),
        nodes: {
          marcha: String(mapping.nodes?.marcha || ''),
          parts_count: String(mapping.nodes?.parts_count || ''),
          parts_rejected: String(mapping.nodes?.parts_rejected || ''),
          Resolution: String(mapping.nodes?.Resolution || ''),
        },
        triggers: [{
          mode: oeeTrigger.mode || 'always',
          triggerNodeId: String(oeeTrigger.triggerNodeId || ''),
          intervalSeconds: Number(oeeTrigger.intervalSeconds || 0) || 0,
        }],
      },
      {
        id: 'machineStates',
        type: 'machineStates',
        name: 'Machine States',
        enabled: Boolean(mapping.publish?.estop),
        onlyOnChange: mapping.publish?.estopOnlyOnChange !== false,
        topic: String(mapping.topics?.estop || ''),
        nodes: {
          estop_status: String(mapping.nodes?.estop_status || ''),
          estop_motive: String(mapping.nodes?.estop_motive || ''),
        },
        triggers: [{
          mode: estopTrigger.mode || 'onValueChanged',
          triggerNodeId: String(estopTrigger.triggerNodeId || ''),
          intervalSeconds: Number(estopTrigger.intervalSeconds || 0) || 0,
        }],
      },
    ];
  }

  shouldPublishByTrigger(stationId, streamName, triggerMode, triggerNodeId, valuesByNodeId, intervalSeconds = 0) {
    if (triggerMode === 'intervalSeconds') {
      const intervalMs = Math.max(1, normalizeInt(intervalSeconds, 0)) * 1000;
      if (!intervalMs) return false;

      const key = `${stationId}:${streamName}:interval`;
      const nowMs = Date.now();
      const previousMs = this.lastPublishedAtByTrigger.get(key) || 0;
      if (nowMs - previousMs < intervalMs) return false;
      this.lastPublishedAtByTrigger.set(key, nowMs);
      return true;
    }

    if (triggerMode !== 'onValueChanged') return true;
    if (!triggerNodeId) return false;

    const key = `${stationId}:${streamName}:${triggerNodeId}`;
    const currentValue = valuesByNodeId[triggerNodeId];
    const previousValue = this.lastNodeValues.get(key);
    this.lastNodeValues.set(key, currentValue);

    return previousValue !== currentValue;
  }

  shouldPublishByTriggerEvents(mapping, feature, valuesByNodeId) {
    const events = Array.isArray(feature.triggers) && feature.triggers.length > 0
      ? feature.triggers
      : [{ mode: 'always', triggerNodeId: '', intervalSeconds: 0 }];

    return events.some((event, index) => this.shouldPublishByTrigger(
      mapping.stationId,
      `${feature.id || feature.type || 'feature'}:${index}`,
      event.mode,
      event.triggerNodeId,
      valuesByNodeId,
      event.intervalSeconds
    ));
  }

  inferResolutionFromIntervalSeconds(intervalSeconds) {
    const seconds = Math.max(1, normalizeInt(intervalSeconds, 0));
    return Math.max(1, Math.round(seconds / 60));
  }

  buildOeePayload(mapping, valuesByNodeId, feature = null) {
    const context = mapping.context || {};
    const resolutionFromNodeOrDefault =
      normalizeInt(
        this.getNodeValueForProperty(mapping, valuesByNodeId, 'Resolution', feature),
        normalizeInt(mapping.defaults?.Resolution, 1)
      );
    const intervalEvent = Array.isArray(feature?.triggers)
      ? feature.triggers.find((event) => event.mode === 'intervalSeconds' && Number(event.intervalSeconds || 0) > 0)
      : null;

    const resolution = intervalEvent
      ? this.inferResolutionFromIntervalSeconds(intervalEvent.intervalSeconds)
      : resolutionFromNodeOrDefault;

    return {
      facilities: String(context.facilities ?? ''),
      Area: String(context.Area ?? ''),
      Line: String(context.Line ?? ''),
      Station: String(mapping.stationId),
      marcha: normalizeBoolean(this.getNodeValueForProperty(mapping, valuesByNodeId, 'marcha', feature)),
      parts_count: normalizeInt(this.getNodeValueForProperty(mapping, valuesByNodeId, 'parts_count', feature), 0),
      parts_rejected: normalizeInt(this.getNodeValueForProperty(mapping, valuesByNodeId, 'parts_rejected', feature), 0),
      T_stamp: toSqlDateTime(new Date()),
      Resolution: resolution,
    };
  }

  buildEstopPayload(mapping, valuesByNodeId, feature = null) {
    const context = mapping.context || {};
    return {
      facilities: String(context.facilities ?? ''),
      Area: String(context.Area ?? ''),
      Line: String(context.Line ?? ''),
      ID: Number(mapping.stationId),
      motive: this.getNodeValueForProperty(mapping, valuesByNodeId, 'estop_motive', feature) == null
        ? null
        : normalizeInt(this.getNodeValueForProperty(mapping, valuesByNodeId, 'estop_motive', feature), null),
      status: normalizeInt(this.getNodeValueForProperty(mapping, valuesByNodeId, 'estop_status', feature), 1),
      T_stamp: toSqlDateTime(new Date()),
    };
  }

  buildCustomPayload(mapping, valuesByNodeId, feature) {
    const context = mapping.context || {};
    const data = {};

    for (const [fieldName, nodeId] of Object.entries(feature?.nodes || {})) {
      if (!fieldName || !nodeId) continue;
      data[fieldName] = valuesByNodeId[nodeId];
    }

    return {
      facilities: String(context.facilities ?? ''),
      Area: String(context.Area ?? ''),
      Line: String(context.Line ?? ''),
      Station: String(mapping.stationId),
      Functionality: String(feature?.name || feature?.type || 'custom'),
      FunctionalityType: String(feature?.type || 'custom'),
      T_stamp: toSqlDateTime(new Date()),
      ...data,
    };
  }

  shouldPublishOee(mapping, payload, feature = null) {
    if (feature?.onlyOnChange) {
      const signature = JSON.stringify({
        marcha: payload.marcha,
        parts_count: payload.parts_count,
        parts_rejected: payload.parts_rejected,
        Resolution: payload.Resolution,
      });

      const key = `${mapping.stationId}:${feature?.id || feature?.type || 'pieceCount'}`;
      const prev = this.lastOeeSignatureByStation.get(key);
      this.lastOeeSignatureByStation.set(key, signature);
      if (prev === signature) return false;
    }

    return true;
  }

  shouldPublishEstop(mapping, payload, feature = null) {
    if (feature?.onlyOnChange !== false) {
      const key = `${mapping.stationId}:${feature?.id || feature?.type || 'machineStates'}`;
      const prev = this.lastEstopStatusByStation.get(key);
      this.lastEstopStatusByStation.set(key, payload.status);
      if (prev === payload.status) return false;
    }

    return true;
  }

  shouldPublishCustom(mapping, payload, feature = null) {
    if (feature?.onlyOnChange) {
      const signature = JSON.stringify(payload);
      const key = `${mapping.stationId}:${feature?.id || feature?.type || 'custom'}`;
      const prev = this.lastCustomSignatureByStation.get(key);
      this.lastCustomSignatureByStation.set(key, signature);
      if (prev === signature) return false;
    }

    return true;
  }

  publishJson(topic, payload) {
    const qos = Number(this.settings?.mqtt?.qos || 1);
    const retain = Boolean(this.settings?.mqtt?.retain);

    this.mqttClient.publish(topic, JSON.stringify(payload), { qos, retain });
  }

  async processMapping(mapping) {
    const valuesByNodeId = await this.readAllNodes(mapping);

    const functionalities = this.getFunctionalities(mapping);
    for (const feature of functionalities) {
      if (!feature.enabled) continue;

      const byTrigger = this.shouldPublishByTriggerEvents(mapping, feature, valuesByNodeId);
      if (!byTrigger) continue;

      if (feature.type === 'pieceCount') {
        const payload = this.buildOeePayload(mapping, valuesByNodeId, feature);
        if (this.shouldPublishOee(mapping, payload, feature)) {
          const topic = feature.topic || this.settings?.topics?.oee || 'optimotion/oee';
          this.publishJson(topic, payload);
        }
        continue;
      }

      if (feature.type === 'machineStates') {
        const payload = this.buildEstopPayload(mapping, valuesByNodeId, feature);
        if (this.shouldPublishEstop(mapping, payload, feature)) {
          const topic = feature.topic || this.settings?.topics?.estop || 'optimotion/estop';
          this.publishJson(topic, payload);
        }
        continue;
      }

      if (feature.type === 'custom') {
        const topic = feature.topic || '';
        if (!topic) {
          this.warn(`Custom feature without topic ignored: station ${mapping.stationId}, feature ${feature.id || feature.name || 'custom'}`);
          continue;
        }

        const payload = this.buildCustomPayload(mapping, valuesByNodeId, feature);
        if (this.shouldPublishCustom(mapping, payload, feature)) {
          this.publishJson(topic, payload);
        }
        continue;
      }

      this.warn(`Feature type not implemented for runtime publish: ${feature.type}`);
    }
  }

  async tick() {
    if (!this.mqttClient || !this.state.mqttConnected || !this.state.opcConnected) {
      return;
    }

    for (const mapping of this.mappings) {
      await this.processMapping(mapping);
    }

    this.state.lastPollAt = new Date().toISOString();
  }
}

module.exports = {
  BridgeRuntime,
};
