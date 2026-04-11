# @intl-ui/react

React components and hooks for international UI — headless-first, accessible, framework-free styling.

Part of the [@intl-ui](https://github.com/johnalbh/intl-ui) ecosystem.

## Status

🚧 **Work in progress.** This package is currently scaffolding only. The first public release will ship with:

- `usePhoneInput()` — headless hook for international phone inputs
- `<PhoneInput />` — one-line component with sane defaults
- `<PhoneInput.Root>` / `.Input` / `.CountrySelect` / `.CountryList` — compound components for full layout control
- WAI-ARIA 1.2 combobox pattern with full keyboard navigation
- Virtualized country dropdown (~15 DOM nodes instead of 240)
- `asChild` pattern for headless composition with any styling system

## Design goals

- **Headless-first** — three levels of abstraction: one-liner, compound components, and pure hooks
- **Accessible** — WCAG 2.1 AA, tested with axe-core in CI
- **Small** — target bundle under 15 KB gzipped, one external dependency (`@intl-ui/core`)
- **Fast** — O(k) country lookup via the dial-code trie from `@intl-ui/core`, no O(n) scans on each keystroke
- **Framework-free styling** — CSS custom properties and data attributes, works with Tailwind, shadcn, MUI, plain CSS, or nothing at all

## Install (when released)

```bash
npm install @intl-ui/react
```

## License

MIT
