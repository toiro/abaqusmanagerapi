module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest'
  },
  moduleFileExtensions: ['js'],
  unmockedModulePathPatterns: [
    '<rootDir>\\/node_modules\\/config'
  ]
};
