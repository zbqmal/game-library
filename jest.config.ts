import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  preset: "ts-jest", // Use ts-jest instead of Babel
  testEnvironment: "jsdom", // Required for testing React components
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], // Jest setup
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest", // Transpile TypeScript & JSX
  },
  testMatch: ["**/__tests__/**/*.(ts|tsx)"], // Match test files
};

export default createJestConfig(customJestConfig);
