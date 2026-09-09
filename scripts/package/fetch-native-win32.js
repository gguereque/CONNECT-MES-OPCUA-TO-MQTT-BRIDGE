#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const VENDOR_DIR = path.join(ROOT, 'vendor', 'native', 'win32-x64');
const NPM_CMD = process.platform === 'win32' ? 'cmd.exe' : 'npm';

function getBetterSqlite3Version() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const version = pkg.dependencies['better-sqlite3'];
  if (!version) throw new Error('No se encontró "better-sqlite3" en package.json');
  return version.replace(/^[\^~]/, '');
}

function main() {
  const version = getBetterSqlite3Version();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'better-sqlite3-win32-fetch-'));

  console.log(`Descargando el binario de better-sqlite3@${version} para win32-x64 (en ${tmpDir})...`);

  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'native-fetch-scratch', version: '0.0.0', private: true }));

  const npmArgs = ['install', `better-sqlite3@${version}`, '--no-audit', '--no-fund'];
  const spawnArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', ['npm', ...npmArgs].join(' ')]
    : npmArgs;

  execFileSync(NPM_CMD, spawnArgs, {
    cwd: tmpDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_platform: 'win32',
      npm_config_arch: 'x64',
    },
  });

  const nodeFile = path.join(tmpDir, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
  if (!fs.existsSync(nodeFile)) {
    throw new Error(`No se encontró el binario esperado en ${nodeFile}`);
  }

  fs.mkdirSync(VENDOR_DIR, { recursive: true });
  const dest = path.join(VENDOR_DIR, 'better_sqlite3.node');
  fs.copyFileSync(nodeFile, dest);
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const { size } = fs.statSync(dest);
  console.log(`Listo: ${dest} (${(size / 1024).toFixed(0)} KB)`);
}

main();
