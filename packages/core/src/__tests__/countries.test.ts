import { describe, expect, it } from 'vitest';
import {
  countries,
  countriesMinimal,
  getCountryByIso2,
  getCountryByIso3,
  getCountriesByDialCode,
} from '../countries';

describe('countries', () => {
  it('has at least 190 countries', () => {
    expect(countries.length).toBeGreaterThanOrEqual(190);
  });

  it('every country has required fields', () => {
    for (const country of countries) {
      expect(country.name).toBeTruthy();
      expect(country.iso2).toHaveLength(2);
      expect(country.iso3).toHaveLength(3);
      expect(country.dialCode).toBeTruthy();
      expect(country.flag).toBeTruthy();
      expect(country.capital).toBeTruthy();
      expect(country.region).toBeTruthy();
      expect(country.subregion).toBeTruthy();
      expect(typeof country.priority).toBe('number');
    }
  });

  it('every country has a non-empty capital', () => {
    for (const country of countries) {
      expect(typeof country.capital).toBe('string');
      expect(country.capital.length).toBeGreaterThan(0);
    }
  });

  it('well-known capitals are correct', () => {
    const expectations: Record<string, string> = {
      co: 'Bogotá',
      us: 'Washington, D.C.',
      gb: 'London',
      fr: 'Paris',
      de: 'Berlin',
      es: 'Madrid',
      jp: 'Tokyo',
      br: 'Brasília',
      mx: 'Mexico City',
      ar: 'Buenos Aires',
      ca: 'Ottawa',
      au: 'Canberra',
      cn: 'Beijing',
      in: 'New Delhi',
      ru: 'Moscow',
      za: 'Pretoria',
      kr: 'Seoul',
      it: 'Rome',
      nl: 'Amsterdam',
      ua: 'Kyiv',
    };
    for (const [iso2, expected] of Object.entries(expectations)) {
      const country = getCountryByIso2(iso2);
      expect(country, `country ${iso2} should exist`).toBeDefined();
      expect(country?.capital, `capital of ${iso2}`).toBe(expected);
    }
  });

  it('city-states use the entity name as their capital', () => {
    const cityStates: Record<string, string> = {
      mc: 'Monaco',
      sg: 'Singapore',
      va: 'Vatican City',
      sm: 'San Marino',
      hk: 'Hong Kong',
      mo: 'Macao',
    };
    for (const [iso2, expected] of Object.entries(cityStates)) {
      expect(getCountryByIso2(iso2)?.capital).toBe(expected);
    }
  });

  it('iso2 codes are lowercase', () => {
    for (const country of countries) {
      expect(country.iso2).toBe(country.iso2.toLowerCase());
    }
  });

  it('iso3 codes are lowercase', () => {
    for (const country of countries) {
      expect(country.iso3).toBe(country.iso3.toLowerCase());
    }
  });

  it('has no duplicate iso2 codes', () => {
    const iso2s = countries.map((c) => c.iso2);
    expect(new Set(iso2s).size).toBe(iso2s.length);
  });

  it('dial codes are digits only', () => {
    for (const country of countries) {
      expect(country.dialCode).toMatch(/^\d+$/);
    }
  });

  it('includes major countries', () => {
    const iso2s = countries.map((c) => c.iso2);
    expect(iso2s).toContain('us');
    expect(iso2s).toContain('gb');
    expect(iso2s).toContain('cn');
    expect(iso2s).toContain('in');
    expect(iso2s).toContain('br');
    expect(iso2s).toContain('co');
    expect(iso2s).toContain('es');
    expect(iso2s).toContain('de');
    expect(iso2s).toContain('jp');
  });

  it('area codes are digit strings', () => {
    for (const country of countries) {
      if (country.areaCodes) {
        for (const code of country.areaCodes) {
          expect(code).toMatch(/^\d+$/);
        }
      }
    }
  });
});

describe('countriesMinimal', () => {
  it('has exactly 50 countries', () => {
    expect(countriesMinimal.length).toBe(50);
  });

  it('is a subset of the full list', () => {
    const fullIso2s = new Set(countries.map((c) => c.iso2));
    for (const country of countriesMinimal) {
      expect(fullIso2s.has(country.iso2)).toBe(true);
    }
  });

  it('includes US, GB, and CO', () => {
    const iso2s = countriesMinimal.map((c) => c.iso2);
    expect(iso2s).toContain('us');
    expect(iso2s).toContain('gb');
    expect(iso2s).toContain('co');
  });
});

describe('getCountryByIso2', () => {
  it('finds country by lowercase code', () => {
    const co = getCountryByIso2('co');
    expect(co?.name).toBe('Colombia');
    expect(co?.dialCode).toBe('57');
  });

  it('finds country by uppercase code', () => {
    const us = getCountryByIso2('US');
    expect(us?.name).toBe('United States');
  });

  it('returns undefined for invalid code', () => {
    expect(getCountryByIso2('xx')).toBeUndefined();
  });
});

describe('getCountryByIso3', () => {
  it('finds country by iso3 code', () => {
    const col = getCountryByIso3('col');
    expect(col?.name).toBe('Colombia');
  });

  it('returns undefined for invalid code', () => {
    expect(getCountryByIso3('xxx')).toBeUndefined();
  });
});

describe('getCountriesByDialCode', () => {
  it('returns multiple countries for shared dial codes', () => {
    const result = getCountriesByDialCode('1');
    expect(result.length).toBeGreaterThan(1);
    const names = result.map((c) => c.name);
    expect(names).toContain('United States');
    expect(names).toContain('Canada');
  });

  it('returns single country for unique dial codes', () => {
    const result = getCountriesByDialCode('57');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Colombia');
  });

  it('returns empty array for invalid dial code', () => {
    expect(getCountriesByDialCode('999')).toHaveLength(0);
  });
});
