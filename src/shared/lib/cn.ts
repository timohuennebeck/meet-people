import { extendTailwindMerge } from 'tailwind-merge';

/**
 * `tailwind-merge` only knows Tailwind's stock scale, so the custom groups
 * added in `tailwind.config.js` are registered here. Without this, classes like
 * `rounded-sheet rounded-card` would both survive instead of the later winning.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            '10.5px',
            '11.5px',
            '12.5px',
            '13.5px',
            '14.5px',
            '15.5px',
            '16.5px',
            '17.5px',
            '18.5px',
          ].map((v) => `[${v}]`),
        },
      ],
      rounded: [{ rounded: ['sheet', 'card', 'panel', 'tile', 'well', 'field', 'pill'] }],
    },
  },
});

/**
 * Joins class names and resolves Tailwind conflicts, last-one-wins.
 * Falsy entries are dropped so `cn('base', isActive && 'active')` reads cleanly.
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return twMerge(inputs.filter(Boolean).join(' '));
}
