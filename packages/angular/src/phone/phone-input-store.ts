import { computed, signal } from '@angular/core';
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
  type DialCodeTrieNode,
} from '@intl-ui/core';

import type { PhoneInputOptions, ValueChangeMeta, ValueChangeSource } from './types';

/**
 * Signal-based store that powers every phone input variant in @intl-ui/angular.
 *
 * This is the Angular equivalent of usePhoneInput() from @intl-ui/react.
 * Instead of React hooks, it uses Angular signals for reactivity.
 *
 * Usage:
 *   const store = createPhoneInputStore({ initialCountry: 'us' });
 *   // Read state via signals: store.value(), store.country(), etc.
 *   // Mutate via methods: store.handleInput('3105551234'), store.setCountry('co')
 */
export function createPhoneInputStore(options: PhoneInputOptions = {}) {
  const {
    initialValue = '',
    initialCountry,
    disableCountryGuess = false,
    countries: countryListOverride,
    preferredCountries = [],
  } = options;

  // ─── Country list ─────────────────────────────────────────────────
  const countryList = countryListOverride ?? allCountries;

  const orderedList = (() => {
    if (preferredCountries.length === 0) return countryList;
    const preferredSet = new Set(preferredCountries.map((c) => c.toLowerCase()));
    const preferred: Country[] = [];
    for (const iso of preferredCountries) {
      const match = countryList.find((c) => c.iso2 === iso.toLowerCase());
      if (match) preferred.push(match);
    }
    const rest = countryList.filter((c) => !preferredSet.has(c.iso2));
    return [...preferred, ...rest];
  })();

  const trie: DialCodeTrieNode = buildDialCodeTrie(countryList);

  // ─── Resolve initial country ──────────────────────────────────────
  let resolvedInitialCountry: Country | null = null;
  if (initialCountry) {
    resolvedInitialCountry = getCountryByIso2(initialCountry) ?? null;
  } else if (initialValue) {
    resolvedInitialCountry = parsePhone(initialValue).country;
  }

  // ─── Core signals ─────────────────────────────────────────────────
  const value = signal<string>(initialValue);
  const country = signal<Country | null>(resolvedInitialCountry);

  // ─── UI state signals ─────────────────────────────────────────────
  const isOpen = signal(false);
  const focusedIndex = signal(-1);
  const filter = signal('');

  // ─── Computed values ──────────────────────────────────────────────
  const parsed = computed(() => {
    const v = value();
    if (!v) return null;
    return parsePhone(v, country() ?? undefined);
  });

  const isValid = computed(() => parsed()?.isValid ?? false);

  const inputValue = computed(() => {
    const v = value();
    const c = country();
    if (!v) return '';
    if (!c) return v;
    const digits = removeNonDigits(v);
    const nationalDigits = digits.startsWith(c.dialCode)
      ? digits.slice(c.dialCode.length)
      : digits;
    if (nationalDigits.length === 0) return '';
    return formatNational(nationalDigits, c);
  });

  const visibleCountries = computed(() => {
    const f = filter();
    if (!f) return orderedList;
    const needle = normalizeText(f);
    return orderedList.filter((c) => {
      return (
        normalizeText(c.name).includes(needle) ||
        c.iso2.includes(needle) ||
        c.iso3.includes(needle) ||
        c.dialCode.startsWith(needle.replace(/^\+/, ''))
      );
    });
  });

  // ─── Internal helpers ─────────────────────────────────────────────
  function buildMeta(
    nextValue: string,
    nextCountry: Country | null,
    source: ValueChangeSource,
  ): ValueChangeMeta {
    const nextParsed = nextValue
      ? parsePhone(nextValue, nextCountry ?? undefined)
      : null;
    return {
      country: nextParsed?.country ?? nextCountry,
      isValid: nextParsed?.isValid ?? false,
      parsed: nextParsed,
      source,
    };
  }

  // ─── Input handler (mirrors the 6-path logic from React) ─────────
  function handleInput(raw: string): ValueChangeMeta {
    const trimmed = raw.trim();
    const digits = removeNonDigits(raw);
    const isInternationalFormat = raw.trimStart().startsWith('+');

    // Path 1: ISO shortcut
    if (!disableCountryGuess && /^[A-Za-z]{2,3}$/.test(trimmed)) {
      const code = trimmed.toLowerCase();
      const matched =
        code.length === 2 ? getCountryByIso2(code) : getCountryByIso3(code);
      if (matched) {
        country.set(matched);
        value.set('');
        return buildMeta('', matched, 'user-type');
      }
    }

    // Path 2: Fully empty
    if (raw.length === 0) {
      country.set(null);
      value.set('');
      return buildMeta('', null, 'user-type');
    }

    // Path 3: Lone "+"
    if (trimmed === '+') {
      country.set(null);
      value.set('+');
      return buildMeta('+', null, 'user-type');
    }

    // Path 4: Garbage
    if (digits.length === 0) {
      return buildMeta(value(), country(), 'user-type');
    }

    // Path 5: International format
    if (isInternationalFormat) {
      const currentCountry = country();
      if (currentCountry && digits.length < currentCountry.dialCode.length) {
        country.set(null);
        value.set(`+${digits}`);
        return buildMeta(`+${digits}`, null, 'user-type');
      }
      if (!disableCountryGuess) {
        const guess = guessCountryByPhone(trie, digits, currentCountry ?? undefined);
        if (guess.country && guess.country.iso2 !== currentCountry?.iso2) {
          country.set(guess.country);
        }
      }
      value.set(`+${digits}`);
      return buildMeta(`+${digits}`, country(), 'user-type');
    }

    // Path 6: National format
    const currentCountry = country();
    if (currentCountry) {
      const canonical = `+${currentCountry.dialCode}${digits}`;
      value.set(canonical);
      return buildMeta(canonical, currentCountry, 'user-type');
    }

    if (!disableCountryGuess) {
      const guess = guessCountryByPhone(trie, digits);
      if (guess.country) {
        country.set(guess.country);
      }
    }
    value.set(`+${digits}`);
    return buildMeta(`+${digits}`, country(), 'user-type');
  }

  // ─── Actions ──────────────────────────────────────────────────────
  function setCountry(iso2: CountryIso2): ValueChangeMeta | null {
    const next = getCountryByIso2(iso2);
    if (!next) return null;

    const previous = country();
    country.set(next);
    closeDropdown();

    if (value()) {
      const digits = removeNonDigits(value());
      const nationalDigits =
        previous && digits.startsWith(previous.dialCode)
          ? digits.slice(previous.dialCode.length)
          : digits;
      const canonical = `+${next.dialCode}${nationalDigits}`;
      value.set(canonical);
      return buildMeta(canonical, next, 'country-change');
    }
    return buildMeta('', next, 'country-change');
  }

  function setValue(newValue: string): ValueChangeMeta {
    value.set(newValue);
    if (!disableCountryGuess && newValue) {
      const guessed = parsePhone(newValue, country() ?? undefined).country;
      if (guessed && guessed.iso2 !== country()?.iso2) {
        country.set(guessed);
      }
    }
    return buildMeta(newValue, country(), 'external');
  }

  function reset(): ValueChangeMeta {
    value.set(initialValue);
    country.set(resolvedInitialCountry);
    isOpen.set(false);
    focusedIndex.set(-1);
    filter.set('');
    return buildMeta(initialValue, resolvedInitialCountry, 'reset');
  }

  function openDropdown() {
    isOpen.set(true);
  }

  function closeDropdown() {
    isOpen.set(false);
    focusedIndex.set(-1);
    filter.set('');
  }

  function toggleDropdown() {
    if (isOpen()) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function setFilter(f: string) {
    filter.set(f);
    focusedIndex.set(f.length > 0 ? 0 : -1);
  }

  function moveFocus(direction: 'up' | 'down') {
    const listLength = visibleCountries().length;
    if (listLength === 0) {
      focusedIndex.set(-1);
      return;
    }
    const current = focusedIndex();
    let next: number;
    if (direction === 'down') {
      next = current < 0 ? 0 : (current + 1) % listLength;
    } else {
      next = current <= 0 ? listLength - 1 : current - 1;
    }
    focusedIndex.set(next);
    if (!isOpen()) isOpen.set(true);
  }

  function setFocusedIndex(index: number) {
    focusedIndex.set(index);
  }

  function handleFocus() {
    if (!value() && !country()) {
      value.set('+');
    }
  }

  function handleBlur() {
    if (value() === '+') {
      value.set('');
    }
  }

  return {
    // State (signals — read with .() in templates)
    value: value.asReadonly(),
    inputValue,
    country: country.asReadonly(),
    parsed,
    isValid,
    isOpen: isOpen.asReadonly(),
    focusedIndex: focusedIndex.asReadonly(),
    filter: filter.asReadonly(),
    visibleCountries,
    countryList: orderedList,

    // Actions
    handleInput,
    setCountry,
    setValue,
    reset,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    setFilter,
    moveFocus,
    setFocusedIndex,
    handleFocus,
    handleBlur,
  };
}

/** Type of the store returned by createPhoneInputStore. */
export type PhoneInputStore = ReturnType<typeof createPhoneInputStore>;
