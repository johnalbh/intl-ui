// Types
export type {
  Country,
  CountryIso2,
  PhoneFormat,
  FormatMap,
  Region,
  City,
  ParsedPhone,
  ValidationResult,
  ValidationError,
  CountryGuessResult,
  FormatOptions,
  DialCodeTrieNode,
} from './types';

// Country data
export {
  countries,
  countriesMinimal,
  getCountryByIso2,
  getCountryByIso3,
  getCountriesByDialCode,
} from './countries';

// Dial code trie
export {
  buildDialCodeTrie,
  findCountryByDigits,
  findAllCountriesByDigits,
  guessCountryByPhone,
} from './dial-codes';

// Phone utilities
export { formatPhone, formatNational, getActiveMask } from './phone/format';
export { parsePhone } from './phone/parse';
export { validatePhone } from './phone/validate';

// Common utilities
export {
  removeNonDigits,
  isNumeric,
  isDigit,
  normalizeText,
  toE164,
  applyMask,
  iso2ToFlag,
} from './utils';
