import { describe, expect, it } from 'vitest';
import * as angularExports from '../index';

describe('@intl-ui/angular exports', () => {
  it('re-exports core types and functions', () => {
    expect(angularExports.countries).toBeDefined();
    expect(angularExports.countriesMinimal).toBeDefined();
    expect(angularExports.getCountryByIso2).toBeTypeOf('function');
    expect(angularExports.getCountryByIso3).toBeTypeOf('function');
    expect(angularExports.getCountriesByDialCode).toBeTypeOf('function');
    expect(angularExports.parsePhone).toBeTypeOf('function');
    expect(angularExports.formatPhone).toBeTypeOf('function');
    expect(angularExports.validatePhone).toBeTypeOf('function');
  });

  it('exports createPhoneInputStore', () => {
    expect(angularExports.createPhoneInputStore).toBeTypeOf('function');
  });

  it('exports IntlPhoneValidators', () => {
    expect(angularExports.IntlPhoneValidators).toBeDefined();
    expect(angularExports.IntlPhoneValidators.validPhone).toBeTypeOf('function');
    expect(angularExports.IntlPhoneValidators.allowedCountries).toBeTypeOf('function');
  });

  it('exports IntlPhoneInputComponent', () => {
    expect(angularExports.IntlPhoneInputComponent).toBeDefined();
  });

  it('exports IntlPhoneInputValueAccessorDirective', () => {
    expect(angularExports.IntlPhoneInputValueAccessorDirective).toBeDefined();
  });
});
