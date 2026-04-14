import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IntlPhoneInputComponent,
  IntlPhoneInputValueAccessorDirective,
  IntlPhoneValidators,
  createPhoneInputStore,
  type Country,
  type CountryIso2,
  type ValueChangeMeta,
} from '@intl-ui/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IntlPhoneInputComponent,
    IntlPhoneInputValueAccessorDirective,
  ],
  template: `
    <div class="container">
      <header class="header">
        <h1>&#64;intl-ui/angular &mdash; Playground</h1>
        <p class="subtitle">
          Angular {{ angularVersion }} &bull; Standalone components &bull; Signal-based
        </p>
      </header>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- DEMO 1: Simple component with two-way binding              -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="demo-section">
        <h2>1. Simple &mdash; Two-way binding</h2>
        <p class="demo-desc">
          Basic usage with <code>[(value)]</code> two-way binding and a default country.
        </p>

        <div class="demo-box">
          <intl-phone-input
            [defaultCountry]="'co'"
            [(value)]="simplePhone"
            (phoneChange)="onSimpleChange($event)"
            (countryChange)="onSimpleCountryChange($event)"
          />
        </div>

        <div class="state-inspector">
          <div class="state-row">
            <span class="state-label">value (E.164)</span>
            <code class="state-value">{{ simplePhone() || '(empty)' }}</code>
          </div>
          @if (simpleCountry(); as c) {
            <div class="state-row">
              <span class="state-label">Country</span>
              <code class="state-value">{{ c.flag }} {{ c.name }} (+{{ c.dialCode }})</code>
            </div>
          }
          @if (simpleMeta(); as m) {
            <div class="state-row">
              <span class="state-label">Valid</span>
              <code class="state-value" [class.valid]="m.isValid" [class.invalid]="!m.isValid">
                {{ m.isValid ? 'Yes' : 'No' }}
              </code>
            </div>
            <div class="state-row">
              <span class="state-label">Source</span>
              <code class="state-value">{{ m.source }}</code>
            </div>
          }
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- DEMO 2: Reactive Forms with validation                     -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="demo-section">
        <h2>2. Reactive Forms &mdash; ControlValueAccessor</h2>
        <p class="demo-desc">
          Works with Angular Reactive Forms via
          <code>formControlName</code>. Includes <code>IntlPhoneValidators.validPhone()</code>.
        </p>

        <form [formGroup]="phoneForm" class="demo-box" (ngSubmit)="onSubmit()">
          <intl-phone-input
            formControlName="phone"
            [defaultCountry]="'us'"
          />

          <div class="form-status">
            @if (phoneForm.controls.phone.errors; as errors) {
              @if (errors['required']) {
                <span class="error">Phone is required</span>
              }
              @if (errors['intlPhone']; as err) {
                <span class="error">Invalid phone: {{ err.error }}</span>
              }
            }
            @if (phoneForm.controls.phone.valid && phoneForm.controls.phone.value) {
              <span class="success">Valid phone number</span>
            }
          </div>

          <div class="state-inspector">
            <div class="state-row">
              <span class="state-label">Form value</span>
              <code class="state-value">{{ phoneForm.controls.phone.value || '(empty)' }}</code>
            </div>
            <div class="state-row">
              <span class="state-label">Status</span>
              <code class="state-value">{{ phoneForm.controls.phone.status }}</code>
            </div>
            <div class="state-row">
              <span class="state-label">Touched</span>
              <code class="state-value">{{ phoneForm.controls.phone.touched }}</code>
            </div>
            <div class="state-row">
              <span class="state-label">Dirty</span>
              <code class="state-value">{{ phoneForm.controls.phone.dirty }}</code>
            </div>
          </div>

          <button type="submit" class="submit-btn" [disabled]="phoneForm.invalid">
            Submit
          </button>
        </form>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- DEMO 3: Headless store                                     -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="demo-section">
        <h2>3. Headless &mdash; createPhoneInputStore()</h2>
        <p class="demo-desc">
          Build your own template using the signal-based store directly.
          Same pattern as <code>usePhoneInput()</code> in React.
        </p>

        <div class="demo-box">
          <div class="custom-phone">
            <button
              type="button"
              class="custom-trigger"
              (click)="headlessStore.toggleDropdown()"
            >
              {{ headlessStore.country()?.flag ?? '\uD83C\uDF10' }}
              @if (headlessStore.country(); as c) {
                <span>+{{ c.dialCode }}</span>
              }
            </button>

            <input
              type="tel"
              class="custom-input"
              [value]="headlessStore.inputValue()"
              (input)="onHeadlessInput($event)"
              (focus)="headlessStore.handleFocus()"
              (blur)="headlessStore.handleBlur()"
              placeholder="Enter phone number"
            />

            <button type="button" class="reset-btn" (click)="headlessStore.reset()">
              Reset
            </button>
          </div>

          @if (headlessStore.isOpen()) {
            <ul class="custom-dropdown">
              @for (c of headlessStore.visibleCountries(); track c.iso2; let i = $index) {
                <li
                  class="custom-option"
                  [class.focused]="headlessStore.focusedIndex() === i"
                  (click)="onHeadlessCountrySelect(c.iso2)"
                >
                  {{ c.flag }} {{ c.name }}
                  <span class="dial-code">+{{ c.dialCode }}</span>
                </li>
              }
            </ul>
          }
        </div>

        <div class="state-inspector">
          <div class="state-row">
            <span class="state-label">value</span>
            <code class="state-value">{{ headlessStore.value() || '(empty)' }}</code>
          </div>
          <div class="state-row">
            <span class="state-label">inputValue</span>
            <code class="state-value">{{ headlessStore.inputValue() || '(empty)' }}</code>
          </div>
          <div class="state-row">
            <span class="state-label">isValid</span>
            <code class="state-value" [class.valid]="headlessStore.isValid()" [class.invalid]="!headlessStore.isValid()">
              {{ headlessStore.isValid() }}
            </code>
          </div>
          @if (headlessStore.parsed(); as p) {
            <div class="state-row">
              <span class="state-label">E.164</span>
              <code class="state-value">{{ p.e164 }}</code>
            </div>
            <div class="state-row">
              <span class="state-label">National</span>
              <code class="state-value">{{ p.national }}</code>
            </div>
          }
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- DEMO 4: Preferred countries + custom list                  -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <section class="demo-section">
        <h2>4. Preferred countries</h2>
        <p class="demo-desc">
          Pin specific countries to the top of the dropdown list.
        </p>

        <div class="demo-box">
          <intl-phone-input
            [defaultCountry]="'co'"
            [preferredCountries]="preferredCountries"
            [(value)]="preferredPhone"
          />
        </div>

        <div class="state-inspector">
          <div class="state-row">
            <span class="state-label">value</span>
            <code class="state-value">{{ preferredPhone() || '(empty)' }}</code>
          </div>
        </div>
      </section>

      <footer class="footer">
        <p>
          &#64;intl-ui/angular &bull;
          <a href="https://github.com/johnalbh/intl-ui" target="_blank">GitHub</a> &bull;
          <a href="https://johnalbh.github.io/intl-ui/react/" target="_blank">React Playground</a>
        </p>
      </footer>
    </div>
  `,
  styles: [`
    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px 16px;
    }

    .header {
      margin-bottom: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }

    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-top: 4px;
    }

    .demo-section {
      margin-bottom: 48px;
      padding: 24px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .demo-section h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .demo-desc {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 16px;
    }

    .demo-desc code {
      background: #f1f5f9;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 13px;
    }

    .demo-box {
      position: relative;
      margin-bottom: 16px;
    }

    .state-inspector {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
    }

    .state-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }

    .state-row + .state-row {
      border-top: 1px solid #f1f5f9;
    }

    .state-label {
      color: #64748b;
      font-weight: 500;
    }

    .state-value {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      color: #334155;
    }

    .state-value.valid { color: #16a34a; font-weight: 600; }
    .state-value.invalid { color: #dc2626; }

    .form-status {
      margin: 8px 0;
      font-size: 13px;
    }

    .error {
      color: #dc2626;
      font-weight: 500;
    }

    .success {
      color: #16a34a;
      font-weight: 500;
    }

    .submit-btn {
      margin-top: 12px;
      padding: 8px 20px;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    .submit-btn:hover:not(:disabled) { background: #2563eb; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Headless demo custom styles ────────────────────────── */
    .custom-phone {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .custom-trigger {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border: 2px solid #a78bfa;
      border-radius: 8px;
      background: #f5f3ff;
      cursor: pointer;
      font-size: 16px;
      color: #5b21b6;
      font-weight: 600;
      transition: border-color 0.15s;
    }

    .custom-trigger:hover { border-color: #7c3aed; }

    .custom-input {
      flex: 1;
      padding: 8px 12px;
      border: 2px solid #a78bfa;
      border-radius: 8px;
      font-size: 16px;
      outline: none;
      transition: border-color 0.15s;
    }

    .custom-input:focus { border-color: #7c3aed; }

    .reset-btn {
      padding: 8px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #f8fafc;
      cursor: pointer;
      font-size: 13px;
      color: #64748b;
      transition: background 0.15s;
    }

    .reset-btn:hover { background: #f1f5f9; }

    .custom-dropdown {
      list-style: none;
      border: 2px solid #a78bfa;
      border-radius: 8px;
      margin-top: 8px;
      max-height: 200px;
      overflow-y: auto;
      background: #fff;
    }

    .custom-option {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .custom-option:hover,
    .custom-option.focused { background: #f5f3ff; }

    .custom-option .dial-code {
      margin-left: auto;
      color: #94a3b8;
      font-size: 13px;
    }

    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 13px;
    }

    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }

    .footer a:hover { text-decoration: underline; }
  `],
})
export class AppComponent {
  readonly angularVersion = '19';

  // ─── Demo 1: Simple two-way binding ─────────────────────────────
  readonly simplePhone = signal('');
  readonly simpleCountry = signal<Country | null>(null);
  readonly simpleMeta = signal<ValueChangeMeta | null>(null);

  onSimpleChange(meta: ValueChangeMeta): void {
    this.simpleMeta.set(meta);
  }

  onSimpleCountryChange(country: Country): void {
    this.simpleCountry.set(country);
  }

  // ─── Demo 2: Reactive Forms ─────────────────────────────────────
  readonly phoneForm = new FormGroup({
    phone: new FormControl('', [
      Validators.required,
      IntlPhoneValidators.validPhone(),
    ]),
  });

  onSubmit(): void {
    if (this.phoneForm.valid) {
      alert(`Phone submitted: ${this.phoneForm.value.phone}`);
    }
  }

  // ─── Demo 3: Headless store ─────────────────────────────────────
  readonly headlessStore = createPhoneInputStore({
    initialCountry: 'gb' as CountryIso2,
  });

  onHeadlessInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.headlessStore.handleInput(raw);
  }

  onHeadlessCountrySelect(iso2: string): void {
    this.headlessStore.setCountry(iso2 as CountryIso2);
  }

  // ─── Demo 4: Preferred countries ────────────────────────────────
  readonly preferredCountries: CountryIso2[] = ['co', 'us', 'es', 'mx'] as CountryIso2[];
  readonly preferredPhone = signal('');
}
