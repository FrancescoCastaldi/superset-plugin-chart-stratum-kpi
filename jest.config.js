module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/\\._'],
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/test/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  // The published @superset-ui/core 0.20.x entry point ships ESM that jest
  // cannot load in CommonJS mode outside the Superset webpack tree, so the
  // runtime APIs used by the tested modules are served by a local double
  // (same pattern as superset-plugin-chart-stratum-bar).
  moduleNameMapper: {
    '^@superset-ui/core$': '<rootDir>/test/__mocks__/supersetCoreMock.js',
    '^@superset-ui/chart-controls$': '<rootDir>/test/__mocks__/supersetCoreMock.js',
  },
};
