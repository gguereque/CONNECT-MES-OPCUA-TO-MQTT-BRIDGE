const { isBridgeAuthorizedRole } = require('../src/web');

describe('bridge role authorization', () => {
  test('allows Optimotion and Super usuario roles', () => {
    expect(isBridgeAuthorizedRole(['Optimotion'])).toBe(true);
    expect(isBridgeAuthorizedRole(['Super usuario'])).toBe(true);
    expect(isBridgeAuthorizedRole(['Administrador'])).toBe(true);
  });

  test('blocks unrelated roles', () => {
    expect(isBridgeAuthorizedRole(['Operador'])).toBe(false);
    expect(isBridgeAuthorizedRole([])).toBe(false);
  });
});
