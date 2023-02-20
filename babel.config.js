module.exports = {
  plugins: [
    '@babel/syntax-dynamic-import',
  ],
  env: {
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            corejs: '3.27',
            useBuiltIns: 'entry',
            browserslistEnv: 'production',
          },
        ],
      ],
    },
    development: {
      presets: [
        [
          '@babel/preset-env',
          {
            corejs: '3.27',
            useBuiltIns: 'entry',
            browserslistEnv: 'development',
          },
        ],
      ],
    },
  },
};
