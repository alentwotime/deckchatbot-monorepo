module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!three/examples/jsm/)'
  ],
  setupFilesAfterEnv: ['./test-setup.js']
};
