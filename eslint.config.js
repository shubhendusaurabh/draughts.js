/**
 * ESLint configuration for draughts.js
 * Using ESLint v9+ flat config format
 */

export default [
  {
    // Global ignores
    ignores: [
      'node_modules/**',
      'draughts.min.js',
      '*.min.js',
      'coverage/**',
      '.npm/**'
    ]
  },
  {
    // Configuration for main library file
    files: ['draughts.js'],
    languageOptions: {
      ecmaVersion: 2020, // Support optional chaining and nullish coalescing
      sourceType: 'script', // CommonJS/Browser compatible
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        
        // Node.js globals
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'writable',
        
        // AMD globals
        define: 'readonly'
      }
    },
    rules: {
      // Error Prevention
      'no-undef': 'error',
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      
      // Best Practices
      'eqeqeq': ['error', 'smart'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-global-assign': 'error',
      'no-implicit-globals': 'off', // Library needs global constructor
      'consistent-return': 'warn',
      'default-case': 'warn',
      
      // ES6+ Features
      'prefer-const': 'warn',
      'no-var': 'warn',
      'prefer-template': 'warn',
      'prefer-arrow-callback': ['warn', { allowNamedFunctions: true }],
      'arrow-spacing': 'warn',
      'template-curly-spacing': 'warn',
      
      // Style (less strict for compatibility)
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'quotes': ['warn', 'single', { allowTemplateLiterals: true }],
      'semi': ['error', 'never'],
      'comma-dangle': ['warn', 'never'],
      'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
      'space-before-function-paren': ['warn', 'always'],
      'keyword-spacing': 'warn',
      'space-infix-ops': 'warn',
      
      // JSDoc
      'valid-jsdoc': 'off', // Disabled as we use TypeScript-style JSDoc
      
      // Relaxed rules for library code
      'no-console': 'off', // Allow console for error reporting
      'complexity': 'off', // Game logic can be complex
      'max-len': 'off', // Allow long lines for readability
      'camelcase': 'off' // Allow snake_case for API compatibility
    }
  },
  {
    // Configuration for test files
    files: ['tests.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        // Test framework globals
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        
        // Chai globals
        assert: 'readonly',
        expect: 'readonly',
        should: 'readonly',
        
        // Browser/Node globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        global: 'writable',
        
        // Test-specific
        Draughts: 'readonly',
        chai: 'readonly'
      }
    },
    rules: {
      // More relaxed rules for tests
      'no-unused-expressions': 'off', // Chai assertions
      'prefer-arrow-callback': 'off', // Mocha uses function expressions
      'func-names': 'off', // Anonymous functions in tests are fine
      'max-nested-callbacks': 'off', // Deep nesting common in tests
      'no-magic-numbers': 'off', // Test data often uses magic numbers
      'no-console': 'off' // Allow console in tests
    }
  },
  {
    // Configuration for config and build files
    files: ['eslint.config.js', '*.config.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module', // ES modules for config files
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'writable',
        exports: 'writable'
      }
    },
    rules: {
      'no-console': 'off', // Config files may use console
      'import/no-commonjs': 'off' // Allow CommonJS in config
    }
  }
]