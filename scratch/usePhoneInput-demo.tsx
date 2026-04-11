/**
 * ─────────────────────────────────────────────────────────────────────
 * scratch/usePhoneInput-demo.tsx
 * ─────────────────────────────────────────────────────────────────────
 *
 * Reference / learning playground for the usePhoneInput() hook.
 *
 * This file is NOT compiled by tsc or the build — it lives in scratch/
 * which is gitignored and excluded from every tsconfig include glob.
 * Treat it as documentation-that-happens-to-be-code: open it, read it,
 * copy pieces of it into a real React app when you want to experiment.
 *
 * To actually run any of these components, drop them into a Vite or
 * Next.js project that already has @intl-ui/react installed. They use
 * Tailwind classes for visual contrast but every className is optional
 * — strip them all and the components still work because the hook is
 * headless.
 *
 * ─── Three demos in this file ────────────────────────────────────────
 *   1. BasicUncontrolledDemo   — no parent state, hook owns everything
 *   2. ControlledDemo          — parent owns the value via useState
 *   3. MinimalHeadlessDemo     — the shortest possible consumer, shows
 *                                 you exactly what the hook gives you
 * ─────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { usePhoneInput, type Country } from '@intl-ui/react';

// ═════════════════════════════════════════════════════════════════════
// DEMO 1 — Uncontrolled, full-featured
// ═════════════════════════════════════════════════════════════════════
//
// The hook owns both the phone value and the selected country. The
// parent component never holds either in its own state — it only
// listens via the onValueChange callback for analytics or form sync.
//
// Use this pattern when you just want "a phone input that works" and
// don't need to intercept or override the value from outside.
//
export function BasicUncontrolledDemo() {
  const {
    // ─── Derived state (read-only) ────────────────────────────────
    country,
    isValid,
    isOpen,
    focusedIndex,
    visibleCountries,

    // ─── Prop-getters (spread onto DOM elements) ──────────────────
    getInputProps,
    getCountrySelectProps,
    getCountryListProps,
    getCountryOptionProps,

    // ─── Actions (programmatic control) ───────────────────────────
    setFilter,
  } = usePhoneInput({
    defaultCountry: 'co',
    onValueChange: (value, meta) => {
      // Called on every user keystroke, also on setCountry calls that
      // triggered a reformat. meta contains the parsed object, the
      // country, the isValid flag, and a `source` tag ("user-type",
      // "country-change", "reset", "external") so you can distinguish
      // where the update came from.
      // eslint-disable-next-line no-console
      console.log('[phone]', { value, ...meta });
    },
    onCountryChange: (next) => {
      // eslint-disable-next-line no-console
      console.log('[country]', next.name, '→', next.capital);
    },
  });

  return (
    <div className="relative inline-flex">
      {/* ─── Trigger: button showing flag + dial code ─────────────── */}
      <button
        {...getCountrySelectProps()}
        className="flex items-center gap-2 px-3 border rounded-l bg-gray-50 hover:bg-gray-100"
      >
        <span className="text-lg">{country?.flag ?? '🌐'}</span>
        <span className="text-sm text-gray-700">
          {country ? `+${country.dialCode}` : '—'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M3 5 L6 8 L9 5" stroke="currentColor" fill="none" />
        </svg>
      </button>

      {/* ─── Input: the actual phone number field ────────────────── */}
      <input
        {...getInputProps()}
        placeholder="Phone number"
        className={`flex-1 px-3 py-2 border border-l-0 rounded-r outline-none ${
          isValid
            ? 'border-green-500 focus:border-green-600'
            : 'border-gray-300 focus:border-blue-500'
        }`}
      />

      {/* ─── Validation hint (appears below when incomplete) ─────── */}
      {!isValid && country && (
        <span className="absolute top-full left-0 mt-1 text-xs text-gray-500">
          Enter a valid {country.name} phone number
        </span>
      )}

      {/* ─── Dropdown panel (only mounted while open) ────────────── */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border rounded shadow-lg z-10">
          {/* Search box filters the visible country list */}
          <input
            type="search"
            placeholder="Search country..."
            onChange={(event) => setFilter(event.target.value)}
            className="w-full px-3 py-2 border-b outline-none"
          />

          {/* The actual listbox — note that the hook gives us the
              filtered + ordered list via visibleCountries, so we just
              iterate it and spread the option props onto each <li>. */}
          <ul
            {...getCountryListProps()}
            className="max-h-60 overflow-y-auto py-1"
          >
            {visibleCountries.map((c, index) => {
              const isFocused = index === focusedIndex;
              const isSelected = c.iso2 === country?.iso2;
              return (
                <li
                  key={c.iso2}
                  {...getCountryOptionProps(c, index)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                    isFocused ? 'bg-blue-100' : 'hover:bg-gray-100'
                  } ${isSelected ? 'font-semibold' : ''}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <span className="text-xs text-gray-500">
                    +{c.dialCode}
                  </span>
                </li>
              );
            })}

            {/* Empty-state when the filter matches nothing */}
            {visibleCountries.length === 0 && (
              <li className="px-3 py-4 text-sm text-gray-500 text-center">
                No countries match your search
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DEMO 2 — Controlled (parent owns the value)
// ═════════════════════════════════════════════════════════════════════
//
// This pattern is what you use inside a form library (react-hook-form,
// Formik, zod-form) or any time the parent component needs to read,
// validate, or reset the phone value programmatically.
//
// The parent holds the value in its own useState. The hook receives
// `value` and `onValueChange` and behaves exactly like a controlled
// <input>: the parent is the source of truth.
//
export function ControlledDemo() {
  const [phone, setPhone] = useState('+573105551234');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const { getInputProps, getCountrySelectProps, country, isValid } =
    usePhoneInput({
      value: phone, // ← the magic line: now the parent owns the value
      onValueChange: (nextValue) => {
        setPhone(nextValue);
      },
    });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(phone);
      }}
      className="flex flex-col gap-2"
    >
      <label className="text-sm font-medium">Phone number</label>

      <div className="flex">
        <button
          {...getCountrySelectProps()}
          className="px-3 border rounded-l bg-gray-50"
        >
          {country?.flag} +{country?.dialCode}
        </button>
        <input
          {...getInputProps()}
          className="flex-1 px-3 py-2 border border-l-0 rounded-r outline-none"
        />
      </div>

      {/* The parent can read `phone` directly because it's in its own
          useState — no need to reach into the hook. */}
      <p className="text-xs text-gray-500">
        Raw value stored by parent:{' '}
        <code className="bg-gray-100 px-1 rounded">{phone || '""'}</code>
      </p>

      {/* Buttons that mutate the value from outside the hook.
          This is the main reason to pick controlled mode. */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPhone('+442071838750')}
          className="px-3 py-1 text-sm border rounded"
        >
          Prefill UK
        </button>
        <button
          type="button"
          onClick={() => setPhone('')}
          className="px-3 py-1 text-sm border rounded"
        >
          Clear
        </button>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Submit
      </button>

      {submitted && (
        <p className="text-sm text-green-700">
          Submitted: <code>{submitted}</code>
        </p>
      )}
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DEMO 3 — The absolute minimum headless consumer
// ═════════════════════════════════════════════════════════════════════
//
// This is the smallest amount of JSX that still gives you a working
// phone input: a hardcoded country (no dropdown), a styled input, and
// a hint line. It intentionally skips the dropdown UI to show you how
// little you need to get going.
//
// Ship this when you only need "a formatted international input with
// a fixed country" — marketing landing pages, single-country forms,
// server-side rendered pages that care about hydration weight.
//
export function MinimalHeadlessDemo() {
  const { getInputProps, isValid, country, parsed } = usePhoneInput({
    defaultCountry: 'co',
  });

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">{country?.flag}</span>
        <input
          {...getInputProps()}
          className={`w-64 px-3 py-2 border rounded outline-none ${
            isValid ? 'border-green-500' : 'border-gray-300'
          }`}
          placeholder={`+${country?.dialCode} phone number`}
        />
      </div>
      {/* Live parsed object for learning purposes — drop this in prod */}
      <pre className="text-xs bg-gray-50 p-2 rounded border">
        {parsed
          ? JSON.stringify(
              {
                e164: parsed.e164,
                national: parsed.national,
                isValid: parsed.isValid,
                isPossible: parsed.isPossible,
                country: parsed.country?.name,
              },
              null,
              2,
            )
          : '(empty)'}
      </pre>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Root demo — mount all three side by side in a real app to compare
// ═════════════════════════════════════════════════════════════════════
export default function UsePhoneInputDemoRoot() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <section>
        <h2 className="text-xl font-bold mb-4">1. Uncontrolled, full-featured</h2>
        <BasicUncontrolledDemo />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">2. Controlled by parent state</h2>
        <ControlledDemo />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">3. Minimal headless (no dropdown)</h2>
        <MinimalHeadlessDemo />
      </section>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Extra: a pure type-level inspection
// ═════════════════════════════════════════════════════════════════════
//
// Hover over these in your editor to see what the hook's types look
// like from the consumer side. TypeScript inference is the cheapest
// form of documentation.
//
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type InspectCountry = Country;
//   ^? Country — the full type from @intl-ui/core including capital
