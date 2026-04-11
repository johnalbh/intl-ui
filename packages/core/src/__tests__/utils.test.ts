import { describe, expect, it } from 'vitest';
import {
  removeNonDigits,
  isNumeric,
  isDigit,
  normalizeText,
  toE164,
  applyMask,
  iso2ToFlag,
} from '../utils';

describe('removeNonDigits', () => {
  it('removes spaces, dashes, parens, and letters', () => {
    expect(removeNonDigits('+1 (310) 555-1234')).toBe('13105551234');
  });

  it('returns empty string for non-digit input', () => {
    expect(removeNonDigits('abc')).toBe('');
  });

  it('returns same string if already digits', () => {
    expect(removeNonDigits('12345')).toBe('12345');
  });

  it('handles empty string', () => {
    expect(removeNonDigits('')).toBe('');
  });
});

describe('isNumeric', () => {
  it('returns true for digit-only strings', () => {
    expect(isNumeric('12345')).toBe(true);
  });

  it('returns false for mixed strings', () => {
    expect(isNumeric('123a5')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isNumeric('')).toBe(false);
  });

  it('returns false for spaces', () => {
    expect(isNumeric('123 456')).toBe(false);
  });
});

describe('isDigit', () => {
  it('returns true for single digits', () => {
    for (let i = 0; i <= 9; i++) {
      expect(isDigit(String(i))).toBe(true);
    }
  });

  it('returns false for non-digits', () => {
    expect(isDigit('a')).toBe(false);
    expect(isDigit('+')).toBe(false);
    expect(isDigit(' ')).toBe(false);
  });
});

describe('normalizeText', () => {
  it('removes diacritics', () => {
    expect(normalizeText('Côte d\'Ivoire')).toBe('cote d\'ivoire');
  });

  it('lowercases', () => {
    expect(normalizeText('COLOMBIA')).toBe('colombia');
  });

  it('trims whitespace', () => {
    expect(normalizeText('  Spain  ')).toBe('spain');
  });

  it('handles combined: accents + uppercase + whitespace', () => {
    expect(normalizeText('  São Tomé  ')).toBe('sao tome');
  });
});

describe('toE164', () => {
  it('prepends + to digits', () => {
    expect(toE164('573105551234')).toBe('+573105551234');
  });

  it('strips non-digits before converting', () => {
    expect(toE164('+57 310 555 1234')).toBe('+573105551234');
  });

  it('prepends dial code if provided and not present', () => {
    expect(toE164('3105551234', '57')).toBe('+573105551234');
  });

  it('does not double-prepend dial code', () => {
    expect(toE164('573105551234', '57')).toBe('+573105551234');
  });

  it('returns empty string for empty input', () => {
    expect(toE164('')).toBe('');
  });
});

describe('applyMask', () => {
  it('applies mask with dots as placeholders', () => {
    expect(applyMask('3105551234', '... ... ....')).toBe('310 555 1234');
  });

  it('handles partial input', () => {
    expect(applyMask('310', '... ... ....')).toBe('310');
  });

  it('handles partial input mid-group', () => {
    expect(applyMask('31055', '... ... ....')).toBe('310 55');
  });

  it('returns digits if mask is empty', () => {
    expect(applyMask('12345', '')).toBe('12345');
  });

  it('returns empty string for empty value', () => {
    expect(applyMask('', '... ....')).toBe('');
  });

  it('stops at end of input digits', () => {
    expect(applyMask('12', '... ... ....')).toBe('12');
  });
});

describe('iso2ToFlag', () => {
  it('converts iso2 to flag emoji', () => {
    expect(iso2ToFlag('us')).toBe('🇺🇸');
    expect(iso2ToFlag('co')).toBe('🇨🇴');
    expect(iso2ToFlag('gb')).toBe('🇬🇧');
  });

  it('handles uppercase input', () => {
    expect(iso2ToFlag('US')).toBe('🇺🇸');
  });
});
