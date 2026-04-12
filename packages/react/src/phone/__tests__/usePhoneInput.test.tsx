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

/**
 * Minimal FocusEvent mock for focus/blur handlers.
 */
function focusEvent() {
  return {} as unknown as React.FocusEvent<HTMLInputElement>;
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
      // When a country is set, the input is EMPTY — the dial code
      // lives in the trigger button, not in the input. No duplication.
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
      // The input shows ONLY the national digits — the dial code
      // lives in the trigger button to avoid duplication.
      expect(result.current.inputValue).toBe('310 555 1234');
      expect(result.current.isValid).toBe(true);
    });

    it('international format input (leading "+") is parsed via the trie', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );

      act(() => {
        result.current.getInputProps().onChange(changeEvent('+57 3105551234'));
      });

      expect(result.current.value).toBe('+573105551234');
      // Even though the user typed "+57...", the inputValue strips
      // the prefix once the country is detected.
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

    it('clears both value and country when the user empties the input', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultValue: '+573105551234' }),
      );

      act(() => {
        result.current.getInputProps().onChange(changeEvent(''));
      });

      expect(result.current.value).toBe('');
      expect(result.current.isValid).toBe(false);
      // Clearing the input also clears the country — this is what
      // lets the user immediately type a different international
      // prefix (e.g. "+380" for Ukraine) without being locked into
      // the previous selection.
      expect(result.current.country).toBe(null);
    });

    it('backspacing past the current dial code clears the country', () => {
      const { result } = renderHook(() =>
        usePhoneInput({
          defaultCountry: 'co',
          defaultValue: '+573105551234',
        }),
      );
      expect(result.current.country?.iso2).toBe('co');

      // User backspaces down to just "+5" — shorter than CO's dial
      // code "57". The hook treats this as "I'm switching countries"
      // and clears the selection so the trie can re-detect on the
      // next keystroke.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('+5'));
      });
      expect(result.current.country).toBe(null);
      expect(result.current.value).toBe('+5');
    });

    it('user can clear the input and type a different country prefix', () => {
      // The exact flow the user described: "+57 3002995465" → Colombia,
      // clear everything, "+380 099 1234" → Ukraine. No dropdown
      // interaction required — pure keyboard typing in the main input.
      const { result } = renderHook(() => usePhoneInput());

      // Step 1: type the Colombian international number
      act(() => {
        result.current
          .getInputProps()
          .onChange(changeEvent('+573002995465'));
      });
      expect(result.current.country?.iso2).toBe('co');
      expect(result.current.country?.capital).toBe('Bogotá');

      // Step 2: Cmd+A + Backspace — empty the input
      act(() => {
        result.current.getInputProps().onChange(changeEvent(''));
      });
      expect(result.current.country).toBe(null);
      expect(result.current.value).toBe('');

      // Step 3: type a Ukrainian international number from scratch
      act(() => {
        result.current
          .getInputProps()
          .onChange(changeEvent('+380991234567'));
      });
      expect(result.current.country?.iso2).toBe('ua');
      expect(result.current.country?.name).toBe('Ukraine');
      expect(result.current.value).toBe('+380991234567');
    });

    it('focusing an empty input with no country auto-inserts "+"', () => {
      // The usability contract: when the user clicks or tabs into an
      // empty input that has no country, the hook inserts a lone "+"
      // as the value so the user can immediately start typing dial
      // code digits without ever having to type "+" themselves.
      const { result } = renderHook(() => usePhoneInput());
      expect(result.current.value).toBe('');
      expect(result.current.inputValue).toBe('');

      act(() => {
        result.current.getInputProps().onFocus(focusEvent());
      });

      expect(result.current.value).toBe('+');
      expect(result.current.inputValue).toBe('+');
      expect(result.current.country).toBe(null);
    });

    it('blurring with only "+" clears the value back to empty', () => {
      // If the user focuses, sees the "+" appear, and then clicks
      // away without typing anything, restore the empty state so
      // the input placeholder is visible again instead of a
      // dangling "+".
      const { result } = renderHook(() => usePhoneInput());

      act(() => {
        result.current.getInputProps().onFocus(focusEvent());
      });
      expect(result.current.value).toBe('+');

      act(() => {
        result.current.getInputProps().onBlur(focusEvent());
      });
      expect(result.current.value).toBe('');
      expect(result.current.inputValue).toBe('');
    });

    it('blurring with a real value (not just "+") keeps the value', () => {
      const { result } = renderHook(() => usePhoneInput());

      // Focus → "+"
      act(() => {
        result.current.getInputProps().onFocus(focusEvent());
      });
      // User types digits → real value
      act(() => {
        result.current.getInputProps().onChange(changeEvent('+380'));
      });
      expect(result.current.value).toBe('+380');
      expect(result.current.country?.iso2).toBe('ua');

      // Blur should NOT clear a real value
      act(() => {
        result.current.getInputProps().onBlur(focusEvent());
      });
      expect(result.current.value).toBe('+380');
      expect(result.current.country?.iso2).toBe('ua');
    });

    it('focus is a no-op when a country is already selected', () => {
      const { result } = renderHook(() =>
        usePhoneInput({ defaultCountry: 'co' }),
      );
      expect(result.current.value).toBe('');
      expect(result.current.country?.iso2).toBe('co');
      // With a country set, the input is empty — dial code is in trigger.
      expect(result.current.inputValue).toBe('');

      // Focus should NOT add "+" because a country is already selected.
      act(() => {
        result.current.getInputProps().onFocus(focusEvent());
      });
      expect(result.current.value).toBe('');
      expect(result.current.country?.iso2).toBe('co');
      expect(result.current.inputValue).toBe('');
    });

    it('typing a digit in an empty input auto-prefixes "+" for the user', () => {
      // Usability contract: when the input is empty and no country
      // is selected yet, the user should NEVER have to type "+"
      // themselves. The hook adds it automatically on the first
      // digit, so the user can just tap the keyboard and start.
      const { result } = renderHook(() => usePhoneInput());
      expect(result.current.value).toBe('');
      expect(result.current.inputValue).toBe('');

      // User types "3" — hook auto-prefixes "+"
      act(() => {
        result.current.getInputProps().onChange(changeEvent('3'));
      });
      expect(result.current.value).toBe('+3');
      // No country yet → inputValue shows the raw value
      expect(result.current.inputValue).toBe('+3');
      expect(result.current.country).toBe(null);

      // User continues typing — "+3" + "8" = "+38"
      act(() => {
        result.current.getInputProps().onChange(changeEvent('+38'));
      });
      expect(result.current.value).toBe('+38');
      // Still no country → raw value visible
      expect(result.current.inputValue).toBe('+38');

      // Once the digits form a full dial code, the country appears
      // and the dial code "moves" from the input to the trigger.
      act(() => {
        result.current.getInputProps().onChange(changeEvent('+380'));
      });
      expect(result.current.country?.iso2).toBe('ua');
      expect(result.current.country?.name).toBe('Ukraine');
      // Country detected → inputValue is now empty (dial code is in trigger)
      expect(result.current.inputValue).toBe('');

      // Further digits show ONLY the national portion
      act(() => {
        result.current.getInputProps().onChange(changeEvent('+380991234567'));
      });
      expect(result.current.country?.iso2).toBe('ua');
      expect(result.current.value).toBe('+380991234567');
      expect(result.current.inputValue.startsWith('+')).toBe(false);
      expect(result.current.inputValue.length).toBeGreaterThan(0);
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
      // Country set + empty value → input is empty (dial code in trigger).
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

    it('inputValue shows national-only digits when country is set (no dial code duplication)', () => {
      // Structural guarantee: when a country is detected or selected,
      // the input shows ONLY the national portion formatted with the
      // country mask. The dial code lives in the trigger button, so
      // the user never sees "+57" duplicated in two places.
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
        // Must NOT start with "+" — the prefix is in the trigger, not the input
        expect(result.current.inputValue.startsWith('+')).toBe(false);
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
