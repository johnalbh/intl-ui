# @intl-ui/angular

[![npm](https://img.shields.io/npm/v/@intl-ui/angular)](https://www.npmjs.com/package/@intl-ui/angular)
[![bundle](https://img.shields.io/badge/gzip-~18_KB-blue)](https://bundlephobia.com/package/@intl-ui/angular)
[![types](https://img.shields.io/badge/types-TypeScript-blue)](https://www.typescriptlang.org/)

Angular components and directives for international phone input. Signal-based, standalone, accessible.

Part of the [@intl-ui](https://github.com/johnalbh/intl-ui) ecosystem.

> **[Live Demo](https://johnalbh.github.io/intl-ui/angular/)**  |  **[React version](https://www.npmjs.com/package/@intl-ui/react)**

## Install

```bash
npm install @intl-ui/angular
# or
pnpm add @intl-ui/angular
```

**Peer dependencies:** `@angular/core` and `@angular/forms` (v17+).

## Usage

### 1. Standalone component (quickest)

```typescript
import { Component, signal } from '@angular/core';
import { IntlPhoneInputComponent } from '@intl-ui/angular';

@Component({
  standalone: true,
  imports: [IntlPhoneInputComponent],
  template: `
    <intl-phone-input
      [defaultCountry]="'us'"
      [(value)]="phone"
      (phoneChange)="onPhoneChange($event)"
    />
  `,
})
export class MyComponent {
  phone = signal('');

  onPhoneChange(meta) {
    console.log(meta.isValid, meta.parsed?.e164);
  }
}
```

### 2. Reactive Forms (ControlValueAccessor)

```typescript
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IntlPhoneInputComponent,
  IntlPhoneInputValueAccessorDirective,
  IntlPhoneValidators,
} from '@intl-ui/angular';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IntlPhoneInputComponent,
    IntlPhoneInputValueAccessorDirective,
  ],
  template: `
    <form [formGroup]="form">
      <intl-phone-input formControlName="phone" [defaultCountry]="'co'" />
    </form>
  `,
})
export class MyFormComponent {
  form = new FormGroup({
    phone: new FormControl('', [
      Validators.required,
      IntlPhoneValidators.validPhone(),
    ]),
  });
}
```

### 3. Headless store (full control)

```typescript
import { Component } from '@angular/core';
import { createPhoneInputStore, type CountryIso2 } from '@intl-ui/angular';

@Component({
  standalone: true,
  template: `
    <button (click)="store.toggleDropdown()">
      {{ store.country()?.flag ?? 'Pick' }}
    </button>
    <input
      type="tel"
      [value]="store.inputValue()"
      (input)="onInput($event)"
    />
    <p>E.164: {{ store.value() }}</p>
    <p>Valid: {{ store.isValid() }}</p>
  `,
})
export class HeadlessComponent {
  store = createPhoneInputStore({ initialCountry: 'gb' as CountryIso2 });

  onInput(event: Event) {
    this.store.handleInput((event.target as HTMLInputElement).value);
  }
}
```

## API

### `IntlPhoneInputComponent`

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultCountry` | `CountryIso2` | - | Initial country ISO2 code |
| `defaultValue` | `string` | `''` | Initial phone value (E.164) |
| `disableCountryGuess` | `boolean` | `false` | Disable auto-detection from digits |
| `countries` | `Country[]` | all | Custom country list |
| `preferredCountries` | `CountryIso2[]` | `[]` | Pin countries to top |
| `showSearch` | `boolean` | `true` | Show search in dropdown |

| Output | Type | Description |
|--------|------|-------------|
| `value` | `model<string>` | Two-way binding for E.164 value |
| `phoneChange` | `ValueChangeMeta` | Emits on every value change |
| `countryChange` | `Country` | Emits when country changes |

### `IntlPhoneValidators`

| Validator | Description |
|-----------|-------------|
| `validPhone(country?)` | Validates phone format (optionally for a specific country) |
| `allowedCountries(iso2[])` | Restricts to specific countries |

### `createPhoneInputStore(options)`

Signal-based store for building custom UIs. Returns signals for `value`, `inputValue`, `country`, `parsed`, `isValid`, `isOpen`, `visibleCountries`, and action methods.

## Bundle size

| Package | gzip |
|---------|------|
| `@intl-ui/core` | ~9.4 KB |
| `@intl-ui/angular` | ~18 KB |
| **Total** | **~27 KB** |

## Related

- [`@intl-ui/core`](https://www.npmjs.com/package/@intl-ui/core) — Framework-agnostic data & utilities
- [`@intl-ui/react`](https://www.npmjs.com/package/@intl-ui/react) — React hooks & components

## License

MIT &copy; [John Alberto L&oacute;pez Hern&aacute;ndez](https://github.com/johnalbh)
