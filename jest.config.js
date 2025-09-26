/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globalSetup: "./tests/JestGlobalSetup.ts",
    modulePathIgnorePatterns: [ 'dist' ]
};