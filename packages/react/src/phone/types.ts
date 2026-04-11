import type {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  RefCallback,
} from 'react';
import type { Country, CountryIso2, ParsedPhone } from '@intl-ui/core';

/**
 * Options accepted by usePhoneInput().
 *
 * The hook supports controlled and uncontrolled modes for both the
 * phone value and the selected country — follow the same pattern as
 * React's native <input>: provide value + onValueChange for
 * controlled, or defaultValue alone for uncontrolled.
 */
export interface UsePhoneInputOptions {
  /** Controlled phone value in E.164 format (e.g., "+573105551234"). */
  value?: string;
  /** Initial phone value for uncontrolled usage. */
  defaultValue?: string;
  /**
   * Called whenever the phone value changes (user typing, country change,
   * programmatic reset). Receives the new value plus parsed metadata.
   */
  onValueChange?: (value: string, meta: ValueChangeMeta) => void;

  /** Controlled selected country ISO2. */
  country?: CountryIso2;
  /** Initial country for uncontrolled usage. */
  defaultCountry?: CountryIso2;
  /** Called when the selected country changes for any reason. */
  onCountryChange?: (country: Country) => void;

  /**
   * If true, the country is never auto-detected from typed input. The
   * country only changes via explicit setCountry calls or controlled
   * prop updates. Default: false.
   */
  disableCountryGuess?: boolean;

  /**
   * If true, the dial code prefix cannot be deleted from the input via
   * backspace. The user must change the selected country to change the
   * prefix. Default: false.
   */
  forceDialCode?: boolean;

  /**
   * Custom list of countries to use instead of the full built-in list.
   * The order is preserved for the dropdown.
   */
  countries?: Country[];

  /**
   * ISO2 codes of countries to pin at the top of the visible list,
   * in the order given. These are shown above the divider.
   */
  preferredCountries?: CountryIso2[];
}

/**
 * Metadata attached to every onValueChange call.
 */
export interface ValueChangeMeta {
  /** The country matching this value, if any. */
  country: Country | null;
  /** Whether the value is a valid phone number for the current country. */
  isValid: boolean;
  /** The parsed phone object, if the value is parseable. */
  parsed: ParsedPhone | null;
  /** What triggered the change, useful for debugging or analytics. */
  source: ValueChangeSource;
}

export type ValueChangeSource =
  | 'user-type'
  | 'country-change'
  | 'reset'
  | 'external';

/**
 * Public shape returned by usePhoneInput.
 */
export interface UsePhoneInputReturn {
  // ─── State ───────────────────────────────────────────────────────
  /** The canonical phone value in E.164 format (or empty string). */
  value: string;
  /** The formatted string currently displayed in the input. */
  inputValue: string;
  /** The currently selected country, or null if none. */
  country: Country | null;
  /** The parsed phone object, or null if the value is empty or unparseable. */
  parsed: ParsedPhone | null;
  /** Whether the current value passes validation for the current country. */
  isValid: boolean;
  /** Whether the country dropdown is open. */
  isOpen: boolean;
  /** Index of the currently focused country in the visible list, or -1. */
  focusedIndex: number;
  /** The countries currently visible in the dropdown (after filtering). */
  visibleCountries: Country[];

  // ─── Prop-getters ────────────────────────────────────────────────
  /** Props to spread onto the <input type="tel" /> element. */
  getInputProps: () => PhoneInputProps;
  /** Props to spread onto the country-select trigger button. */
  getCountrySelectProps: () => CountrySelectTriggerProps;
  /** Props to spread onto the <ul role="listbox"> that lists countries. */
  getCountryListProps: () => CountryListProps;
  /** Props to spread onto each <li role="option"> in the country list. */
  getCountryOptionProps: (
    country: Country,
    index: number,
  ) => CountryOptionProps;

  // ─── Actions ─────────────────────────────────────────────────────
  /** Programmatically set the selected country. */
  setCountry: (iso2: CountryIso2) => void;
  /** Open or close the country dropdown. */
  setOpen: (open: boolean) => void;
  /** Set the filter string used to search the country list. */
  setFilter: (filter: string) => void;
  /** Reset the hook state to its initial values. */
  reset: () => void;
}

// ─── Prop-getter return types ──────────────────────────────────────

export interface PhoneInputProps {
  ref: RefCallback<HTMLInputElement>;
  type: 'tel';
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  autoComplete: 'tel';
  'aria-autocomplete': 'none';
}

export interface CountrySelectTriggerProps {
  type: 'button';
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  'aria-haspopup': 'listbox';
  'aria-expanded': boolean;
}

export interface CountryListProps {
  role: 'listbox';
  'aria-label': string;
}

export interface CountryOptionProps {
  role: 'option';
  'aria-selected': boolean;
  'data-iso2': string;
  'data-index': number;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onMouseEnter: () => void;
}
