const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_CERT_UPLOAD_BYTES = 512 * 1024;
const CERT_ALLOWED_EXTENSIONS = new Set(['.pem', '.crt', '.cer', '.der']);
const KEY_ALLOWED_EXTENSIONS = new Set(['.pem', '.key']);

function normalizeServerId(serverId = '') {
  return String(serverId || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getBridgeCertsRoot() {
  return path.resolve(process.env.BRIDGE_CERTS_DIR || './data/certs');
}

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function removeDirIfExists(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function validateCertBuffer(buffer, ext) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Certificate file is empty');
  }

  const text = buffer.toString('utf8');
  if (text.includes('BEGIN CERTIFICATE')) return;
  if (ext === '.der') return;

  throw new Error('Certificate must be PEM or DER');
}

function validatePrivateKeyBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Private key file is empty');
  }

  const text = buffer.toString('utf8');
  if (!/BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY/.test(text)) {
    throw new Error('Private key must be PEM format');
  }
}

const AUTH_CACHE_TTL_MS = 60_000;
const authProfileCache = new Map();

function decodeJwtPayload(token) {
  const raw = String(token || '').trim();
  const parts = raw.split('.');
  if (parts.length < 2) {
    throw new Error('Token JWT invalido');
  }

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  const json = Buffer.from(padded, 'base64').toString('utf8');
  const payload = JSON.parse(json);

  if (payload?.exp && Number.isFinite(payload.exp)) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSec) {
      throw new Error('Token expirado');
    }
  }

  return payload;
}

function buildProfileFromJwt(token) {
  const payload = decodeJwtPayload(token);
  const roles = Array.isArray(payload.roles)
    ? payload.roles
    : payload.role
      ? [payload.role]
      : [];

  return {
    username: String(payload.username || payload.user || ''),
    roles,
    source: 'jwt',
  };
}

function getConnectMesBaseUrl(store) {
  const cfg = store.getConfig();
  const connectmes = cfg?.connectmes || {};
  return String(connectmes.baseUrl || '').replace(/\/+$/, '');
}

function getConnectMesBaseUrlCandidates(store) {
  const configured = getConnectMesBaseUrl(store);
  const candidates = [
    configured,
    'http://backend:3000',
    'http://connectmes-backend:3000',
  ].filter(Boolean);

  return [...new Set(candidates.map((item) => String(item).replace(/\/+$/, '')))];
}

function getConnectMesStationsPath(store) {
  const cfg = store.getConfig();
  const connectmes = cfg?.connectmes || {};
  return String(connectmes.stationsPath || '/api/stations/assignment/stations');
}

function getStoredConnectMesToken(store) {
  const cfg = store.getConfig();
  const connectmes = cfg?.connectmes || {};
  return String(connectmes.token || '').trim();
}

const BRIDGE_ALLOWED_ROLES = new Set([
  'optimotion',
  'super usuario',
  'superusuario',
  'administrador',
  'admin',
  'supervisor',
]);

function isBridgeAuthorizedRole(roles = []) {
  return roles.some((role) => BRIDGE_ALLOWED_ROLES.has(String(role).trim().toLowerCase()));
}

function isOptimotionRole(roles = []) {
  return isBridgeAuthorizedRole(roles);
}

function extractBearerToken(req) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader) return '';

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return '';
  return token.trim();
}

async function requestConnectMesAtBase(baseUrl, endpointPath, { method = 'GET', token = '', body } = {}) {
  if (!baseUrl) {
    throw new Error('connectmes.baseUrl is required');
  }

  const normalizedPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const url = `${baseUrl}${normalizedPath}`;

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data?.error
      ? data.error
      : String(text || response.statusText || 'ConnectMES request failed');
    const error = new Error(message);
    error.status = response.status;
    error.baseUrl = baseUrl;
    error.endpointPath = normalizedPath;
    throw error;
  }

  return data;
}

async function requestConnectMes(store, endpointPath, { method = 'GET', token = '', body, fallbackOn404 = false } = {}) {
  const baseUrls = fallbackOn404
    ? getConnectMesBaseUrlCandidates(store)
    : [getConnectMesBaseUrl(store)];

  let lastError;
  for (const baseUrl of baseUrls) {
    try {
      return await requestConnectMesAtBase(baseUrl, endpointPath, { method, token, body });
    } catch (error) {
      lastError = error;
      if (!fallbackOn404 || error.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError || new Error('No se pudo contactar CONNECT-MES');
}

async function fetchConnectMesProfile(store, token) {
  try {
    return await requestConnectMes(store, '/auth/profile', { token, fallbackOn404: true });
  } catch (error) {
    if (error.status !== 404) throw error;
    return requestConnectMes(store, '/api/auth/profile', { token, fallbackOn404: true });
  }
}

async function resolveProfileWithCache(store, token) {
  const now = Date.now();
  const cached = authProfileCache.get(token);
  if (cached && cached.expiresAt > now) {
    return cached.profile;
  }

  let profile;
  try {
    profile = await fetchConnectMesProfile(store, token);
  } catch (error) {
    if (error.status !== 404) throw error;
    profile = buildProfileFromJwt(token);
  }

  authProfileCache.set(token, { profile, expiresAt: now + AUTH_CACHE_TTL_MS });
  return profile;
}

async function fetchConnectMesStations(store, token) {
  const stationsPath = getConnectMesStationsPath(store);
  const data = await requestConnectMes(store, stationsPath, { token });
  return Array.isArray(data) ? data : [];
}

async function requireOptimotionRole(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Token requerido' });
    }

    const profile = await resolveProfileWithCache(req.app.locals.store, token);
    const roles = Array.isArray(profile?.roles) ? profile.roles : [];

    if (!isOptimotionRole(roles)) {
      return res.status(403).json({ ok: false, error: 'Acceso restringido a roles autorizados de ConnectMES' });
    }

    req.authToken = token;
    req.authProfile = profile;
    return next();
  } catch (error) {
    const status = error.status === 401 || error.status === 403 ? error.status : 401;
    return res.status(status).json({ ok: false, error: `Sesion invalida: ${error.message}` });
  }
}

function createWebApp({ store, runtime }) {
  const app = express();
  app.locals.store = store;
  app.use(express.json({ limit: '2mb' }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_CERT_UPLOAD_BYTES,
      files: 2,
    },
  });
  const certUploadMiddleware = upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'privateKey', maxCount: 1 },
  ]);

  app.post('/api/auth/login', async (req, res) => {
    try {
      const username = String(req.body?.username || '').trim();
      const password = String(req.body?.password || '');

      if (!username || !password) {
        return res.status(400).json({ ok: false, error: 'Usuario y password son requeridos' });
      }

      let loginData;
      try {
        loginData = await requestConnectMes(store, '/auth/login', {
          method: 'POST',
          body: { username, password },
          fallbackOn404: true,
        });
      } catch (error) {
        if (error.status !== 404) throw error;
        loginData = await requestConnectMes(store, '/api/auth/login', {
          method: 'POST',
          body: { username, password },
          fallbackOn404: true,
        });
      }

      const token = String(loginData?.token || '').trim();
      if (!token) {
        return res.status(401).json({ ok: false, error: 'ConnectMES no devolvio token' });
      }

      const profile = await resolveProfileWithCache(store, token);
      const roles = Array.isArray(profile?.roles) ? profile.roles : [];
      if (!isOptimotionRole(roles)) {
        return res.status(403).json({ ok: false, error: 'Acceso restringido a roles autorizados de ConnectMES' });
      }

      return res.json({
        ok: true,
        token,
        user: {
          username: profile?.username || username,
          roles,
        },
      });
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 502;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/auth/session', requireOptimotionRole, (req, res) => {
    res.json({
      ok: true,
      user: {
        username: req.authProfile?.username || '',
        roles: Array.isArray(req.authProfile?.roles) ? req.authProfile.roles : [],
      },
    });
  });

  app.post('/api/auth/logout', requireOptimotionRole, (req, res) => {
    authProfileCache.delete(req.authToken);
    res.json({ ok: true });
  });

  app.use('/api', requireOptimotionRole);

  app.post(
    '/api/opc/certificates/upload',
    (req, res, next) => {
      certUploadMiddleware(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) {
          return res.status(400).json({ ok: false, error: error.message });
        }
        return res.status(400).json({ ok: false, error: error.message || 'Upload failed' });
      });
    },
    async (req, res) => {
      try {
        const serverIdRaw = String(req.body?.serverId || '').trim();
        const serverId = normalizeServerId(serverIdRaw);
        if (!serverId) {
          return res.status(400).json({ ok: false, error: 'serverId is required' });
        }

        const files = req.files || {};
        const certFile = files.certificate?.[0];
        const keyFile = files.privateKey?.[0];

        if (!certFile || !keyFile) {
          return res.status(400).json({ ok: false, error: 'certificate and privateKey files are required' });
        }

        const certExt = path.extname(certFile.originalname || '').toLowerCase();
        const keyExt = path.extname(keyFile.originalname || '').toLowerCase();

        if (!CERT_ALLOWED_EXTENSIONS.has(certExt)) {
          return res.status(400).json({ ok: false, error: 'Unsupported certificate extension' });
        }

        if (!KEY_ALLOWED_EXTENSIONS.has(keyExt)) {
          return res.status(400).json({ ok: false, error: 'Unsupported private key extension' });
        }

        validateCertBuffer(certFile.buffer, certExt);
        validatePrivateKeyBuffer(keyFile.buffer);

        const certsRoot = getBridgeCertsRoot();
        const serverDir = path.join(certsRoot, serverId);
        ensureDirSync(serverDir);

        const certPath = path.join(serverDir, `user-certificate${certExt}`);
        const keyPath = path.join(serverDir, `user-private-key${keyExt}`);

        fs.writeFileSync(certPath, certFile.buffer, { mode: 0o600 });
        fs.writeFileSync(keyPath, keyFile.buffer, { mode: 0o600 });

        return res.json({
          ok: true,
          serverId,
          certificateRef: certPath,
          privateKeyRef: keyPath,
        });
      } catch (error) {
        return res.status(400).json({ ok: false, error: error.message });
      }
    }
  );

  app.delete('/api/opc/certificates/:serverId', async (req, res) => {
    try {
      const serverId = normalizeServerId(req.params.serverId || '');
      if (!serverId) {
        return res.status(400).json({ ok: false, error: 'serverId is required' });
      }

      const certsRoot = getBridgeCertsRoot();
      const serverDir = path.join(certsRoot, serverId);
      removeDirIfExists(serverDir);

      return res.json({ ok: true, serverId });
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/status', (_req, res) => {
    res.json({ ok: true, status: runtime.getStatus() });
  });

  app.get('/api/config', (_req, res) => {
    const config = store.getConfig();
    res.json({ ok: true, config });
  });

  app.put('/api/config', async (req, res) => {
    try {
      const saved = store.saveConfig(req.body || {});

      void runtime.reloadFromStore({ reconnect: true, restartTimer: true }).catch((runtimeError) => {
        runtime.state.lastError = runtimeError.message;
        console.warn('[bridge][warn] Config saved but runtime reconnect failed:', runtimeError.message);
      });

      return res.json({ ok: true, config: saved, runtimeReloaded: true });
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/mappings', (_req, res) => {
    const mappings = store.getMappings();
    res.json({ ok: true, mappings });
  });

  app.put('/api/mappings', async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ ok: false, error: 'Body must be an array of mappings' });
      }

      const mappings = store.replaceMappings(req.body);
      await runtime.reloadFromStore({ reconnect: false, restartTimer: true });
      return res.json({ ok: true, mappings });
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post('/api/runtime/reconnect', async (_req, res) => {
    try {
      await runtime.reloadFromStore({ reconnect: true, restartTimer: true });
      res.json({ ok: true, status: runtime.getStatus() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/opc/browse', async (req, res) => {
    try {
      const nodeId = String(req.query.nodeId || 'RootFolder');
      const serverId = String(req.query.serverId || '').trim();
      const result = await runtime.browseNode(nodeId, serverId);
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/opc/read', async (req, res) => {
    try {
      const nodeId = String(req.query.nodeId || '').trim();
      const serverId = String(req.query.serverId || '').trim();
      if (!nodeId) {
        return res.status(400).json({ ok: false, error: 'nodeId is required' });
      }

      const result = await runtime.readNodeValueById(nodeId, serverId);
      return res.json({ ok: true, ...result });
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get('/api/connectmes/stations', async (req, res) => {
    try {
      const fallbackToken = getStoredConnectMesToken(store);
      const stations = await fetchConnectMesStations(store, req.authToken || fallbackToken);
      return res.json({ ok: true, stations });
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }
  });

  const staticDir = path.resolve(__dirname, './public');
  app.use(express.static(staticDir));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });

  return app;
}

module.exports = {
  createWebApp,
  isBridgeAuthorizedRole,
  isOptimotionRole,
};
