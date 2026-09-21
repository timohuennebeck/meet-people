const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'node_modules/*',
      'project/*',
      'chats/*',
      'supabase/.temp/*',
      // Deno, not React Native — its own globals and module resolution.
      'supabase/functions/*',
    ],
  },
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    // Features are leaves. Anything two of them need is not a feature's own —
    // it belongs in `@shared/data/queries`, `@shared/ui` or `@shared/lib`.
    // Within a feature imports are relative, so banning the alias here costs
    // nothing and stops the boundary drifting again: it drifted eleven times
    // while this rule lived only in CLAUDE.md.
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@features/*'],
              message:
                'Features may not import each other. Move the shared piece to @shared/data/queries, @shared/ui or @shared/lib.',
            },
          ],
        },
      ],
    },
  },
]);
