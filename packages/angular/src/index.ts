/**
 * @intl-ui/angular — Angular components and directives for international UI.
 *
 * Re-exports from `@intl-ui/core` are intentional: consumers of the
 * Angular package should never need to install `@intl-ui/core` separately
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

// Phone input — headless store (signal-based)
export { createPhoneInputStore } from './phone';
export type { PhoneInputStore, PhoneInputOptions, ValueChangeMeta, ValueChangeSource } from './phone';

// Phone input — standalone component
export { IntlPhoneInputComponent } from './phone';

// Phone input — ControlValueAccessor (Reactive Forms / ngModel)
export { IntlPhoneInputValueAccessorDirective } from './phone';

// Phone input — validators
export { IntlPhoneValidators } from './phone';
