import { describe, expect, it } from 'vitest';
import * as pkg from '../index';

/**
 * Smoke tests for the package entry point.
 *
 * These are not feature tests — they exist so `pnpm test` has
 * something to run while `@intl-ui/react` is still scaffolding, and
 * so any accidental breakage of the re-exports from @intl-ui/core is
 * caught immediately. Feature tests (usePhoneInput, compound
 * components) replace this file as they land.
 */

describe('@intl-ui/react entry point', () => {
  it('re-exports country data from @intl-ui/core', () => {
    expect(Array.isArray(pkg.countries)).toBe(true);
    expect(pkg.countries.length).toBeGreaterThanOrEqual(190);
  });

  it('re-exports phone utilities from @intl-ui/core', () => {
    expect(typeof pkg.parsePhone).toBe('function');
    expect(typeof pkg.formatPhone).toBe('function');
    expect(typeof pkg.validatePhone).toBe('function');
  });

  it('re-exports country lookup helpers from @intl-ui/core', () => {
    const colombia = pkg.getCountryByIso2('co');
    expect(colombia?.name).toBe('Colombia');
    expect(colombia?.capital).toBe('Bogotá');
  });

  it('parses a real phone number end to end', () => {
    const parsed = pkg.parsePhone('+573105551234');
    expect(parsed.isValid).toBe(true);
    expect(parsed.country?.iso2).toBe('co');
    expect(parsed.country?.capital).toBe('Bogotá');
  });
});
