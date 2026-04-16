# @intl-ui/react

## 1.0.7

### Patch Changes

- e9a4aec: ### Bug fix: +1 dial code now defaults to USA instead of Antigua and Barbuda

  **Problem:** Typing `+1` detected Antigua and Barbuda instead of the United States because all 14 NANP countries shared the same priority (0), and stable sort picked the first alphabetically.

  **Fix:**
  - Set priority for USA to `0`, Canada to `1`, and all 12 Caribbean NANP nations to `2`
  - Area-code disambiguation still works: `+1268` → Antigua, `+1204` → Canada, `+1876` → Jamaica

  ### New: `findAllCountriesByDigits()` API

  Returns all candidate countries for a given dial code, sorted by priority. Enables UI layers to show a country selector dropdown when dial codes are ambiguous.

  ```typescript
  findAllCountriesByDigits(trie, '1'); // → [US, CA, AG, BS, ...] (14 countries)
  findAllCountriesByDigits(trie, '1268'); // → [AG] (only Antigua)
  ```

  ### Fix: React national-format country re-detection

  The `usePhoneInput` hook now re-evaluates the country when typing in national format (without `+`). Previously, typing `268 555 1234` with US pre-selected would not switch to Antigua despite the area code match.

  ### Fix: resolve workspace:\* protocol before npm publish

  Versions 1.0.2–1.0.6 of @intl-ui/react and 1.0.2–1.0.4 of @intl-ui/angular were published with `"workspace:*"` in dependencies, breaking external consumers. The CI now resolves these to real version ranges before publishing.

  ### Internal
  - Refactored trie traversal into shared `traverseTrie()` to eliminate duplication
  - Added CI guard to block publish if workspace protocol leaks through
  - Deprecated broken npm versions via CI

- Updated dependencies [e9a4aec]
  - @intl-ui/core@1.0.5

## 1.0.6

### Patch Changes

- 6ea692a: ### Bug fix: +1 dial code now defaults to USA instead of Antigua and Barbuda

  **Problem:** Typing `+1` detected Antigua and Barbuda instead of the United States because all 14 NANP countries shared the same priority (0), and stable sort picked the first alphabetically.

  **Fix:**
  - Set priority for USA to `0`, Canada to `1`, and all 12 Caribbean NANP nations to `2`
  - Area-code disambiguation still works: `+1268` → Antigua, `+1204` → Canada, `+1876` → Jamaica

  ### New: `findAllCountriesByDigits()` API

  Returns all candidate countries for a given dial code, sorted by priority. Enables UI layers to show a country selector dropdown when dial codes are ambiguous.

  ```typescript
  findAllCountriesByDigits(trie, '1'); // → [US, CA, AG, BS, ...] (14 countries)
  findAllCountriesByDigits(trie, '1268'); // → [AG] (only Antigua)
  ```

  ### Fix: React national-format country re-detection

  The `usePhoneInput` hook now re-evaluates the country when typing in national format (without `+`). Previously, typing `268 555 1234` with US pre-selected would not switch to Antigua despite the area code match.

  ### Internal
  - Refactored trie traversal into shared `traverseTrie()` to eliminate duplication between `findCountryByDigits` and `findAllCountriesByDigits`

- Updated dependencies [6ea692a]
  - @intl-ui/core@1.0.4

## 1.0.5

### Patch Changes

- Updated dependencies [7a2a01c]
  - @intl-ui/core@1.0.3

## 1.0.4

### Patch Changes

- 0e67f05: Switch to automated release flow via Changesets + GitHub Actions. No functional changes; this release validates the end-to-end CI/CD pipeline for publishing to npm.
- Updated dependencies [0e67f05]
  - @intl-ui/core@1.0.2
