import {
  Directive,
  forwardRef,
  inject,
  type OnInit,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { IntlPhoneInputComponent } from './phone-input.component';

/**
 * ControlValueAccessor that bridges <intl-phone-input> with Angular
 * Reactive Forms and Template-driven Forms.
 *
 * This directive is automatically applied when you use formControlName,
 * formControl, or ngModel on an <intl-phone-input>.
 *
 * @example
 * ```html
 * <!-- Reactive Forms -->
 * <intl-phone-input formControlName="phone" [defaultCountry]="'us'" />
 *
 * <!-- Template-driven -->
 * <intl-phone-input [(ngModel)]="phone" [defaultCountry]="'co'" />
 * ```
 */
@Directive({
  selector: 'intl-phone-input[formControlName],intl-phone-input[formControl],intl-phone-input[ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IntlPhoneInputValueAccessorDirective),
      multi: true,
    },
  ],
})
export class IntlPhoneInputValueAccessorDirective implements ControlValueAccessor, OnInit {
  private readonly host = inject(IntlPhoneInputComponent);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    // Override the onInput to also notify the form
    const origOnInput = this.host.onInput.bind(this.host);
    this.host.onInput = (event: Event) => {
      origOnInput(event);
      this.onChange(this.host.store.value());
    };

    const origOnCountrySelect = this.host.onCountrySelect.bind(this.host);
    this.host.onCountrySelect = (iso2: string) => {
      origOnCountrySelect(iso2);
      this.onChange(this.host.store.value());
    };

    // Mark as touched on blur
    const origHandleBlur = this.host.store.handleBlur;
    this.host.store.handleBlur = () => {
      origHandleBlur();
      this.onTouched();
    };
  }

  writeValue(value: string | null): void {
    if (!this.host.store) return;
    const v = value ?? '';
    this.host.store.setValue(v);
    this.host.value.set(v);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // Future: propagate disabled state to the host component
  }
}
