import { useCallback, useRef, useState } from 'react';

/**
 * Parameters for useControllableState.
 */
export interface UseControllableStateOptions<T> {
  /** Controlled value. When provided, internal state is ignored. */
  value?: T;
  /** Default value for uncontrolled mode. */
  defaultValue?: T;
  /** Fallback value when neither value nor defaultValue is provided. */
  fallback: T;
  /** Called whenever the value changes, in both modes. */
  onChange?: (value: T) => void;
}

/**
 * Mimics the controlled/uncontrolled pattern of React's <input>.
 *
 * Returns a [value, setValue] tuple where:
 *   - If `options.value` is defined, the state is fully controlled by
 *     the parent. setValue calls onChange but does not touch local state.
 *   - If `options.value` is undefined, the state is internal. setValue
 *     updates local state and calls onChange.
 *
 * Both modes guarantee that onChange is called with the new value.
 *
 * This hook is intentionally kept private to @intl-ui/react — it's an
 * implementation detail of usePhoneInput, not part of the public API.
 */
export function useControllableState<T>(
  options: UseControllableStateOptions<T>,
): readonly [T, (next: T | ((prev: T) => T)) => void] {
  const { value: controlledValue, defaultValue, fallback, onChange } = options;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<T>(
    defaultValue !== undefined ? defaultValue : fallback,
  );

  // Use a ref to get the most recent value inside setValue without
  // forcing consumers to add the value to their dependency arrays.
  const valueRef = useRef<T>(
    isControlled ? (controlledValue as T) : internalValue,
  );
  valueRef.current = isControlled
    ? (controlledValue as T)
    : internalValue;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === 'function'
          ? (next as (prev: T) => T)(valueRef.current)
          : next;

      if (!isControlled) {
        setInternalValue(resolved);
      }

      onChange?.(resolved);
    },
    [isControlled, onChange],
  );

  const value = isControlled ? (controlledValue as T) : internalValue;

  return [value, setValue] as const;
}
