import type { Country, ValidationResult } from '../types';
import { removeNonDigits } from '../utils';
import { getActiveMask } from './format';

/**
 * Count the digit placeholders in a mask.
 *
 * @example getDigitCount("... ... ....") → 10
 * @example getDigitCount(".. .... ....") → 10
 */
function getDigitCount(mask: string, maskChar: string = '.'): number {
  let count = 0;
  for (const char of mask) {
    if (char === maskChar) count++;
  }
  return count;
}

/**
 * Validate a phone number against its country's format rules.
 *
 * Validation is mask-based: checks if the national digits match
 * the expected length from the country's formatting mask.
 *
 * @param phone - Phone string (with or without dial code/prefix)
 * @param country - Country to validate against
 * @returns Validation result with error details
 *
 * @example
 * validatePhone("+573105551234", colombia)
 * // → { isValid: true, isPossible: true }
 *
 * @example
 * validatePhone("+5731055", colombia)
 * // → { isValid: false, isPossible: true, error: "TOO_SHORT" }
 */
export function validatePhone(
  phone: string,
  country: Country | null,
): ValidationResult {
  const digits = removeNonDigits(phone);

  if (!digits) {
    return { isValid: false, isPossible: false, error: 'NOT_A_NUMBER' };
  }

  if (!country) {
    return { isValid: false, isPossible: false, error: 'INVALID_COUNTRY' };
  }

  // Extract national digits
  let nationalDigits: string;
  if (digits.startsWith(country.dialCode)) {
    nationalDigits = digits.slice(country.dialCode.length);
  } else {
    nationalDigits = digits;
  }

  if (!nationalDigits) {
    return { isValid: false, isPossible: true, error: 'TOO_SHORT' };
  }

  // Get the expected digit count from the mask
  const mask = getActiveMask(country.format, nationalDigits);
  const expectedLength = getDigitCount(mask);

  // If no meaningful mask, we can only do basic validation
  if (expectedLength === 0) {
    return { isValid: nationalDigits.length > 0, isPossible: true };
  }

  if (nationalDigits.length < expectedLength) {
    return { isValid: false, isPossible: true, error: 'TOO_SHORT' };
  }

  if (nationalDigits.length > expectedLength) {
    return { isValid: false, isPossible: false, error: 'TOO_LONG' };
  }

  return { isValid: true, isPossible: true };
}
