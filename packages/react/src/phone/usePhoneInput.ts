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
  formatNational,
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

  // The input shows ONLY the national portion of the number — never the
  // dial code. This is the "separate dial code" model used by every
  // modern messaging app: the country (and its prefix) lives in the
  // <PhoneInput.CountrySelect> trigger, the input only contains the
  // digits the user actually types. The benefit is that backspace
  // works the way users expect — they can clear the entire input and
  // re-type without fighting the formatter, and switching countries
  // happens through the dropdown (or by typing "+" + new digits to
  // trigger international auto-detection).
  const inputValue = useMemo(() => {
    if (!value) return '';
    if (!country) return value;
    const digits = removeNonDigits(value);
    const nationalDigits = digits.startsWith(country.dialCode)
      ? digits.slice(country.dialCode.length)
      : digits;
    if (nationalDigits.length === 0) return '';
    return formatNational(nationalDigits, country);
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
  // Three distinct paths based on what the user typed:
  //
  //   1. ISO-code shortcut — the input is exactly 2 or 3 letters
  //      that match a country code (alpha-2 or alpha-3). Switches
  //      the country and clears the input. Examples: "co", "USA",
  //      "gb", "fra". Disabled when disableCountryGuess is true.
  //
  //   2. International format (raw starts with "+") — the user is
  //      typing or pasting a full E.164-style number. We let the trie
  //      auto-detect the country from the digits and update the
  //      canonical value accordingly.
  //
  //   3. National format (default) — the digits ARE the national
  //      number, the dial code comes from the selected country. This
  //      is the everyday path because in the Model B design the user
  //      never sees the "+57" prefix in the input.
  //
  // Empty input clears the value but keeps the country selection so
  // the user can immediately re-type without losing context.
  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const trimmed = raw.trim();
      const digits = removeNonDigits(raw);
      const isInternationalFormat = raw.trimStart().startsWith('+');

      // ─── Path 1: ISO-code shortcut ───────────────────────────────
      // Matches strictly: 2 or 3 ASCII letters, nothing else. So
      // "co" switches to Colombia, but "co3" or "c o" fall through
      // to the national-digits path. The user must explicitly type
      // a clean country code for the shortcut to fire.
      if (!disableCountryGuess && /^[A-Za-z]{2,3}$/.test(trimmed)) {
        const code = trimmed.toLowerCase();
        const matched =
          code.length === 2 ? getCountryByIso2(code) : getCountryByIso3(code);
        if (matched) {
          setCountryRaw(matched);
          // Clear the input after switching — the user is now ready
          // to type the national digits for the new country.
          emitChange('', 'user-type');
          return;
        }
      }

      // Empty input → clear value, preserve country.
      if (digits.length === 0) {
        emitChange('', 'user-type');
        return;
      }

      // ─── Path 2: International format ────────────────────────────
      if (isInternationalFormat) {
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

      // ─── Path 3: National format ─────────────────────────────────
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
      onFocus: (_event: FocusEvent<HTMLInputElement>) => {
        /* reserved for sprint 2.3 (focus management) */
      },
      onBlur: (_event: FocusEvent<HTMLInputElement>) => {
        /* reserved for sprint 2.3 (focus management) */
      },
      onKeyDown: handleInputKeyDown,
      autoComplete: 'tel',
      'aria-autocomplete': 'none',
    }),
    [inputValue, handleInputChange, handleInputKeyDown, setInputRef],
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
