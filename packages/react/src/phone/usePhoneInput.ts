import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  buildDialCodeTrie,
  countries as allCountries,
  formatPhone,
  getCountryByIso2,
  getCountryByIso3,
  guessCountryByPhone,
  normalizeText,
  parsePhone,
  removeNonDigits,
  type Country,
  type CountryIso2,
  type ParsedPhone,
} from '@intl-ui/core';

import { initialUiState, uiReducer } from './reducer';
import { useControllableState } from './use-controllable-state';
import type {
  CountryListProps,
  CountryOptionProps,
  CountrySelectTriggerProps,
  PhoneInputProps,
  UsePhoneInputOptions,
  UsePhoneInputReturn,
  ValueChangeMeta,
  ValueChangeSource,
} from './types';

/**
 * Headless hook that powers every phone input variant in @intl-ui/react.
 *
 * Returns a tuple of state, prop-getters, and actions. Consumers spread
 * the prop-getters onto their own DOM elements — the hook never renders
 * anything itself. See usePhoneInput.test.tsx and the compound
 * components in ../PhoneInput.tsx for usage patterns.
 *
 * Design notes:
 *  - Value and country follow React's controlled/uncontrolled pattern.
 *    Pass `value` + `onValueChange` for controlled, `defaultValue` for
 *    uncontrolled, or neither for the empty-state default.
 *  - Country auto-detection runs on every typed change unless
 *    `disableCountryGuess` is true. Detection uses the dial-code trie
 *    from @intl-ui/core, which is O(k) where k is the number of digits
 *    typed — independent of the country list size.
 *  - The dropdown UI state (isOpen, focusedIndex, filter) lives in a
 *    reducer so every transition is testable and snapshot-able.
 *  - Cursor-position preservation is intentionally not attempted in
 *    sprint 2.1: the input cursor jumps to the end after each reformat.
 *    A future sprint may add cursor tracking if feedback demands it.
 */
export function usePhoneInput(
  options: UsePhoneInputOptions = {},
): UsePhoneInputReturn {
  const {
    value: controlledValue,
    defaultValue,
    onValueChange,
    country: controlledCountry,
    defaultCountry,
    onCountryChange,
    disableCountryGuess = false,
    countries: countryListOverride,
    preferredCountries = [],
  } = options;

  // ─── Country list (stable reference for trie + visible list) ─────
  const countryList = useMemo(
    () => countryListOverride ?? allCountries,
    [countryListOverride],
  );

  // Preferred countries pinned to the top of the visible list, in the
  // order the consumer provided them.
  const orderedList = useMemo(() => {
    if (preferredCountries.length === 0) return countryList;
    const preferredSet = new Set(preferredCountries.map((c) => c.toLowerCase()));
    const preferred: Country[] = [];
    for (const iso of preferredCountries) {
      const match = countryList.find((c) => c.iso2 === iso.toLowerCase());
      if (match) preferred.push(match);
    }
    const rest = countryList.filter((c) => !preferredSet.has(c.iso2));
    return [...preferred, ...rest];
  }, [countryList, preferredCountries]);

  // The trie is rebuilt only when the country list identity changes,
  // which is rare in practice.
  const trie = useMemo(() => buildDialCodeTrie(countryList), [countryList]);

  // ─── Controllable value and country ──────────────────────────────
  // We intentionally do NOT pass onChange to useControllableState.
  // onValueChange/onCountryChange are fired explicitly through
  // emitChange and setCountry so we can pass the source metadata
  // ("user-type", "country-change", "reset", "external") and avoid
  // emitting twice for the same change.
  const [value, setValueRaw] = useControllableState<string>({
    value: controlledValue,
    defaultValue,
    fallback: '',
  });

  // Initial country considers (in order):
  //   1. An explicit defaultCountry or controlled country prop
  //   2. The country derived from the initial phone value (controlled or default)
  //   3. null (no country yet)
  // Intentionally computed ONCE with an empty dep array — the initial
  // country must be frozen at first render so later prop changes can
  // flow through the separate "sync on controlled value change" block
  // below without fighting with this memo.
  const initialCountryRef = useRef<Country | null>(null);
  if (initialCountryRef.current === null) {
    if (defaultCountry) {
      initialCountryRef.current = getCountryByIso2(defaultCountry) ?? null;
    } else {
      const seed = controlledValue ?? defaultValue;
      if (seed) {
        initialCountryRef.current = parsePhone(seed).country;
      }
    }
  }
  const initialCountry = initialCountryRef.current;

  const [country, setCountryRaw] = useControllableState<Country | null>({
    value: controlledCountry
      ? (getCountryByIso2(controlledCountry) ?? null)
      : undefined,
    defaultValue: initialCountry,
    fallback: null,
  });

  // Stable ref to the current country, used inside callbacks that
  // must not re-subscribe when the country changes.
  const currentCountryRef = useRef<Country | null>(country);
  currentCountryRef.current = country;

  // ─── UI state reducer ────────────────────────────────────────────
  const [uiState, dispatch] = useReducer(uiReducer, initialUiState);

  // ─── Derived values ──────────────────────────────────────────────
  const parsed: ParsedPhone | null = useMemo(() => {
    if (!value) return null;
    return parsePhone(value, country ?? undefined);
  }, [value, country]);

  const isValid = parsed?.isValid ?? false;

  // The input shows the full international format — "+<dialCode> <mask>"
  // — so the user sees exactly what they are typing. This is the
  // classic "combined input" model from react-phone-number-input and
  // intl-tel-input. Backspacing is made non-broken by handleInputChange:
  // when the user deletes past the dial code or clears the input
  // completely, the country is cleared too and they can immediately
  // type a new international prefix (e.g. "+380" for Ukraine) and the
  // trie re-detects the country.
  //
  // The one subtle case: when value === "" + country, we show
  // "+<dialCode> " as an editable placeholder (the space makes it
  // obvious where the national digits will go). When the user hits
  // backspace and the value becomes just the dial code digits, we
  // show "+<dialCode>" without the trailing space — otherwise the
  // formatter would re-stamp the space and trap the user in a loop.
  const inputValue = useMemo(() => {
    if (!value && !country) return '';
    if (!value && country) return `+${country.dialCode} `;
    if (!country) return value;
    const digits = removeNonDigits(value);
    if (digits === country.dialCode) return `+${country.dialCode}`;
    return formatPhone(value, country);
  }, [value, country]);

  const visibleCountries = useMemo(() => {
    if (!uiState.filter) return orderedList;
    const needle = normalizeText(uiState.filter);
    return orderedList.filter((c) => {
      return (
        normalizeText(c.name).includes(needle) ||
        c.iso2.includes(needle) ||
        c.iso3.includes(needle) ||
        c.dialCode.startsWith(needle.replace(/^\+/, ''))
      );
    });
  }, [orderedList, uiState.filter]);

  // ─── Internal helpers ────────────────────────────────────────────
  const buildMeta = useCallback(
    (
      nextValue: string,
      nextCountry: Country | null,
      source: ValueChangeSource,
    ): ValueChangeMeta => {
      const nextParsed = nextValue
        ? parsePhone(nextValue, nextCountry ?? undefined)
        : null;
      return {
        country: nextParsed?.country ?? nextCountry,
        isValid: nextParsed?.isValid ?? false,
        parsed: nextParsed,
        source,
      };
    },
    [],
  );

  const emitChange = useCallback(
    (nextValue: string, source: ValueChangeSource) => {
      setValueRaw(nextValue);
      onValueChange?.(
        nextValue,
        buildMeta(nextValue, currentCountryRef.current, source),
      );
    },
    [setValueRaw, onValueChange, buildMeta],
  );

  // ─── Core input change handler ───────────────────────────────────
  // Six distinct paths, checked in order:
  //
  //   1. ISO shortcut    — raw is exactly 2-3 ASCII letters that
  //                        match a real country code ("co", "USA",
  //                        "gb"). Switches and clears.
  //   2. Fully empty     — raw is "". User cleared everything →
  //                        clear both value AND country so they can
  //                        start fresh with a new international
  //                        prefix like "+380".
  //   3. Lone "+"        — raw is "+". User is starting international
  //                        entry. Clear country, store "+" as value.
  //   4. Garbage         — raw has characters but no digits and is
  //                        not a shortcut or "+". Reject silently so
  //                        React's next render resets the input.
  //   5. International   — raw starts with "+". If the user has
  //                        backspaced below the current country's
  //                        dial code length, clear the country; then
  //                        let the trie re-detect. Emits "+digits".
  //   6. National        — default for raw without a leading "+".
  //                        The digits ARE the national number; the
  //                        dial code comes from the selected country.
  //
  // This design supports the full clear-and-retype scenario: user
  // starts with "+57 310 555 1234", presses Cmd+A + Backspace, sees
  // empty input with no country, types "+380 099 999" and sees the
  // country flip to Ukraine automatically.
  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const trimmed = raw.trim();
      const digits = removeNonDigits(raw);
      const isInternationalFormat = raw.trimStart().startsWith('+');

      // ─── Path 1: ISO shortcut ────────────────────────────────────
      if (!disableCountryGuess && /^[A-Za-z]{2,3}$/.test(trimmed)) {
        const code = trimmed.toLowerCase();
        const matched =
          code.length === 2 ? getCountryByIso2(code) : getCountryByIso3(code);
        if (matched) {
          setCountryRaw(matched);
          emitChange('', 'user-type');
          return;
        }
      }

      // ─── Path 2: Fully empty → clear everything ──────────────────
      if (raw.length === 0) {
        setCountryRaw(null);
        emitChange('', 'user-type');
        return;
      }

      // ─── Path 3: Lone "+" → starting international entry ─────────
      if (trimmed === '+') {
        setCountryRaw(null);
        emitChange('+', 'user-type');
        return;
      }

      // ─── Path 4: Garbage (non-empty raw, no digits) ──────────────
      // Reject silently. React re-renders with the previous
      // inputValue, effectively undoing the garbage keystroke.
      if (digits.length === 0) {
        return;
      }

      // ─── Path 5: International format ────────────────────────────
      if (isInternationalFormat) {
        // If the user has backspaced below the current country's
        // dial code length, they are trying to switch countries —
        // clear the current country so the trie can re-detect.
        if (country && digits.length < country.dialCode.length) {
          setCountryRaw(null);
          emitChange(`+${digits}`, 'user-type');
          return;
        }
        if (!disableCountryGuess) {
          const guess = guessCountryByPhone(
            trie,
            digits,
            country ?? undefined,
          );
          if (guess.country && guess.country.iso2 !== country?.iso2) {
            setCountryRaw(guess.country);
          }
        }
        emitChange(`+${digits}`, 'user-type');
        return;
      }

      // ─── Path 6: National format ─────────────────────────────────
      if (country) {
        const canonical = `+${country.dialCode}${digits}`;
        emitChange(canonical, 'user-type');
        return;
      }

      // No country yet and the user is typing without "+". Try to
      // detect what country these digits could belong to.
      if (!disableCountryGuess) {
        const guess = guessCountryByPhone(trie, digits);
        if (guess.country) {
          setCountryRaw(guess.country);
        }
      }
      emitChange(`+${digits}`, 'user-type');
    },
    [country, disableCountryGuess, trie, setCountryRaw, emitChange],
  );

  // ─── Keyboard handler for the <input> ────────────────────────────
  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!uiState.isOpen) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        dispatch({
          type: 'MOVE_FOCUS',
          direction: 'down',
          listLength: visibleCountries.length,
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        dispatch({
          type: 'MOVE_FOCUS',
          direction: 'up',
          listLength: visibleCountries.length,
        });
      } else if (event.key === 'Enter') {
        const focused = visibleCountries[uiState.focusedIndex];
        if (focused) {
          event.preventDefault();
          setCountryRaw(focused);
          dispatch({ type: 'CLOSE' });
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        dispatch({ type: 'CLOSE' });
      }
    },
    [
      uiState.isOpen,
      uiState.focusedIndex,
      visibleCountries,
      setCountryRaw,
    ],
  );

  // ─── Keyboard handler for the country-select button ──────────────
  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowDown' || event.key === ' ') {
        event.preventDefault();
        dispatch({ type: 'OPEN' });
        dispatch({
          type: 'MOVE_FOCUS',
          direction: 'down',
          listLength: visibleCountries.length,
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        dispatch({ type: 'OPEN' });
        dispatch({
          type: 'MOVE_FOCUS',
          direction: 'up',
          listLength: visibleCountries.length,
        });
      } else if (event.key === 'Enter') {
        event.preventDefault();
        dispatch({ type: 'TOGGLE' });
      } else if (event.key === 'Escape') {
        event.preventDefault();
        dispatch({ type: 'CLOSE' });
      }
    },
    [visibleCountries.length],
  );

  // ─── Input ref (callback ref for future focus management) ────────
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setInputRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
  }, []);

  // ─── Focus handler — auto-insert "+" when entering an empty input ─
  // When the user clicks or tabs into an empty input that has no
  // country selected yet, we insert a lone "+" into the value. This
  // is a pure usability win: the user never has to type the "+"
  // themselves because it's already there waiting for them to type
  // the dial code digits.
  //
  // Edge cases:
  //   • If a country is already selected (default or user-picked),
  //     the input shows "+<dialCode> " via the inputValue derivation
  //     and we do NOT overwrite it with a lone "+".
  //   • If the input already has any value (focus after a blur, or
  //     re-focus after mouse out), we leave the value alone.
  const handleInputFocus = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      if (!value && !country) {
        emitChange('+', 'user-type');
      }
    },
    [value, country, emitChange],
  );

  // ─── Blur handler — clear the lone "+" if the user never typed ────
  // If the user focused, saw "+", and then clicked away without
  // typing a single digit, we restore the empty state so the input
  // goes back to showing its placeholder instead of a dangling "+".
  // Anything beyond a lone "+" means the user committed some intent,
  // so we leave it alone.
  const handleInputBlur = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      if (value === '+') {
        emitChange('', 'user-type');
      }
    },
    [value, emitChange],
  );

  // ─── Actions ─────────────────────────────────────────────────────
  const setCountry = useCallback(
    (iso2: CountryIso2) => {
      const next = getCountryByIso2(iso2);
      if (!next) return;
      const previous = currentCountryRef.current;
      setCountryRaw(next);
      dispatch({ type: 'CLOSE' });

      // Re-format the current value against the new country's mask so
      // the displayed value is coherent after the change. We strip the
      // PREVIOUS country's dial code (not the new one's) because the
      // current value's digits still start with the old prefix.
      if (value) {
        const digits = removeNonDigits(value);
        const nationalDigits =
          previous && digits.startsWith(previous.dialCode)
            ? digits.slice(previous.dialCode.length)
            : digits;
        const canonical = `+${next.dialCode}${nationalDigits}`;
        setValueRaw(canonical);
        onValueChange?.(
          canonical,
          buildMeta(canonical, next, 'country-change'),
        );
      }
    },
    [value, setCountryRaw, setValueRaw, onValueChange, buildMeta],
  );

  const setOpen = useCallback((open: boolean) => {
    dispatch({ type: open ? 'OPEN' : 'CLOSE' });
  }, []);

  const setFilter = useCallback((filter: string) => {
    dispatch({ type: 'SET_FILTER', filter });
  }, []);

  const reset = useCallback(() => {
    setValueRaw(defaultValue ?? '');
    if (initialCountry) {
      setCountryRaw(initialCountry);
    }
    dispatch({ type: 'RESET_UI' });
    onValueChange?.(
      defaultValue ?? '',
      buildMeta(defaultValue ?? '', initialCountry ?? null, 'reset'),
    );
  }, [
    defaultValue,
    initialCountry,
    setValueRaw,
    setCountryRaw,
    onValueChange,
    buildMeta,
  ]);

  // ─── Sync country when the controlled value changes externally ──
  // In controlled mode the parent may change `value` without also
  // passing a `country` — when that happens, re-detect the country
  // from the new value so the UI stays coherent. We compare against
  // a ref (not a dep array on an effect) so the update happens in
  // the same render pass as the prop change.
  const previousControlledValueRef = useRef<string | undefined>(controlledValue);
  if (
    controlledValue !== undefined &&
    controlledValue !== previousControlledValueRef.current &&
    controlledCountry === undefined &&
    !disableCountryGuess
  ) {
    previousControlledValueRef.current = controlledValue;
    const guessed = controlledValue
      ? parsePhone(controlledValue, country ?? undefined).country
      : null;
    if (guessed && guessed.iso2 !== country?.iso2) {
      setCountryRaw(guessed);
    }
  }

  // ─── Emit country change events ──────────────────────────────────
  // setCountryRaw itself does not call onCountryChange (by design —
  // see the note above useControllableState). We track the previous
  // country in a ref and fire onCountryChange during render rather
  // than from a useEffect so the event fires in the same tick as
  // the state update.
  const previousCountryRef = useRef<Country | null>(country);
  if (previousCountryRef.current !== country && country) {
    previousCountryRef.current = country;
    onCountryChange?.(country);
  }

  // ─── Prop-getter factories ───────────────────────────────────────
  const getInputProps = useCallback(
    (): PhoneInputProps => ({
      ref: setInputRef,
      type: 'tel',
      value: inputValue,
      onChange: handleInputChange,
      onFocus: handleInputFocus,
      onBlur: handleInputBlur,
      onKeyDown: handleInputKeyDown,
      autoComplete: 'tel',
      'aria-autocomplete': 'none',
    }),
    [
      inputValue,
      handleInputChange,
      handleInputFocus,
      handleInputBlur,
      handleInputKeyDown,
      setInputRef,
    ],
  );

  const getCountrySelectProps = useCallback(
    (): CountrySelectTriggerProps => ({
      type: 'button',
      onClick: (_event: MouseEvent<HTMLButtonElement>) => {
        dispatch({ type: 'TOGGLE' });
      },
      onKeyDown: handleTriggerKeyDown,
      'aria-haspopup': 'listbox',
      'aria-expanded': uiState.isOpen,
    }),
    [uiState.isOpen, handleTriggerKeyDown],
  );

  const getCountryListProps = useCallback(
    (): CountryListProps => ({
      role: 'listbox',
      'aria-label': 'Select country',
    }),
    [],
  );

  const getCountryOptionProps = useCallback(
    (c: Country, index: number): CountryOptionProps => ({
      role: 'option',
      'aria-selected': c.iso2 === country?.iso2,
      'data-iso2': c.iso2,
      'data-index': index,
      onClick: (_event: MouseEvent<HTMLElement>) => {
        const previous = currentCountryRef.current;
        setCountryRaw(c);
        dispatch({ type: 'CLOSE' });
        if (value) {
          const digits = removeNonDigits(value);
          // Strip the PREVIOUS country's dial code before prefixing
          // the new one, same reasoning as in setCountry above.
          const nationalDigits =
            previous && digits.startsWith(previous.dialCode)
              ? digits.slice(previous.dialCode.length)
              : digits;
          const canonical = `+${c.dialCode}${nationalDigits}`;
          setValueRaw(canonical);
          onValueChange?.(
            canonical,
            buildMeta(canonical, c, 'country-change'),
          );
        }
      },
      onMouseEnter: () => {
        dispatch({ type: 'SET_FOCUSED_INDEX', index });
      },
    }),
    [
      country?.iso2,
      value,
      setCountryRaw,
      setValueRaw,
      onValueChange,
      buildMeta,
    ],
  );

  return {
    value,
    inputValue,
    country,
    parsed,
    isValid,
    isOpen: uiState.isOpen,
    focusedIndex: uiState.focusedIndex,
    filter: uiState.filter,
    visibleCountries,
    getInputProps,
    getCountrySelectProps,
    getCountryListProps,
    getCountryOptionProps,
    setCountry,
    setOpen,
    setFilter,
    reset,
  };
}
