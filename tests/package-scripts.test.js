const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

test('package scripts include the release pipeline', () => {
  const required = [
    'bundle:server',
    'prepare:native',
    'obfuscate',
    'stage:dist',
    'compile',
    'release',
    'release:dry-run',
    'build:installer',
  ];

  for (const name of required) {
    expect(pkg.scripts).toHaveProperty(name);
  }
});
