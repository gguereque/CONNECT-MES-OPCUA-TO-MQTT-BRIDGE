#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const EXE_FILE = path.join(ROOT, 'dist-server', 'opcua-mqtt-bridge.exe');
const ISS_TEMPLATE = path.join(ROOT, 'installer', 'opcua-mqtt-bridge.iss');
const NSSM_FILE = path.join(ROOT, 'vendor', 'nssm', 'win64', 'nssm.exe');
const NSSM_DEST = path.join(ROOT, 'installer', 'nssm.exe');

function findIscc() {
  const candidates = [
    'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
    'C:\\Program Files\\Inno Setup 6\\ISCC.exe',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'ISCC.exe';
}

function main() {
  if (process.platform !== 'win32') {
    throw new Error('build:installer solo se ejecuta en Windows porque usa ISCC.exe de Inno Setup.');
  }

  if (!fs.existsSync(EXE_FILE)) {
    throw new Error(`No se encontró ${EXE_FILE} — corre "npm run release" primero.`);
  }

  if (!fs.existsSync(ISS_TEMPLATE)) {
    throw new Error(`No se encontró ${ISS_TEMPLATE}. Debes crear el script de Inno Setup para el instalador.`);
  }

  if (!fs.existsSync(NSSM_FILE)) {
    throw new Error(
      `No se encontró ${NSSM_FILE}. Descarga NSSM desde https://nssm.cc/download y colócalo en vendor/nssm/win64/nssm.exe antes de generar el instalador.`,
    );
  }

  fs.copyFileSync(NSSM_FILE, NSSM_DEST);

  const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  const iscc = findIscc();

  console.log(`Compilando instalador con ${iscc} (versión ${version})...`);
  execFileSync(iscc, [`/DMyAppVersion=${version}`, ISS_TEMPLATE], { stdio: 'inherit' });

  console.log('\nListo — instalador generado en installer/output/');
}

main();
