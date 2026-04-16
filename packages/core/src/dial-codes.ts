import type { Country, CountryGuessResult, DialCodeTrieNode } from './types';

/**
 * Create an empty trie node.
 */
function createNode(): DialCodeTrieNode {
  return { countries: [], children: new Map() };
}

/**
 * Build a trie from country dial codes for O(1) lookup.
 *
 * The trie indexes countries by their dial code digits.
 * For countries with area codes (e.g., US +1-201, +1-202),
 * entries are also added at the dial code + area code path.
 *
 * @example
 * const trie = buildDialCodeTrie(countries);
 * // trie["5"]["7"] → [Colombia] (dial code "57")
 * // trie["1"] → [US, Canada, ...] (shared dial code "1")
 * // trie["1"]["2"]["0"]["1"] → [US] (area code match)
 */
export function buildDialCodeTrie(countryList: Country[]): DialCodeTrieNode {
  const root = createNode();

  for (const country of countryList) {
    // Insert at dial code path
    let node = root;
    for (const digit of country.dialCode) {
      if (!node.children.has(digit)) {
        node.children.set(digit, createNode());
      }
      node = node.children.get(digit)!;
    }
    node.countries.push(country);

    // Also insert at dial code + area code paths for disambiguation
    if (country.areaCodes) {
      for (const areaCode of country.areaCodes) {
        let areaNode = root;
        const fullCode = country.dialCode + areaCode;
        for (const digit of fullCode) {
          if (!areaNode.children.has(digit)) {
            areaNode.children.set(digit, createNode());
          }
          areaNode = areaNode.children.get(digit)!;
        }
        areaNode.countries.push(country);
      }
    }
  }

  return root;
}

/**
 * Walk the trie as deep as possible, returning the deepest node's countries.
 */
function traverseTrie(
  trie: DialCodeTrieNode,
  digits: string,
): { matches: Country[]; depth: number } {
  let node = trie;
  let matches: Country[] = [];
  let depth = 0;

  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i];
    if (!digit || !node.children.has(digit)) break;

    node = node.children.get(digit)!;

    if (node.countries.length > 0) {
      matches = node.countries;
      depth = i + 1;
    }
  }

  return { matches, depth };
}

/**
 * Find the best matching country for a phone number's dial code.
 * Traverses the trie as deep as possible, returning the highest-priority match.
 *
 * @param trie - Pre-built dial code trie
 * @param digits - Phone digits (without +)
 * @returns Best matching country and whether it was a full dial code match
 *
 * @example
 * findCountryByDigits(trie, '12015551234') // → { country: US, fullDialCodeMatch: true }
 * findCountryByDigits(trie, '1')           // → { country: US, fullDialCodeMatch: true }
 */
export function findCountryByDigits(trie: DialCodeTrieNode, digits: string): CountryGuessResult {
  const { matches, depth } = traverseTrie(trie, digits);

  if (matches.length === 0) {
    return { country: undefined, fullDialCodeMatch: false };
  }

  const sorted = [...matches].sort((a, b) => a.priority - b.priority);

  return {
    country: sorted[0],
    fullDialCodeMatch: depth >= (sorted[0]?.dialCode.length ?? 0),
  };
}

/**
 * Find ALL countries matching a phone number's dial code.
 * Returns every candidate sorted by priority (lower = higher).
 * Useful for UI layers that want to show a country selector when ambiguous.
 *
 * @param trie - Pre-built dial code trie
 * @param digits - Phone digits (without +)
 * @returns All matching countries sorted by priority
 *
 * @example
 * findAllCountriesByDigits(trie, '1')    // → [US, CA, AG, BS, ...] (14 NANP countries)
 * findAllCountriesByDigits(trie, '1268') // → [AG] (only Antigua)
 * findAllCountriesByDigits(trie, '57')   // → [CO] (unambiguous)
 */
export function findAllCountriesByDigits(trie: DialCodeTrieNode, digits: string): Country[] {
  const { matches } = traverseTrie(trie, digits);
  return [...matches].sort((a, b) => a.priority - b.priority);
}

/**
 * Guess country from a partial phone number string.
 * Strips non-digits and leading +, then searches the trie.
 *
 * @param trie - Pre-built dial code trie
 * @param phone - Phone string (can include +, spaces, dashes)
 * @param currentCountry - Current country for disambiguation (optional)
 * @returns Best matching country
 */
export function guessCountryByPhone(
  trie: DialCodeTrieNode,
  phone: string,
  currentCountry?: Country,
): CountryGuessResult {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return { country: currentCountry, fullDialCodeMatch: false };
  }

  const result = findCountryByDigits(trie, digits);

  // If we found a match, use it
  if (result.country) {
    // If current country shares the same dial code, prefer current country
    // unless there's a deeper match (area code) pointing elsewhere.
    // This prevents switching from Canada to US when user types "+1"
    if (
      currentCountry &&
      result.country.dialCode === currentCountry.dialCode &&
      currentCountry.dialCode === digits.slice(0, currentCountry.dialCode.length)
    ) {
      // Only switch away if we matched an area code that doesn't belong to currentCountry
      const matchedByAreaCode =
        result.fullDialCodeMatch && digits.length > currentCountry.dialCode.length;
      const areaCodeDigits = digits.slice(currentCountry.dialCode.length);
      const currentHasThisAreaCode =
        currentCountry.areaCodes?.some((ac) => areaCodeDigits.startsWith(ac)) ?? false;

      if (!matchedByAreaCode || currentHasThisAreaCode) {
        return { country: currentCountry, fullDialCodeMatch: result.fullDialCodeMatch };
      }
    }
    return result;
  }

  // No match found, keep current country
  return { country: currentCountry, fullDialCodeMatch: false };
}
