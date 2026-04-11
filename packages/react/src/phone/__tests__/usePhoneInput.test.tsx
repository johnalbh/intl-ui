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
      // In Model B, the input only contains the national digits.
      // The dial code lives in the country-select trigger, not here.
      expect(result.current.inputValue).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // User typing behaviour
  // ───────────────────────────────────────────────────────────────
  describe('user input', () => {
    it('formats national digits against the country mask as the user types', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      // National-format input (no leading +): the digits ARE the
      // national number, the dial code comes from the selected country.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('3105551234'));
      });

      // Internal value is always the canonical E.164 string.
      expect(result.current.value).toBe('+573105551234');
      // Displayed inputValue is the national portion, masked per country.
      expect(result.current.inputValue).toBe('310 555 1234');
      expect(result.current.isValid).toBe(true);
    });

    it('international format input (leading "+") is parsed via the trie', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      // When the user pastes "+57 3105551234", the leading + flips
      // the handler into international mode and the trie parses the
      // dial code out of the digits.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('+57 3105551234'));
      });

      expect(result.current.value).toBe('+573105551234');
      expect(result.current.inputValue).toBe('310 555 1234');
      expect(result.current.country?.iso2).toBe('co');
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

    it('user can clear the input via backspace and re-type a new number', () => {
      // This is the regression test for the Model A bug where the
      // dial code prefix was unfightable: backspace would shrink the
      // input to "+57", the formatter would re-stamp it back to "+57 ",
      // and the user got stuck. With Model B the dial code never lives
      // in the input, so backspace clears national digits cleanly and
      // typing fresh digits works immediately.
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      // Type a Colombian number.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('3105551234'));
      });
      expect(result.current.inputValue).toBe('310 555 1234');
      expect(result.current.value).toBe('+573105551234');

      // User selects-all and deletes (browser fires onChange with "").
      act(() => {
        result.current.getInputProps().onChange(changeEvent(''));
      });
      expect(result.current.inputValue).toBe('');
      expect(result.current.value).toBe('');
      // Country is preserved so the next typed digits are still CO.
      expect(result.current.country?.iso2).toBe('co');

      // User immediately types a new Colombian number — should work.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('3209876543'));
      });
      expect(result.current.inputValue).toBe('320 987 6543');
      expect(result.current.value).toBe('+573209876543');
    });

    it('typing 2-letter ISO code switches country and clears the input', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'us' }),
      );
      expect(result.current.country?.iso2).toBe('us');

      act(() => {
        result.current.getInputProps().onChange(changeEvent('co'));
      });

      expect(result.current.country?.iso2).toBe('co');
      expect(result.current.country?.capital).toBe('Bogotá');
      expect(result.current.value).toBe('');
      expect(result.current.inputValue).toBe('');
    });

    it('typing 3-letter ISO code (alpha-3) switches the country', () => {
      const { result } = renderHook(() => usePhoneInput());

      act(() => {
        result.current.getInputProps().onChange(changeEvent('USA'));
      });
      expect(result.current.country?.iso2).toBe('us');

      act(() => {
        result.current.getInputProps().onChange(changeEvent('col'));
      });
      expect(result.current.country?.iso2).toBe('co');

      act(() => {
        result.current.getInputProps().onChange(changeEvent('deu'));
      });
      expect(result.current.country?.iso2).toBe('de');
    });

    it('invalid ISO code falls through to digits path without switching', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      // "xx" is not a real country code — should fall through and
      // be treated as text without digits, leaving the country alone.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('xx'));
      });
      expect(result.current.country?.iso2).toBe('co');
    });

    it('non-letter input does not trigger the ISO shortcut', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      // "co3" should be treated as digits "3" with country=CO,
      // not as ISO code "co" + leftover.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('co3'));
      });
      expect(result.current.country?.iso2).toBe('co');
      expect(result.current.value).toBe('+573');
    });

    it('ISO shortcut respects disableCountryGuess', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co', disableCountryGuess: true }),
      );

      act(() => {
        result.current.getInputProps().onChange(changeEvent('us'));
      });
      // Country should NOT change because guessing is disabled.
      expect(result.current.country?.iso2).toBe('co');
    });

    it('typing "+" with new digits switches the country via auto-detect', () => {
      // The other half of the Model B contract: while the user can
      // never delete the dial code via backspace (because it's not
      // in the input), they CAN switch country by typing "+" + the
      // new dial code as international format. The trie picks the
      // best match and the hook flips countries automatically.
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      // Type a Colombian number to set up state.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('3105551234'));
      });
      expect(result.current.country?.iso2).toBe('co');

      // User pastes a UK international number — country flips to GB.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('+442071838750'));
      });
      expect(result.current.country?.iso2).toBe('gb');
      expect(result.current.value).toBe('+442071838750');
    });

    it('inputValue never starts with the dial code prefix', () => {
      // Structural guarantee of Model B — the input is always free
      // of any "+<dialCode>" prefix, regardless of how the value got
      // there. The dial code lives in the country-select trigger.
      // (We can't use a simple .not.toContain(dialCode) because the
      // dial code digits may legitimately appear inside the masked
      // national number — e.g. US country.dialCode="1" naturally
      // shows up in "(1)23-4567" type masks.)
      const cases: Array<{
        defaultCountry: 'co' | 'us' | 'gb';
        defaultValue: string;
        expectedInputValue: string;
      }> = [
        {
          defaultCountry: 'co',
          defaultValue: '+573105551234',
          expectedInputValue: '310 555 1234',
        },
        {
          defaultCountry: 'us',
          defaultValue: '+12025551234',
          expectedInputValue: '202 555 1234',
        },
        {
          defaultCountry: 'gb',
          defaultValue: '+442071838750',
          expectedInputValue: '2071 838750',
        },
      ];

      for (const { defaultCountry, defaultValue, expectedInputValue } of cases) {
        const { result } = renderHook(() =>
          usePhoneInput({ defaultCountry, defaultValue }),
        );
        expect(result.current.inputValue.startsWith('+')).toBe(false);
        expect(
          result.current.inputValue.startsWith(
            result.current.country!.dialCode,
          ) && result.current.inputValue.charAt(1) === ' ',
        ).toBe(false);
        expect(result.current.inputValue).toBe(expectedInputValue);
      }
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
