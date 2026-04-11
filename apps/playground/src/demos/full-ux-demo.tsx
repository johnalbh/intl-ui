/**
 * Full UX demo — the showcase consumer.
 *
 * This is the demo that exercises every interactive feature of
 * @intl-ui/react in a single, fully working component:
 *
 *   • Country trigger button with flag + dial code
 *   • Dropdown with auto-focused search box (filter by name, ISO, or dial code)
 *   • Keyboard navigation (arrows, Enter, Escape)
 *   • Three ways to switch country:
 *       1. Click the trigger and pick from the searchable list
 *       2. Type "+<dial code>" in the input → trie auto-detects
 *       3. Type the ISO code (2 or 3 letters) in the input
 *   • Live state inspector showing canonical value vs displayed inputValue
 *   • Click-outside to close the dropdown
 *   • No hardcoded default country — start fresh, pick whatever you want
 *
 * Open the playground and use this as the main test surface.
 */

import { useEffect, useRef } from 'react';
import { usePhoneInput } from '@intl-ui/react';
import type { UsePhoneInputReturn } from '@intl-ui/react';

// ─────────────────────────────────────────────────────────────────────
// Live state inspector — JSON view of every relevant hook field
// ─────────────────────────────────────────────────────────────────────
function StateInspector({ api }: { api: UsePhoneInputReturn }) {
  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        Hook state
      </div>
      <pre className="text-xs bg-slate-900 text-slate-100 rounded p-3 overflow-auto">
        {JSON.stringify(
          {
            value: api.value,
            inputValue: api.inputValue,
            country: api.country
              ? {
                  iso2: api.country.iso2,
                  iso3: api.country.iso3,
                  name: api.country.name,
                  dialCode: api.country.dialCode,
                  flag: api.country.flag,
                  capital: api.country.capital,
                }
              : null,
            isValid: api.isValid,
            isOpen: api.isOpen,
            focusedIndex: api.focusedIndex,
            visibleCount: api.visibleCountries.length,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hook into "click outside the dropdown to close it"
// ─────────────────────────────────────────────────────────────────────
function useClickOutside<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);
  return ref;
}

// ═════════════════════════════════════════════════════════════════════
// THE DEMO
// ═════════════════════════════════════════════════════════════════════
export function FullUxDemo() {
  // No defaultCountry, no defaultValue. Start fresh — the user picks
  // a country via the dropdown, types "+code", or types the ISO code.
  const api = usePhoneInput();

  const {
    country,
    isOpen,
    isValid,
    focusedIndex,
    visibleCountries,
    getInputProps,
    getCountrySelectProps,
    getCountryListProps,
    getCountryOptionProps,
    setOpen,
    setFilter,
  } = api;

  // Auto-focus the search box when the dropdown opens.
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    } else {
      setFilter('');
    }
  }, [isOpen, setFilter]);

  // Click-outside to close the dropdown.
  const containerRef = useClickOutside<HTMLDivElement>(isOpen, () =>
    setOpen(false),
  );

  return (
    <div>
      {/* ─── Instructions ───────────────────────────────────────── */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <div className="font-semibold text-blue-900 mb-1">
          🎯 Try any of these to set the country:
        </div>
        <ol className="list-decimal list-inside space-y-1 text-blue-900">
          <li>
            <strong>Click the country button</strong> → search by name, ISO code,
            or dial code in the dropdown
          </li>
          <li>
            <strong>Type a "+" code</strong> in the input — e.g.{' '}
            <code className="bg-white px-1 rounded">+380</code> for Ukraine,{' '}
            <code className="bg-white px-1 rounded">+44</code> for UK,{' '}
            <code className="bg-white px-1 rounded">+57</code> for Colombia
          </li>
          <li>
            <strong>Type the ISO code</strong> (2 or 3 letters) — e.g.{' '}
            <code className="bg-white px-1 rounded">co</code>,{' '}
            <code className="bg-white px-1 rounded">USA</code>,{' '}
            <code className="bg-white px-1 rounded">gb</code>,{' '}
            <code className="bg-white px-1 rounded">deu</code>
          </li>
        </ol>
      </div>

      {/* ─── The phone input itself ─────────────────────────────── */}
      <div ref={containerRef} className="relative inline-flex w-full max-w-md">
        <button
          {...getCountrySelectProps()}
          className="flex items-center gap-2 px-3 border border-gray-300 rounded-l bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-xl leading-none">{country?.flag ?? '🌐'}</span>
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {country ? `+${country.dialCode}` : 'Pick country'}
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            className={`text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 4.5 L6 7.5 L9 4.5" />
          </svg>
        </button>

        <input
          {...getInputProps()}
          placeholder={
            country ? 'National number' : 'Phone, +code, or ISO (co, usa, gb…)'
          }
          className={`flex-1 px-3 py-2 border border-l-0 rounded-r outline-none transition-colors ${
            isValid
              ? 'border-green-500 focus:border-green-600'
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />

        {/* ─── Dropdown (portaled by absolute positioning) ─────── */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 overflow-hidden">
            <div className="border-b border-gray-100 p-2">
              <input
                ref={searchRef}
                type="search"
                placeholder="Search by name, ISO, or +code…"
                onChange={(event) => setFilter(event.target.value)}
                onKeyDown={(event) => {
                  // Forward arrow keys / Enter / Escape to the hook so
                  // keyboard navigation in the list works while typing.
                  if (
                    event.key === 'ArrowDown' ||
                    event.key === 'ArrowUp' ||
                    event.key === 'Enter' ||
                    event.key === 'Escape'
                  ) {
                    getInputProps().onKeyDown(
                      event as unknown as React.KeyboardEvent<HTMLInputElement>,
                    );
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded outline-none focus:border-blue-500"
              />
            </div>

            <ul
              {...getCountryListProps()}
              className="max-h-72 overflow-y-auto py-1"
            >
              {visibleCountries.length === 0 && (
                <li className="px-3 py-4 text-sm text-gray-500 text-center">
                  No countries match
                </li>
              )}
              {visibleCountries.map((c, index) => {
                const isFocused = index === focusedIndex;
                const isSelected = c.iso2 === country?.iso2;
                return (
                  <li
                    key={c.iso2}
                    {...getCountryOptionProps(c, index)}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm ${
                      isFocused ? 'bg-blue-100' : 'hover:bg-gray-50'
                    } ${isSelected ? 'font-semibold' : ''}`}
                  >
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      +{c.dialCode}
                    </span>
                    <span className="text-xs text-gray-400 uppercase font-mono">
                      {c.iso2}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ─── Status line ────────────────────────────────────────── */}
      <div className="mt-2 text-xs text-gray-500">
        {country ? (
          <>
            Selected:{' '}
            <strong>
              {country.flag} {country.name}
            </strong>{' '}
            — capital {country.capital}, dial code +{country.dialCode}
            {isValid && (
              <span className="ml-2 text-green-700">✓ valid number</span>
            )}
          </>
        ) : (
          <em>No country selected yet — try the input or the dropdown</em>
        )}
      </div>

      <StateInspector api={api} />
    </div>
  );
}
