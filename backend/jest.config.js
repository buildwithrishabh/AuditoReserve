module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setupEnv.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  collectCoverage: false,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/worker.js",
    "!src/config/db.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};

