import { FullUxDemo } from './demos/full-ux-demo';
import {
  BasicUncontrolledDemo,
  ControlledDemo,
  MinimalHeadlessDemo,
} from './demos/usePhoneInput-demo';
import {
  OneLinerDemo,
  CompoundDemo,
  AsChildDemo,
} from './demos/PhoneInput-compound-demo';
import {
  ClearAndRetypeDemo,
  PasteIntlDemo,
  SwitchViaDropdownDemo,
  CompoundClearAndRetypeDemo,
} from './demos/model-b-test-demo';

/**
 * Playground root — mounts every demo side by side so you can click
 * through them and compare the abstraction levels.
 *
 * The first section (FullUxDemo) is the most realistic / interactive
 * demo and the one to use for manual UX testing. Everything below
 * exists for narrower scenarios (regression tests, individual
 * abstraction levels, asChild composition, …).
 */
export function App() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">@intl-ui/react playground</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manual testing ground for the headless hooks and compound
          components. The first demo is the comprehensive interactive
          one — start there. Everything below it covers narrower
          scenarios for regression testing and abstraction-level
          comparison.
        </p>
      </header>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* The main demo — pinned at the top, fully interactive       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <DemoSection
        title="🚀 Full UX demo — start here"
        description="No hardcoded country, working dropdown with search, three ways to switch country (click, +code, or ISO code), live state inspector. This is the showcase consumer."
      >
        <FullUxDemo />
      </DemoSection>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Model B regression tests — bug-fix scenarios               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <header className="border-b pb-2 pt-4">
        <h1 className="text-xl font-bold">🧪 Model B regression tests</h1>
        <p className="text-sm text-gray-600 mt-1">
          Targeted scenarios that exercise the bug fix: backspace can
          clear the input cleanly, country switches happen via dropdown
          or international format paste, and digits survive country
          changes.
        </p>
      </header>

      <DemoSection
        title="Clear and re-type"
        description="Pre-loaded number, Cmd+A + Backspace, type a new one. Previously got stuck on '+57'."
      >
        <ClearAndRetypeDemo />
      </DemoSection>

      <DemoSection
        title="Paste international format → country switches"
        description="One-click paste buttons for international numbers. The trie auto-detects each country."
      >
        <PasteIntlDemo />
      </DemoSection>

      <DemoSection
        title="Switch country via dropdown — digits survive"
        description="Pick a different country from the dropdown. The previously typed national digits get reformatted against the new country's mask."
      >
        <SwitchViaDropdownDemo />
      </DemoSection>

      <DemoSection
        title="Same scenario via compound components"
        description="Proves the fix flows through the compound API as well — handleInputChange runs regardless of how you assemble the UI."
      >
        <CompoundClearAndRetypeDemo />
      </DemoSection>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Headless hook (level 3)                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <header className="border-b pb-2 pt-8">
        <h1 className="text-xl font-bold">Headless hook (level 3)</h1>
        <p className="text-sm text-gray-600 mt-1">
          The lowest abstraction level: <code>usePhoneInput()</code> on its
          own, with the consumer responsible for the entire DOM tree.
        </p>
      </header>

      <DemoSection
        title="Uncontrolled, full-featured"
        description="The hook owns both the phone value and the selected country. The parent only listens via onValueChange."
      >
        <BasicUncontrolledDemo />
      </DemoSection>

      <DemoSection
        title="Controlled by parent state"
        description="Parent holds the value in its own useState and passes it via the value prop, mimicking React's native <input>."
      >
        <ControlledDemo />
      </DemoSection>

      <DemoSection
        title="Minimal headless (no dropdown)"
        description="The smallest possible consumer. Shows the live parsed object so you can watch the hook detect countries as you type."
      >
        <MinimalHeadlessDemo />
      </DemoSection>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Compound components (level 2)                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <header className="border-b pb-2 pt-8">
        <h1 className="text-xl font-bold">Compound components (level 2)</h1>
        <p className="text-sm text-gray-600 mt-1">
          The middle abstraction level: one-liner, full compound layout,
          and the asChild pattern. All backed by the same underlying
          usePhoneInput hook.
        </p>
      </header>

      <DemoSection
        title="One-liner (<PhoneInput />)"
        description="Zero children, styling passed via triggerProps/inputProps. The fastest way to drop a phone input into any page."
      >
        <OneLinerDemo />
      </DemoSection>

      <DemoSection
        title="Full compound layout (<PhoneInput.Root>)"
        description="Complete control of the layout while the children still handle state, events, and ARIA via context."
      >
        <CompoundDemo />
      </DemoSection>

      <DemoSection
        title="asChild — clone a styled input"
        description="When you already have a design-system input and want PhoneInput to take over its behavior without replacing the element."
      >
        <AsChildDemo />
      </DemoSection>
    </div>
  );
}

interface DemoSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function DemoSection({ title, description, children }: DemoSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="bg-white border rounded-lg p-6">{children}</div>
    </section>
  );
}
