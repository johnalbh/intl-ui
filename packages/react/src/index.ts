/**
 * @intl-ui/react — React components and hooks for international UI.
 *
 * This package is currently scaffolding. The first public release will
 * export `usePhoneInput`, `<PhoneInput />`, and the compound components
 * listed in the README.
 *
 * Re-exports from `@intl-ui/core` are intentional: consumers of the
 * React package should never need to install `@intl-ui/core` separately
 * to access phone types, country data, or validation helpers.
 */

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
