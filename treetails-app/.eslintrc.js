module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'react-app',
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    __firebase_config: 'readonly', // Marks as global so ESLint doesn't complain
    __app_id: 'readonly',          // Marks as global so ESLint doesn't complain
  },
  rules: {
    // You can add more rules here if needed
  },
};
