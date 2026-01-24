import { configApp } from '@adonisjs/eslint-config'

export default [
  ...configApp(),
  {
    files: ['app/models/**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
]
