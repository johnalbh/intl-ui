import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';

/**
 * Compose multiple refs into a single ref callback.
 *
 * Used internally by Slot to forward a ref to both the outer
 * forwardRef AND whatever ref the user already set on the cloned
 * child. Handles both function refs and MutableRefObject refs.
 */
export function composeRefs<T>(
  ...refs: Array<Ref<T> | undefined | null>
): Ref<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref != null && typeof ref === 'object' && 'current' in ref) {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}

/**
 * Merge two sets of React props.
 *
 * Rules:
 *  - Event handlers (onClick, onKeyDown, …) are COMPOSED: both run,
 *    the base handler first, then the override.
 *  - `className` is concatenated with a space.
 *  - `style` objects are merged, override winning on conflicts.
 *  - Every other key: override wins.
 *
 * This is the prop-merge contract used by every compound component
 * in this package. Event composition is critical so consumers can
 * add their own handlers without breaking the hook's internal logic.
 */
export function mergeProps<T extends Record<string, unknown>>(
  baseProps: T,
  overrideProps: Partial<T>,
): T {
  const merged: Record<string, unknown> = { ...baseProps };

  for (const key in overrideProps) {
    const baseValue = (baseProps as Record<string, unknown>)[key];
    const overrideValue = (overrideProps as Record<string, unknown>)[key];

    if (overrideValue === undefined) continue;

    const isEventHandler =
      /^on[A-Z]/.test(key) && typeof overrideValue === 'function';

    if (isEventHandler) {
      if (typeof baseValue === 'function') {
        // Compose: base runs first, override after. Both fire.
        merged[key] = (...args: unknown[]) => {
          (baseValue as (...a: unknown[]) => unknown)(...args);
          (overrideValue as (...a: unknown[]) => unknown)(...args);
        };
      } else {
        merged[key] = overrideValue;
      }
    } else if (key === 'className') {
      merged[key] = [baseValue, overrideValue].filter(Boolean).join(' ');
    } else if (key === 'style') {
      merged[key] = {
        ...(baseValue as object | undefined),
        ...(overrideValue as object),
      };
    } else {
      merged[key] = overrideValue;
    }
  }

  return merged as T;
}

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

/**
 * Clone a single child element and merge Slot's props into it.
 *
 * Enables the `asChild` pattern popularized by Radix UI:
 *
 *   <PhoneInput.Input asChild>
 *     <MyCustomInput placeholder="Phone" />
 *   </PhoneInput.Input>
 *
 * In that example, Slot clones <MyCustomInput /> and passes the
 * hook-provided props (value, onChange, ref, onKeyDown, …) merged
 * with the props already set on MyCustomInput. The consumer gets
 * full control of the rendered element while the compound child
 * keeps owning the behavior.
 *
 * This is a minimal reimplementation of @radix-ui/react-slot so the
 * package stays at a single external dependency (@intl-ui/core).
 * It handles className concatenation, style merging, event handler
 * composition, and ref forwarding.
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  props,
  forwardedRef,
) {
  const { children, ...slotProps } = props;

  const child = Children.only(children);
  if (!isValidElement(child)) {
    return null;
  }

  const childElement = child as ReactElement<Record<string, unknown>>;
  const merged = mergeProps(
    slotProps as Record<string, unknown>,
    childElement.props,
  );

  // React 18 exposes ref as a top-level property on the element;
  // React 19 moves it into props. Read both to stay compatible.
  const childRef =
    (childElement as { ref?: Ref<HTMLElement> }).ref ??
    (childElement.props as { ref?: Ref<HTMLElement> }).ref;

  const ref = composeRefs<HTMLElement>(
    forwardedRef as ForwardedRef<HTMLElement>,
    childRef,
  );

  return cloneElement(childElement, { ...merged, ref } as never);
});
