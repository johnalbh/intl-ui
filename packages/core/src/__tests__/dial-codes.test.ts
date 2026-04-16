import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { countries } from '../countries';
import {
  buildDialCodeTrie,
  findAllCountriesByDigits,
  findCountryByDigits,
  guessCountryByPhone,
} from '../dial-codes';

import type { DialCodeTrieNode } from '../types';

let trie: DialCodeTrieNode;

beforeAll(() => {
  trie = buildDialCodeTrie(countries);
});

describe('buildDialCodeTrie', () => {
  it('builds a trie from countries', () => {
    expect(trie).toBeDefined();
    expect(trie.children.size).toBeGreaterThan(0);
  });

  it('has root children for first digits of dial codes', () => {
    // Dial codes start with 1-9
    expect(trie.children.has('1')).toBe(true);
    expect(trie.children.has('2')).toBe(true);
    expect(trie.children.has('3')).toBe(true);
    expect(trie.children.has('5')).toBe(true);
    expect(trie.children.has('9')).toBe(true);
  });
});

describe('findCountryByDigits', () => {
  it('finds Colombia by dial code 57', () => {
    const result = findCountryByDigits(trie, '573105551234');
    expect(result.country?.iso2).toBe('co');
    expect(result.fullDialCodeMatch).toBe(true);
  });

  it('finds US by dial code 1 with area code', () => {
    const result = findCountryByDigits(trie, '12015551234');
    expect(result.country?.iso2).toBe('us');
    expect(result.fullDialCodeMatch).toBe(true);
  });

  it('finds UK by dial code 44', () => {
    const result = findCountryByDigits(trie, '447911123456');
    expect(result.country?.iso2).toBe('gb');
    expect(result.fullDialCodeMatch).toBe(true);
  });

  it('returns undefined for empty digits', () => {
    const result = findCountryByDigits(trie, '');
    expect(result.country).toBeUndefined();
    expect(result.fullDialCodeMatch).toBe(false);
  });

  it('finds Germany by dial code 49', () => {
    const result = findCountryByDigits(trie, '491234567890');
    expect(result.country?.iso2).toBe('de');
  });

  it('finds Spain by dial code 34', () => {
    const result = findCountryByDigits(trie, '34612345678');
    expect(result.country?.iso2).toBe('es');
  });

  it('prefers Russia over Kazakhstan for dial code 7 (lower priority)', () => {
    const result = findCountryByDigits(trie, '79001234567');
    expect(result.country?.iso2).toBe('ru');
  });
});

describe('guessCountryByPhone', () => {
  it('guesses country from formatted phone', () => {
    const result = guessCountryByPhone(trie, '+57 310 555 1234');
    expect(result.country?.iso2).toBe('co');
  });

  it('returns current country for empty phone', () => {
    const colombia = countries.find((c) => c.iso2 === 'co')!;
    const result = guessCountryByPhone(trie, '', colombia);
    expect(result.country?.iso2).toBe('co');
  });

  it('keeps current country when dial codes match', () => {
    const canada = countries.find((c) => c.iso2 === 'ca')!;
    const result = guessCountryByPhone(trie, '+1', canada);
    expect(result.country?.iso2).toBe('ca');
  });

  it('guesses from E.164 format', () => {
    const result = guessCountryByPhone(trie, '+81901234567');
    expect(result.country?.iso2).toBe('jp');
  });

  it('guesses from digits with dashes', () => {
    const result = guessCountryByPhone(trie, '49-170-1234567');
    expect(result.country?.iso2).toBe('de');
  });

  it('defaults to USA for bare +1 (not Caribbean)', () => {
    const result = guessCountryByPhone(trie, '+1');
    expect(result.country?.iso2).toBe('us');
  });

  it('detects Antigua when area code 268 is present', () => {
    const result = guessCountryByPhone(trie, '+1268 555 1234');
    expect(result.country?.iso2).toBe('ag');
  });

  it('detects Canada when area code 204 is present', () => {
    const result = guessCountryByPhone(trie, '+1204 555 1234');
    expect(result.country?.iso2).toBe('ca');
  });

  it('detects Jamaica when area code 876 is present', () => {
    const result = guessCountryByPhone(trie, '+1876 555 1234');
    expect(result.country?.iso2).toBe('jm');
  });
});

describe('findAllCountriesByDigits', () => {
  it('returns all +1 countries sorted by priority', () => {
    const results = findAllCountriesByDigits(trie, '1');
    expect(results.length).toBeGreaterThan(1);
    // US should be first (priority 0)
    expect(results[0]?.iso2).toBe('us');
    // Canada should be second (priority 1)
    expect(results[1]?.iso2).toBe('ca');
    // Caribbean nations should follow (priority 2)
    expect(results.some((c) => c.iso2 === 'ag')).toBe(true);
    expect(results.some((c) => c.iso2 === 'jm')).toBe(true);
  });

  it('narrows to single country with area code', () => {
    const results = findAllCountriesByDigits(trie, '1268');
    expect(results.length).toBe(1);
    expect(results[0]?.iso2).toBe('ag');
  });

  it('returns empty for non-existent code', () => {
    const results = findAllCountriesByDigits(trie, '0');
    expect(results).toHaveLength(0);
  });

  it('returns single country for unambiguous code', () => {
    const results = findAllCountriesByDigits(trie, '57');
    expect(results.length).toBe(1);
    expect(results[0]?.iso2).toBe('co');
  });
});
