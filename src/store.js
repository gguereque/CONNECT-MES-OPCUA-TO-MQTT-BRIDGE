const fs = require('fs');
const path = require('path');
const { openDb } = require('./db');

const DEFAULT_TOPICS = {
  oee: 'optimotion/oee',
  estop: 'optimotion/estop',
};

function resolveOpcAuthType(rawAuthType, username = '') {
  const normalized = String(rawAuthType || '').trim().toLowerCase();
  if (normalized === 'username' || normalized === 'certificate' || normalized === 'anonymous') {
    return normalized;
  }
  return username ? 'username' : 'anonymous';
}

function parseMaybeJson(rawValue, fallback) {
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function createDefaultConfigFromEnv(env) {
  const defaultOpcServerId = 'opc-1';
  const defaultUsername = env.OPCUA_USERNAME || '';

  return {
    opcua: {
      defaultServerId: defaultOpcServerId,
      servers: [
        {
          id: defaultOpcServerId,
          name: 'OPC Server 1',
          endpoint: env.OPCUA_ENDPOINT || '',
          securityMode: env.OPCUA_SECURITY_MODE || 'None',
          securityPolicy: env.OPCUA_SECURITY_POLICY || 'None',
          authType: resolveOpcAuthType(env.OPCUA_AUTH_TYPE || '', defaultUsername),
          username: defaultUsername,
          password: env.OPCUA_PASSWORD || '',
          userCertificateFile: env.OPCUA_USER_CERTIFICATE_FILE || '',
          userPrivateKeyFile: env.OPCUA_USER_PRIVATE_KEY_FILE || '',
          userCertificateRef: '',
          userPrivateKeyRef: '',
          enabled: true,
        },
      ],
    },
    mqtt: {
      url: env.MQTT_URL || 'mqtt://127.0.0.1:1883',
      username: env.MQTT_USERNAME || '',
      password: env.MQTT_PASSWORD || '',
      clientId: env.MQTT_CLIENT_ID || 'connectmes-opcua-bridge',
      qos: Number.parseInt(env.MQTT_QOS || '1', 10),
      retain: ['1', 'true', 'yes', 'on'].includes(String(env.MQTT_RETAIN || '').toLowerCase()),
    },
    topics: {
      oee: env.TOPIC_OEE || DEFAULT_TOPICS.oee,
      estop: env.TOPIC_ESTOP || DEFAULT_TOPICS.estop,
    },
    app: {
      pollIntervalMs: Number.parseInt(env.POLL_INTERVAL_MS || '1000', 10),
      webPort: Number.parseInt(env.BRIDGE_WEB_PORT || '3400', 10),
    },
    connectmes: {
      baseUrl: env.CONNECTMES_API_BASE_URL || 'http://backend:3000',
      stationsPath: env.CONNECTMES_STATIONS_PATH || '/api/stations/assignment/stations',
      token: env.CONNECTMES_API_TOKEN || '',
    },
  };
}

function normalizeOpcConfig(opcua = {}, defaultsOpcua = createDefaultConfigFromEnv(process.env).opcua) {
  if (Array.isArray(opcua.servers) && opcua.servers.length > 0) {
    const servers = opcua.servers
      .map((server, idx) => ({
        id: String(server.id || `opc-${idx + 1}`),
        name: String(server.name || `OPC Server ${idx + 1}`),
        endpoint: String(server.endpoint || ''),
        securityMode: String(server.securityMode || 'None'),
        securityPolicy: String(server.securityPolicy || 'None'),
        authType: resolveOpcAuthType(server.authType, server.username || ''),
        username: String(server.username || ''),
        password: String(server.password || ''),
        userCertificateFile: String(server.userCertificateFile || ''),
        userPrivateKeyFile: String(server.userPrivateKeyFile || ''),
        userCertificateRef: String(server.userCertificateRef || ''),
        userPrivateKeyRef: String(server.userPrivateKeyRef || ''),
        enabled: server.enabled !== false,
      }))
      .filter((server) => server.id);

    const defaultServerId = String(opcua.defaultServerId || servers[0]?.id || defaultsOpcua.defaultServerId);
    return { defaultServerId, servers };
  }

  const legacyEndpoint = String(opcua.endpoint || '').trim();
  const server = {
    id: defaultsOpcua.defaultServerId,
    name: 'OPC Server 1',
    endpoint: legacyEndpoint,
    securityMode: String(opcua.securityMode || 'None'),
    securityPolicy: String(opcua.securityPolicy || 'None'),
    authType: resolveOpcAuthType(opcua.authType, opcua.username || ''),
    username: String(opcua.username || ''),
    password: String(opcua.password || ''),
    userCertificateFile: String(opcua.userCertificateFile || ''),
    userPrivateKeyFile: String(opcua.userPrivateKeyFile || ''),
    userCertificateRef: String(opcua.userCertificateRef || ''),
    userPrivateKeyRef: String(opcua.userPrivateKeyRef || ''),
    enabled: true,
  };

  return {
    defaultServerId: defaultsOpcua.defaultServerId,
    servers: [server],
  };
}

function normalizeBridgeConfig(config = {}, env = process.env) {
  const defaults = createDefaultConfigFromEnv(env);

  return {
    ...defaults,
    ...(config || {}),
    opcua: normalizeOpcConfig(config?.opcua || {}, defaults.opcua),
    mqtt: {
      ...defaults.mqtt,
      ...(config?.mqtt || {}),
    },
    topics: {
      ...defaults.topics,
      ...(config?.topics || {}),
    },
    app: {
      ...defaults.app,
      ...(config?.app || {}),
    },
    connectmes: {
      ...defaults.connectmes,
      ...(config?.connectmes || {}),
    },
  };
}

const FUNCTIONALITY_DEFAULTS = {
  pieceCount: {
    name: 'Piece Count',
    enabled: true,
    onlyOnChange: false,
    topic: '',
    trigger: { mode: 'always', triggerNodeId: '', intervalSeconds: 0 },
  },
  machineStates: {
    name: 'Machine States',
    enabled: false,
    onlyOnChange: true,
    topic: '',
    trigger: { mode: 'onValueChanged', triggerNodeId: '', intervalSeconds: 0 },
  },
};

function normalizeTriggerEvent(raw = {}, fallbackMode = 'always') {
  const mode = ['always', 'onValueChanged', 'intervalSeconds'].includes(raw.mode)
    ? raw.mode
    : fallbackMode;

  return {
    mode,
    triggerNodeId: String(raw.triggerNodeId || ''),
    intervalSeconds: Number(raw.intervalSeconds ?? 0) || 0,
  };
}

function normalizeFunctionalities(rawFunctionalities = [], legacy = {}) {
  const legacyNodes = legacy.nodes || {};

  const fallbackNodesByType = {
    pieceCount: {
      marcha: String(legacyNodes.marcha || ''),
      parts_count: String(legacyNodes.parts_count || ''),
      parts_rejected: String(legacyNodes.parts_rejected || ''),
      Resolution: String(legacyNodes.Resolution || ''),
    },
    machineStates: {
      estop_status: String(legacyNodes.estop_status || ''),
      estop_motive: String(legacyNodes.estop_motive || ''),
    },
  };

  if (Array.isArray(rawFunctionalities) && rawFunctionalities.length > 0) {
    return rawFunctionalities.map((item, index) => {
      const type = String(item.type || item.id || 'custom');
      const defaults = FUNCTIONALITY_DEFAULTS[type] || {
        name: 'Custom',
        enabled: false,
        onlyOnChange: false,
        topic: '',
        trigger: { mode: 'always', triggerNodeId: '', intervalSeconds: 0 },
      };

      const triggers = Array.isArray(item.triggers) && item.triggers.length > 0
        ? item.triggers.map((event) => normalizeTriggerEvent(event, defaults.trigger.mode))
        : [normalizeTriggerEvent(defaults.trigger, defaults.trigger.mode)];

      const explicitNodes = Object.fromEntries(
        Object.entries(item.nodes || {}).filter(([, value]) => String(value || '').trim())
      );
      const backfilledNodes = Object.fromEntries(
        Object.entries(fallbackNodesByType[type] || {}).filter(([, value]) => String(value || '').trim())
      );

      return {
        id: String(item.id || `${type}-${index + 1}`),
        name: String(item.name || defaults.name),
        type,
        enabled: item.enabled !== false,
        onlyOnChange: Boolean(item.onlyOnChange),
        topic: String(item.topic || defaults.topic),
        triggers,
        nodes: Object.keys(explicitNodes).length > 0 ? explicitNodes : backfilledNodes,
      };
    });
  }

  const oeeTrigger = legacy.triggers?.oee || {};
  const estopTrigger = legacy.triggers?.estop || {};

  return [
    {
      id: 'pieceCount',
      name: FUNCTIONALITY_DEFAULTS.pieceCount.name,
      type: 'pieceCount',
      enabled: legacy.publish?.oee !== false,
      onlyOnChange: Boolean(legacy.publish?.oeeOnlyOnChange),
      topic: String(legacy.topics?.oee || ''),
      triggers: [normalizeTriggerEvent({
        mode: oeeTrigger.mode || 'always',
        triggerNodeId: oeeTrigger.triggerNodeId || '',
        intervalSeconds: oeeTrigger.intervalSeconds || 0,
      }, 'always')],
      nodes: {
        marcha: String(legacyNodes.marcha || ''),
        parts_count: String(legacyNodes.parts_count || ''),
        parts_rejected: String(legacyNodes.parts_rejected || ''),
        Resolution: String(legacyNodes.Resolution || ''),
      },
    },
    {
      id: 'machineStates',
      name: FUNCTIONALITY_DEFAULTS.machineStates.name,
      type: 'machineStates',
      enabled: Boolean(legacy.publish?.estop),
      onlyOnChange: legacy.publish?.estopOnlyOnChange !== false,
      topic: String(legacy.topics?.estop || ''),
      triggers: [normalizeTriggerEvent({
        mode: estopTrigger.mode || 'onValueChanged',
        triggerNodeId: estopTrigger.triggerNodeId || '',
        intervalSeconds: estopTrigger.intervalSeconds || 0,
      }, 'onValueChanged')],
      nodes: {
        estop_status: String(legacyNodes.estop_status || ''),
        estop_motive: String(legacyNodes.estop_motive || ''),
      },
    },
  ];
}

function buildLegacyFieldsFromFunctionalities(functionalities = []) {
  const pieceCount = functionalities.find((item) => item.type === 'pieceCount') || null;
  const machineStates = functionalities.find((item) => item.type === 'machineStates') || null;

  const pickTrigger = (feature, fallbackMode) => {
    if (!feature || !Array.isArray(feature.triggers) || feature.triggers.length === 0) {
      return normalizeTriggerEvent({ mode: fallbackMode }, fallbackMode);
    }

    const specific = feature.triggers.find((evt) => evt.mode === 'onValueChanged' || evt.mode === 'intervalSeconds');
    return normalizeTriggerEvent(specific || feature.triggers[0], fallbackMode);
  };

  return {
    publish: {
      oee: pieceCount ? pieceCount.enabled : true,
      estop: machineStates ? machineStates.enabled : false,
      oeeOnlyOnChange: pieceCount ? pieceCount.onlyOnChange : false,
      estopOnlyOnChange: machineStates ? machineStates.onlyOnChange : true,
    },
    topics: {
      oee: pieceCount?.topic || '',
      estop: machineStates?.topic || '',
    },
    triggers: {
      oee: pickTrigger(pieceCount, 'always'),
      estop: pickTrigger(machineStates, 'onValueChanged'),
    },
    nodes: Object.assign(
      {},
      pieceCount?.nodes || {},
      machineStates?.nodes || {}
    ),
  };
}

function mapJsonToDbMapping(item) {
  const stationId = Number(item.stationId);
  const context = item.context || {};
  const functionalities = normalizeFunctionalities(item.functionalities, item);
  const legacy = buildLegacyFieldsFromFunctionalities(functionalities);

  return {
    stationId,
    context: {
      facilities: String(context.facilities ?? ''),
      Area: String(context.Area ?? ''),
      Line: String(context.Line ?? ''),
    },
    defaults: {
      Resolution: Number(item.defaults?.Resolution ?? 1) || 1,
    },
    functionalities,
    publish: legacy.publish,
    topics: legacy.topics,
    triggers: legacy.triggers,
    opcServerId: String(item.opcServerId || ''),
    nodes: legacy.nodes,
  };
}

function loadMappingJsonIfExists() {
  const mappingPath = path.resolve(process.cwd(), './config/mapping.json');
  if (!fs.existsSync(mappingPath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    if (!Array.isArray(parsed.stations)) return null;
    return parsed;
  } catch {
    return null;
  }
}

class BridgeStore {
  constructor(env = process.env) {
    this.env = env;
    this.db = openDb();
    this.migrate();
    this.seedIfEmpty();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS station_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stationId INTEGER NOT NULL UNIQUE,
        facilities TEXT NOT NULL,
        area TEXT NOT NULL,
        line TEXT NOT NULL,
        resolutionDefault INTEGER NOT NULL DEFAULT 1,
        publishOee INTEGER NOT NULL DEFAULT 1,
        publishEstop INTEGER NOT NULL DEFAULT 0,
        oeeOnlyOnChange INTEGER NOT NULL DEFAULT 0,
        estopOnlyOnChange INTEGER NOT NULL DEFAULT 1,
        oeeTopic TEXT NOT NULL DEFAULT '',
        estopTopic TEXT NOT NULL DEFAULT '',
        oeeTriggerMode TEXT NOT NULL DEFAULT 'always',
        oeeTriggerNodeId TEXT NOT NULL DEFAULT '',
        oeeTriggerIntervalSeconds INTEGER NOT NULL DEFAULT 0,
        estopTriggerMode TEXT NOT NULL DEFAULT 'onValueChanged',
        estopTriggerNodeId TEXT NOT NULL DEFAULT '',
        estopTriggerIntervalSeconds INTEGER NOT NULL DEFAULT 0,
        functionalitiesJson TEXT NOT NULL DEFAULT '',
        opcServerId TEXT NOT NULL DEFAULT '',
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tag_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stationMappingId INTEGER NOT NULL,
        property TEXT NOT NULL,
        nodeId TEXT NOT NULL,
        FOREIGN KEY(stationMappingId) REFERENCES station_mappings(id) ON DELETE CASCADE,
        UNIQUE(stationMappingId, property)
      );
    `);

    const columns = this.db.prepare("PRAGMA table_info('station_mappings')").all();
    const hasOpcServerId = columns.some((col) => col.name === 'opcServerId');
    if (!hasOpcServerId) {
      this.db.exec("ALTER TABLE station_mappings ADD COLUMN opcServerId TEXT NOT NULL DEFAULT ''");
    }

    const hasOeeTriggerIntervalSeconds = columns.some((col) => col.name === 'oeeTriggerIntervalSeconds');
    if (!hasOeeTriggerIntervalSeconds) {
      this.db.exec('ALTER TABLE station_mappings ADD COLUMN oeeTriggerIntervalSeconds INTEGER NOT NULL DEFAULT 0');
    }

    const hasEstopTriggerIntervalSeconds = columns.some((col) => col.name === 'estopTriggerIntervalSeconds');
    if (!hasEstopTriggerIntervalSeconds) {
      this.db.exec('ALTER TABLE station_mappings ADD COLUMN estopTriggerIntervalSeconds INTEGER NOT NULL DEFAULT 0');
    }

    const hasFunctionalitiesJson = columns.some((col) => col.name === 'functionalitiesJson');
    if (!hasFunctionalitiesJson) {
      this.db.exec("ALTER TABLE station_mappings ADD COLUMN functionalitiesJson TEXT NOT NULL DEFAULT ''");
    }
  }

  seedIfEmpty() {
    const hasConfig = this.db.prepare('SELECT id FROM app_config WHERE id = 1').get();
    if (!hasConfig) {
      const cfg = createDefaultConfigFromEnv(this.env);
      this.db.prepare('INSERT INTO app_config (id, data) VALUES (1, ?)').run(JSON.stringify(cfg));
    }

    const count = this.db.prepare('SELECT COUNT(*) AS n FROM station_mappings').get().n;
    if (count > 0) return;

    const mappingJson = loadMappingJsonIfExists();
    if (!mappingJson) return;

    const rows = mappingJson.stations
      .map(mapJsonToDbMapping)
      .filter((row) => Number.isFinite(row.stationId) && row.stationId > 0);

    this.replaceMappings(rows);
  }

  getConfig() {
    const row = this.db.prepare('SELECT data FROM app_config WHERE id = 1').get();
    const parsed = parseMaybeJson(row?.data, createDefaultConfigFromEnv(this.env));
    const normalized = normalizeBridgeConfig(parsed, this.env);

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      this.db
        .prepare('UPDATE app_config SET data = ?, updatedAt = datetime(\'now\') WHERE id = 1')
        .run(JSON.stringify(normalized));
    }

    return normalized;
  }

  saveConfig(config) {
    const merged = normalizeBridgeConfig(config, this.env);

    this.db
      .prepare('UPDATE app_config SET data = ?, updatedAt = datetime(\'now\') WHERE id = 1')
      .run(JSON.stringify(merged));

    return merged;
  }

  getMappings() {
    const stations = this.db
      .prepare('SELECT * FROM station_mappings ORDER BY stationId ASC')
      .all();

    const tagsByStationId = new Map();
    const tags = this.db
      .prepare('SELECT stationMappingId, property, nodeId FROM tag_mappings ORDER BY property ASC')
      .all();

    for (const tag of tags) {
      if (!tagsByStationId.has(tag.stationMappingId)) tagsByStationId.set(tag.stationMappingId, {});
      tagsByStationId.get(tag.stationMappingId)[tag.property] = tag.nodeId;
    }

    return stations.map((row) => {
      const legacy = {
        publish: {
          oee: Boolean(row.publishOee),
          estop: Boolean(row.publishEstop),
          oeeOnlyOnChange: Boolean(row.oeeOnlyOnChange),
          estopOnlyOnChange: Boolean(row.estopOnlyOnChange),
        },
        topics: {
          oee: row.oeeTopic,
          estop: row.estopTopic,
        },
        triggers: {
          oee: {
            mode: row.oeeTriggerMode,
            triggerNodeId: row.oeeTriggerNodeId,
            intervalSeconds: Number(row.oeeTriggerIntervalSeconds || 0),
          },
          estop: {
            mode: row.estopTriggerMode,
            triggerNodeId: row.estopTriggerNodeId,
            intervalSeconds: Number(row.estopTriggerIntervalSeconds || 0),
          },
        },
        nodes: tagsByStationId.get(row.id) || {},
      };

      const functionalities = normalizeFunctionalities(parseMaybeJson(row.functionalitiesJson, []), legacy);
      const normalizedLegacy = buildLegacyFieldsFromFunctionalities(functionalities);

      return {
        id: row.id,
        stationId: row.stationId,
        context: {
          facilities: row.facilities,
          Area: row.area,
          Line: row.line,
        },
        defaults: {
          Resolution: row.resolutionDefault,
        },
        functionalities,
        publish: normalizedLegacy.publish,
        topics: normalizedLegacy.topics,
        triggers: normalizedLegacy.triggers,
        opcServerId: row.opcServerId || '',
        nodes: normalizedLegacy.nodes,
      };
    });
  }

  replaceMappings(mappings) {
    const tx = this.db.transaction((rows) => {
      this.db.prepare('DELETE FROM tag_mappings').run();
      this.db.prepare('DELETE FROM station_mappings').run();

      const insertStation = this.db.prepare(`
        INSERT INTO station_mappings (
          stationId, facilities, area, line, resolutionDefault,
          publishOee, publishEstop, oeeOnlyOnChange, estopOnlyOnChange,
          oeeTopic, estopTopic, oeeTriggerMode, oeeTriggerNodeId, oeeTriggerIntervalSeconds,
          estopTriggerMode, estopTriggerNodeId, estopTriggerIntervalSeconds, functionalitiesJson, opcServerId, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      const insertTag = this.db.prepare(
        'INSERT INTO tag_mappings (stationMappingId, property, nodeId) VALUES (?, ?, ?)'
      );

      for (const item of rows) {
        const stationId = Number(item.stationId);
        if (!Number.isFinite(stationId) || stationId <= 0) {
          continue;
        }

        const context = item.context || {};
        const functionalities = normalizeFunctionalities(item.functionalities, item);
        const legacy = buildLegacyFieldsFromFunctionalities(functionalities);
        const publish = legacy.publish;
        const topics = legacy.topics;
        const triggers = legacy.triggers;
        const nodes = legacy.nodes;

        const result = insertStation.run(
          stationId,
          String(context.facilities ?? ''),
          String(context.Area ?? ''),
          String(context.Line ?? ''),
          Number(item.defaults?.Resolution ?? 1) || 1,
          publish.oee === false ? 0 : 1,
          publish.estop ? 1 : 0,
          publish.oeeOnlyOnChange ? 1 : 0,
          publish.estopOnlyOnChange === false ? 0 : 1,
          String(topics.oee || ''),
          String(topics.estop || ''),
          String(triggers.oee?.mode || 'always'),
          String(triggers.oee?.triggerNodeId || ''),
          Number(triggers.oee?.intervalSeconds ?? 0) || 0,
          String(triggers.estop?.mode || 'onValueChanged'),
          String(triggers.estop?.triggerNodeId || ''),
          Number(triggers.estop?.intervalSeconds ?? 0) || 0,
          JSON.stringify(functionalities),
          String(item.opcServerId || '')
        );

        const stationMappingId = result.lastInsertRowid;

        for (const [property, nodeId] of Object.entries(nodes)) {
          if (!nodeId) continue;
          insertTag.run(stationMappingId, String(property), String(nodeId));
        }
      }
    });

    tx(mappings || []);
    return this.getMappings();
  }
}

module.exports = {
  BridgeStore,
};
