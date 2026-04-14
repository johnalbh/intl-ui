<div align="center">

# intl-ui

**International UI components for web applications.**

A multi-framework ecosystem for phone input, country selection, and localized forms. One framework-agnostic core, thin wrappers per framework.

[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![@intl-ui/core](https://img.shields.io/npm/v/@intl-ui/core?label=%40intl-ui%2Fcore)](https://www.npmjs.com/package/@intl-ui/core)
[![@intl-ui/react](https://img.shields.io/npm/v/@intl-ui/react?label=%40intl-ui%2Freact)](https://www.npmjs.com/package/@intl-ui/react)
[![@intl-ui/angular](https://img.shields.io/npm/v/@intl-ui/angular?label=%40intl-ui%2Fangular)](https://www.npmjs.com/package/@intl-ui/angular)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](./tooling/tsconfig/base.json)

**[Live Demo &mdash; React](https://johnalbh.github.io/intl-ui/react/)** &nbsp;·&nbsp;
**[Live Demo &mdash; Angular](https://johnalbh.github.io/intl-ui/angular/)** &nbsp;·&nbsp;
**[GitHub](https://github.com/johnalbh/intl-ui)**

</div>

---

## Packages

| Package | Version | Gzipped | Description |
|---------|---------|---------|-------------|
| [`@intl-ui/core`](./packages/core) | [![npm](https://img.shields.io/npm/v/@intl-ui/core)](https://www.npmjs.com/package/@intl-ui/core) | ~9.4 KB | Framework-agnostic phone parsing, formatting, validation, and country data |
| [`@intl-ui/react`](./packages/react) | [![npm](https://img.shields.io/npm/v/@intl-ui/react)](https://www.npmjs.com/package/@intl-ui/react) | ~4.8 KB | React hook and compound components |
| [`@intl-ui/angular`](./packages/angular) | [![npm](https://img.shields.io/npm/v/@intl-ui/angular)](https://www.npmjs.com/package/@intl-ui/angular) | ~18 KB | Angular standalone components, ControlValueAccessor, and validators |

---

## Install

**React:**

```bash
npm install @intl-ui/react
```

**Angular:**

```bash
npm install @intl-ui/angular
```

**Framework-agnostic (Node, Deno, Bun, browser):**

```bash
npm install @intl-ui/core
```

`@intl-ui/core` is bundled as a dependency of the React and Angular packages &mdash; you only need to install it directly if you want to use the parsing and validation utilities without a UI framework.

---

## Quick start

### React

```tsx
import { PhoneInput } from '@intl-ui/react';

function App() {
  return (
    <PhoneInput
      defaultCountry="us"
      onValueChange={(value, meta) => {
        console.log(value);         // "+573105551234"
        console.log(meta.isValid);  // true
        console.log(meta.country);  // { name: "Colombia", iso2: "co", ... }
      }}
    />
  );
}
```

### Angular

```typescript
import { Component, signal } from '@angular/core';
import { IntlPhoneInputComponent } from '@intl-ui/angular';

@Component({
  standalone: true,
  imports: [IntlPhoneInputComponent],
  template: `
    <intl-phone-input [defaultCountry]="'co'" [(value)]="phone" />
    <p>E.164: {{ phone() }}</p>
  `,
})
export class AppComponent {
  phone = signal('');
}
```

For full API documentation, see the package-level READMEs:
- [React package README](./packages/react/README.md)
- [Angular package README](./packages/angular/README.md)

---

## Design goals

### Framework-agnostic core

The phone parser, formatter, validator, country dataset, and dial-code trie live in `@intl-ui/core` &mdash; pure TypeScript with zero runtime dependencies. The same logic is shared across every framework wrapper, so behavior stays consistent whether you use React, Angular, or call the utilities directly in Node.

### Three levels of abstraction

Each framework wrapper exposes three ways to consume the library, so you can pick the level of control you need:

1. **One-liner component** &mdash; sensible defaults, works out of the box.
2. **Compound components** &mdash; full layout control with shared context.
3. **Headless hook or store** &mdash; returns state and prop-getters; you render whatever you want.

### Accessibility built in

- `role="combobox"`, `role="listbox"`, `role="option"`
- `aria-haspopup`, `aria-expanded`, `aria-selected`
- Full keyboard navigation (arrows, Enter, Escape, typeahead)
- `type="tel"` and `autoComplete="tel"` on the input
- Focus management across input, trigger, and list boundaries

### Small and measured

Bundle sizes reported above come from the actual `dist/` output, not estimates. Every package ships:

- Dual **ESM + CJS** builds via tsup
- **TypeScript declarations** (`.d.ts` and `.d.cts`)
- **Source maps**
- **`"sideEffects": false`** for full tree-shaking

---

## Features

### Auto country detection

Typing a dial code automatically switches the country via an O(k) dial-code trie lookup:

```
Type "3"   → "+3"
Type "8"   → "+38"
Type "0"   → "+380"  → Ukraine detected, flag switches, mask applied
```

### ISO code shortcut

Power users can type the country code directly in the input:

```
"co"  → Colombia
"usa" → United States
"gb"  → United Kingdom
"deu" → Germany
```

The shortcut triggers only on exactly 2 or 3 ASCII letters, so partial digits are preserved normally.

### Searchable country list

The dropdown filters by name, ISO2, ISO3, and dial code:

| Search | Match |
|---|---|
| `colomb` | Colombia |
| `usa` / `us` | United States |
| `44` or `+44` | United Kingdom |
| `kenya` | Kenya |

### Controlled and uncontrolled

Follows the same pattern as native form controls: pass `value` + `onValueChange` for controlled mode, or `defaultValue` alone for uncontrolled. Both work identically for the selected country.

---

## Ecosystem

```
@intl-ui/core                ← TypeScript, zero runtime deps
      ↑
      ├── @intl-ui/react     ← hooks + compound components
      └── @intl-ui/angular   ← standalone components + CVA + validators
```

`@intl-ui/core` runs in any JavaScript runtime (Node, Deno, Bun, Cloudflare Workers, browsers). Framework wrappers are thin layers on top &mdash; each consumes the same parsing, formatting, and validation logic.

A Vue, Solid, or Svelte wrapper could be added without modifying `@intl-ui/core`.

---

## Project structure

This is a pnpm + Turborepo monorepo:

```
intl-ui/
├── packages/
│   ├── core/              @intl-ui/core        (framework-agnostic)
│   ├── react/             @intl-ui/react       (React bindings)
│   └── angular/           @intl-ui/angular     (Angular bindings)
│
├── apps/
│   ├── playground/        React demo (Vite)
│   └── playground-angular/ Angular demo
│
├── tooling/
│   ├── tsconfig/          Shared TypeScript config
│   ├── eslint-config/     Shared ESLint config
│   └── vitest-config/     Shared Vitest config
│
├── .changeset/            Independent per-package versioning
└── .github/workflows/     CI + automated release via OIDC
```

---

## Development

```bash
git clone https://github.com/johnalbh/intl-ui.git
cd intl-ui
pnpm install

# React playground  →  http://localhost:5173
pnpm --filter @intl-ui/playground dev

# Angular playground  →  http://localhost:4200
pnpm --filter @intl-ui/playground-angular dev
```

### Common tasks

```bash
pnpm build       # Build all packages
pnpm test        # Run all test suites
pnpm typecheck   # Type-check every package
pnpm lint        # Lint every package
```

### Release flow

Releases are fully automated:

1. Make changes in a feature branch
2. Run `pnpm changeset` to describe the change
3. Open a PR; CI runs type-check, build, and tests
4. Merge to `main`
5. A bot opens a "Version Packages" PR with the appropriate version bumps
6. Merge that PR to publish to npm

Publishing uses **OIDC Trusted Publishing** &mdash; no npm tokens stored anywhere. GitHub Actions authenticates directly against npm through GitHub's OIDC provider.

---

## Testing

Tests run on every CI push across Node 20 and 22:

| Package | Test files | Tests |
|---|---|---|
| `@intl-ui/core` | 4 | 91 |
| `@intl-ui/react` | 2 | 40 |
| `@intl-ui/angular` | 1 | 5 |

Coverage thresholds: **90%** statements / functions / lines, **85%** branches.

---

## Contributing

Contributions are welcome. A few ways to help:

- **Report issues** with reproducible examples
- **Suggest features** with a concrete use case
- **Improve docs** &mdash; typos, clarifications, missing examples
- **Add a framework wrapper** (Vue, Solid, Svelte) &mdash; the core is ready

Before opening a pull request, please:
- Run `pnpm test && pnpm typecheck` locally
- Add or update a changeset via `pnpm changeset`
- Keep commits focused and descriptive

---

## Acknowledgments

This library stands on the shoulders of several excellent open-source projects:

- [Radix UI](https://www.radix-ui.com/) &mdash; compound component patterns and the `asChild` / Slot primitive
- [TanStack](https://tanstack.com/) &mdash; framework-agnostic core architecture
- [Downshift](https://github.com/downshift-js/downshift) &mdash; prop-getter API style
- [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) &mdash; phone format rules
- [world-countries](https://github.com/mledoze/countries) &mdash; ISO 3166-1 dataset

---

## License

[MIT](./LICENSE) &copy; John Alberto L&oacute;pez Hern&aacute;ndez

Free to use in commercial and closed-source projects.
