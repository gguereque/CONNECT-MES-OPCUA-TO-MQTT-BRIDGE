// Manual smoke test: simulates an OPC UA server with a random-incrementing /
// random-resetting counter and drives BridgeRuntime against it (one station,
// pieceCount feature, intervalSeconds trigger, parts_count/parts_rejected in
// delta mode) to confirm no errors and correct reset handling. Not part of jest.
const fs = require('fs');
const path = require('path');
const { OPCUAServer, Variant, DataType, MessageSecurityMode, SecurityPolicy } = require('node-opcua');
const { BridgeStore } = require('../src/store');
const { BridgeRuntime } = require('../src/runtime');

const OPC_PORT = 26543;
const RESET_PROBABILITY = 0.15;
const TICKS = 24;
const TICK_MS = 1000;
const INTERVAL_SECONDS = 5;

function stepCounter(current) {
  if (Math.random() < RESET_PROBABILITY) return 0;
  return current + Math.floor(Math.random() * 5) + 1;
}

async function main() {
  let opcServer;
  try {
    opcServer = new OPCUAServer({
      port: OPC_PORT,
      resourcePath: '/UA/DeltaSim',
      allowAnonymous: true,
      securityModes: [MessageSecurityMode.None],
      securityPolicies: [SecurityPolicy.None],
    });
    await opcServer.initialize();

    const addressSpace = opcServer.engine.addressSpace;
    const ns = addressSpace.getOwnNamespace();
    const folder = ns.addObject({
      organizedBy: addressSpace.rootFolder.objects,
      browseName: 'DeltaSim',
    });

    let partsCount = 0;
    let partsRejected = 0;

    ns.addVariable({
      componentOf: folder,
      nodeId: 'ns=1;s=Sim.Marcha',
      browseName: 'Marcha',
      dataType: 'Boolean',
      value: { get: () => new Variant({ dataType: DataType.Boolean, value: true }) },
    });

    ns.addVariable({
      componentOf: folder,
      nodeId: 'ns=1;s=Sim.PartsCount',
      browseName: 'PartsCount',
      dataType: 'UInt32',
      value: {
        get: () => {
          partsCount = stepCounter(partsCount);
          return new Variant({ dataType: DataType.UInt32, value: partsCount });
        },
      },
    });

    ns.addVariable({
      componentOf: folder,
      nodeId: 'ns=1;s=Sim.PartsRejected',
      browseName: 'PartsRejected',
      dataType: 'UInt32',
      value: {
        get: () => {
          partsRejected = stepCounter(partsRejected);
          return new Variant({ dataType: DataType.UInt32, value: partsRejected });
        },
      },
    });

    ns.addVariable({
      componentOf: folder,
      nodeId: 'ns=1;s=Sim.Resolution',
      browseName: 'Resolution',
      dataType: 'UInt16',
      value: { get: () => new Variant({ dataType: DataType.UInt16, value: 1 }) },
    });

    await opcServer.start();
    // give the server a moment to publish its endpoint descriptions before a client connects
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const endpoint = `opc.tcp://127.0.0.1:${OPC_PORT}/UA/DeltaSim`;
    console.log('OPC UA sim server listening at', endpoint);

    const testRoot = path.resolve(__dirname, '../data/delta-sim-test');
    fs.rmSync(testRoot, { recursive: true, force: true });
    fs.mkdirSync(testRoot, { recursive: true });
    process.env.BRIDGE_CONFIG_FILE = path.join(testRoot, 'bridge-config.json');
    process.env.MAPPING_FILE = path.join(testRoot, 'mapping.json');

    const store = new BridgeStore(process.env);
    const cfg = store.getConfig();
    store.saveConfig({
      ...cfg,
      opcua: {
        defaultServerId: 'sim-1',
        servers: [{
          id: 'sim-1',
          name: 'Delta Sim',
          endpoint,
          enabled: true,
          securityMode: 'None',
          securityPolicy: 'None',
          authType: 'anonymous',
          username: '',
          password: '',
        }],
      },
    });

    store.replaceMappings([{
      stationId: 999,
      context: { facilities: '1', Area: '1', Line: '1' },
      defaults: { Resolution: 1 },
      opcServerId: 'sim-1',
      functionalities: [{
        id: 'pieceCount',
        type: 'pieceCount',
        name: 'Piece Count',
        enabled: true,
        onlyOnChange: false,
        topic: 'optimotion/oee',
        counterModes: { parts_count: 'delta', parts_rejected: 'delta' },
        nodes: {
          marcha: 'ns=1;s=Sim.Marcha',
          parts_count: 'ns=1;s=Sim.PartsCount',
          parts_rejected: 'ns=1;s=Sim.PartsRejected',
          Resolution: 'ns=1;s=Sim.Resolution',
        },
        triggers: [{ mode: 'intervalSeconds', triggerNodeId: '', intervalSeconds: INTERVAL_SECONDS }],
      }],
    }]);

    const runtime = new BridgeRuntime(store);
    const published = [];
    runtime.publishJson = (topic, payload) => {
      published.push({ tick: currentTick, topic, payload });
      console.log(`  -> PUBLISH topic=${topic} parts_count=${payload.parts_count} parts_rejected=${payload.parts_rejected}`);
    };

    runtime.settings = store.getConfig();
    await runtime.connectOpc();
    console.log('OPC connected:', runtime.state.opcConnected);

    const mapping = store.getMappings()[0];
    const countKey = runtime.counterAccumulatorKey(mapping.stationId, 'pieceCount', 'parts_count');
    const rejectedKey = runtime.counterAccumulatorKey(mapping.stationId, 'pieceCount', 'parts_rejected');

    let currentTick = 0;
    for (currentTick = 1; currentTick <= TICKS; currentTick++) {
      await runtime.processMapping(mapping);
      const rawCount = runtime.counterRawByKey.get(countKey);
      const accumCount = runtime.counterAccumByKey.get(countKey) || 0;
      const rawRejected = runtime.counterRawByKey.get(rejectedKey);
      const accumRejected = runtime.counterAccumByKey.get(rejectedKey) || 0;
      console.log(
        `tick ${String(currentTick).padStart(2, '0')}: raw_count=${rawCount} accum_count=${accumCount} | raw_rejected=${rawRejected} accum_rejected=${accumRejected}`
      );
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, TICK_MS));
    }

    console.log('\n--- summary ---');
    console.log(`published ${published.length} messages over ${TICKS} ticks (interval=${INTERVAL_SECONDS}s)`);
    published.forEach((m) => console.log(`  tick ${m.tick}: parts_count=${m.payload.parts_count} parts_rejected=${m.payload.parts_rejected}`));

    await runtime.disconnectOpc();
    await opcServer.shutdown(100);
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    if (opcServer) {
      try {
        await opcServer.shutdown(100);
      } catch {
        // ignore cleanup failures
      }
    }
    process.exit(1);
  }
}

main();
