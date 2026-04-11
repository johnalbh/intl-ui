/**
 * usePhoneInput() demo components — tracked, runnable version.
 *
 * Three patterns are demonstrated:
 *   1. BasicUncontrolledDemo   — the hook owns everything
 *   2. ControlledDemo          — parent owns the value via useState
 *   3. MinimalHeadlessDemo     — smallest possible consumer
 *
 * Every demo ends with an <OutputInspector /> so you can toggle
 * between the two backend-shaped outputs (full E.164 vs separate
 * dial code + national).
 */

import { useState } from 'react';
import { usePhoneInput } from '@intl-ui/react';

import { OutputInspector } from '../components/OutputInspector';

// ═════════════════════════════════════════════════════════════════════
// DEMO 1 — Uncontrolled, full-featured
// ═════════════════════════════════════════════════════════════════════
export function BasicUncontrolledDemo() {
  const api = usePhoneInput({
    defaultCountry: 'co',
    onValueChange: (value, meta) => {
      // eslint-disable-next-line no-console
      console.log('[phone]', { value, ...meta });
    },
    onCountryChange: (next) => {
      // eslint-disable-next-line no-console
      console.log('[country]', next.name, '→', next.capital);
    },
  });

  const {
    country,
    isValid,
    isOpen,
    focusedIndex,
    visibleCountries,
    getInputProps,
    getCountrySelectProps,
    getCountryListProps,
    getCountryOptionProps,
    setFilter,
  } = api;

  return (
    <div>
      <div className="relative inline-flex">
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

        <input
          {...getInputProps()}
          placeholder="Phone number"
          className={`flex-1 px-3 py-2 border border-l-0 rounded-r outline-none ${
            isValid
              ? 'border-green-500 focus:border-green-600'
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-white border rounded shadow-lg z-10">
            <input
              type="search"
              placeholder="Search country..."
              onChange={(event) => setFilter(event.target.value)}
              className="w-full px-3 py-2 border-b outline-none"
            />
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
              {visibleCountries.length === 0 && (
                <li className="px-3 py-4 text-sm text-gray-500 text-center">
                  No countries match your search
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <OutputInspector api={api} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DEMO 2 — Controlled (parent owns the value)
// ═════════════════════════════════════════════════════════════════════
export function ControlledDemo() {
  const [phone, setPhone] = useState('+573105551234');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const api = usePhoneInput({
    value: phone,
    onValueChange: (nextValue) => {
      setPhone(nextValue);
    },
  });

  const { getInputProps, getCountrySelectProps, country, isValid } = api;

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
          className="px-3 border rounded-l bg-gray-50 hover:bg-gray-100"
        >
          {country?.flag ?? '🌐'} {country ? `+${country.dialCode}` : '—'}
        </button>
        <input
          {...getInputProps()}
          className="flex-1 px-3 py-2 border border-l-0 rounded-r outline-none"
        />
      </div>

      <p className="text-xs text-gray-500">
        Raw value stored by parent:{' '}
        <code className="bg-gray-100 px-1 rounded">{phone || '""'}</code>
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPhone('+442071838750')}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
        >
          Prefill UK
        </button>
        <button
          type="button"
          onClick={() => setPhone('')}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
      >
        Submit
      </button>

      {submitted && (
        <p className="text-sm text-green-700">
          Submitted: <code>{submitted}</code>
        </p>
      )}

      <OutputInspector api={api} />
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DEMO 3 — Minimal headless (no dropdown)
// ═════════════════════════════════════════════════════════════════════
export function MinimalHeadlessDemo() {
  const api = usePhoneInput({
    defaultCountry: 'co',
  });

  const { getInputProps, isValid, country } = api;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{country?.flag}</span>
        <input
          {...getInputProps()}
          className={`w-64 px-3 py-2 border rounded outline-none ${
            isValid ? 'border-green-500' : 'border-gray-300'
          }`}
          placeholder="Phone"
        />
      </div>

      <OutputInspector api={api} />
    </div>
  );
}
