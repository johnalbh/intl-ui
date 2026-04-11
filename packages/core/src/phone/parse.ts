import type { Country, ParsedPhone } from '../types';
import { countries } from '../countries';
import { buildDialCodeTrie, findCountryByDigits, guessCountryByPhone } from '../dial-codes';
import { removeNonDigits, toE164 } from '../utils';
import { formatNational, formatPhone } from './format';
import { validatePhone } from './validate';

// Lazy-initialized singleton trie
let _trie: ReturnType<typeof buildDialCodeTrie> | null = null;

function getTrie() {
  if (!_trie) {
    _trie = buildDialCodeTrie(countries);
  }
  return _trie;
}

/**
 * Parse a phone number string into its components.
 *
 * Accepts various formats:
 * - E.164: "+573105551234"
 * - With spaces: "+57 310 555 1234"
 * - With dashes: "57-310-555-1234"
 * - National: "3105551234" (requires country hint)
 *
 * @param phone - Phone string in any format
 * @param countryHint - Optional country for disambiguation
 * @returns Parsed phone object with all formats
 *
 * @example
 * parsePhone("+573105551234")
 * // → {
 * //   raw: "+573105551234",
 * //   e164: "+573105551234",
 * //   national: "310 555 1234",
 * //   international: "+57 310 555 1234",
 * //   country: { name: "Colombia", iso2: "co", ... },
 * //   isValid: true,
 * //   isPossible: true,
 * // }
 */
export function parsePhone(
  phone: string,
  countryHint?: Country,
): ParsedPhone {
  const digits = removeNonDigits(phone);

  const empty: ParsedPhone = {
    raw: phone,
    e164: '',
    national: '',
    international: '',
    country: null,
    isValid: false,
    isPossible: false,
  };

  if (!digits) return empty;

  // Try to detect country from digits using the trie
  const trie = getTrie();
  const hasExplicitDialCode = phone.trim().startsWith('+') || digits.startsWith(countryHint?.dialCode ?? '');

  let country: Country | null;
  if (countryHint && !hasExplicitDialCode) {
    // Input looks like a national number — trust the hint
    country = countryHint;
  } else {
    const guess = countryHint
      ? guessCountryByPhone(trie, digits, countryHint)
      : findCountryByDigits(trie, digits);
    country = guess.country ?? countryHint ?? null;
  }

  if (!country) {
    return {
      ...empty,
      e164: `+${digits}`,
      international: `+${digits}`,
    };
  }

  // Extract national part
  let nationalDigits: string;
  if (digits.startsWith(country.dialCode)) {
    nationalDigits = digits.slice(country.dialCode.length);
  } else {
    nationalDigits = digits;
  }

  const e164 = toE164(nationalDigits, country.dialCode);
  const national = formatNational(nationalDigits, country);
  const international = formatPhone(
    country.dialCode + nationalDigits,
    country,
  );

  const validation = validatePhone(phone, country);

  return {
    raw: phone,
    e164,
    national,
    international,
    country,
    isValid: validation.isValid,
    isPossible: validation.isPossible,
  };
}
