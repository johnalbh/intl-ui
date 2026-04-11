import { describe, expect, it } from 'vitest';
import { getCountryByIso2 } from '../countries';
import { formatPhone, formatNational, getActiveMask } from '../phone/format';
import { parsePhone } from '../phone/parse';
import { validatePhone } from '../phone/validate';

const colombia = getCountryByIso2('co')!;
const us = getCountryByIso2('us')!;
const uk = getCountryByIso2('gb')!;
const spain = getCountryByIso2('es')!;

describe('getActiveMask', () => {
  it('returns string mask directly', () => {
    expect(getActiveMask('... ... ....', '')).toBe('... ... ....');
  });

  it('returns default mask when format is undefined', () => {
    expect(getActiveMask(undefined, '')).toBe('............');
  });

  it('returns custom default mask', () => {
    expect(getActiveMask(undefined, '', '.... ....')).toBe('.... ....');
  });
});

describe('formatPhone', () => {
  it('formats Colombian phone number', () => {
    const result = formatPhone('573105551234', colombia);
    expect(result).toBe('+57 310 555 1234');
  });

  it('formats US phone number', () => {
    const result = formatPhone('13105551234', us);
    expect(result).toBe('+1 310 555 1234');
  });

  it('formats UK phone number', () => {
    const result = formatPhone('447911123456', uk);
    expect(result).toBe('+44 7911 123456');
  });

  it('formats partial number', () => {
    const result = formatPhone('57310', colombia);
    expect(result).toBe('+57 310');
  });

  it('returns empty for empty input', () => {
    expect(formatPhone('', colombia)).toBe('');
  });

  it('handles null country', () => {
    const result = formatPhone('12345', null);
    expect(result).toBe('+12345');
  });

  it('respects disableFormatting option', () => {
    const result = formatPhone('573105551234', colombia, {
      disableFormatting: true,
    });
    expect(result).toBe('+57 3105551234');
  });

  it('handles number without dial code prefix', () => {
    const result = formatPhone('3105551234', colombia);
    expect(result).toBe('+57 310 555 1234');
  });
});

describe('formatNational', () => {
  it('formats national digits with mask', () => {
    expect(formatNational('3105551234', colombia)).toBe('310 555 1234');
  });

  it('returns raw digits for null country', () => {
    expect(formatNational('12345', null)).toBe('12345');
  });

  it('handles partial input', () => {
    expect(formatNational('310', colombia)).toBe('310');
  });
});

describe('validatePhone', () => {
  it('validates correct Colombian number', () => {
    const result = validatePhone('+573105551234', colombia);
    expect(result.isValid).toBe(true);
    expect(result.isPossible).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('detects too short number', () => {
    const result = validatePhone('+5731055', colombia);
    expect(result.isValid).toBe(false);
    expect(result.isPossible).toBe(true);
    expect(result.error).toBe('TOO_SHORT');
  });

  it('detects too long number', () => {
    const result = validatePhone('+5731055512345678', colombia);
    expect(result.isValid).toBe(false);
    expect(result.isPossible).toBe(false);
    expect(result.error).toBe('TOO_LONG');
  });

  it('validates correct US number', () => {
    const result = validatePhone('+13105551234', us);
    expect(result.isValid).toBe(true);
  });

  it('validates correct Spanish number', () => {
    const result = validatePhone('+34612345678', spain);
    expect(result.isValid).toBe(true);
  });

  it('returns NOT_A_NUMBER for empty input', () => {
    const result = validatePhone('', colombia);
    expect(result.error).toBe('NOT_A_NUMBER');
  });

  it('returns INVALID_COUNTRY for null country', () => {
    const result = validatePhone('+12345', null);
    expect(result.error).toBe('INVALID_COUNTRY');
  });

  it('returns TOO_SHORT for just dial code', () => {
    const result = validatePhone('+57', colombia);
    expect(result.isValid).toBe(false);
    expect(result.isPossible).toBe(true);
    expect(result.error).toBe('TOO_SHORT');
  });
});

describe('parsePhone', () => {
  it('parses E.164 Colombian number', () => {
    const result = parsePhone('+573105551234');
    expect(result.country?.iso2).toBe('co');
    expect(result.e164).toBe('+573105551234');
    expect(result.national).toBe('310 555 1234');
    expect(result.international).toBe('+57 310 555 1234');
    expect(result.isValid).toBe(true);
  });

  it('parses formatted US number', () => {
    const result = parsePhone('+1 310 555 1234');
    expect(result.country?.iso2).toBe('us');
    expect(result.e164).toBe('+13105551234');
    expect(result.isValid).toBe(true);
  });

  it('parses with country hint', () => {
    const result = parsePhone('3105551234', colombia);
    expect(result.country?.iso2).toBe('co');
    expect(result.e164).toBe('+573105551234');
  });

  it('returns empty result for empty input', () => {
    const result = parsePhone('');
    expect(result.country).toBeNull();
    expect(result.e164).toBe('');
    expect(result.isValid).toBe(false);
  });

  it('handles UK number', () => {
    const result = parsePhone('+447911123456');
    expect(result.country?.iso2).toBe('gb');
    expect(result.isValid).toBe(true);
  });

  it('preserves raw input', () => {
    const input = '+57 (310) 555-1234';
    const result = parsePhone(input);
    expect(result.raw).toBe(input);
  });
});
