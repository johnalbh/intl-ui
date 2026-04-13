import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  viewChild,
  type OnInit,
} from '@angular/core';
import type { Country, CountryIso2 } from '@intl-ui/core';

import { createPhoneInputStore, type PhoneInputStore } from './phone-input-store';
import type { ValueChangeMeta } from './types';

/**
 * Standalone phone input component with built-in country selector.
 *
 * This is the Angular equivalent of <PhoneInput /> from @intl-ui/react.
 * It provides a complete phone input with dropdown country selector,
 * keyboard navigation, and search filtering.
 *
 * For headless usage, use `createPhoneInputStore()` directly and build
 * your own template — same pattern as usePhoneInput() in React.
 *
 * @example
 * ```html
 * <!-- Simple usage -->
 * <intl-phone-input
 *   [defaultCountry]="'us'"
 *   (valueChange)="onPhoneChange($event)"
 * />
 *
 * <!-- With two-way binding -->
 * <intl-phone-input [(value)]="phoneNumber" [defaultCountry]="'co'" />
 * ```
 */
@Component({
  selector: 'intl-phone-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'intl-phone-input',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="intl-phone-input__wrapper">
      <!-- Country select trigger -->
      <button
        type="button"
        class="intl-phone-input__trigger"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="store.isOpen()"
        (click)="store.toggleDropdown()"
        (keydown)="onTriggerKeyDown($event)"
      >
        <span class="intl-phone-input__flag">
          {{ store.country()?.flag ?? '\uD83C\uDF10' }}
        </span>
        @if (store.country(); as c) {
          <span class="intl-phone-input__dial-code">+{{ c.dialCode }}</span>
        }
        <span class="intl-phone-input__arrow">&#9662;</span>
      </button>

      <!-- Phone input -->
      <input
        #phoneInput
        type="tel"
        class="intl-phone-input__input"
        autocomplete="tel"
        [attr.placeholder]="placeholder()"
        [value]="store.inputValue()"
        (input)="onInput($event)"
        (focus)="store.handleFocus()"
        (blur)="store.handleBlur()"
        (keydown)="onInputKeyDown($event)"
      />
    </div>

    <!-- Country dropdown -->
    @if (store.isOpen()) {
      <div class="intl-phone-input__dropdown">
        <!-- Search filter -->
        @if (showSearch()) {
          <input
            #searchInput
            type="text"
            class="intl-phone-input__search"
            placeholder="Search countries..."
            [value]="store.filter()"
            (input)="onFilterInput($event)"
            (keydown)="onSearchKeyDown($event)"
          />
        }

        <!-- Country list -->
        <ul role="listbox" aria-label="Select country" class="intl-phone-input__list">
          @for (c of store.visibleCountries(); track c.iso2; let i = $index) {
            <li
              role="option"
              class="intl-phone-input__option"
              [class.intl-phone-input__option--focused]="store.focusedIndex() === i"
              [class.intl-phone-input__option--selected]="c.iso2 === store.country()?.iso2"
              [attr.aria-selected]="c.iso2 === store.country()?.iso2"
              [attr.data-iso2]="c.iso2"
              (click)="onCountrySelect(c.iso2)"
              (mouseenter)="onCountryHover(i)"
            >
              <span class="intl-phone-input__option-flag">{{ c.flag }}</span>
              <span class="intl-phone-input__option-name">{{ c.name }}</span>
              <span class="intl-phone-input__option-dial-code">+{{ c.dialCode }}</span>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class IntlPhoneInputComponent implements OnInit {
  // ─── Inputs ─────────────────────────────────────────────────────
  readonly defaultCountry = input<CountryIso2>();
  readonly defaultValue = input<string>('');
  readonly disableCountryGuess = input(false);
  readonly countries = input<Country[]>();
  readonly preferredCountries = input<CountryIso2[]>([]);
  readonly showSearch = input(true);

  // ─── Two-way binding ────────────────────────────────────────────
  readonly value = model<string>('');

  // ─── Outputs ────────────────────────────────────────────────────
  readonly valueChange = output<ValueChangeMeta>({ alias: 'phoneChange' });
  readonly countryChange = output<Country>();

  // ─── View children ──────────────────────────────────────────────
  private readonly phoneInputEl = viewChild<ElementRef<HTMLInputElement>>('phoneInput');
  private readonly searchInputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // ─── Store ──────────────────────────────────────────────────────
  store!: PhoneInputStore;

  readonly placeholder = computed(() => {
    const c = this.store?.country();
    if (!c) return '+1 234 567 8900';
    return `+${c.dialCode}`;
  });

  private previousCountryIso2: string | null = null;

  ngOnInit(): void {
    this.store = createPhoneInputStore({
      initialValue: this.value() || this.defaultValue(),
      initialCountry: this.defaultCountry(),
      disableCountryGuess: this.disableCountryGuess(),
      countries: this.countries(),
      preferredCountries: this.preferredCountries(),
    });

    this.previousCountryIso2 = this.store.country()?.iso2 ?? null;
  }

  // ─── Event handlers ─────────────────────────────────────────────
  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const meta = this.store.handleInput(raw);
    this.value.set(this.store.value());
    this.valueChange.emit(meta);
    this.emitCountryChangeIfNeeded();
  }

  onCountrySelect(iso2: string): void {
    const meta = this.store.setCountry(iso2 as CountryIso2);
    if (meta) {
      this.value.set(this.store.value());
      this.valueChange.emit(meta);
    }
    this.emitCountryChangeIfNeeded();
    this.phoneInputEl()?.nativeElement.focus();
  }

  onCountryHover(index: number): void {
    this.store.setFocusedIndex(index);
  }

  onFilterInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.store.setFilter(val);
  }

  onTriggerKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case ' ':
        event.preventDefault();
        this.store.openDropdown();
        this.store.moveFocus('down');
        this.focusSearchInput();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.store.openDropdown();
        this.store.moveFocus('up');
        this.focusSearchInput();
        break;
      case 'Enter':
        event.preventDefault();
        this.store.toggleDropdown();
        break;
      case 'Escape':
        event.preventDefault();
        this.store.closeDropdown();
        break;
    }
  }

  onInputKeyDown(event: KeyboardEvent): void {
    if (!this.store.isOpen()) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.store.moveFocus('down');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.store.moveFocus('up');
        break;
      case 'Enter': {
        const focused = this.store.visibleCountries()[this.store.focusedIndex()];
        if (focused) {
          event.preventDefault();
          this.onCountrySelect(focused.iso2);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.store.closeDropdown();
        break;
    }
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.store.moveFocus('down');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.store.moveFocus('up');
        break;
      case 'Enter': {
        const focused = this.store.visibleCountries()[this.store.focusedIndex()];
        if (focused) {
          event.preventDefault();
          this.onCountrySelect(focused.iso2);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.store.closeDropdown();
        this.phoneInputEl()?.nativeElement.focus();
        break;
    }
  }

  onDocumentClick(event: Event): void {
    // Close dropdown when clicking outside
    const target = event.target as HTMLElement;
    const host = (this as unknown as { _elementRef?: ElementRef })._elementRef;
    if (host && !host.nativeElement.contains(target)) {
      this.store.closeDropdown();
    }
  }

  private focusSearchInput(): void {
    // Delay to allow @if to render the search input
    setTimeout(() => this.searchInputEl()?.nativeElement.focus());
  }

  private emitCountryChangeIfNeeded(): void {
    const currentCountry = this.store.country();
    if (currentCountry && currentCountry.iso2 !== this.previousCountryIso2) {
      this.previousCountryIso2 = currentCountry.iso2;
      this.countryChange.emit(currentCountry);
    }
  }
}
