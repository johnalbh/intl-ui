export { usePhoneInput } from './usePhoneInput';
export type {
  UsePhoneInputOptions,
  UsePhoneInputReturn,
  ValueChangeMeta,
  ValueChangeSource,
  PhoneInputProps as PhoneInputInputGetterProps,
  CountrySelectTriggerProps,
  CountryListProps,
  CountryOptionProps,
} from './types';

// Compound component suite
export {
  PhoneInput,
  PhoneInputRoot,
  PhoneInputInput,
  PhoneInputCountrySelect,
  PhoneInputFlag,
  PhoneInputDialCode,
  PhoneInputCountryList,
  PhoneInputCountryListItem,
} from './PhoneInput';
export type {
  PhoneInputProps,
  PhoneInputRootProps,
  PhoneInputInputProps,
  PhoneInputCountrySelectProps,
  PhoneInputFlagProps,
  PhoneInputDialCodeProps,
  PhoneInputCountryListProps,
  PhoneInputCountryListItemProps,
} from './PhoneInput';

// Low-level composition primitives (for power users)
export { Slot, mergeProps, composeRefs } from './Slot';
export type { SlotProps } from './Slot';

// Context hook — exposed so consumers can write their own custom
// compound children that read the phone input state. Throws a clear
// error if called outside <PhoneInput.Root>.
export { usePhoneInputContext } from './context';
