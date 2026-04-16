---
'@intl-ui/core': patch
'@intl-ui/react': patch
---

### Bug fix: +1 dial code now defaults to USA instead of Antigua and Barbuda

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
