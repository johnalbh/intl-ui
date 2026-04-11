/**
 * Local smoke-test / playground for @intl-ui/core.
 *
 * Run from the repo root:
 *
 *   pnpm -F @intl-ui/core build   # only when you changed src/
 *   node scratch/play.mjs
 *
 * This file imports directly from the built dist/ folder of the core package.
 * It is not part of the published package and is ignored by git.
 *
 * Feel free to break this file: add cases, try edge inputs, explore the API.
 * It is a sandbox — the only rule is that it must run without errors when
 * the core package is healthy.
 */

import {
  parsePhone,
  formatPhone,
  formatNational,
  validatePhone,
  getCountryByIso2,
  getCountryByIso3,
  getCountriesByDialCode,
  countries,
  countriesMinimal,
  buildDialCodeTrie,
  guessCountryByPhone,
  findCountryByDigits,
  iso2ToFlag,
  normalizeText,
  toE164,
} from '../packages/core/dist/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Pretty-printing helpers
// ─────────────────────────────────────────────────────────────────────────────
const section = (title) => {
  console.log('\n' + '─'.repeat(60));
  console.log(title);
  console.log('─'.repeat(60));
};
const kv = (label, value) =>
  console.log(`  ${label.padEnd(14)} ${value}`);

// ─────────────────────────────────────────────────────────────────────────────
// 1. parsePhone — the main entry point
// ─────────────────────────────────────────────────────────────────────────────
section('1. parsePhone — detect country + normalize number');

const parsed = parsePhone('+573105551234');
kv('raw',      parsed.raw);
kv('country',  `${parsed.country?.flag} ${parsed.country?.name}`);
kv('capital',  parsed.country?.capital);
kv('e164',     parsed.e164);
kv('national', parsed.national);
kv('intl',     parsed.international);
kv('isValid',  parsed.isValid);
kv('isPossible', parsed.isPossible);

// Try a number in a different format — parser should still handle it
const messy = parsePhone('+57 (310) 555-1234');
kv('\n  messy input', '"+57 (310) 555-1234"');
kv('→ e164', messy.e164);
kv('→ country', messy.country?.name);

// ─────────────────────────────────────────────────────────────────────────────
// 2. formatPhone / formatNational — apply country mask
// ─────────────────────────────────────────────────────────────────────────────
section('2. formatPhone — apply country-specific mask');

const co = getCountryByIso2('co');
const us = getCountryByIso2('us');
const br = getCountryByIso2('br');
const de = getCountryByIso2('de');

kv('CO (3105551234)', formatPhone('3105551234', co));
kv('US (2025551234)', formatPhone('2025551234', us));
kv('BR (11987654321)', formatPhone('11987654321', br));
kv('DE (15112345678)', formatPhone('15112345678', de));

kv('\n  national CO', formatNational('3105551234', co));
kv('national DE', formatNational('15112345678', de));

// ─────────────────────────────────────────────────────────────────────────────
// 3. validatePhone — structural validation
// ─────────────────────────────────────────────────────────────────────────────
section('3. validatePhone — length + mask validation');

const cases = [
  ['+573105551234',       co, 'valid CO mobile'],
  ['+5731055',            co, 'too short CO'],
  ['+5731055512349999',   co, 'too long CO'],
  ['+12025551234',        us, 'valid US'],
  ['+1202',               us, 'too short US'],
];

for (const [num, country, label] of cases) {
  const result = validatePhone(num, country);
  const status = result.isValid ? '✓ valid' : `✗ ${result.error ?? 'invalid'}`;
  console.log(`  ${status.padEnd(14)} ${num.padEnd(20)} (${label})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Shared dial codes — +1 is the hardest case
// ─────────────────────────────────────────────────────────────────────────────
section('4. getCountriesByDialCode("1") — NANP sharing');

const plusOne = getCountriesByDialCode('1');
console.log(`  ${plusOne.length} countries/territories share +1:`);
plusOne.slice(0, 8).forEach((c) =>
  console.log(`    ${c.flag} ${c.name.padEnd(30)} capital: ${c.capital}`),
);
console.log(`    ... and ${plusOne.length - 8} more`);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Trie detection — area codes disambiguate shared dial codes
// ─────────────────────────────────────────────────────────────────────────────
section('5. guessCountryByPhone — trie lookup by digits');

const trie = buildDialCodeTrie(countries);
const tries = [
  '+1201',   // US — New Jersey
  '+1416',   // Canada — Toronto
  '+1787',   // Puerto Rico
  '+573',    // Colombia
  '+39',     // Italy (Vatican City shares this with priority)
  '+44',     // UK
  '+81',     // Japan
  '+7',      // Russia / Kazakhstan shared
  '+7727',   // Kazakhstan area code
];

for (const num of tries) {
  const guess = guessCountryByPhone(trie, num);
  const c = guess.country;
  const match = guess.fullDialCodeMatch ? '✓' : '~';
  console.log(
    `  ${match} ${num.padEnd(8)} → ${c?.flag ?? '  '} ${(c?.name ?? 'unknown').padEnd(20)} (${c?.capital ?? '-'})`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Country lookups
// ─────────────────────────────────────────────────────────────────────────────
section('6. Country lookups');

kv('iso2: "co"',   `${getCountryByIso2('co')?.flag} ${getCountryByIso2('co')?.name}`);
kv('iso2: "US"',   `${getCountryByIso2('US')?.flag} ${getCountryByIso2('US')?.name}`);
kv('iso3: "col"',  `${getCountryByIso3('col')?.flag} ${getCountryByIso3('col')?.name}`);
kv('iso3: "deu"',  `${getCountryByIso3('deu')?.flag} ${getCountryByIso3('deu')?.name}`);
kv('invalid iso2', `${getCountryByIso2('xx') ?? '(undefined ✓)'}`);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Utilities
// ─────────────────────────────────────────────────────────────────────────────
section('7. Utility helpers');

kv('iso2ToFlag("co")',    iso2ToFlag('co'));
kv('iso2ToFlag("jp")',    iso2ToFlag('jp'));
kv('normalizeText',       `"${normalizeText('Bogotá')}" (from "Bogotá")`);
kv('toE164',              toE164('3105551234', '57'));

// ─────────────────────────────────────────────────────────────────────────────
// 8. Data stats
// ─────────────────────────────────────────────────────────────────────────────
section('8. Data stats');

const regions = new Set(countries.map((c) => c.region));
const subregions = new Set(countries.map((c) => c.subregion));
const dialCodes = new Set(countries.map((c) => c.dialCode));
const withAreaCodes = countries.filter((c) => c.areaCodes?.length).length;

kv('countries',         countries.length);
kv('countriesMinimal',  countriesMinimal.length);
kv('regions',           regions.size);
kv('subregions',        subregions.size);
kv('unique dialCodes',  dialCodes.size);
kv('with areaCodes',    withAreaCodes);

// Every country has a capital — this will throw if the guarantee breaks
const missing = countries.filter((c) => !c.capital);
kv('missing capital',   missing.length === 0 ? '0 ✓' : `${missing.length} ✗`);

// Random sample to eyeball the data
console.log('\n  random sample:');
for (let i = 0; i < 5; i++) {
  const c = countries[Math.floor(Math.random() * countries.length)];
  console.log(`    ${c.flag} ${c.name.padEnd(25)} +${c.dialCode.padEnd(4)} capital: ${c.capital}`);
}

console.log('\n✓ All checks ran without throwing.\n');
