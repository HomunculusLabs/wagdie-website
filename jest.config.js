const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  testEnvironment: 'jest-environment-jsdom',

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Test file patterns (integration and component tests)
  testMatch: [
    '<rootDir>/tests/**/*.{test,spec}.{ts,tsx}',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },

  // Ignore these directories
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    // Archived/stale suites kept for reference only (leaflet-era + TODO integration)
    '<rootDir>/tests/archive/',
    '<rootDir>/tests/TODO-',
    // Playwright-runner specs: they need a live server/browser and the Playwright
    // test runner, not jest. Run with `npx playwright test` instead.
    '<rootDir>/tests/e2e/map-with-assets\\.spec\\.ts$',
    '<rootDir>/tests/e2e/responsive-map\\.spec\\.ts$',
  ],

  // Transform ignore patterns - don't transform node_modules except react-leaflet
  transformIgnorePatterns: [
    'node_modules/(?!(react-leaflet)/)',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)
