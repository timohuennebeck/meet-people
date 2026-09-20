# Working in this repo

This is an Expo app implementing the `Nearby Plans iOS` design. The design
source of truth is `project/Nearby Plans iOS.dc.html` — an HTML prototype with
inline styles in a 402×874 iOS frame. When changing a screen's appearance,
check that file first.

## Conventions

- **Every screen lives in `src/features/<area>/screens/`.** Files under `app/`
  are one-line re-exports; keep them that way.
- **Copy goes through i18n.** No literal user-facing strings in components.
  `pt-BR` is the source locale and holds the design's exact wording; `en` must
  mirror its key structure or the build fails.
- **Text renders through `@shared/ui`'s `Text`.** React Native cannot synthesise
  Inter's weights, so each weight maps to its own font file.
- **Styling is Tailwind via NativeWind.** Use `cn()` from `@shared/lib/cn` to
  compose classes — it knows the custom scales in `tailwind.config.ts`. Reach
  for `style={}` only where Tailwind cannot express it: shadows, gradients, SVG
  props and computed values.
- **Colours are declared once, in `@shared/theme/palette.ts`.** Tailwind reads
  it for classes and `@shared/theme/tokens.ts` flattens it for raw values, so a
  new colour goes in the palette and nowhere else. Shadows come from `tokens.ts`.
  Never write a hex literal in a component.
- **Anything two features need moves to `src/shared`.** Features should not
  import from each other's internals.

## Translating design values

- A CSS ring becomes a border, but check the `inset` keyword first — a React
  Native border always eats inwards, so the two cases convert differently:
  - **Outset** (`box-shadow: 0 0 0 Npx`, no `inset`): painted outside, consumes
    nothing. Grow the element by `2N` and keep the design's padding. Use `Ring`
    from `@shared/ui` rather than writing it out.
  - **Inset** (`inset 0 0 0 Npx`): painted over the padding. Keep the element's
    size and drop its padding by `N`.

  The design export has no global `box-sizing` reset, so a plain `border` on an
  element that did not opt into `border-box` is the outset case too.

- Unitless line heights and `em` letter-spacing resolve to px against the font
  size.
- Keep the design's half-pixel sizes: `text-[16.5px]`, not `text-[17px]`.

## Before finishing

```bash
npm run typecheck && npm run lint
```
