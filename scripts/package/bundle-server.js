#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..', '..');
const ENTRY = path.join(ROOT, 'src', 'index.js');
const BUILD_DIR = path.join(ROOT, 'build');
const OUT_FILE = path.join(BUILD_DIR, 'backend.bundle.js');

const EXTERNAL_PACKAGES = ['proper-lockfile', '@ster5/global-mutex'];

async function main() {
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  const result = await esbuild.build({
    entryPoints: [ENTRY],
    outfile: OUT_FILE,
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    minify: true,
    sourcemap: false,
    external: EXTERNAL_PACKAGES,
    logLevel: 'info',
    metafile: true,
  });

  fs.writeFileSync(path.join(BUILD_DIR, 'bundle-meta.json'), JSON.stringify(result.metafile, null, 2));

  const { size } = fs.statSync(OUT_FILE);
  console.log(`\nBundle generado: ${OUT_FILE} (${(size / 1024).toFixed(0)} KB)`);
  console.log(`Paquetes externos (no incluidos en el bundle): ${EXTERNAL_PACKAGES.join(', ')}`);
}

main().catch((err) => {
  console.error('Falló el bundling del servidor:', err);
  process.exit(1);
});
