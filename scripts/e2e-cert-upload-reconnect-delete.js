const fs = require('fs');
const path = require('path');
const http = require('http');
const { OPCUAServer, Variant, DataType } = require('node-opcua');
const { OPCUACertificateManager } = require('node-opcua-certificate-manager');
const { convertPEMtoDER } = require('node-opcua-crypto');
const { BridgeStore } = require('../src/store');
const { BridgeRuntime } = require('../src/runtime');
const { createWebApp } = require('../src/web');

function closeServer(server) {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
  });
}

async function main() {
  const testRoot = path.resolve('./data/e2e-upload-runtime');
  fs.rmSync(testRoot, { recursive: true, force: true });
  fs.mkdirSync(testRoot, { recursive: true });

  const mockToken = 'mock-token-optimotion';
  const authSrv = http.createServer((req, res) => {
    const url = req.url || '';
    const method = req.method || 'GET';

    if (method === 'POST' && (url === '/auth/login' || url === '/api/auth/login')) {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        const body = raw ? JSON.parse(raw) : {};
        if (body.username === 'optimotion' && body.password === 'optimotion123') {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ token: mockToken }));
          return;
        }

        res.statusCode = 401;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'invalid credentials' }));
      });
      return;
    }

    if ((url === '/auth/profile' || url === '/api/auth/profile') && method === 'GET') {
      const authHeader = String(req.headers.authorization || '');
      if (authHeader === `Bearer ${mockToken}`) {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ username: 'optimotion', roles: ['Optimotion'] }));
        return;
      }

      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'invalid token' }));
      return;
    }

    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'not-found' }));
  });

  await new Promise((resolve) => authSrv.listen(3999, '127.0.0.1', resolve));

  const store = new BridgeStore(process.env);
  const runtime = new BridgeRuntime(store);
  const app = createWebApp({ store, runtime });
  const webServer = app.listen(3411, '127.0.0.1');

  let opcServer;
  let userCm;
  let serverUserCm;

  try {
    userCm = new OPCUACertificateManager({
      rootFolder: path.join(testRoot, 'client-user-cm'),
      name: 'pki',
      disableFileWatchers: true,
    });
    await userCm.initialize();

    const certFile = path.join(userCm.rootDir, 'own/certs/user_cert.pem');
    await userCm.createSelfSignedCertificate({
      applicationUri: 'urn:bridge:e2e:user',
      subject: '/CN=Bridge E2E User',
      dns: ['localhost'],
      outputFile: certFile,
      validity: 30,
    });
    const keyFile = userCm.privateKey;

    serverUserCm = new OPCUACertificateManager({
      rootFolder: path.join(testRoot, 'opc-user-cm'),
      name: 'pki',
      disableFileWatchers: true,
    });
    await serverUserCm.initialize();

    const certDer = Buffer.from(convertPEMtoDER(fs.readFileSync(certFile, 'utf8')));
    await serverUserCm.trustCertificate(certDer);

    opcServer = new OPCUAServer({
      port: 51231,
      resourcePath: '/UA/E2EAuth',
      allowAnonymous: false,
      securityModes: ['SignAndEncrypt'],
      securityPolicies: ['Basic256Sha256'],
      userCertificateManager: serverUserCm,
    });

    await opcServer.initialize();

    const ns = opcServer.engine.addressSpace.getOwnNamespace();
    const folder = ns.addObject({
      organizedBy: opcServer.engine.addressSpace.rootFolder.objects,
      browseName: 'Demo',
    });
    let counter = 2000;

    ns.addVariable({
      componentOf: folder,
      nodeId: 'ns=1;s=Demo.E2ECounter',
      browseName: 'E2ECounter',
      dataType: 'UInt32',
      value: {
        get: () => new Variant({ dataType: DataType.UInt32, value: counter++ }),
      },
    });

    await opcServer.start();

    const previousConfig = store.getConfig();
    store.saveConfig({
      ...previousConfig,
      connectmes: {
        ...previousConfig.connectmes,
        baseUrl: 'http://127.0.0.1:3999',
      },
    });

    const loginRes = await fetch('http://127.0.0.1:3411/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'optimotion', password: 'optimotion123' }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.ok || !loginData.token) {
      throw new Error(`Bridge login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.token;

    const form = new FormData();
    form.append('serverId', 'opc-e2e');
    form.append('certificate', new Blob([fs.readFileSync(certFile)]), 'user_cert.pem');
    form.append('privateKey', new Blob([fs.readFileSync(keyFile)]), 'user_key.pem');

    const uploadRes = await fetch('http://127.0.0.1:3411/api/opc/certificates/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.ok) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }

    const endpoint = 'opc.tcp://127.0.0.1:51231/UA/E2EAuth';
    const cfg = store.getConfig();

    store.saveConfig({
      ...cfg,
      opcua: {
        defaultServerId: 'opc-e2e',
        servers: [
          {
            id: 'opc-e2e',
            name: 'OPC E2E',
            endpoint,
            enabled: true,
            securityMode: 'SignAndEncrypt',
            securityPolicy: 'Basic256Sha256',
            authType: 'certificate',
            username: '',
            password: '',
            userCertificateFile: '',
            userPrivateKeyFile: '',
            userCertificateRef: uploadData.certificateRef,
            userPrivateKeyRef: uploadData.privateKeyRef,
          },
        ],
      },
      mqtt: {
        ...cfg.mqtt,
        url: 'mqtt://127.0.0.1:1883',
      },
    });

    runtime.settings = store.getConfig();
    await runtime.connectOpc();
    const read = await runtime.readNodeValueById('ns=1;s=Demo.E2ECounter', 'opc-e2e');
    await runtime.disconnectOpc();

    const delRes = await fetch('http://127.0.0.1:3411/api/opc/certificates/opc-e2e', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const delData = await delRes.json();

    const certRoot = path.resolve(process.env.BRIDGE_CERTS_DIR || './data/certs');
    const serverDir = path.join(certRoot, 'opc-e2e');

    const backup = JSON.parse(fs.readFileSync('./data/pre-stress-backup.json', 'utf8'));
    store.saveConfig(backup.config || {});
    store.replaceMappings(Array.isArray(backup.mappings) ? backup.mappings : []);

    console.log(
      JSON.stringify(
        {
          uploadOk: uploadData.ok === true,
          uploadRefs: {
            certificateRef: uploadData.certificateRef,
            privateKeyRef: uploadData.privateKeyRef,
          },
          runtimeRead: read,
          deleteOk: delData.ok === true,
          certDirDeleted: !fs.existsSync(serverDir),
        },
        null,
        2
      )
    );
  } finally {
    if (runtime) {
      try {
        await runtime.disconnectOpc();
      } catch {
        // ignore cleanup failures
      }
    }
    if (opcServer) {
      try {
        await opcServer.shutdown(100);
      } catch {
        // ignore cleanup failures
      }
    }
    if (userCm) {
      try {
        await userCm.dispose();
      } catch {
        // ignore cleanup failures
      }
    }
    if (serverUserCm) {
      try {
        await serverUserCm.dispose();
      } catch {
        // ignore cleanup failures
      }
    }
    await closeServer(webServer);
    await closeServer(authSrv);
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
