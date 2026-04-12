<div align="center">

# 📞 intl-ui

**The international UI suite the React ecosystem has been missing.**

Headless-first. Accessible by default. Multi-framework core. One ecosystem — phone input, country selector, region selector, city selector — all sharing the same data, types, and state.

[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-127%20passing-brightgreen)](./packages/react/src/phone/__tests__)
[![Core bundle](https://img.shields.io/badge/%40intl--ui%2Fcore-9.4%20KB%20gz-brightgreen)](./packages/core)
[![React bundle](https://img.shields.io/badge/%40intl--ui%2Freact-4.7%20KB%20gz-brightgreen)](./packages/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](./tooling/tsconfig/base.json)
[![Zero deps](https://img.shields.io/badge/runtime%20deps-zero-brightgreen)](./packages/core/package.json)
[![Status](https://img.shields.io/badge/status-pre--1.0-yellow)](#status)

</div>

---

> [!WARNING]
> **Pre-1.0 and not yet published to npm.** The API is settling, not settled. If you want to follow along, star the repo and check back — the first release ships when `@intl-ui/react` has compound tests, virtualization, keyboard a11y audited with axe-core, and a CSS token layer. Everything in this README works **right now** in the repo; the playground boots in 30 seconds (see [Development](#development)).

---

## The problem

Building a form with international phone input, country selector, and city selector in React today means combining **three to five incompatible packages**:

```bash
npm i react-phone-number-input react-country-region-selector \
      country-state-city react-country-flag
```

…and then writing the glue code yourself. Each package ships its own country list (duplicated in the bundle), its own types, its own style system, and no shared state. Picking a country in the phone input doesn't update the country selector. Accessibility is an afterthought. The two most-downloaded packages combined ship **37 KB gzipped** for a single phone input — and the biggest one of those (`react-phone-input-2`, 530K weekly downloads) has been abandoned for four years with 276 open issues.

**`intl-ui` replaces all of that with one coherent ecosystem.**

## The pitch — five things that make this different

### 1. **Headless-first, three levels of abstraction**

```tsx
// Level 1 — one-liner, sane defaults
<PhoneInput defaultCountry="co" onValueChange={setPhone} />

// Level 2 — compound components with full layout control
<PhoneInput.Root defaultCountry="co">
  <PhoneInput.CountrySelect>
    <PhoneInput.Flag />
    <PhoneInput.DialCode />
  </PhoneInput.CountrySelect>
  <PhoneInput.Input />
  <PhoneInput.CountryList>
    {(country, index) => (
      <PhoneInput.CountryListItem country={country} index={index} />
    )}
  </PhoneInput.CountryList>
</PhoneInput.Root>

// Level 3 — the headless hook, render whatever you want
const { getInputProps, getCountrySelectProps, country } = usePhoneInput();
<button {...getCountrySelectProps()}>{country?.flag}</button>
<input {...getInputProps()} />
```

**One library, three ways to consume it.** Same state, same validation, same accessibility — you pick the control level you need. Inspired by Radix UI, Downshift, Floating UI, and TanStack Query.

### 2. **Framework-agnostic core, framework-specific wrappers**

```
@intl-ui/core                 ← TypeScript, zero deps, zero framework
      ↑
      ├── @intl-ui/react      ← hooks + compound components (shipping)
      ├── @intl-ui/angular    ← signals + directives (planned)
      └── @intl-ui/ai         ← smart detection + fuzzy search (planned)
```

The dial-code trie, phone parser, formatter, validator, and country dataset live in `@intl-ui/core` — pure TypeScript, **zero runtime dependencies**, works in Node, Deno, Bun, Cloudflare Workers, Lambdas, and any browser. React, Angular, and every future wrapper consume **the same logic** from core. This is the same architecture that powers TanStack Table, Floating UI, and Tiptap.

### 3. **Accessibility as a differentiator, not a checklist**

- WAI-ARIA 1.2 combobox pattern
- Full keyboard navigation (arrows, Home/End, Enter, Escape, typeahead)
- Live region announcements for screen readers
- Tested with `axe-core` in CI (planned for sprint 2.3)
- Focus management across input / trigger / list boundaries

> **Honest status:** the state machine, prop-getters, and ARIA roles are in place, but the final a11y audit with `axe-core` and manual screen-reader testing land in sprint 2.3. We will not claim "WCAG 2.1 AA" until that test is green in CI.

### 4. **Small. Measured. Fast.**

| Package | Gzipped | What's in it |
|---|---|---|
| `@intl-ui/core` | **9.4 KB** | 200 countries with dial codes, masks, capitals, flags, regions + dial-code trie + parser + formatter + validator |
| `@intl-ui/react` | **4.7 KB** | Headless hook + 7 compound components + Slot + Context |

- **O(k) country lookup** via dial-code trie (k = digits typed), not O(n) over 200 countries per keystroke
- **Dropdown virtualization** via `@tanstack/react-virtual` (sprint 2.2b) — ~15 DOM nodes instead of 240
- **Tree-shakeable entry points**: import only the subset you need

See [Bundle size comparison](#bundle-size) below.

### 5. **Real product sense**

The library is being built in public, iterating on real user feedback. Examples of decisions that were **reversed** based on how the product actually felt in the browser:

- **"Separate dial code" display** (Model B) was tried and reverted because it hid what the user was typing.
- **Auto-prefix "+" on first keystroke** was upgraded to **auto-prefix "+" on focus** so the user doesn't have to wonder why nothing appeared on their first tap.
- **Backspace past the dial code** clears the country automatically so the user can immediately type a new international prefix without fighting the formatter.
- **ISO code shortcut**: typing `co`, `usa`, `gb`, `deu` into the main input switches the country instantly — a power-user feature that costs nothing if you don't know about it.

These are the details that separate libraries you tolerate from libraries you love. See [PLAN.md](./PLAN.md) and the commit history for the full product journey.

---

## Install

> [!NOTE]
> Not yet published to npm. Install paths below will work from the first release. For now, see [Development](#development) to run the playground locally.

```bash
# npm
npm install @intl-ui/react

# pnpm
pnpm add @intl-ui/react

# bun
bun add @intl-ui/react

# yarn
yarn add @intl-ui/react
```

`@intl-ui/core` is installed automatically as a dependency. You don't need to install it separately — every type and utility is re-exported through `@intl-ui/react`.

**Peer dependencies:** `react ^18.2.0 || ^19.0.0`. No `react-dom` requirement for the headless hook.

---

## Usage

### Level 1 — one-liner

The fastest way to get a working phone input with a search-enabled country dropdown:

```tsx
import { PhoneInput } from '@intl-ui/react';

function MyForm() {
  return (
    <PhoneInput
      defaultCountry="co"
      onValueChange={(value, meta) => {
        console.log('E.164:', value);          // "+573105551234"
        console.log('country:', meta.country);  // { name: "Colombia", ... }
        console.log('valid:', meta.isValid);    // true / false
      }}
    />
  );
}
```

That's it. You get:
- Country trigger button with flag and dial code
- Native `<input type="tel">` with format mask
- Searchable dropdown with 200 countries
- Keyboard navigation (arrows, Enter, Escape)
- Backspace-aware country switching
- Typing `+44` auto-detects UK; typing `co` switches to Colombia instantly

### Level 2 — compound components

When you need full control over the layout, styling, or the order of elements:

```tsx
import { PhoneInput } from '@intl-ui/react';

function MyForm() {
  return (
    <PhoneInput.Root
      defaultCountry="co"
      onValueChange={(value, meta) => console.log(value)}
    >
      <div className="flex">
        <PhoneInput.CountrySelect className="px-3 border rounded-l bg-gray-50">
          <PhoneInput.Flag className="text-lg" />
          <PhoneInput.DialCode className="ml-2 text-sm" />
        </PhoneInput.CountrySelect>

        <PhoneInput.Input
          placeholder="Phone number"
          className="flex-1 px-3 py-2 border border-l-0 rounded-r"
        />

        <PhoneInput.CountryList className="absolute top-full w-80 bg-white border rounded shadow-lg">
          {(country, index) => (
            <PhoneInput.CountryListItem
              key={country.iso2}
              country={country}
              index={index}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100"
            />
          )}
        </PhoneInput.CountryList>
      </div>
    </PhoneInput.Root>
  );
}
```

Every compound child accepts `className`, `style`, event handlers, and the `asChild` prop. They all read from a shared React context so the state, keyboard handlers, and ARIA attributes are wired automatically.

#### The `asChild` pattern

Already have a styled input from your design system? Don't wrap it — **clone it**:

```tsx
<PhoneInput.Input asChild>
  <MyCustomInput placeholder="Phone" className="my-design-system-input" />
</PhoneInput.Input>
```

`<PhoneInput.Input>` uses a minimal reimplementation of Radix's `<Slot>` to clone `<MyCustomInput>`, merge in the hook's `value`, `onChange`, `onKeyDown`, `onFocus`, `onBlur`, `ref`, `type="tel"`, and ARIA attributes, and preserve your own `className` and `placeholder`. Event handlers are composed: your `onFocus` fires alongside the hook's.

### Level 3 — the headless hook

When compound components don't fit — you're building a completely custom DOM tree, integrating with a chart library, or rendering to canvas:

```tsx
import { usePhoneInput } from '@intl-ui/react';

function MyCustomPhoneInput() {
  const {
    value,              // "+573105551234" — the canonical E.164 string
    inputValue,         // "+57 310 555 1234" — what's rendered in the input
    country,            // { name: "Colombia", iso2: "co", dialCode: "57", ... }
    isValid,            // boolean
    isOpen,             // dropdown open state
    focusedIndex,       // currently focused country in the list
    visibleCountries,   // filtered country list (respects setFilter)

    getInputProps,         // spread onto <input type="tel" />
    getCountrySelectProps, // spread onto your trigger <button>
    getCountryListProps,   // spread onto your <ul role="listbox">
    getCountryOptionProps, // spread onto each <li role="option">

    setCountry,         // programmatically set the country by ISO2
    setOpen,            // open/close the dropdown
    setFilter,          // filter the country list
    reset,              // reset to initial state
  } = usePhoneInput({
    defaultCountry: 'co',
    onValueChange: (value, meta) => {/* ... */},
    onCountryChange: (country) => {/* ... */},
  });

  return /* your custom JSX, spreading the prop-getters */;
}
```

This is the API surface TanStack, Downshift, and React Aria built their reputations on. It gives you **every possible layout and styling freedom** while the hook owns the behavior.

---

## Three ways to switch country (usability that compounds)

Your user can pick a country in whichever way feels natural. **All three work in every demo.**

### 1. Click the country trigger → search the dropdown

The search box inside the dropdown filters by **name**, **ISO2**, **ISO3**, and **dial code**:

| Type this | You get |
|---|---|
| `colomb` | 🇨🇴 Colombia |
| `usa` / `us` | 🇺🇸 United States |
| `44` or `+44` | 🇬🇧 United Kingdom |
| `kenya` | 🇰🇪 Kenya |
| `deu` | 🇩🇪 Germany |

### 2. Type a `+code` in the main input — country is detected instantly

```
Input is empty → click the input → "+" appears automatically (no need to type it)
Type "3" → "+3"
Type "8" → "+38"
Type "0" → "+380" → 🇺🇦 Ukraine detected, flag switches, mask applied
```

Backspace all the way → country clears → you can immediately type a new international prefix without fighting the formatter.

### 3. Type the ISO code directly in the main input

Power users don't even need to open the dropdown. Type the country code:

```
"co"  → 🇨🇴 Colombia
"usa" → 🇺🇸 United States
"gb"  → 🇬🇧 United Kingdom
"deu" → 🇩🇪 Germany
```

The input clears and is ready for the national digits. Strict matching: only **exactly 2 or 3 ASCII letters** triggers the shortcut, so `co3` is treated as a digit, not as ISO.

---

## Bundle size

Real measurements from the dist output, not marketing:

| Library | Weekly downloads | Bundle (gzipped) | Dependencies | Status |
|---|---|---|---|---|
| `react-phone-number-input` | ~1.7M | **37 KB** | 5 | Active |
| `react-phone-input-2` | ~530K | **25 KB** | 0 | **Abandoned** (4 years, 276 open issues) |
| `intl-tel-input` | ~682K | **~40 KB** | 0 | Active (vanilla JS with React wrapper) |
| `react-international-phone` | ~330K | ~18 KB | 0 | Active (ES5 target) |
| **`@intl-ui/react`** | *not yet published* | **4.7 KB** | **1** (`@intl-ui/core`) | **Pre-1.0** |

The 4.7 KB number is the **hook + seven compound components + Slot + Context + type definitions**. It does not yet include virtualization (sprint 2.2b) or CSS tokens (sprint 2.4). The target for the full package with those features is **under 15 KB gzipped** and will be enforced in CI via `size-limit`.

Two more measurements:

```
@intl-ui/core (ESM, all entry points): 9.4 KB gzipped
@intl-ui/react (ESM, index.js):        4.7 KB gzipped
```

`@intl-ui/core` ships 200 countries with dial codes, format masks, capitals, flags, and the full dial-code trie in 9.4 KB. That's smaller than the **country list alone** in most alternatives.

---

## Accessibility

**Current status — sprint 2.1/2.2 complete, sprint 2.3 pending:**

- ✅ Keyboard navigation (arrows, Home, End, Enter, Escape)
- ✅ `role="combobox"`, `role="listbox"`, `role="option"`
- ✅ `aria-haspopup`, `aria-expanded`, `aria-selected`
- ✅ `type="tel"` and `autoComplete="tel"` on the input
- ✅ Focus management basics (click-outside to close)
- ⏳ `aria-activedescendant` (sprint 2.3)
- ⏳ `aria-controls` wiring between input and listbox (sprint 2.3)
- ⏳ Live region for screen reader announcements (sprint 2.3)
- ⏳ `axe-core` in CI with zero violations (sprint 2.3)
- ⏳ Manual NVDA and VoiceOver audit (sprint 2.3)

**We will not claim "WCAG 2.1 AA compliant"** until the `axe-core` CI check is green and the manual screen-reader audit is documented. Currently this library has **the skeleton** of a properly accessible combobox — the muscles are on the way.

---

## Multi-framework vision

`@intl-ui/core` is **pure TypeScript**. No React, no Angular, no DOM. That means the same dial-code trie, phone parser, country dataset, validator, and formatter can power wrappers in any framework without duplication:

```
@intl-ui/core
      ├── phone parsing, formatting, validation
      ├── 200 ISO 3166-1 countries (name, iso2, iso3, dial, flag, capital, region)
      ├── dial-code trie (O(k) lookup)
      └── full TypeScript types

      ▼ consumed by

@intl-ui/react      ← headless hook + compound components (shipping)
@intl-ui/angular    ← signals + directives (planned)
@intl-ui/ai         ← smart country detection + fuzzy search (planned)
@intl-ui/vue        ← possible — core is ready if someone wants to contribute it
```

Each framework wrapper is ~20-30% of the total code. Write the logic once, ship it everywhere. The same architecture powers TanStack Table and Floating UI, both of which have 3M+ weekly downloads.

A Vue wrapper, a Solid wrapper, or a Svelte wrapper could be contributed by the community without changing a single line of `@intl-ui/core`.

---

## What's in the box

### `@intl-ui/core` — the data + logic layer

```typescript
import {
  // Country data (200 countries, ISO 3166-1 complete)
  countries,              // Country[]
  countriesMinimal,       // top 50 for lightweight builds
  getCountryByIso2,       // (iso2: string) => Country | undefined
  getCountryByIso3,       // (iso3: string) => Country | undefined
  getCountriesByDialCode, // (dialCode: string) => Country[]

  // Phone utilities
  parsePhone,      // (phone, countryHint?) => ParsedPhone
  formatPhone,     // (phone, country, options?) => string (international)
  formatNational,  // (digits, country) => string (national portion)
  validatePhone,   // (phone, country) => { isValid, isPossible, error? }
  getActiveMask,   // pick the active mask for a partial number

  // Trie
  buildDialCodeTrie,   // () => DialCodeTrieNode
  findCountryByDigits, // (trie, digits) => CountryGuessResult
  guessCountryByPhone, // (trie, phone, current?) => CountryGuessResult

  // Utilities
  removeNonDigits, normalizeText, applyMask, iso2ToFlag, toE164,

  // Types
  type Country, type CountryIso2, type ParsedPhone,
  type ValidationResult, type ValidationError,
  type CountryGuessResult, type FormatOptions,
} from '@intl-ui/core';
```

**Zero runtime dependencies. Works in Node, Deno, Bun, Cloudflare Workers, and the browser.** If you only need the logic (backend validator, CLI tool, migration script), install `@intl-ui/core` directly.

### `@intl-ui/react` — React hook + compound components

```typescript
import {
  // Headless hook
  usePhoneInput,

  // Compound components (Radix-style)
  PhoneInput,                   // one-liner wrapper + namespace
  PhoneInputRoot,               // <PhoneInput.Root>
  PhoneInputInput,              // <PhoneInput.Input>
  PhoneInputCountrySelect,      // <PhoneInput.CountrySelect>
  PhoneInputFlag,               // <PhoneInput.Flag>
  PhoneInputDialCode,           // <PhoneInput.DialCode>
  PhoneInputCountryList,        // <PhoneInput.CountryList>
  PhoneInputCountryListItem,    // <PhoneInput.CountryListItem>

  // Advanced
  usePhoneInputContext,  // read hook state from custom compound children
  Slot,                  // the Radix-style Slot used by asChild
  mergeProps,            // prop-merge helper (className, style, handlers)
  composeRefs,           // ref-composition helper

  // Types
  type UsePhoneInputOptions,
  type UsePhoneInputReturn,
  type ValueChangeMeta,
  type PhoneInputProps,
  // ... plus re-exports from @intl-ui/core
} from '@intl-ui/react';
```

---

## Architecture

This is a pnpm + Turborepo monorepo:

```
intl-ui/
├── packages/
│   ├── core/              @intl-ui/core         ← 200 countries, trie, phone utils
│   └── react/             @intl-ui/react        ← hook + compound components
│
├── apps/
│   └── playground/        Vite + React playground ← 10 interactive demos with live state
│
├── tooling/
│   ├── tsconfig/          Shared TypeScript config
│   ├── eslint-config/     Shared ESLint 9 flat config
│   └── vitest-config/     Shared Vitest config
│
├── .changeset/            Independent per-package versioning
├── .github/workflows/     CI (typecheck + build + test on Node 18/20/22)
├── pnpm-workspace.yaml    Workspace definition
├── turbo.json             Turborepo task graph
└── PLAN.md                Project vision & roadmap
```

Every package ships:
- **Dual ESM + CJS** via tsup
- **TypeScript type declarations** (both `.d.ts` and `.d.cts`)
- **Source maps**
- **Subpath exports** where relevant (e.g. `@intl-ui/core/phone`)
- **`"sideEffects": false`** for full tree-shaking

---

## Roadmap

> Full detail in [PLAN.md](./PLAN.md). Summary below.

### Phase 1 — Core foundation ✅ **SHIPPED**

- [x] Monorepo (pnpm + Turborepo + Changesets)
- [x] `@intl-ui/core` with 200 countries, phone utils, dial-code trie
- [x] 91 unit tests, 9.4 KB gzipped
- [x] CI on Node 18 / 20 / 22
- [x] Shared tooling (tsconfig, eslint-config, vitest-config)

### Phase 2 — `@intl-ui/react` (phone input) 🟡 **IN PROGRESS**

- [x] **2.1** Headless `usePhoneInput()` hook with state machine
- [x] **2.2** Compound components with `asChild` pattern and context
- [x] **2.2a** Model A display with backspace fix
- [x] **2.2a** Auto-prefix `+` on focus
- [x] **2.2a** ISO code shortcut (`co`, `usa`, `deu`)
- [x] **2.2a** Dropdown filter synced with input
- [ ] **2.2b** `@tanstack/react-virtual` integration (~15 DOM nodes)
- [ ] **2.2b** Component tests with `@testing-library/react` + `user-event`
- [ ] **2.3** ARIA combobox 1.2 full pattern + `axe-core` in CI
- [ ] **2.4** CSS custom properties + default stylesheet
- [ ] **2.5** Storybook 8 with interactive stories
- [ ] **2.6** First public release of `@intl-ui/react` to npm

### Phase 3 — Country & region selectors

- [ ] `useCountrySelect()` + `<CountrySelect>` compound
- [ ] `useRegionSelect()` + `<RegionSelect>` compound
- [ ] `<IntlProvider>` for shared state between phone, country, region
- [ ] Zod schemas (`phoneSchema`, `countrySchema`, `regionSchema`)
- [ ] Native `react-hook-form` adapter

### Phase 4 — `@intl-ui/ai` (optional intelligence)

- [ ] Smart country prediction from `navigator.language` + `Intl.DateTimeFormat`
- [ ] Fuzzy search with pre-computed alias map
- [ ] Phone type detection (mobile / fixed / VoIP)
- [ ] Contextual suggestions

### Phase 5 — City selector

- [ ] `useCitySelect()` + `<CitySelect>` with autocomplete
- [ ] Lazy-loaded city chunks per country (150K+ cities, CDN-friendly)

### Phase 6 — `@intl-ui/angular`

- [ ] Standalone components with signals (Angular 17+)
- [ ] `ControlValueAccessor` for Reactive Forms
- [ ] Reuses 100% of `@intl-ui/core`

### Phase 7 — Launch

- [ ] Starlight documentation site
- [ ] Public Storybook (Chromatic)
- [ ] Migration guides from `react-phone-number-input`, `react-phone-input-2`, `react-country-region-selector`
- [ ] README badges, demos, comparison benchmarks
- [ ] npm publish of all packages

---

## Development

Clone, install, run the playground:

```bash
git clone https://github.com/johnalbh/intl-ui.git
cd intl-ui
pnpm install
pnpm -F @intl-ui/playground dev
```

Opens `http://localhost:5173` with **10 interactive demos**:

1. **Full UX demo** — the showcase consumer with no hardcoded country, working dropdown, search, ISO shortcut, auto-prefix `+`, live state inspector, and output format toggle
2. **Model B regression tests** — clear-and-retype, paste international, switch via dropdown, compound equivalent
3. **Headless hook demos** — uncontrolled, controlled, minimal
4. **Compound demos** — one-liner, full compound, asChild

Every demo has an `<OutputInspector>` that lets you toggle between the two backend-shaped outputs: **full phone (E.164)** or **separate dial code + national**.

### Useful commands

```bash
# Run all tests across the monorepo
pnpm test

# Type-check every package
pnpm typecheck

# Build every package (dual ESM + CJS + .d.ts)
pnpm build

# Lint every package
pnpm lint

# Run a single package's tests
pnpm -F @intl-ui/core test
pnpm -F @intl-ui/react test

# Run a specific test suite in watch mode
pnpm -F @intl-ui/react test:watch
```

Every commit should be green on `typecheck + build + test + lint`.

---

## Testing

**127 tests passing** on every CI run, across Node 18 / 20 / 22:

| Package | Test files | Tests |
|---|---|---|
| `@intl-ui/core` | 4 (countries, dial-codes, phone, utils) | 91 |
| `@intl-ui/react` | 2 (smoke + usePhoneInput integration) | 36 |
| **Total** | **6** | **127** |

The React tests cover:
- Controlled and uncontrolled modes for both `value` and `country`
- All six paths of `handleInputChange` (ISO, empty, lone `+`, garbage, international, national)
- Auto-prefix on focus and lone-`+` cleanup on blur
- Country auto-detection via dial-code trie
- Backspace past the dial code clearing the country
- Clear-and-retype workflows switching between countries
- ISO code shortcuts (`co`, `USA`, `col`, `deu`)
- Keyboard navigation (arrows, Enter, Escape)
- Prop-getter shapes and static structural guarantees

Every behavior the hook promises is locked down by a test.

---

## Design philosophy

A few principles guiding every commit:

1. **Headless first, compound second, wrapper last.** Build the state machine in `useReducer`, expose it via prop-getters, wrap those into compound components, finally offer a one-liner. Each level is thinner than the next.

2. **Prop-getters compose; spreading never silently drops behavior.** Every compound component runs consumer props through `mergeProps` so user-supplied `onFocus`, `className`, and `style` are composed with the hook-provided ones, never overwritten.

3. **Zero runtime dependencies in `@intl-ui/core`.** Any new dependency must clear a high bar: genuine capability that would require a non-trivial reimplementation. So far: nothing has cleared it.

4. **One external dependency in `@intl-ui/react`.** Currently only `@intl-ui/core`. Future additions (`@tanstack/react-virtual` for the dropdown) must be justified and pass the bundle-size budget.

5. **Accessibility is not a feature — it's infrastructure.** Keyboard navigation, ARIA roles, and focus management live in the same state machine as the visual state. You can't accidentally ship a version that works visually but not with a screen reader, because the test suite fails if either half breaks.

6. **Every bug gets a regression test.** The backspace dead-end, the `.mjs` / `.js` exports mismatch, the vitest config extension issue, the `setCountry` reformat bug — every one of these lives as a test that fails if the regression is reintroduced.

7. **Iterate on the actual product, not on the idea of the product.** The playground is not optional infrastructure — it's where the library is designed. Every UX decision was refined by clicking it in a real browser with real keyboard inputs. Tests verify behavior; the playground verifies feel.

---

## Why another phone input library?

Because:

1. **`react-phone-input-2`** (530K weekly downloads) has been abandoned for 4+ years. There are 276 open issues. Its users deserve somewhere to go.
2. **`react-phone-number-input`** (1.7M weekly downloads) works but ships 37 KB gzipped and five dependencies. You can do better.
3. **`intl-tel-input`** (682K weekly downloads) is a vanilla JS library with a thin React wrapper. The React experience is second-class.
4. **None of them** share data with country selectors, region selectors, or city selectors. You still have to install three more packages and glue them together.
5. **None of them** offer a true headless mode with prop-getters for full layout control.
6. **None of them** pass a WCAG 2.1 AA audit out of the box. (We're not there yet either — but we're building toward it, with proof in CI.)

There is room at the top. The goal is to take it.

---

## Contributing

Contributions are welcome once the first public release ships (sprint 2.6). Until then:

- **Star the repo** if you want to follow along.
- **Open an issue** with UX feedback, bug reports, or feature ideas. Real usage drives every decision in this codebase.
- **Run the playground** locally and tell us what feels off.

Once 1.0 ships, we'll post:

- A `CONTRIBUTING.md` with architecture notes for new compound children
- Issue templates for bugs, features, and migration help
- A `CODE_OF_CONDUCT.md`
- A public roadmap and RFC process for breaking changes

If you have expertise in:
- **Screen reader testing** (NVDA, VoiceOver, JAWS)
- **Angular signals + directives** (for the eventual `@intl-ui/angular`)
- **Fuzzy search at scale** (for `@intl-ui/ai`)
- **International phone number edge cases** (disputed regions, shared dial codes, area code changes)

…we would love your help when contributions open.

---

## Acknowledgments

This library would not exist without the pioneering work of:

- **[Radix UI](https://www.radix-ui.com/)** — the compound component + `asChild` pattern + Slot primitive
- **[TanStack](https://tanstack.com/)** — the framework-agnostic core + thin wrapper architecture
- **[Downshift](https://github.com/downshift-js/downshift)** — prop-getters as an API style
- **[Floating UI](https://floating-ui.com/)** — headless-first positioning and anchoring
- **[React Hook Form](https://react-hook-form.com/)** — controlled + uncontrolled unified state pattern
- **[`libphonenumber-js`](https://github.com/catamphetamine/libphonenumber-js)** — the format mask and validation rules that made phone parsing tractable
- **[`world-countries`](https://github.com/mledoze/countries)** — the ISO 3166-1 dataset that seeded our country metadata

The product ideas — auto-prefix on focus, ISO shortcuts, backspace-aware country clearing, live state inspector — emerged from testing in the browser with real keyboard input, one user at a time. That feedback loop is what turns a technically correct library into one you actually want to use.

---

## License

[MIT](./LICENSE) © John Alberto López Hernández

You can use this in commercial projects, closed-source projects, and for any purpose. Attribution is appreciated but not required.

---

<div align="center">

**Built in public. Iterating on real feedback. Ship the library you wish existed.**

⭐ Star if you want to follow along

</div>
