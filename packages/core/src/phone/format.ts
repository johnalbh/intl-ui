import type { Country, FormatOptions, PhoneFormat } from '../types';
import { applyMask, removeNonDigits } from '../utils';

const DEFAULT_MASK = '............';
const DEFAULT_OPTIONS: Required<FormatOptions> = {
  prefix: '+',
  charAfterDialCode: ' ',
  maskChar: '.',
  defaultMask: DEFAULT_MASK,
  forceDialCode: false,
  disableFormatting: false,
};

/**
 * Get the active formatting mask for a country, based on the phone digits.
 * Some countries have multiple masks depending on the number pattern.
 */
export function getActiveMask(
  format: PhoneFormat | undefined,
  nationalDigits: string,
  defaultMask: string = DEFAULT_MASK,
): string {
  if (!format) return defaultMask;

  if (typeof format === 'string') return format;

  // FormatMap: try each regex key, fall back to default
  for (const [pattern, mask] of Object.entries(format)) {
    if (pattern === 'default') continue;
    try {
      if (new RegExp(pattern).test(nationalDigits)) return mask;
    } catch {
      continue;
    }
  }

  return format.default || defaultMask;
}

/**
 * Format a phone number with country-specific mask.
 *
 * @param phone - Phone digits (may include dial code)
 * @param country - Country for formatting rules
 * @param options - Formatting options
 * @returns Formatted phone string (e.g., "+57 310 555 1234")
 *
 * @example
 * formatPhone("573105551234", colombia)
 * // → "+57 310 555 1234"
 *
 * @example
 * formatPhone("3105551234", colombia, { forceDialCode: true })
 * // → "+57 310 555 1234"
 */
export function formatPhone(
  phone: string,
  country: Country | null,
  options: FormatOptions = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const digits = removeNonDigits(phone);

  if (!digits) return '';
  if (!country) return `${opts.prefix}${digits}`;

  // Determine national digits (without dial code)
  let nationalDigits: string;
  if (digits.startsWith(country.dialCode)) {
    nationalDigits = digits.slice(country.dialCode.length);
  } else {
    nationalDigits = digits;
  }

  if (opts.disableFormatting) {
    return `${opts.prefix}${country.dialCode}${opts.charAfterDialCode}${nationalDigits}`;
  }

  const mask = getActiveMask(country.format, nationalDigits, opts.defaultMask);
  const formatted = applyMask(nationalDigits, mask, opts.maskChar);

  return `${opts.prefix}${country.dialCode}${opts.charAfterDialCode}${formatted}`;
}

/**
 * Format only the national part of a phone number (without dial code/prefix).
 *
 * @example
 * formatNational("3105551234", colombia) → "310 555 1234"
 */
export function formatNational(
  nationalDigits: string,
  country: Country | null,
  maskChar: string = '.',
  defaultMask: string = DEFAULT_MASK,
): string {
  const digits = removeNonDigits(nationalDigits);

  if (!digits || !country) return digits;

  const mask = getActiveMask(country.format, digits, defaultMask);
  return applyMask(digits, mask, maskChar);
}
