/**
 * Compound components demo — the middle abstraction level.
 *
 * This file shows how to build a phone input using
 * <PhoneInput.Root>, <PhoneInput.Input>, <PhoneInput.CountrySelect>,
 * etc. You get full control of the layout (where the flag goes,
 * where the dial code lives, how the dropdown is positioned) without
 * writing any of the behavior code — the compound children handle
 * state, events, ARIA, and prop merging for you.
 *
 * Three sub-demos:
 *   1. OneLinerDemo      — just <PhoneInput /> with zero children
 *   2. CompoundDemo       — full control via <PhoneInput.Root>
 *   3. AsChildDemo        — the asChild pattern, cloning a styled input
 */

import { PhoneInput } from '@intl-ui/react';

// ═════════════════════════════════════════════════════════════════════
// DEMO A — The one-liner
// ═════════════════════════════════════════════════════════════════════
//
// Zero children, zero config beyond the hook options. Useful for the
// "I just need a phone input and I'll style it later" case.
//
export function OneLinerDemo() {
  return (
    <PhoneInput
      defaultCountry="co"
      className="inline-flex"
      triggerProps={{
        className: 'px-3 border rounded-l bg-gray-50 hover:bg-gray-100',
      }}
      inputProps={{
        placeholder: 'Phone number',
        className: 'flex-1 px-3 py-2 border border-l-0 rounded-r outline-none',
      }}
      onValueChange={(value, meta) => {
        // eslint-disable-next-line no-console
        console.log('[one-liner]', value, meta.isValid);
      }}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════
// DEMO B — Full compound layout
// ═════════════════════════════════════════════════════════════════════
//
// You control every element, but <PhoneInput.Root> still runs the
// hook and publishes it to every child via context. No prop-drilling
// needed — children just "know" the state.
//
// Notice the CountryList children is a render prop: it receives each
// visible country + its index so the hook's focused index and
// selection state can flow through.
//
export function CompoundDemo() {
  return (
    <PhoneInput.Root
      defaultCountry="co"
      onValueChange={(value) => {
        // eslint-disable-next-line no-console
        console.log('[compound]', value);
      }}
    >
      <div className="relative inline-flex">
        {/* ─── Trigger: flag + dial code in one button ─── */}
        <PhoneInput.CountrySelect className="flex items-center gap-2 px-3 border rounded-l bg-gray-50 hover:bg-gray-100">
          <PhoneInput.Flag className="text-lg" />
          <PhoneInput.DialCode className="text-sm text-gray-700" />
          <span className="text-xs text-gray-400">▾</span>
        </PhoneInput.CountrySelect>

        {/* ─── Input ─── */}
        <PhoneInput.Input
          placeholder="Phone number"
          className="flex-1 px-3 py-2 border border-l-0 rounded-r outline-none focus:border-blue-500"
        />

        {/* ─── Dropdown ─── */}
        <PhoneInput.CountryList className="absolute top-full left-0 mt-1 w-80 max-h-60 overflow-y-auto bg-white border rounded shadow-lg py-1 z-10">
          {(country, index) => (
            <PhoneInput.CountryListItem
              key={country.iso2}
              country={country}
              index={index}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 aria-selected:bg-blue-50 aria-selected:font-semibold"
            />
          )}
        </PhoneInput.CountryList>
      </div>
    </PhoneInput.Root>
  );
}

// ═════════════════════════════════════════════════════════════════════
// DEMO C — The asChild pattern
// ═════════════════════════════════════════════════════════════════════
//
// When you already have a styled input component (maybe from shadcn
// or your design system), you don't want PhoneInput to render its own
// <input> — you want IT to take over your element's behavior. That
// is what `asChild` does: Slot clones your child and merges all the
// hook-provided props into it.
//
// In this demo we clone a styled <input> that has its own className,
// a placeholder, and a border color. PhoneInput merges value, type,
// onChange, onKeyDown, etc. into that element without replacing it.
//
export function AsChildDemo() {
  return (
    <PhoneInput.Root defaultCountry="us">
      <div className="inline-flex gap-2 items-center">
        <PhoneInput.CountrySelect className="px-3 py-2 border rounded-full bg-indigo-50 text-indigo-700 font-medium">
          <PhoneInput.Flag className="mr-1" />
          <PhoneInput.DialCode />
        </PhoneInput.CountrySelect>

        <PhoneInput.Input asChild>
          {/* Your own custom-styled input. PhoneInput.Input will clone
              this element and merge its own props (value, onChange,
              type, onKeyDown, refs) into it. */}
          <input
            placeholder="(555) 123-4567"
            className="px-4 py-2 border-2 border-indigo-200 rounded-full outline-none focus:border-indigo-500 transition-colors"
          />
        </PhoneInput.Input>
      </div>
    </PhoneInput.Root>
  );
}
