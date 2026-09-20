# treff

Nearby plans, for people who want something to do tonight.

An Expo app built from the `Nearby Plans iOS` design handoff. The original
HTML/CSS prototype and its chat transcripts are kept in `project/` and `chats/`
as the reference the implementation is measured against.

## Getting started

```bash
npm install
cp .env.example .env     # optional; the app runs on fixtures without it
npm start
```

Nothing needs configuring to run the app. Supabase, PostHog and RevenueCat all
stay inert until their keys are present, and screens read from the in-memory
fixture data transcribed from the design.

### On a device

**Expo Go cannot run this app.** `react-native-purchases` ships its own iOS and
Android native code, and Expo Go only carries the modules compiled into its
binary. A development build is required, which is why `expo-dev-client` is a
dependency — `npm start` therefore opens in dev-client mode, not Expo Go.

With a Mac and Xcode, building locally is the shortest path:

```bash
npx expo run:ios --device      # generates ios/, installs pods, builds, installs
```

The first run also needs Developer Mode enabled on the phone (Settings →
Privacy & Security → Developer Mode) and the certificate trusted afterwards
(Settings → General → VPN & Device Management). A free Apple ID signs the build
for seven days; a paid account for a year.

Without a Mac, EAS builds in the cloud. This needs a paid Apple Developer
account — a physical device cannot be provisioned without one:

```bash
npx eas login
npx eas device:create                                  # register the iPhone
npx eas build --profile development --platform ios
npx expo start --dev-client                            # then scan to load the JS
```

`eas.json` defines four profiles: `development` (dev client, internal
distribution), `simulator` (the same, for a Mac simulator), `preview` (internal
distribution, release build) and `production` (store builds, auto-incrementing
the build number).

### Local Supabase

```bash
npm run db:start         # prints the API URL and anon key
npm run db:reset         # re-applies migrations
npm run db:types         # regenerates database.types.ts
```

Copy the printed URL and anon key into `.env` as `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Layout

```
app/                      expo-router routes — thin re-exports of feature screens
src/
  features/               one folder per product area
    onboarding/           welcome through rules, 18 steps
    verification/         selfie capture, review, badge
    paywall/              Nearby Plus
    plans/                map, plan sheets, create flow
    chat/                 threads and the conversations list
    profile/              own and other people's profiles, people search
    settings/             preferences and their detail pages
  shared/
    ui/                   design-system primitives
    components/           composites used by more than one feature
    data/                 schemas, fixtures, query keys, the data source
    lib/                  cn, env, languages, the step sequence, Supabase
    i18n/                 pt-BR and en
    providers/            session, analytics, billing
    theme/                the palette and the tokens derived from it
supabase/                 local dev config and migrations
```

Each feature owns its `screens/`, `ui/`, `lib/`, `data/` and `hooks/`. Anything
two features need moves to `src/shared`.

## How the design was translated

The prototype is HTML with inline styles in a 402×874 iOS frame. A few
conversions were made deliberately, and are worth knowing before changing
anything:

- **Ring outlines become borders, and which ring it is matters.** A React
  Native border is always drawn inside the element's box and eats into its
  padding, so the conversion depends on where the CSS painted the ring. The
  design has no global `box-sizing` reset, which is what makes the two cases
  differ:
  - An **outset** ring — `box-shadow: 0 0 0 Npx` with no `inset`, or a `border`
    on a content-box element — is painted _outside_ and consumes nothing. The
    React Native element must grow by `2N` and keep the design's full padding.
    `Ring` in `src/shared/ui/Avatar.tsx` is that case: a 12px dot inside a 2.5px
    ring is a 17px element, not a 12px one.
  - An **inset** ring — `inset 0 0 0 Npx` — is painted over the padding. The
    element keeps its size and its padding drops by `N`, which is what
    `padCompensation` in `src/shared/ui/Card.tsx` does.

  Getting this backwards silently shrinks every ringed avatar, dot and flag, so
  check the shadow's `inset` keyword before converting one.

- **Shadows are pre-decomposed.** Every `box-shadow` in the design has a named
  entry in `src/shared/theme/tokens.ts`, split into the iOS and Android fields.
- **Relative units become absolute.** `line-height: 1.45` and
  `letter-spacing: -.032em` are resolved to px against their font size.
- **Safe areas floor the design's padding.** The design's 56px top and 34px
  bottom already match an iPhone's insets closely; `Math.max` keeps content
  clear of the notch on hardware whose insets run larger.
- **Icons come from two places.** Icons the design pulled from Phosphor use
  `phosphor-react-native`; the glyphs it drew inline are exact `react-native-svg`
  reproductions in `src/shared/ui/icons.tsx`.

### Where the implementation departs from the prototype

- The prototype had no tab bar, so the map's card carousel sat 30px from the
  bottom edge. With native tabs, the carousel is lifted above the tab bar
  instead — the same visual relationship to the bottom of the usable area.
- The Profile tab is a new screen. The design only drew another person's
  profile (17a); the signed-in user's own profile is derived from it.
- The design offers two layouts for the account step. Both are built: the
  default flow uses `AccountScreen` (6), and `AccountInlineScreen` (6b) sits at
  `/(onboarding)/account-inline` so the variant can be compared and swapped in.

## Data

Screens talk to TanStack Query hooks, which talk to `src/shared/data/source.ts`.
That module resolves against fixtures today and against Supabase later; its
method signatures are the seam, so nothing above it changes.

Query keys come from factories in `src/shared/data/queryKeys.ts`, so
invalidation can target a whole feature or a single record without hand-written
key arrays drifting apart. Mutations apply their change to the cache first and
roll back on error.

## i18n

`pt-BR` is the source locale and carries the design's exact copy, so screens
render identically to the mockups. `en` mirrors its key structure, enforced by
the `Translation` type — a missing or misspelled key is a compile error.

## Checks

```bash
npm run typecheck
npm run lint
npm run format:check
```
