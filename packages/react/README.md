# @intl-ui/react

[![npm](https://img.shields.io/npm/v/@intl-ui/react)](https://www.npmjs.com/package/@intl-ui/react)
[![bundle](https://img.shields.io/badge/gzip-4.8_KB-brightgreen)](https://bundlephobia.com/package/@intl-ui/react)
[![types](https://img.shields.io/badge/types-TypeScript-blue)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

React components and hooks for international phone input. Headless-first, accessible, zero-config styling.

Part of the [@intl-ui](https://github.com/johnalbh/intl-ui) ecosystem.

> **[Live Demo](https://johnalbh.github.io/intl-ui/react/)** &nbsp;·&nbsp; **[Angular version](https://www.npmjs.com/package/@intl-ui/angular)** &nbsp;·&nbsp; **[GitHub](https://github.com/johnalbh/intl-ui)**

---

## Install

```bash
npm install @intl-ui/react
# or
pnpm add @intl-ui/react
# or
yarn add @intl-ui/react
```

`@intl-ui/core` is bundled automatically &mdash; no separate install needed.

**Peer dependency:** `react ^18.2.0 || ^19.0.0`

---

## Quick start

```tsx
import { PhoneInput } from '@intl-ui/react';

function App() {
  return (
    <PhoneInput
      defaultCountry="co"
      onValueChange={(value, meta) => {
        console.log(value);         // "+573105551234"
        console.log(meta.isValid);  // true
        console.log(meta.country);  // { name: "Colombia", iso2: "co", ... }
      }}
    />
  );
}
```

That's it. You get a fully working phone input with country dropdown, auto-detection, keyboard navigation, and validation. See it running in the **[live demo](https://johnalbh.github.io/intl-ui/react/)**.

---

## Three levels of abstraction

Pick the level that fits your use case. All three share the same core logic &mdash; you can always drop down a level for more control.

### 1. `<PhoneInput />` &mdash; one-liner

Works out of the box with sensible defaults.

```tsx
import { PhoneInput } from '@intl-ui/react';

<PhoneInput defaultCountry="us" onValueChange={(v) => console.log(v)} />
```

### 2. Compound components &mdash; full layout control

Every child reads from a shared context. No prop drilling.

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
      <PhoneInput.CountryListItem
        key={country.iso2}
        country={country}
        index={index}
      />
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

### 3. `usePhoneInput()` &mdash; headless hook

Maximum control. The hook returns state, prop-getters, and actions &mdash; you render whatever you want.

```tsx
import { usePhoneInput } from '@intl-ui/react';

function CustomPhoneInput() {
  const {
    country, isValid, visibleCountries,
    getInputProps, getCountrySelectProps,
    getCountryListProps, getCountryOptionProps,
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

---

## Features

- **200 countries** with dial codes, format masks, capitals, flags, and regions
- **Auto country detection** &mdash; type `+380` and Ukraine is detected via the dial-code trie
- **ISO code shortcut** &mdash; type `co`, `usa`, `gb` to switch country instantly
- **Auto-prefix `+`** &mdash; click the input and the `+` appears, ready for dial code digits
- **Backspace-aware** &mdash; clear the input and type a new prefix without fighting the formatter
- **Searchable dropdown** &mdash; filter by name, ISO code, or dial code
- **Keyboard navigation** &mdash; arrows, Enter, Escape, typeahead
- **`asChild` pattern** &mdash; clone your own elements with Radix-style Slot
- **Controlled + uncontrolled** &mdash; `value` / `defaultValue` + `onValueChange`, same as native `<input>`
- **Zero styling opinions** &mdash; the package ships no CSS, use whatever you want
- **4.8 KB gzipped** (hook + 7 compound components + Slot + Context)

---

## Three ways to set the country

| Method | Example |
|---|---|
| **Dropdown search** | Click trigger &rarr; type `colomb` &rarr; pick Colombia |
| **Type `+code`** | Type `+380` &rarr; Ukraine detected automatically |
| **ISO shortcut** | Type `co`, `usa`, `gb`, `deu` &rarr; instant switch |

---

## Compound components

| Component | Element | Description |
|---|---|---|
| `<PhoneInput />` | `<div>` | One-liner wrapper with sane defaults |
| `<PhoneInput.Root>` | &mdash; | Provider. Calls the hook, publishes via context |
| `<PhoneInput.Input>` | `<input>` | The phone number field (`type="tel"`) |
| `<PhoneInput.CountrySelect>` | `<button>` | Trigger that opens the dropdown |
| `<PhoneInput.Flag>` | `<span>` | Emoji flag of the selected country |
| `<PhoneInput.DialCode>` | `<span>` | `+57` label |
| `<PhoneInput.CountryList>` | `<ul>` | Dropdown listbox (render-prop children) |
| `<PhoneInput.CountryListItem>` | `<li>` | One country option |

---

## Hook API &mdash; `usePhoneInput(options)`

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | &mdash; | Controlled phone value (E.164) |
| `defaultValue` | `string` | `""` | Initial value for uncontrolled mode |
| `onValueChange` | `(value, meta) => void` | &mdash; | Fired on every change with parsed metadata |
| `country` | `CountryIso2` | &mdash; | Controlled country ISO2 |
| `defaultCountry` | `CountryIso2` | &mdash; | Initial country for uncontrolled mode |
| `onCountryChange` | `(country) => void` | &mdash; | Fired when the country changes |
| `disableCountryGuess` | `boolean` | `false` | Don't auto-detect country from typed input |
| `countries` | `Country[]` | all 200 | Custom country list |
| `preferredCountries` | `CountryIso2[]` | `[]` | Countries pinned to top of the dropdown |

### Return value

| Field | Type | Description |
|---|---|---|
| `value` | `string` | Canonical E.164 string |
| `inputValue` | `string` | Formatted string displayed in the input |
| `country` | `Country \| null` | Selected country object |
| `parsed` | `ParsedPhone \| null` | Full parsed phone (e164, national, international, isValid, ...) |
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

---

## Advanced: custom compound children

Use `usePhoneInputContext()` to build your own compound children that read from `<PhoneInput.Root>`:

```tsx
import { PhoneInput, usePhoneInputContext } from '@intl-ui/react';

function ValidationBadge() {
  const { isValid, country } = usePhoneInputContext();
  return isValid
    ? <span>&check; Valid {country?.name} number</span>
    : <span>Enter a valid number</span>;
}

<PhoneInput.Root defaultCountry="co">
  <PhoneInput.Input />
  <ValidationBadge />
</PhoneInput.Root>
```

---

## Bundle size

| Package | Gzipped |
|---|---|
| `@intl-ui/react` | **4.8 KB** |
| `@intl-ui/core` (bundled) | **9.4 KB** |
| **Total** | **~14 KB** |

---

## Ecosystem

- [`@intl-ui/core`](https://www.npmjs.com/package/@intl-ui/core) &mdash; Framework-agnostic phone parsing, formatting, validation, and country data. Works in Node, Deno, Bun, and the browser without React.
- [`@intl-ui/angular`](https://www.npmjs.com/package/@intl-ui/angular) &mdash; Angular 17+ components, directives, and validators with signal-based reactivity and Reactive Forms support.

---

## License

MIT &copy; [John Alberto L&oacute;pez Hern&aacute;ndez](https://github.com/johnalbh)
