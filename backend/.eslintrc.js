module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es2021': true,
    'node': true,
    'jest': true
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'sourceType': 'module'
  },
  'rules': {
    'indent': [
      'error',
      2, { 'SwitchCase': 1 }
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ],
    'eqeqeq': 'error',
    'no-trailing-spaces': 'error',
    'object-curly-spacing': [
      'error', 'always'
    ],
    'arrow-spacing': [
      'error', { 'before': true, 'after': true }
    ],
    'no-console': 0,
    'react/prop-types': 0,
    'camelcase': [ 'error', { 'ignoreImports': true } ],
    'no-multi-spaces': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'no-lonely-if': 'error',
    'no-loop-func': 'error',
    'no-mixed-operators': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-object': 'error',
    'no-new-wrappers': 'error',
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'no-var': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'prefer-const': 'error',
    'prefer-destructuring': ['error', {
      'VariableDeclarator': {
        'array': false,
        'object': true
      },
    }, {
      'enforceForRenamedProperties': false
    }],
    'prefer-object-spread': 'error',
    'prefer-template': 'error',
    'require-await': 'error',
    'eol-last': ['error', 'always'],
    'no-whitespace-before-property': 'error',
    'nonblock-statement-body-position': ['error', 'beside'],
    'rest-spread-spacing': ['error'],
    'space-infix-ops': 'error',
  }
}
