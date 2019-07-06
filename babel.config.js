module.exports = api => {
  api.cache(false)
  return {
    presets: [
      '@babel/preset-env',
      '@babel/preset-typescript'
    ],
    plugins: [
      '@babel/plugin-proposal-object-rest-spread',
      ['@babel/plugin-transform-runtime', { regenerator: true }],
    ]
  }
}
