//standalone jest config for the repo's tooling and pure-TypeScript utilities (kept outside packages/ because every service tsconfig type-checks packages/**)
module.exports = {
  displayName: 'types',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  transform: {
    '^.+\.ts$': [
      '@swc/jest',
      {
        swcrc: false,
        jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
        module: { type: 'commonjs' },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
};
