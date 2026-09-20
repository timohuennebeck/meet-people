import type { Config } from 'tailwindcss';

import { palette, radii } from './src/shared/theme/palette';

/**
 * Colours and radii come from `src/shared/theme/palette.ts`, which is also what
 * `tokens.ts` reads — a class and a raw value can never name different hexes.
 */
export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- nativewind/preset ships no ESM type declaration.
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: palette,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: radii,
    },
  },
  plugins: [],
} satisfies Config;
