# OPC UA -> MQTT Bridge (CONNECT-MES)

This service reads signals from OPC UA and publishes messages in the MQTT contract expected by CONNECT-MES/Productivity.
It now includes an embedded visual admin (web UI) and its own SQLite database for configuration and mappings.

## Supported contracts

### Topic: optimotion/oee
Payload example:

```json
{
  "facilities": "37",
  "Area": "39",
  "Line": "81",
  "Station": "125",
  "marcha": true,
  "parts_count": 3,
  "parts_rejected": 0,
  "T_stamp": "2026-07-31 16:28:35",
  "Resolution": 1
}
```

### Topic: optimotion/estop
Payload example:

```json
{
  "facilities": "37",
  "Area": "39",
  "Line": "81",
  "ID": 125,
  "motive": 4,
  "status": 0,
  "T_stamp": "2026-07-31 16:28:35"
}
```

`status` meaning:
- `0`: stop
- `1`: running

## Why this architecture

- Service is separated from `server` and `client`.
- Optional in Docker with its own profile.
- Can run on another machine and publish to the same MQTT broker.
- Manual configuration through env vars and a mapping JSON file.

## Configuration

1. Copy `.env.example` to `.env`.
2. Copy `config/mapping.example.json` to `config/mapping.json`.
3. Edit broker data, OPC UA endpoint, topics, station mappings and node IDs.

Environment notes:
- `BRIDGE_WEB_PORT`: web admin port (default `3400`).
- `BRIDGE_DB_PATH`: SQLite path for bridge config/mappings.
- `TOPIC_OEE` / `TOPIC_ESTOP`: default topics used when station-level topics are not set.

## Visual admin (new)

Open the web UI:

- `http://localhost:3400` (or the configured `BRIDGE_WEB_PORT`)

From this interface you can:

- Register OPC UA server connection (endpoint/security/user/password).
- Configure MQTT broker/credentials/QoS/retain.
- Configure default topics (`optimotion/oee`, `optimotion/estop`).
- Map OPC tags to contract properties (`marcha`, `parts_count`, `parts_rejected`, `Resolution`, `estop_status`, `estop_motive`).
- Configure trigger logic per stream:
  - `always`
  - `onValueChanged` with a dedicated trigger tag
- Save and apply configuration with runtime reconnect.

The UI stores data in SQLite (`BRIDGE_DB_PATH`) and runtime reads directly from DB.

## Mapping file

`config/mapping.json` controls:
- Topics (`topics.oee`, `topics.estop`)
- Station context (`facilities`, `Area`, `Line`)
- OPC UA node IDs per signal
- Per-station publish behavior (`oeeOnlyOnChange`, `estopOnlyOnChange`)

The mapping file is still supported as an initial seed when DB is empty.

## Local run

```bash
npm install
npm start
```

After start, access web admin on the configured port.

## Docker run (optional profile)

From project root:

```bash
docker compose --profile opcua-bridge up -d opcua-mqtt-bridge
```

## Deploy on another machine

You can copy only `opcua-mqtt-bridge/` to another host and run it there, as long as it can reach:
- the OPC UA server
- the target MQTT broker

## Notes

- Current implementation uses polling. Tune `POLL_INTERVAL_MS` carefully.
- If your broker or OPC UA needs TLS/certificates, extend env and client options accordingly.
