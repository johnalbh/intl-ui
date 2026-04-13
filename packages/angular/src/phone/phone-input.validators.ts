import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';
import {
  getCountryByIso2,
  parsePhone,
  validatePhone,
  type CountryIso2,
} from '@intl-ui/core';

/**
 * Validators for phone input form controls.
 *
 * @example
 * ```typescript
 * // In a reactive form
 * this.form = this.fb.group({
 *   phone: ['', [IntlPhoneValidators.validPhone()]],
 * });
 *
 * // With a specific country
 * this.form = this.fb.group({
 *   phone: ['', [IntlPhoneValidators.validPhone('us')]],
 * });
 * ```
 */
export class IntlPhoneValidators {
  /**
   * Validates that the control value is a valid phone number.
   *
   * If a country ISO2 code is provided, validates against that country's
   * format. Otherwise, parses the number and validates against the
   * detected country.
   */
  static validPhone(countryIso2?: CountryIso2): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;
      if (!value || value === '+') return null; // Empty is valid (use Validators.required separately)

      const parsed = parsePhone(value);
      if (!parsed.country) {
        return { intlPhone: { error: 'INVALID_COUNTRY', value } };
      }

      const targetCountry = countryIso2
        ? getCountryByIso2(countryIso2)
        : parsed.country;

      if (!targetCountry) {
        return { intlPhone: { error: 'INVALID_COUNTRY', value } };
      }

      const result = validatePhone(value, targetCountry);
      if (!result.isValid) {
        return {
          intlPhone: {
            error: result.error ?? 'INVALID_FORMAT',
            value,
            country: targetCountry.iso2,
          },
        };
      }
      return null;
    };
  }

  /**
   * Validates that the phone number belongs to a specific set of countries.
   */
  static allowedCountries(countries: CountryIso2[]): ValidatorFn {
    const allowed = new Set(countries.map((c) => c.toLowerCase()));
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;
      if (!value || value === '+') return null;

      const parsed = parsePhone(value);
      if (!parsed.country || !allowed.has(parsed.country.iso2)) {
        return {
          intlPhoneCountry: {
            allowedCountries: countries,
            actualCountry: parsed.country?.iso2 ?? null,
            value,
          },
        };
      }
      return null;
    };
  }
}
