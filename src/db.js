const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.BRIDGE_DB_PATH
  ? path.resolve(process.cwd(), process.env.BRIDGE_DB_PATH)
  : path.resolve(process.cwd(), './data/bridge.db');

function ensureDbDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function openDb() {
  ensureDbDir();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

module.exports = {
  DB_PATH,
  openDb,
};
