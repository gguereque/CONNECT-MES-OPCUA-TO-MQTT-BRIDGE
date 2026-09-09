#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(ROOT, 'dist-server');
const OBFUSCATED_BUNDLE = path.join(ROOT, 'build', 'backend.protected.js');
const VENDOR_NATIVE = path.join(ROOT, 'vendor', 'native', 'win32-x64', 'better_sqlite3.node');
const NPM_CMD = process.platform === 'win32' ? 'cmd.exe' : 'npm';

const EXTERNAL_RUNTIME_DEPS = ['better-sqlite3'];

function parseTarget(argv) {
  const arg = argv.find((a) => a.startsWith('--target='));
  const value = arg ? arg.split('=')[1] : 'win32-x64';
  if (!['win32-x64', 'host'].includes(value)) {
    throw new Error(`--target inválido: "${value}" (usa "win32-x64" o "host")`);
  }
  return value;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function readMainPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
}

function main() {
  const target = parseTarget(process.argv.slice(2));

  if (!fs.existsSync(OBFUSCATED_BUNDLE)) {
    throw new Error(`No se encontró ${OBFUSCATED_BUNDLE} — corre "npm run bundle:server" y "npm run obfuscate" primero.`);
  }
  if (target === 'win32-x64' && !fs.existsSync(VENDOR_NATIVE)) {
    throw new Error(`No se encontró ${VENDOR_NATIVE} — corre "npm run prepare:native" primero.`);
  }

  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  fs.copyFileSync(OBFUSCATED_BUNDLE, path.join(DIST_DIR, 'backend.js'));

  const staticSource = path.join(ROOT, 'src', 'public');
  if (fs.existsSync(staticSource)) {
    copyDir(staticSource, path.join(DIST_DIR, 'public'));
  }

  const configSource = path.join(ROOT, 'config');
  if (fs.existsSync(configSource)) {
    copyDir(configSource, path.join(DIST_DIR, 'config'));
  }

  const dataSource = path.join(ROOT, 'data');
  if (fs.existsSync(dataSource)) {
    copyDir(dataSource, path.join(DIST_DIR, 'data'));
  }

  const mainPkg = readMainPackageJson();
  const distPkg = {
    name: 'opcua-mqtt-bridge',
    version: mainPkg.version,
    private: true,
    main: 'backend.js',
    bin: 'backend.js',
    dependencies: Object.fromEntries(
      EXTERNAL_RUNTIME_DEPS.map((name) => [name, mainPkg.dependencies[name]]),
    ),
    pkg: {
      targets: [target === 'win32-x64' ? 'node22-win-x64' : 'node22-linux-x64'],
      outputPath: '.',
      assets: [
        'public/**/*',
        'config/**/*',
        'data/**/*',
        'node_modules/better-sqlite3/build/Release/*.node',
      ],
    },
  };
  fs.writeFileSync(path.join(DIST_DIR, 'package.json'), JSON.stringify(distPkg, null, 2));

  console.log('\nInstalando dependencias externas en dist-server/...');
  const npmArgs = ['install', '--omit=dev', '--no-audit', '--no-fund'];
  const spawnArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', ['npm', ...npmArgs].join(' ')]
    : npmArgs;

  execFileSync(NPM_CMD, spawnArgs, { cwd: DIST_DIR, stdio: 'inherit' });

  if (target === 'win32-x64') {
    const targetNodeFile = path.join(DIST_DIR, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
    fs.mkdirSync(path.dirname(targetNodeFile), { recursive: true });
    fs.copyFileSync(VENDOR_NATIVE, targetNodeFile);
  }

  console.log(`\ndist-server/ listo en ${DIST_DIR} (target: ${target})`);
}

main();
