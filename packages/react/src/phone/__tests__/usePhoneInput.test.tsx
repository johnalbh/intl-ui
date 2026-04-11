import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePhoneInput } from '../usePhoneInput';

/**
 * Minimal ChangeEvent mock — we never render a real input in these
 * tests, we just build an event object that looks enough like the
 * React synthetic event for handleInputChange to work.
 */
function changeEvent(value: string) {
  return {
    target: { value },
    currentTarget: { value },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}

describe('usePhoneInput', () => {
  // ───────────────────────────────────────────────────────────────
  // Default / uncontrolled mode
  // ───────────────────────────────────────────────────────────────
  describe('uncontrolled mode', () => {
    it('starts empty when no options are provided', () => {
      const { result } = renderHook(() => usePhoneInput());
      expect(result.current.value).toBe('');
      expect(result.current.country).toBe(null);
      expect(result.current.isValid).toBe(false);
      expect(result.current.isOpen).toBe(false);
    });

    it('accepts defaultValue and detects the country from it', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultValue: '+573105551234' }),
      );
      expect(result.current.value).toBe('+573105551234');
      expect(result.current.country?.iso2).toBe('co');
      expect(result.current.isValid).toBe(true);
    });

    it('accepts defaultCountry without a defaultValue', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );
      expect(result.current.value).toBe('');
      expect(result.current.country?.iso2).toBe('co');
      expect(result.current.country?.capital).toBe('Bogotá');
      expect(result.current.inputValue).toBe('+57 ');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // User typing behaviour
  // ───────────────────────────────────────────────────────────────
  describe('user input', () => {
    it('formats digits against the country mask as the user types', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      act(() => {
        result.current.getInputProps().onChange(changeEvent('+57 3105551234'));
      });

      expect(result.current.value).toBe('+573105551234');
      expect(result.current.inputValue).toBe('+57 310 555 1234');
      expect(result.current.isValid).toBe(true);
    });

    it('auto-detects the country when the user types a foreign dial code', () => {
      const { result } = renderHook(() => usePhoneInput());

      act(() => {
        result.current.getInputProps().onChange(changeEvent('+442071838750'));
      });

      expect(result.current.country?.iso2).toBe('gb');
      expect(result.current.value).toBe('+442071838750');
    });

    it('does not auto-detect when disableCountryGuess is true', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co', disableCountryGuess: true }),
      );

      act(() => {
        result.current.getInputProps().onChange(changeEvent('+442071838750'));
      });

      // Country stays as CO even though the user typed a UK number.
      expect(result.current.country?.iso2).toBe('co');
    });

    it('clears the value when the user deletes all digits', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultValue: '+573105551234' }),
      );

      act(() => {
        result.current.getInputProps().onChange(changeEvent(''));
      });

      expect(result.current.value).toBe('');
      expect(result.current.isValid).toBe(false);
      // The country should be preserved when clearing.
      expect(result.current.country?.iso2).toBe('co');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // Country change
  // ───────────────────────────────────────────────────────────────
  describe('setCountry', () => {
    it('updates the selected country programmatically', () => {
      const { result } = renderHook(() => usePhoneInput());

      act(() => {
        result.current.setCountry('co');
      });

      expect(result.current.country?.iso2).toBe('co');
      expect(result.current.country?.capital).toBe('Bogotá');
    });

    it('reformats the current value against the new country mask', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultValue: '+573105551234' }),
      );

      act(() => {
        result.current.setCountry('us');
      });

      expect(result.current.country?.iso2).toBe('us');
      // The digits survive the country change — only the mask changes.
      expect(result.current.value.replace(/^\+1/, '')).toBe('3105551234');
    });

    it('fires onCountryChange when the country changes', () => {
      const onCountryChange = vi.fn();
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co', onCountryChange }),
      );

      act(() => {
        result.current.setCountry('us');
      });

      expect(onCountryChange).toHaveBeenCalledTimes(1);
      expect(onCountryChange.mock.calls[0]?.[0]?.iso2).toBe('us');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // Dropdown state
  // ───────────────────────────────────────────────────────────────
  describe('dropdown state', () => {
    it('opens and closes via setOpen', () => {
      const { result } = renderHook(() => usePhoneInput());

      act(() => result.current.setOpen(true));
      expect(result.current.isOpen).toBe(true);

      act(() => result.current.setOpen(false));
      expect(result.current.isOpen).toBe(false);
    });

    it('filters visibleCountries by name', () => {
      const { result } = renderHook(() => usePhoneInput());

      act(() => result.current.setFilter('colomb'));

      expect(
        result.current.visibleCountries.every((c) =>
          c.name.toLowerCase().includes('colomb'),
        ),
      ).toBe(true);
      expect(result.current.visibleCountries.length).toBeGreaterThan(0);
    });

    it('filters visibleCountries by iso2 or iso3', () => {
      const { result } = renderHook(() => usePhoneInput());

      act(() => result.current.setFilter('co'));

      const iso2s = result.current.visibleCountries.map((c) => c.iso2);
      expect(iso2s).toContain('co'); // Colombia
    });

    it('arrow keys move focusedIndex through visibleCountries', () => {
      const { result } = renderHook(() => usePhoneInput());

      // Open the dropdown first — arrow keys only work when open.
      act(() => result.current.setOpen(true));

      // ArrowDown from -1 → focuses first item (index 0).
      act(() => {
        result.current.getInputProps().onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });
      expect(result.current.focusedIndex).toBe(0);

      // ArrowDown again → index 1.
      act(() => {
        result.current.getInputProps().onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });
      expect(result.current.focusedIndex).toBe(1);

      // ArrowUp → back to index 0.
      act(() => {
        result.current.getInputProps().onKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });
      expect(result.current.focusedIndex).toBe(0);
    });

    it('Escape closes the dropdown and resets focus', () => {
      const { result } = renderHook(() => usePhoneInput());

      act(() => result.current.setOpen(true));
      act(() => {
        result.current.getInputProps().onKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });
      expect(result.current.focusedIndex).toBe(0);

      act(() => {
        result.current.getInputProps().onKeyDown({
          key: 'Escape',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.focusedIndex).toBe(-1);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // Controlled mode
  // ───────────────────────────────────────────────────────────────
  describe('controlled mode', () => {
    it('uses the value prop instead of internal state', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => usePhoneInput({ value }),
        { initialProps: { value: '+573105551234' } },
      );

      expect(result.current.value).toBe('+573105551234');
      expect(result.current.country?.iso2).toBe('co');

      rerender({ value: '+442071838750' });

      expect(result.current.value).toBe('+442071838750');
      expect(result.current.country?.iso2).toBe('gb');
    });

    it('calls onValueChange when the user types', () => {
      const onValueChange = vi.fn();
      const { result } = renderHook(() =>
        usePhoneInput({
          value: '',
          defaultCountry: 'co',
          onValueChange,
        }),
      );

      act(() => {
        result.current.getInputProps().onChange(changeEvent('+57 3105551234'));
      });

      expect(onValueChange).toHaveBeenCalledTimes(1);
      const [newValue, meta] = onValueChange.mock.calls[0]!;
      expect(newValue).toBe('+573105551234');
      expect(meta.source).toBe('user-type');
      expect(meta.country?.iso2).toBe('co');
      expect(meta.isValid).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // Prop-getters shape
  // ───────────────────────────────────────────────────────────────
  describe('prop-getters', () => {
    it('getInputProps returns a spreadable object with tel attrs', () => {
      const { result } = renderHook(() => usePhoneInput());
      const props = result.current.getInputProps();
      expect(props.type).toBe('tel');
      expect(props.autoComplete).toBe('tel');
      expect(typeof props.onChange).toBe('function');
      expect(typeof props.onKeyDown).toBe('function');
    });

    it('getCountrySelectProps exposes button + aria attrs', () => {
      const { result } = renderHook(() => usePhoneInput());
      const props = result.current.getCountrySelectProps();
      expect(props.type).toBe('button');
      expect(props['aria-haspopup']).toBe('listbox');
      expect(props['aria-expanded']).toBe(false);
    });

    it('getCountryOptionProps marks the current country as aria-selected', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );
      const colombia = result.current.visibleCountries.find(
        (c) => c.iso2 === 'co',
      )!;
      const props = result.current.getCountryOptionProps(colombia, 0);
      expect(props['aria-selected']).toBe(true);
      expect(props['data-iso2']).toBe('co');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // reset
  // ───────────────────────────────────────────────────────────────
  describe('reset', () => {
    it('clears the value and restores the initial country', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      act(() => {
        result.current.getInputProps().onChange(changeEvent('+57 310 555 1234'));
      });
      expect(result.current.value).toBe('+573105551234');

      act(() => {
        result.current.reset();
      });

      expect(result.current.value).toBe('');
      expect(result.current.country?.iso2).toBe('co');
    });
  });
});
