/**
 * Remove all non-digit characters from a string.
 */
export function removeNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Check if a string contains only digit characters.
 */
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Check if a single character is a digit.
 */
export function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

/**
 * Normalize text for search: lowercase, remove accents/diacritics, trim.
 * "Côte d'Ivoire" → "cote d'ivoire"
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Convert a phone number to E.164 format.
 * Strips everything except digits, prepends "+".
 *
 * @example toE164("(310) 555-1234", "1") → "+13105551234"
 * @example toE164("+57 310 555 1234") → "+573105551234"
 */
export function toE164(phone: string, dialCode?: string): string {
  const digits = removeNonDigits(phone);

  if (!digits) return '';

  // If the digits already start with the dial code, just prepend +
  if (dialCode && digits.startsWith(dialCode)) {
    return `+${digits}`;
  }

  // If a dial code is provided, prepend it
  if (dialCode) {
    return `+${dialCode}${digits}`;
  }

  return `+${digits}`;
}

/**
 * Apply a mask pattern to a value string.
 * Uses '.' as the digit placeholder by default.
 *
 * @example applyMask("3105551234", "... ... ....") → "310 555 1234"
 * @example applyMask("3105", "... ... ....") → "310 5"
 */
export function applyMask(
  value: string,
  mask: string,
  maskChar: string = '.',
): string {
  const digits = removeNonDigits(value);

  if (!digits || !mask) return digits;

  let result = '';
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === maskChar) {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += mask[i];
    }
  }

  return result;
}

/**
 * Convert an ISO 3166-1 alpha-2 code to a flag emoji.
 * Each letter is offset to its Regional Indicator Symbol.
 *
 * @example iso2ToFlag("co") → "🇨🇴"
 * @example iso2ToFlag("us") → "🇺🇸"
 */
export function iso2ToFlag(iso2: string): string {
  const upper = iso2.toUpperCase();
  const codePoints = [...upper].map(
    (char) => 0x1f1e6 + char.charCodeAt(0) - 65,
  );
  return String.fromCodePoint(...codePoints);
}
