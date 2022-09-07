module.exports = {
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        'import/order': [
          'error',
          {
            'groups': ['builtin', 'external', 'internal'],
            'pathGroups': [
              {
                pattern: 'react',
                group: 'external',
                position: 'before'
              }
            ],
            'newlines-between': 'always',
            'alphabetize': {
              order: 'asc',
              caseInsensitive: true
            }
          }
        ]
      }
    }
  ]
}
