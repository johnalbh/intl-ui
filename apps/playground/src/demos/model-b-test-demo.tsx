/**
 * Model B regression test demo.
 *
 * Built specifically to exercise the bug that motivated the move
 * from Model A (dial code in input) to Model B (separate dial code).
 *
 * Three scenarios in this file, each with a live state inspector
 * so you can see the difference between:
 *
 *   • value      — the canonical E.164 string (what your app stores
 *                   and submits)
 *   • inputValue — the formatted national portion (what the user
 *                   sees and types into the <input>)
 *
 * Try the scenarios in this order to validate the fix:
 *
 *   1. ClearAndRetypeDemo  — type a number, Cmd+A + Backspace, type
 *                            a different one. The previous behavior
 *                            got stuck on "+57"; this should now
 *                            clear cleanly.
 *   2. PasteIntlDemo       — paste a UK number ("+44 207 183 8750")
 *                            on top of a CO number. The country
 *                            switches automatically via the trie.
 *   3. SwitchViaDropdownDemo — select another country in the
 *                            dropdown. The previously typed digits
 *                            survive and get reformatted to the new
 *                            country's mask.
 */

import { useState } from 'react';
import { PhoneInput, usePhoneInput } from '@intl-ui/react';
import type { UsePhoneInputReturn } from '@intl-ui/react';

// ─────────────────────────────────────────────────────────────────────
// Shared inspector — shows the hook state in a tidy panel
// ─────────────────────────────────────────────────────────────────────
function StateInspector({ api }: { api: UsePhoneInputReturn }) {
  return (
    <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-3 mt-3 overflow-auto">
      {JSON.stringify(
        {
          value: api.value,
          inputValue: api.inputValue,
          country: api.country?.iso2,
          dialCode: api.country?.dialCode,
          isValid: api.isValid,
        },
        null,
        2,
      )}
    </pre>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SCENARIO 1 — Clear and retype (the regression test for the bug)
// ═════════════════════════════════════════════════════════════════════
export function ClearAndRetypeDemo() {
  const api = usePhoneInput({
    defaultCountry: 'co',
    defaultValue: '+573105551234',
  });
  const { getInputProps, getCountrySelectProps, country } = api;

  return (
    <div>
      <ol className="text-sm text-gray-700 mb-3 space-y-1 list-decimal list-inside">
        <li>The input is pre-filled with <code className="bg-gray-100 px-1 rounded">310 555 1234</code> (Colombia).</li>
        <li>Click into the input, press <kbd className="px-1 border rounded">Cmd</kbd>/<kbd className="px-1 border rounded">Ctrl</kbd>+<kbd className="px-1 border rounded">A</kbd>, then <kbd className="px-1 border rounded">Backspace</kbd>.</li>
        <li>The input should be empty (no stuck "+57").</li>
        <li>Type any new digits — they format against the CO mask immediately.</li>
      </ol>

      <div className="inline-flex">
        <button
          {...getCountrySelectProps()}
          className="flex items-center gap-2 px-3 border rounded-l bg-gray-50 hover:bg-gray-100"
        >
          <span className="text-lg">{country?.flag}</span>
          <span className="text-sm text-gray-700">+{country?.dialCode}</span>
        </button>
        <input
          {...getInputProps()}
          placeholder="National number"
          className="flex-1 px-3 py-2 border border-l-0 rounded-r outline-none focus:border-blue-500 w-64"
        />
      </div>

      <StateInspector api={api} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SCENARIO 2 — Paste international format to switch countries
// ═════════════════════════════════════════════════════════════════════
export function PasteIntlDemo() {
  const api = usePhoneInput({
    defaultCountry: 'co',
    defaultValue: '+573105551234',
  });
  const { getInputProps, getCountrySelectProps, country } = api;

  // A list of pastable example numbers — click any of them to copy
  // it into the input and see the country auto-switch.
  const examples = [
    { label: '🇬🇧 UK',     value: '+442071838750' },
    { label: '🇺🇸 USA',    value: '+12025551234' },
    { label: '🇩🇪 Germany',value: '+4915112345678' },
    { label: '🇯🇵 Japan',  value: '+81312345678' },
  ];

  return (
    <div>
      <ol className="text-sm text-gray-700 mb-3 space-y-1 list-decimal list-inside">
        <li>The input starts with a Colombian number.</li>
        <li>Click any of the buttons below to simulate pasting an international number.</li>
        <li>The country flag, dial code, and inputValue update automatically because the trie detects the new dial code.</li>
      </ol>

      <div className="inline-flex">
        <button
          {...getCountrySelectProps()}
          className="flex items-center gap-2 px-3 border rounded-l bg-gray-50 hover:bg-gray-100"
        >
          <span className="text-lg">{country?.flag}</span>
          <span className="text-sm text-gray-700">+{country?.dialCode}</span>
        </button>
        <input
          {...getInputProps()}
          placeholder="National number"
          className="flex-1 px-3 py-2 border border-l-0 rounded-r outline-none focus:border-blue-500 w-64"
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {examples.map((ex) => (
          <button
            key={ex.value}
            type="button"
            onClick={() => {
              // Synthesize a change event that mimics a paste of the
              // international format. handleInputChange branches into
              // the international path because the value starts with "+".
              api.getInputProps().onChange({
                target: { value: ex.value },
                currentTarget: { value: ex.value },
              } as React.ChangeEvent<HTMLInputElement>);
            }}
            className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
          >
            Paste {ex.label}
          </button>
        ))}
      </div>

      <StateInspector api={api} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SCENARIO 3 — Switch country via the dropdown, digits survive
// ═════════════════════════════════════════════════════════════════════
export function SwitchViaDropdownDemo() {
  const api = usePhoneInput({
    defaultCountry: 'co',
    defaultValue: '+573105551234',
  });
  const {
    getInputProps,
    getCountrySelectProps,
    getCountryListProps,
    getCountryOptionProps,
    country,
    isOpen,
    visibleCountries,
    focusedIndex,
  } = api;

  return (
    <div>
      <ol className="text-sm text-gray-700 mb-3 space-y-1 list-decimal list-inside">
        <li>Click the country selector to open the dropdown.</li>
        <li>Pick a different country (e.g. United States).</li>
        <li>The previously typed digits survive — only the dial code and mask change.</li>
      </ol>

      <div className="relative inline-flex">
        <button
          {...getCountrySelectProps()}
          className="flex items-center gap-2 px-3 border rounded-l bg-gray-50 hover:bg-gray-100"
        >
          <span className="text-lg">{country?.flag}</span>
          <span className="text-sm text-gray-700">+{country?.dialCode}</span>
          <span className="text-xs">▾</span>
        </button>
        <input
          {...getInputProps()}
          placeholder="National number"
          className="flex-1 px-3 py-2 border border-l-0 rounded-r outline-none focus:border-blue-500 w-64"
        />

        {isOpen && (
          <ul
            {...getCountryListProps()}
            className="absolute top-full left-0 mt-1 w-80 max-h-60 overflow-y-auto bg-white border rounded shadow-lg py-1 z-10"
          >
            {visibleCountries.slice(0, 50).map((c, index) => (
              <li
                key={c.iso2}
                {...getCountryOptionProps(c, index)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                  index === focusedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                } ${c.iso2 === country?.iso2 ? 'font-semibold' : ''}`}
              >
                <span>{c.flag}</span>
                <span className="flex-1 text-sm">{c.name}</span>
                <span className="text-xs text-gray-500">+{c.dialCode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <StateInspector api={api} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SCENARIO 4 — The same as scenario 1 but using compound components
// to prove the fix flows through the full API surface, not just the hook
// ═════════════════════════════════════════════════════════════════════
export function CompoundClearAndRetypeDemo() {
  const [value, setValue] = useState<string>('+573105551234');

  return (
    <div>
      <ol className="text-sm text-gray-700 mb-3 space-y-1 list-decimal list-inside">
        <li>Same scenario as #1 but using <code className="bg-gray-100 px-1 rounded">{'<PhoneInput.Root>'}</code> compound components.</li>
        <li>Cmd/Ctrl + A, Backspace, type new digits.</li>
        <li>Confirms the fix isn't hook-only — the compound API flows through the same handleInputChange.</li>
      </ol>

      <PhoneInput.Root
        value={value}
        onValueChange={(next) => setValue(next)}
      >
        <div className="inline-flex">
          <PhoneInput.CountrySelect className="flex items-center gap-2 px-3 border rounded-l bg-gray-50 hover:bg-gray-100">
            <PhoneInput.Flag className="text-lg" />
            <PhoneInput.DialCode className="text-sm text-gray-700" />
          </PhoneInput.CountrySelect>
          <PhoneInput.Input
            placeholder="National number"
            className="flex-1 px-3 py-2 border border-l-0 rounded-r outline-none focus:border-blue-500 w-64"
          />
        </div>
      </PhoneInput.Root>

      <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-3 mt-3 overflow-auto">
        {JSON.stringify({ canonicalValue: value }, null, 2)}
      </pre>
    </div>
  );
}
