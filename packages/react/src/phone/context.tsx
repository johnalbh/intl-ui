import { createContext, useContext } from 'react';
import type { UsePhoneInputReturn } from './types';

/**
 * React Context carrying the value returned by usePhoneInput().
 *
 * <PhoneInput.Root> calls the hook once and publishes the result
 * through this context. Every child compound component
 * (<PhoneInput.Input>, <PhoneInput.CountrySelect>, …) reads from it.
 *
 * This is deliberately NOT exported from the package — consumers
 * should interact with the compound components, not the context
 * directly. If you find yourself wanting to read the context from
 * outside, it usually means you want the headless usePhoneInput()
 * hook instead.
 */
export const PhoneInputContext = createContext<UsePhoneInputReturn | null>(
  null,
);

/**
 * Read the PhoneInputContext with a clear error message when the
 * consumer forgot to wrap children in <PhoneInput.Root>.
 */
export function usePhoneInputContext(): UsePhoneInputReturn {
  const ctx = useContext(PhoneInputContext);
  if (!ctx) {
    throw new Error(
      '<PhoneInput.*> compound components must be rendered inside ' +
        '<PhoneInput.Root>. If you want a single-element phone input, ' +
        'render <PhoneInput /> (the wrapper) instead of a child on its own.',
    );
  }
  return ctx;
}
