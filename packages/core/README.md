# @intl-ui/core

Framework-agnostic international data and utilities for phone numbers, countries, and more.

Part of the [@intl-ui](https://github.com/johnalbh/intl-ui) ecosystem.

## Features

- **240 countries** as typed objects (not tuples)
- **Phone parsing** — any format to structured data
- **Phone formatting** — country-specific masks
- **Phone validation** — mask-based length validation
- **E.164 conversion** — standard international format
- **Dial code trie** — O(1) country lookup by phone number
- **Country guessing** — auto-detect country from partial input
- **Zero dependencies** — pure TypeScript
- **Framework-agnostic** — works in React, Angular, Vue, Node, Deno, Bun

## Install

```bash
npm install @intl-ui/core
```

## Usage

### Parse a phone number

```typescript
import { parsePhone } from '@intl-ui/core';

const result = parsePhone('+573105551234');
// {
//   e164: '+573105551234',
//   national: '310 555 1234',
//   international: '+57 310 555 1234',
//   country: { name: 'Colombia', iso2: 'co', dialCode: '57', ... },
//   isValid: true,
// }
```

### Validate

```typescript
import { validatePhone, getCountryByIso2 } from '@intl-ui/core';

const colombia = getCountryByIso2('co');
validatePhone('+573105551234', colombia);
// { isValid: true, isPossible: true }

validatePhone('+5731055', colombia);
// { isValid: false, isPossible: true, error: 'TOO_SHORT' }
```

### Format

```typescript
import { formatPhone, getCountryByIso2 } from '@intl-ui/core';

const co = getCountryByIso2('co');
formatPhone('573105551234', co);
// '+57 310 555 1234'
```

### Country data

```typescript
import { countries, getCountryByIso2, getCountriesByDialCode } from '@intl-ui/core';

countries.length; // 193+
getCountryByIso2('co'); // { name: 'Colombia', iso2: 'co', dialCode: '57', flag: '🇨🇴', ... }
getCountriesByDialCode('1'); // [US, Canada, Puerto Rico, ...]
```

### Dial code trie (O(1) lookup)

```typescript
import { buildDialCodeTrie, guessCountryByPhone, countries } from '@intl-ui/core';

const trie = buildDialCodeTrie(countries);
const result = guessCountryByPhone(trie, '+57310');
// { country: { name: 'Colombia', ... }, fullDialCodeMatch: true }
```

## Bundle size

~7.5 KB gzipped (with all 240 countries).

## License

MIT
