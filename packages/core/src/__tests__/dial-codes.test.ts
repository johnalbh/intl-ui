import { describe, expect, it, beforeAll } from 'vitest';
import { countries } from '../countries';
import {
  buildDialCodeTrie,
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
});
