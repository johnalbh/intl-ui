/**
 * @intl-ui/react — React components and hooks for international UI.
 *
 * Re-exports from `@intl-ui/core` are intentional: consumers of the
 * React package should never need to install `@intl-ui/core` separately
 * to access phone types, country data, or validation helpers.
 */

// Re-exports from @intl-ui/core (so users never need to install core directly)
export {
  type Country,
  type CountryIso2,
  type ParsedPhone,
  type ValidationResult,
  type ValidationError,
  countries,
  countriesMinimal,
  getCountryByIso2,
  getCountryByIso3,
  getCountriesByDialCode,
  parsePhone,
  formatPhone,
  validatePhone,
} from '@intl-ui/core';

// Phone input — headless hook
export { usePhoneInput } from './phone';
export type {
  UsePhoneInputOptions,
  UsePhoneInputReturn,
  ValueChangeMeta,
  ValueChangeSource,
  PhoneInputInputGetterProps,
  CountrySelectTriggerProps,
  CountryListProps,
  CountryOptionProps,
} from './phone';

// Phone input — compound components
export {
  PhoneInput,
  PhoneInputRoot,
  PhoneInputInput,
  PhoneInputCountrySelect,
  PhoneInputFlag,
  PhoneInputDialCode,
  PhoneInputCountryList,
  PhoneInputCountryListItem,
} from './phone';
export type {
  PhoneInputProps,
  PhoneInputRootProps,
  PhoneInputInputProps,
  PhoneInputCountrySelectProps,
  PhoneInputFlagProps,
  PhoneInputDialCodeProps,
  PhoneInputCountryListProps,
  PhoneInputCountryListItemProps,
} from './phone';

// Low-level composition primitives (for power users building custom compounds)
export { Slot, mergeProps, composeRefs } from './phone';
export type { SlotProps } from './phone';
