# @intl-ui/react

React components and hooks for international phone input — headless-first, accessible, zero-config styling.

Part of the [@intl-ui](https://github.com/johnalbh/intl-ui) ecosystem.

[![npm](https://img.shields.io/npm/v/@intl-ui/react)](https://www.npmjs.com/package/@intl-ui/react)
[![bundle](https://img.shields.io/badge/bundle-4.8%20KB%20gz-brightgreen)](https://www.npmjs.com/package/@intl-ui/react)
[![types](https://img.shields.io/badge/types-TypeScript-blue)](https://www.npmjs.com/package/@intl-ui/react)

## Install

```bash
npm install @intl-ui/react
```

`@intl-ui/core` is installed automatically — you don't need to install it separately.

**Peer dependency:** `react ^18.2.0 || ^19.0.0`

## Three levels of abstraction

### Level 1 — One-liner

```tsx
import { PhoneInput } from '@intl-ui/react';

<PhoneInput defaultCountry="co" onValueChange={(value, meta) => {
  console.log(value);          // "+573105551234"
  console.log(meta.isValid);   // true
  console.log(meta.country);   // { name: "Colombia", iso2: "co", ... }
}} />
```

### Level 2 — Compound components

Full control over the layout. Every child reads from a shared context — no prop drilling.

```tsx
import { PhoneInput } from '@intl-ui/react';

<PhoneInput.Root defaultCountry="co" onValueChange={(v) => console.log(v)}>
  <PhoneInput.CountrySelect>
    <PhoneInput.Flag />
    <PhoneInput.DialCode />
  </PhoneInput.CountrySelect>
  <PhoneInput.Input placeholder="Phone number" />
  <PhoneInput.CountryList>
    {(country, index) => (
      <PhoneInput.CountryListItem key={country.iso2} country={country} index={index} />
    )}
  </PhoneInput.CountryList>
</PhoneInput.Root>
```

Every compound child supports `className`, `style`, event handlers, and the `asChild` prop for rendering your own element:

```tsx
<PhoneInput.Input asChild>
  <MyDesignSystemInput placeholder="Phone" />
</PhoneInput.Input>
```

### Level 3 — Headless hook

Maximum control. The hook returns state, prop-getters, and actions — you render whatever you want.

```tsx
import { usePhoneInput } from '@intl-ui/react';

function MyPhoneInput() {
  const {
    country, isValid, inputValue, visibleCountries,
    getInputProps, getCountrySelectProps,
    getCountryListProps, getCountryOptionProps,
    setCountry, setOpen, setFilter, reset,
  } = usePhoneInput({ defaultCountry: 'co' });

  return (
    <div>
      <button {...getCountrySelectProps()}>
        {country?.flag} +{country?.dialCode}
      </button>
      <input {...getInputProps()} />
    </div>
  );
}
```

## Features

- **200 countries** with dial codes, format masks, capitals, flags, and regions
- **Auto country detection** — type `+380` and Ukraine is detected via the dial-code trie
- **ISO code shortcut** — type `co`, `usa`, `gb` to switch country instantly
- **Auto-prefix `+`** — click the input and the `+` appears, ready for dial code digits
- **Backspace-aware** — clear the input and type a new international prefix without fighting the formatter
- **Searchable dropdown** — filter by name, ISO code, or dial code
- **Keyboard navigation** — arrows, Enter, Escape
- **`asChild` pattern** — clone your own elements with Radix-style Slot
- **Controlled + uncontrolled** — `value` / `defaultValue` + `onValueChange`, same as native `<input>`
- **Zero runtime deps** on `@intl-ui/core` (pure TypeScript, works everywhere)
- **4.8 KB gzipped** (hook + 7 compound components + Slot + Context)

## Three ways to set the country

| Method | Example |
|---|---|
| **Dropdown search** | Click trigger → type `colomb` → pick Colombia |
| **Type +code** | Type `+380` → Ukraine detected automatically |
| **ISO shortcut** | Type `co`, `usa`, `gb`, `deu` → instant switch |

## Compound components

| Component | Element | Description |
|---|---|---|
| `<PhoneInput />` | `<div>` | One-liner wrapper with sane defaults |
| `<PhoneInput.Root>` | — | Provider. Calls the hook, publishes via context |
| `<PhoneInput.Input>` | `<input>` | The phone number field (`type="tel"`) |
| `<PhoneInput.CountrySelect>` | `<button>` | Trigger that opens the dropdown |
| `<PhoneInput.Flag>` | `<span>` | Emoji flag of the selected country |
| `<PhoneInput.DialCode>` | `<span>` | "+57" label |
| `<PhoneInput.CountryList>` | `<ul>` | Dropdown listbox (render-prop children) |
| `<PhoneInput.CountryListItem>` | `<li>` | One country option |

## Hook API

```typescript
const api = usePhoneInput(options);
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | — | Controlled phone value (E.164) |
| `defaultValue` | `string` | `""` | Initial value for uncontrolled mode |
| `onValueChange` | `(value, meta) => void` | — | Called on every change with parsed metadata |
| `country` | `CountryIso2` | — | Controlled country ISO2 |
| `defaultCountry` | `CountryIso2` | — | Initial country for uncontrolled mode |
| `onCountryChange` | `(country) => void` | — | Called when the country changes |
| `disableCountryGuess` | `boolean` | `false` | Don't auto-detect country from input |
| `countries` | `Country[]` | all 200 | Custom country list |
| `preferredCountries` | `CountryIso2[]` | `[]` | Pinned to top of dropdown |

### Return value

| Field | Type | Description |
|---|---|---|
| `value` | `string` | Canonical E.164 string |
| `inputValue` | `string` | Formatted string displayed in the input |
| `country` | `Country \| null` | Selected country object |
| `parsed` | `ParsedPhone \| null` | Full parsed phone object |
| `isValid` | `boolean` | Whether the number is valid |
| `isOpen` | `boolean` | Dropdown open state |
| `focusedIndex` | `number` | Focused country index (-1 if none) |
| `filter` | `string` | Current dropdown filter text |
| `visibleCountries` | `Country[]` | Filtered country list |
| `getInputProps` | `() => Props` | Spread onto `<input>` |
| `getCountrySelectProps` | `() => Props` | Spread onto trigger `<button>` |
| `getCountryListProps` | `() => Props` | Spread onto `<ul>` |
| `getCountryOptionProps` | `(country, index) => Props` | Spread onto each `<li>` |
| `setCountry` | `(iso2) => void` | Set country programmatically |
| `setOpen` | `(open) => void` | Open/close dropdown |
| `setFilter` | `(text) => void` | Filter the country list |
| `reset` | `() => void` | Reset to initial state |

## Advanced: custom compound children

Use `usePhoneInputContext()` to build your own compound children that read from `<PhoneInput.Root>`:

```tsx
import { PhoneInput, usePhoneInputContext } from '@intl-ui/react';

function MyValidationBadge() {
  const { isValid, country } = usePhoneInputContext();
  return isValid
    ? <span>✓ Valid {country?.name} number</span>
    : <span>Enter a valid number</span>;
}

<PhoneInput.Root defaultCountry="co">
  <PhoneInput.Input />
  <MyValidationBadge />
</PhoneInput.Root>
```

## Bundle size

| Package | Gzipped |
|---|---|
| `@intl-ui/react` | **4.8 KB** |
| `@intl-ui/core` (auto-installed) | **9.4 KB** |

## Related packages

- [`@intl-ui/core`](https://www.npmjs.com/package/@intl-ui/core) — Framework-agnostic phone parsing, formatting, validation, and country data. Works in Node, Deno, Bun, and the browser without React.

## License

MIT © [John Alberto López Hernández](https://github.com/johnalbh)
