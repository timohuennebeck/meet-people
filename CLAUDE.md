# Working in this repo

This is an Expo app implementing the `Nearby Plans iOS` design. The design
source of truth is `project/Nearby Plans iOS.dc.html` — an HTML prototype with
inline styles in a 402×874 iOS frame. When changing a screen's appearance,
check that file first.

## Conventions

- **Filenames are kebab-case**, all of them: `age-range-control.tsx`,
  `use-chat.ts`, `query-keys.ts`. What is _inside_ keeps its own casing —
  components stay `PascalCase`, hooks stay `useCamelCase` — so
  `plan-card.tsx` exports `PlanCard`. Routes under `app/` are filenames too,
  and there the name is also the URL.
- **Every screen lives in `src/features/<area>/screens/`.** Files under `app/`
  are one-line re-exports; keep them that way.
- **Copy goes through i18n.** No literal user-facing strings in components.
  `pt-BR` is the source locale and holds the design's exact wording; `en` must
  mirror its key structure or the build fails.
- **Text renders through `@shared/ui/text`'s `Text`.** React Native cannot synthesise
  Inter's weights, so each weight maps to its own font file.
- **Styling is Tailwind via NativeWind.** Use `cn()` from `@shared/lib/cn` to
  compose classes — it knows the custom scales in `tailwind.config.ts`. Reach
  for `style={}` only where Tailwind cannot express it: shadows, gradients, SVG
  props and computed values.
- **Colours are declared once, in `@shared/theme/palette.ts`.** Tailwind reads
  it for classes and `@shared/theme/tokens.ts` flattens it for raw values, so a
  new colour goes in the palette and nowhere else. Shadows come from `tokens.ts`.
  Never write a hex literal in a component.
- **Anything two features need moves to `src/shared`.** Features are leaves:
  they import from `@shared` and never from each other, and `no-restricted-imports`
  fails the lint if one tries. A feature holds `screens/`, its own `ui/` and its
  own `lib/` — nothing else. Server reads and writes live in
  `@shared/data/api/<group>`, and the TanStack Query hooks over them in
  `@shared/data/queries/`.
- **Three parameters or more means one object.** Two positional arguments of
  the same type are a bug waiting to be typed in the wrong order — `seatsFor`
  took two strings and `pinFor` two numbers. Destructure in the signature and
  name each field, so the call site reads as a sentence and the compiler
  catches a swap.
- **A shared set of values is a named constant, never a literal.** The app's
  vocabulary is in `@shared/data/schemas` (`MEMBERSHIP.HOST`,
  `AUDIENCE_GENDER.EVERYONE`), the database's own words in
  `@shared/lib/supabase/enums` (`MEMBER_STATUS.SEATED`). They are not the same
  sets — `'requested'` is in both and means different things — so the mapping
  layer translates between them and a screen only ever sees the app's.
  SCREAMING_SNAKE for the object, PascalCase for the type of the same name.
  A union of _shapes_ discriminated by a tag, like `AttendeeDetail`, is not
  one of these and stays as it is.
- **No barrel files.** Metro does not tree-shake, so a re-export hub pulls every
  module behind it into whatever imports one name. Import the module you mean:
  `@shared/ui/text`, not `@shared/ui`.

## Translating design values

- A CSS ring becomes a border, but check the `inset` keyword first — a React
  Native border always eats inwards, so the two cases convert differently:
  - **Outset** (`box-shadow: 0 0 0 Npx`, no `inset`): painted outside, consumes
    nothing. Grow the element by `2N` and keep the design's padding. Use `Ring`
    from `@shared/ui/avatar` rather than writing it out.
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
