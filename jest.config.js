/**
 * Jest configuration for opNimal.
 *
 * We use ts-jest to compile TypeScript test files directly. The game logic
 * module is pure TypeScript with no React Native imports, so we deliberately
 * do not use the jest-expo preset — keeping the unit test runtime light and
 * decoupled from the RN bundler.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
