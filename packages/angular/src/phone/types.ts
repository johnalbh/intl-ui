import type { Country, CountryIso2, ParsedPhone } from '@intl-ui/core';

/**
 * Options for creating a PhoneInputStore.
 *
 * Mirrors UsePhoneInputOptions from @intl-ui/react but uses Angular
 * idioms — signals for reactivity, no controlled/uncontrolled split
 * (Angular forms handle that via ControlValueAccessor).
 */
export interface PhoneInputOptions {
  /** Initial phone value in E.164 format (e.g., "+573105551234"). */
  initialValue?: string;
  /** Initial country ISO2 code. */
  initialCountry?: CountryIso2;
  /**
   * If true, the country is never auto-detected from typed input.
   * Default: false.
   */
  disableCountryGuess?: boolean;
  /** Custom list of countries instead of the full built-in list. */
  countries?: Country[];
  /** ISO2 codes of countries to pin at the top of the list. */
  preferredCountries?: CountryIso2[];
}

/**
 * Metadata emitted with every value change.
 */
export interface ValueChangeMeta {
  country: Country | null;
  isValid: boolean;
  parsed: ParsedPhone | null;
  source: ValueChangeSource;
}

export type ValueChangeSource =
  | 'user-type'
  | 'country-change'
  | 'reset'
  | 'external';
