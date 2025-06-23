module.exports = [
  {
    ignores: ['frontend/**', 'node_modules/**']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      sourceType: 'module'
    },
    plugins: {
      react: require('eslint-plugin-react')
    },
    rules: {}
  }
];
