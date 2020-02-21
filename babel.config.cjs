module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  env: {
    test: {
      plugins: [
        'transform-es2015-modules-commonjs',
        '@babel/plugin-syntax-import-meta'
      ]
    }
  }
};
