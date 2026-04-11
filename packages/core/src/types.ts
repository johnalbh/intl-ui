/**
 * ISO 3166-1 alpha-2 country code (e.g., "us", "co", "es").
 * Lowercase by convention throughout @intl-ui.
 */
export type CountryIso2 = string & { readonly __brand?: 'CountryIso2' };

/**
 * Phone number formatting mask.
 * Uses '.' as digit placeholder (e.g., "... ... ...." for Colombia).
 * Can be a single string or a map of patterns for countries with multiple formats.
 */
export type FormatMap = Record<string, string> & { default: string };
export type PhoneFormat = string | FormatMap;

/**
 * Core country data object.
 * Objects, not tuples — readable, extensible, type-safe.
 */
export interface Country {
  /** Display name in English (e.g., "Colombia") */
  name: string;
  /** ISO 3166-1 alpha-2 code, lowercase (e.g., "co") */
  iso2: CountryIso2;
  /** ISO 3166-1 alpha-3 code, lowercase (e.g., "col") */
  iso3: string;
  /** International dial code without + (e.g., "57") */
  dialCode: string;
  /** Phone number formatting mask */
  format?: PhoneFormat;
  /** Priority for countries sharing a dial code (lower = higher priority) */
  priority: number;
  /** Area codes for disambiguation (e.g., US: ["201", "202", ...]) */
  areaCodes?: string[];
  /** Flag emoji (e.g., "🇨🇴") */
  flag: string;
  /** Capital city in English (e.g., "Bogotá"). For city-states this equals the country name. */
  capital: string;
  /** Geographic region (e.g., "Americas", "Europe") */
  region: string;
  /** Geographic subregion (e.g., "South America") */
  subregion: string;
}

/**
 * State, province, or region within a country.
 */
export interface Region {
  /** Display name (e.g., "Antioquia") */
  name: string;
  /** Region code (e.g., "ANT") */
  code: string;
  /** Parent country ISO2 */
  countryIso2: CountryIso2;
}

/**
 * City within a region.
 */
export interface City {
  /** Display name (e.g., "Medellín") */
  name: string;
  /** Parent region code */
  regionCode: string;
  /** Parent country ISO2 */
  countryIso2: CountryIso2;
}

/**
 * Result of parsing a phone number string.
 */
export interface ParsedPhone {
  /** Original input string */
  raw: string;
  /** E.164 format (e.g., "+573105551234") */
  e164: string;
  /** National format with formatting (e.g., "310 555 1234") */
  national: string;
  /** International format (e.g., "+57 310 555 1234") */
  international: string;
  /** Detected country, or null if unknown */
  country: Country | null;
  /** Whether the number passes validation */
  isValid: boolean;
  /** Whether the number could be valid with more digits */
  isPossible: boolean;
}

/**
 * Result of phone number validation.
 */
export interface ValidationResult {
  /** Number is fully valid for the detected country */
  isValid: boolean;
  /** Number could be valid (has valid prefix but may be incomplete) */
  isPossible: boolean;
  /** Specific error if invalid */
  error?: ValidationError;
}

export type ValidationError =
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'INVALID_COUNTRY'
  | 'INVALID_FORMAT'
  | 'NOT_A_NUMBER';

/**
 * Result of guessing a country from a partial phone number.
 */
export interface CountryGuessResult {
  /** Best matching country, or undefined */
  country: Country | undefined;
  /** Whether the full dial code was matched (vs partial) */
  fullDialCodeMatch: boolean;
}

/**
 * Configuration for phone formatting.
 */
export interface FormatOptions {
  /** Prefix character before dial code (default: "+") */
  prefix?: string;
  /** Character between dial code and number (default: " ") */
  charAfterDialCode?: string;
  /** Mask placeholder character (default: ".") */
  maskChar?: string;
  /** Default mask when country has no specific format */
  defaultMask?: string;
  /** Whether to force the dial code to always be present */
  forceDialCode?: boolean;
  /** Whether to disable formatting entirely (raw digits only) */
  disableFormatting?: boolean;
}

/**
 * Node in the dial code trie for O(1) country lookups.
 */
export interface DialCodeTrieNode {
  /** Countries that match at this exact prefix */
  countries: Country[];
  /** Child nodes keyed by next digit */
  children: Map<string, DialCodeTrieNode>;
}
