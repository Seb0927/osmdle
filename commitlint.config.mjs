export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 50],
    'subject-full-stop': [2, 'never', '.'],
  },
}
