const fs = require('fs');
const path = require('path');
const { convertPEMtoDER } = require('node-opcua-crypto');
const {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  UserTokenType,
} = require('node-opcua');

function resolveSecurityMode(rawMode = 'None') {
  const mode = String(rawMode || 'None').trim();
  return MessageSecurityMode[mode] ?? MessageSecurityMode.None;
}

function resolveSecurityPolicy(rawPolicy = 'None') {
  const policy = String(rawPolicy || 'None').trim();
  if (SecurityPolicy[policy] !== undefined) return SecurityPolicy[policy];
  const policyKey = `Basic${policy.replace(/^Basic/i, '')}`;
  return SecurityPolicy[policyKey] ?? SecurityPolicy.None;
}

function resolveOpcAuthType(rawAuthType, username = '') {
  const normalized = String(rawAuthType || '').trim().toLowerCase();
  if (normalized === 'anonymous' || normalized === 'username' || normalized === 'certificate') {
    return normalized;
  }
  return username ? 'username' : 'anonymous';
}

function resolveReadableFilePath(rawPath = '') {
  const value = String(rawPath || '').trim();
  if (!value) return '';

  const resolved = path.isAbsolute(value)
    ? value
    : path.resolve(process.cwd(), value);

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${value}`);
  }

  return resolved;
}

function readUserCertificateData(filePath) {
  const raw = fs.readFileSync(filePath);
  const maybePem = raw.toString('utf8');
  if (maybePem.includes('BEGIN CERTIFICATE')) {
    return Buffer.from(convertPEMtoDER(maybePem));
  }
  return raw;
}

function resolvePreferredFilePath(primaryPath = '', fallbackPath = '') {
  const primary = String(primaryPath || '').trim();
  if (primary) return resolveReadableFilePath(primary);

  const fallback = String(fallbackPath || '').trim();
  if (fallback) return resolveReadableFilePath(fallback);

  return '';
}

class OpcConnectionManager {
  constructor({ info = () => {}, warn = () => {} } = {}) {
    this.info = info;
    this.warn = warn;
    this.connectionTimeoutMs = 8_000;
    this.opcConnections = new Map();
    this.lastConnectionState = {
      opcServersState: {},
      opcConnected: false,
    };
  }

  async withConnectionTimeout(operation, timeoutMs = this.connectionTimeoutMs, operationName = 'OPC UA operation') {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  getStatusSnapshot(settings = {}) {
    return {
      opcServersConfigured: this.getOpcServersFromSettings(settings).length,
      opcServers: { ...this.lastConnectionState.opcServersState },
      opcConnected: Boolean(this.lastConnectionState.opcConnected),
    };
  }

  getOpcServersFromSettings(settings = {}) {
    const opcua = settings?.opcua || {};
    const servers = Array.isArray(opcua.servers) ? opcua.servers : [];

    if (servers.length > 0) {
      return servers
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
    }

    const legacyEndpoint = String(opcua.endpoint || '');
    return [{
      id: String(opcua.defaultServerId || 'opc-1'),
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
    }];
  }

  getDefaultOpcServerId(settings = {}) {
    const configured = String(settings?.opcua?.defaultServerId || '').trim();
    const servers = this.getOpcServersFromSettings(settings);
    if (configured && servers.some((server) => server.id === configured)) return configured;
    return servers[0]?.id || '';
  }

  resolveOpcServerId(settings = {}, preferredServerId = '') {
    const servers = this.getOpcServersFromSettings(settings);
    const preferred = String(preferredServerId || '').trim();

    if (preferred && servers.some((server) => server.id === preferred)) {
      return preferred;
    }

    return this.getDefaultOpcServerId(settings);
  }

  buildOpcConnectionConfig(settings = {}, serverId = '') {
    const resolvedServerId = this.resolveOpcServerId(settings, serverId);
    const server = this.getOpcServersFromSettings(settings).find((item) => item.id === resolvedServerId);

    if (!server || !server.endpoint) {
      throw new Error(`OPC UA endpoint is required for server ${resolvedServerId || '(default)'}`);
    }

    return {
      id: resolvedServerId,
      endpoint: server.endpoint,
      securityMode: resolveSecurityMode(server.securityMode),
      securityPolicy: resolveSecurityPolicy(server.securityPolicy),
      authType: resolveOpcAuthType(server.authType, server.username),
      username: server.username || '',
      password: server.password || '',
      userCertificateFile: server.userCertificateFile || '',
      userPrivateKeyFile: server.userPrivateKeyFile || '',
      userCertificateRef: server.userCertificateRef || '',
      userPrivateKeyRef: server.userPrivateKeyRef || '',
    };
  }

  buildOpcIdentity(cfg) {
    const authType = resolveOpcAuthType(cfg.authType, cfg.username || '');

    if (authType === 'certificate') {
      const certPath = resolvePreferredFilePath(cfg.userCertificateRef, cfg.userCertificateFile);
      const keyPath = resolvePreferredFilePath(cfg.userPrivateKeyRef, cfg.userPrivateKeyFile);

      if (!certPath || !keyPath) {
        throw new Error('Certificate auth requires certificate/private key files (uploaded or manual path)');
      }

      return {
        type: UserTokenType.Certificate,
        certificateData: readUserCertificateData(certPath),
        privateKey: fs.readFileSync(keyPath, 'utf8'),
      };
    }

    if (authType === 'username') {
      if (!cfg.username) {
        throw new Error('Username auth requires username');
      }

      return {
        type: UserTokenType.UserName,
        userName: cfg.username,
        password: cfg.password || '',
      };
    }

    return {
      type: UserTokenType.Anonymous,
    };
  }

  async connectAll(settings = {}) {
    const servers = this.getOpcServersFromSettings(settings);
    const opcServersState = {};

    for (const server of servers) {
      if (!server.enabled) {
        opcServersState[server.id] = { connected: false, endpoint: server.endpoint, reason: 'disabled' };
        continue;
      }

      if (!server.endpoint) {
        opcServersState[server.id] = { connected: false, endpoint: '', reason: 'missing endpoint' };
        continue;
      }

      try {
        const lastAttemptAt = new Date().toISOString();
        const client = OPCUAClient.create({
          securityMode: resolveSecurityMode(server.securityMode),
          securityPolicy: resolveSecurityPolicy(server.securityPolicy),
          endpointMustExist: false,
          keepSessionAlive: true,
          requestedSessionTimeout: 60_000,
        });

        await this.withConnectionTimeout(
          async () => {
            await client.connect(server.endpoint);
            const session = await client.createSession(this.buildOpcIdentity(server));

            this.opcConnections.set(server.id, {
              serverId: server.id,
              serverName: server.name,
              endpoint: server.endpoint,
              client,
              session,
            });
          },
          this.connectionTimeoutMs,
          `OPC UA connect for ${server.id}`
        );

        opcServersState[server.id] = {
          connected: true,
          endpoint: server.endpoint,
          lastAttemptAt,
          lastConnectedAt: new Date().toISOString(),
        };
        this.info(`OPC UA connected [${server.id}]: ${server.endpoint}`);
      } catch (error) {
        const lastAttemptAt = new Date().toISOString();
        opcServersState[server.id] = {
          connected: false,
          endpoint: server.endpoint,
          reason: error.message,
          lastAttemptAt,
        };
        this.warn(`OPC UA connect failed [${server.id}]: ${error.message}`);
      }
    }

    this.lastConnectionState = {
      opcServersState,
      opcConnected: Object.values(opcServersState).some((item) => item.connected),
    };

    return {
      ...this.lastConnectionState,
    };
  }

  async withSession(settings = {}, serverId = '', task) {
    const resolvedServerId = this.resolveOpcServerId(settings, serverId);
    const connection = this.opcConnections.get(resolvedServerId);

    if (connection?.session) {
      return task(connection.session, resolvedServerId);
    }

    const cfg = this.buildOpcConnectionConfig(settings, resolvedServerId);
    const tempClient = OPCUAClient.create({
      securityMode: cfg.securityMode,
      securityPolicy: cfg.securityPolicy,
      endpointMustExist: false,
      keepSessionAlive: false,
      requestedSessionTimeout: 30_000,
    });

    let tempSession;
    try {
      await tempClient.connect(cfg.endpoint);
      tempSession = await tempClient.createSession(this.buildOpcIdentity(cfg));
      return await task(tempSession, resolvedServerId);
    } finally {
      if (tempSession) {
        try {
          await tempSession.close();
        } catch {
          // Ignore close failures for temporary sessions.
        }
      }

      try {
        await tempClient.disconnect();
      } catch {
        // Ignore disconnect failures for temporary sessions.
      }
    }
  }

  async disconnectAll() {
    for (const [serverId, connection] of this.opcConnections.entries()) {
      if (connection?.session) {
        try {
          await connection.session.close();
        } catch (err) {
          this.warn(`Error closing OPC session [${serverId}]: ${err.message}`);
        }
      }

      if (connection?.client) {
        try {
          await connection.client.disconnect();
        } catch (err) {
          this.warn(`Error closing OPC client [${serverId}]: ${err.message}`);
        }
      }
    }

    this.opcConnections.clear();
    this.lastConnectionState = {
      opcServersState: {},
      opcConnected: false,
    };
  }
}

module.exports = {
  OpcConnectionManager,
};
