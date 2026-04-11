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

/**
 * Playground root — mounts every demo side by side so you can click
 * through them and compare the three consumption patterns.
 *
 * Add new demos by importing them here and adding a <DemoSection> entry.
 */
export function App() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">@intl-ui/react playground</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manual testing ground for the headless hooks and (soon) the
          compound components. Not a production app — Tailwind is loaded
          via CDN and there is no bundle optimization.
        </p>
      </header>

      <DemoSection
        title="1. Uncontrolled, full-featured"
        description="The hook owns both the phone value and the selected country. The parent only listens via onValueChange."
      >
        <BasicUncontrolledDemo />
      </DemoSection>

      <DemoSection
        title="2. Controlled by parent state"
        description="Parent holds the value in its own useState and passes it via the value prop, mimicking React's native <input>."
      >
        <ControlledDemo />
      </DemoSection>

      <DemoSection
        title="3. Minimal headless (no dropdown)"
        description="The smallest possible consumer. Shows the live parsed object so you can watch the hook detect countries as you type."
      >
        <MinimalHeadlessDemo />
      </DemoSection>

      <header className="border-b pb-2 pt-8">
        <h1 className="text-xl font-bold">Compound components</h1>
        <p className="text-sm text-gray-600 mt-1">
          The middle abstraction level: one-liner, full compound layout,
          and the asChild pattern. All backed by the same underlying
          usePhoneInput hook, just wrapped in ergonomic React components.
        </p>
      </header>

      <DemoSection
        title="4. One-liner (<PhoneInput />)"
        description="Zero children, styling passed via triggerProps/inputProps. The fastest way to drop a phone input into any page."
      >
        <OneLinerDemo />
      </DemoSection>

      <DemoSection
        title="5. Full compound layout (<PhoneInput.Root>)"
        description="Complete control of the layout while the children still handle state, events, and ARIA via context."
      >
        <CompoundDemo />
      </DemoSection>

      <DemoSection
        title="6. asChild — clone a styled input"
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
