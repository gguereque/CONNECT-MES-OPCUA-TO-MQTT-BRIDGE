require('dotenv').config();

const { BridgeStore } = require('./store');
const { BridgeRuntime } = require('./runtime');
const { createWebApp } = require('./web');

const store = new BridgeStore(process.env);
const runtime = new BridgeRuntime(store);
const app = createWebApp({ store, runtime });

let server;

async function bootstrap() {
  const config = store.getConfig();
  const webPort = Number(config?.app?.webPort || process.env.BRIDGE_WEB_PORT || 3400);

  server = app.listen(webPort, () => {
    console.log(`[bridge][info] Web admin available on port ${webPort}`);
  });

  try {
    await runtime.start();
  } catch (error) {
    runtime.state.lastError = error.message;
    console.error('[bridge][warn] Runtime could not start on boot. Use web admin to fix config and reconnect:', error.message);
  }
}

async function shutdown() {
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  } catch (error) {
    console.warn('[bridge][warn] Error closing web server:', error.message);
  }

  try {
    await runtime.stop();
  } catch (error) {
    console.warn('[bridge][warn] Error stopping runtime:', error.message);
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

bootstrap().catch((error) => {
  console.error('[bridge][error] Fatal error on startup:', error);
  process.exit(1);
});
