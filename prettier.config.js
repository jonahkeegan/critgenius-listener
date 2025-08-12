// prettier.config.js
/** @type {import('prettier').Config} */
export default {
  // Basic formatting options
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,

  // Line length and wrapping
  printWidth: 80,
  proseWrap: 'preserve',

  // JSX specific options
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Object and array formatting
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // HTML and CSS options
  htmlWhitespaceSensitivity: 'css',
  endOfLine: 'lf',

  // File-specific overrides
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: {
        parser: 'json',
        printWidth: 120,
      },
    },
    {
      files: ['*.md'],
      options: {
        parser: 'markdown',
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        parser: 'yaml',
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: ['*.css', '*.scss'],
      options: {
        parser: 'css',
        singleQuote: false,
      },
    },
  ],
};
