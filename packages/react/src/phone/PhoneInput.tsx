import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import type { Country } from '@intl-ui/core';

import { PhoneInputContext, usePhoneInputContext } from './context';
import { Slot, mergeProps } from './Slot';
import { usePhoneInput } from './usePhoneInput';
import type { UsePhoneInputOptions } from './types';

/**
 * Compound component suite for the phone input.
 *
 * Three usage levels, all powered by the same underlying hook:
 *
 *   1. One-liner — <PhoneInput defaultCountry="co" />
 *   2. Compound — <PhoneInput.Root>...children...</PhoneInput.Root>
 *   3. Hook direct — const api = usePhoneInput();
 *
 * Every compound child accepts an `asChild` prop that swaps the
 * rendered DOM element for whatever the consumer passes, while
 * preserving all the hook-provided behavior (state, handlers, refs).
 * See Slot.tsx for the merging rules.
 */

// ═══════════════════════════════════════════════════════════════════
// <PhoneInput.Root> — the provider
// ═══════════════════════════════════════════════════════════════════

export interface PhoneInputRootProps extends UsePhoneInputOptions {
  children?: ReactNode;
}

/**
 * Calls usePhoneInput() once and publishes the resulting state and
 * prop-getters through a React Context so every nested compound
 * child can consume them.
 *
 * All options accepted by usePhoneInput() can be passed as props:
 *   <PhoneInput.Root defaultCountry="co" onValueChange={fn}>
 *     ...
 *   </PhoneInput.Root>
 */
export function PhoneInputRoot({
  children,
  ...options
}: PhoneInputRootProps): JSX.Element {
  const api = usePhoneInput(options);
  return (
    <PhoneInputContext.Provider value={api}>
      {children}
    </PhoneInputContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════
// <PhoneInput.Input> — the <input type="tel"> element
// ═══════════════════════════════════════════════════════════════════

export interface PhoneInputInputProps
  extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'value' | 'onChange' | 'type'
  > {
  /**
   * If true, the component clones its only child and merges the
   * hook-provided props into it, instead of rendering a default
   * <input>. See Slot.tsx for merge rules.
   */
  asChild?: boolean;
}

export const PhoneInputInput = forwardRef<
  HTMLInputElement,
  PhoneInputInputProps
>(function PhoneInputInput({ asChild, ...userProps }, forwardedRef) {
  const { getInputProps } = usePhoneInputContext();
  const hookProps = getInputProps();
  // Merge user props WITH the hook props, letting the hook's
  // functional props (value, onChange, type, refs, a11y attrs) win.
  // Event handlers that exist on both are composed by mergeProps.
  const merged = mergeProps(
    userProps as Record<string, unknown>,
    hookProps as unknown as Record<string, unknown>,
  );

  if (asChild) {
    return <Slot ref={forwardedRef} {...merged} />;
  }
  return <input ref={forwardedRef} {...(merged as ComponentPropsWithoutRef<'input'>)} />;
});

// ═══════════════════════════════════════════════════════════════════
// <PhoneInput.CountrySelect> — the trigger button for the dropdown
// ═══════════════════════════════════════════════════════════════════

export interface PhoneInputCountrySelectProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'type'> {
  asChild?: boolean;
}

export const PhoneInputCountrySelect = forwardRef<
  HTMLButtonElement,
  PhoneInputCountrySelectProps
>(function PhoneInputCountrySelect(
  { asChild, children, ...userProps },
  forwardedRef,
) {
  const { getCountrySelectProps, country } = usePhoneInputContext();
  const hookProps = getCountrySelectProps();
  const merged = mergeProps(
    userProps as Record<string, unknown>,
    hookProps as unknown as Record<string, unknown>,
  );

  // If the consumer didn't provide children, render a sensible default:
  // the flag + dial code. This keeps the simplest case (just render
  // <PhoneInput.CountrySelect />) visually meaningful.
  const resolvedChildren =
    children ??
    (country ? (
      <>
        <span aria-hidden="true">{country.flag}</span>
        {' +'}
        {country.dialCode}
      </>
    ) : (
      <span aria-hidden="true">🌐</span>
    ));

  if (asChild) {
    return (
      <Slot ref={forwardedRef} {...merged}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      ref={forwardedRef}
      {...(merged as ComponentPropsWithoutRef<'button'>)}
    >
      {resolvedChildren}
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════════
// <PhoneInput.Flag> — the emoji flag (or whatever you render)
// ═══════════════════════════════════════════════════════════════════

export interface PhoneInputFlagProps extends ComponentPropsWithoutRef<'span'> {
  asChild?: boolean;
  /** Fallback shown when no country is selected. Defaults to "🌐". */
  fallback?: ReactNode;
}

export const PhoneInputFlag = forwardRef<HTMLSpanElement, PhoneInputFlagProps>(
  function PhoneInputFlag(
    { asChild, fallback = '🌐', children, ...userProps },
    forwardedRef,
  ) {
    const { country } = usePhoneInputContext();
    const content = children ?? country?.flag ?? fallback;

    if (asChild) {
      return (
        <Slot
          ref={forwardedRef}
          aria-hidden="true"
          {...(userProps as Record<string, unknown>)}
        >
          {children}
        </Slot>
      );
    }
    return (
      <span
        ref={forwardedRef}
        aria-hidden="true"
        {...(userProps as ComponentPropsWithoutRef<'span'>)}
      >
        {content}
      </span>
    );
  },
);

// ═══════════════════════════════════════════════════════════════════
// <PhoneInput.DialCode> — the "+57" label
// ═══════════════════════════════════════════════════════════════════

export interface PhoneInputDialCodeProps
  extends ComponentPropsWithoutRef<'span'> {
  asChild?: boolean;
}

export const PhoneInputDialCode = forwardRef<
  HTMLSpanElement,
  PhoneInputDialCodeProps
>(function PhoneInputDialCode(
  { asChild, children, ...userProps },
  forwardedRef,
) {
  const { country } = usePhoneInputContext();
  const content = children ?? (country ? `+${country.dialCode}` : '');

  if (asChild) {
    return (
      <Slot ref={forwardedRef} {...(userProps as Record<string, unknown>)}>
        {children}
      </Slot>
    );
  }
  return (
    <span
      ref={forwardedRef}
      {...(userProps as ComponentPropsWithoutRef<'span'>)}
    >
      {content}
    </span>
  );
});

// ═══════════════════════════════════════════════════════════════════
// <PhoneInput.CountryList> — the dropdown listbox
// ═══════════════════════════════════════════════════════════════════

export interface PhoneInputCountryListProps
  extends Omit<ComponentPropsWithoutRef<'ul'>, 'children'> {
  asChild?: boolean;
  /**
   * Render prop: receives each visible country plus its index in the
   * filtered list. If omitted, the list renders nothing (consumer is
   * responsible for mapping visibleCountries themselves via the hook).
   */
  children?:
    | ((country: Country, index: number) => ReactNode)
    | ReactNode;
}

export const PhoneInputCountryList = forwardRef<
  HTMLUListElement,
  PhoneInputCountryListProps
>(function PhoneInputCountryList(
  { asChild, children, ...userProps },
  forwardedRef,
) {
  const { getCountryListProps, visibleCountries, isOpen } =
    usePhoneInputContext();

  if (!isOpen) return null;

  const hookProps = getCountryListProps();
  const merged = mergeProps(
    userProps as Record<string, unknown>,
    hookProps as unknown as Record<string, unknown>,
  );

  const renderedChildren =
    typeof children === 'function'
      ? visibleCountries.map((c, i) => children(c, i))
      : children;

  if (asChild) {
    return (
      <Slot ref={forwardedRef} {...merged}>
        {renderedChildren as ReactNode}
      </Slot>
    );
  }
  return (
    <ul ref={forwardedRef} {...(merged as ComponentPropsWithoutRef<'ul'>)}>
      {renderedChildren}
    </ul>
  );
});

// ═══════════════════════════════════════════════════════════════════
// <PhoneInput.CountryListItem> — one option in the dropdown
// ═══════════════════════════════════════════════════════════════════

export interface PhoneInputCountryListItemProps
  extends ComponentPropsWithoutRef<'li'> {
  asChild?: boolean;
  /** The country this option represents. */
  country: Country;
  /** Index in the current visible list — used for keyboard focus. */
  index: number;
}

export const PhoneInputCountryListItem = forwardRef<
  HTMLLIElement,
  PhoneInputCountryListItemProps
>(function PhoneInputCountryListItem(
  { asChild, country, index, children, ...userProps },
  forwardedRef,
) {
  const { getCountryOptionProps } = usePhoneInputContext();
  const hookProps = getCountryOptionProps(country, index);
  const merged = mergeProps(
    userProps as Record<string, unknown>,
    hookProps as unknown as Record<string, unknown>,
  );

  const content =
    children ?? (
      <>
        <span aria-hidden="true">{country.flag}</span>
        {' '}
        <span>{country.name}</span>
        {' '}
        <span>+{country.dialCode}</span>
      </>
    );

  if (asChild) {
    return (
      <Slot ref={forwardedRef} {...merged}>
        {children}
      </Slot>
    );
  }
  return (
    <li ref={forwardedRef} {...(merged as ComponentPropsWithoutRef<'li'>)}>
      {content}
    </li>
  );
});

// ═══════════════════════════════════════════════════════════════════
// <PhoneInput /> — the one-line wrapper
// ═══════════════════════════════════════════════════════════════════

export interface PhoneInputProps extends UsePhoneInputOptions {
  /** Props forwarded to the underlying <input>. */
  inputProps?: Omit<
    ComponentPropsWithoutRef<'input'>,
    'value' | 'onChange' | 'type'
  >;
  /** Props forwarded to the country-select trigger <button>. */
  triggerProps?: Omit<ComponentPropsWithoutRef<'button'>, 'type'>;
  /** Container className applied to the wrapping <div>. */
  className?: string;
}

/**
 * The single-element wrapper. Use this when you don't need custom
 * layout — it renders a country trigger next to an input, with a
 * dropdown that opens on click.
 *
 * Equivalent to building the following compound tree manually:
 *
 *   <PhoneInput.Root {...options}>
 *     <PhoneInput.CountrySelect {...triggerProps} />
 *     <PhoneInput.Input {...inputProps} />
 *     <PhoneInput.CountryList>
 *       {(c, i) => <PhoneInput.CountryListItem country={c} index={i} />}
 *     </PhoneInput.CountryList>
 *   </PhoneInput.Root>
 */
function PhoneInputOneLiner({
  inputProps,
  triggerProps,
  className,
  ...options
}: PhoneInputProps): JSX.Element {
  return (
    <PhoneInputRoot {...options}>
      <div
        className={className}
        style={{ position: 'relative', display: 'inline-flex' }}
      >
        <PhoneInputCountrySelect {...triggerProps} />
        <PhoneInputInput {...inputProps} />
        <PhoneInputCountryList>
          {(country, index) => (
            <PhoneInputCountryListItem
              key={country.iso2}
              country={country}
              index={index}
            />
          )}
        </PhoneInputCountryList>
      </div>
    </PhoneInputRoot>
  );
}

// Namespace export: attach every compound component to the main
// wrapper so consumers can write <PhoneInput.Root>, <PhoneInput.Input>,
// etc., using dot-access.
export const PhoneInput = Object.assign(PhoneInputOneLiner, {
  Root: PhoneInputRoot,
  Input: PhoneInputInput,
  CountrySelect: PhoneInputCountrySelect,
  Flag: PhoneInputFlag,
  DialCode: PhoneInputDialCode,
  CountryList: PhoneInputCountryList,
  CountryListItem: PhoneInputCountryListItem,
});
