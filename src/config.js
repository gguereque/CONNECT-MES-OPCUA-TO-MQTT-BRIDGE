const fs = require('fs');
const path = require('path');
const {
  MessageSecurityMode,
  SecurityPolicy,
} = require('node-opcua');

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const toBool = (value, fallback = false) => {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const resolveSecurityMode = (rawMode = 'None') => {
  const mode = String(rawMode || 'None').trim();
  return MessageSecurityMode[mode] ?? MessageSecurityMode.None;
};

const resolveSecurityPolicy = (rawPolicy = 'None') => {
  const policy = String(rawPolicy || 'None').trim();
  if (SecurityPolicy[policy] !== undefined) return SecurityPolicy[policy];

  const policyKey = `Basic${policy.replace(/^Basic/i, '')}`;
  return SecurityPolicy[policyKey] ?? SecurityPolicy.None;
};

function buildConfig(env) {
  const mappingPath = path.resolve(process.cwd(), env.MAPPING_FILE || './config/mapping.json');

  return {
    opcua: {
      endpoint: env.OPCUA_ENDPOINT,
      securityMode: resolveSecurityMode(env.OPCUA_SECURITY_MODE),
      securityPolicy: resolveSecurityPolicy(env.OPCUA_SECURITY_POLICY),
      username: env.OPCUA_USERNAME || undefined,
      password: env.OPCUA_PASSWORD || undefined,
    },
    mqtt: {
      url: env.MQTT_URL,
      username: env.MQTT_USERNAME || undefined,
      password: env.MQTT_PASSWORD || undefined,
      clientId: env.MQTT_CLIENT_ID || `connectmes-opcua-bridge-${Math.random().toString(16).slice(2, 8)}`,
      qos: toInt(env.MQTT_QOS, 1),
      retain: toBool(env.MQTT_RETAIN, false),
    },
    app: {
      mappingPath,
      pollIntervalMs: toInt(env.POLL_INTERVAL_MS, 1000),
      logLevel: env.LOG_LEVEL || 'info',
    },
  };
}

function loadMapping(mappingPath) {
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`Mapping file not found: ${mappingPath}`);
  }

  const raw = fs.readFileSync(mappingPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.stations) || parsed.stations.length === 0) {
    throw new Error('mapping.stations must be a non-empty array');
  }

  return parsed;
}

module.exports = {
  buildConfig,
  loadMapping,
};
