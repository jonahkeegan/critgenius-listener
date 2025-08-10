/**
 * Prettier Configuration for CritGenius Listener
 * Ensures consistent code formatting across the entire workspace
 * 
 * Key principles:
 * - Single quotes for consistency with JavaScript/TypeScript community standards
 * - Semicolons to avoid ASI (Automatic Semicolon Insertion) issues
 * - Trailing commas for cleaner git diffs and easier array/object manipulation
 * - 100 character print width balances readability with modern screen sizes
 * - 2-space indentation for compact, readable code
 */

export default {
  // Core formatting preferences
  singleQuote: true,
  semi: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  
  // Bracket and spacing preferences
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // JSX-specific formatting
  jsxSingleQuote: true,
  
  // Prose formatting (for markdown, etc.)
  proseWrap: 'preserve',
  
  // End of line handling (auto-detect based on existing files)
  endOfLine: 'auto',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        trailingComma: 'none'
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        singleQuote: false
      }
    },
    {
      files: '*.{yml,yaml}',
      options: {
        singleQuote: false,
        tabWidth: 2
      }
    },
    {
      files: '*.css',
      options: {
        singleQuote: false
      }
    }
  ]
};