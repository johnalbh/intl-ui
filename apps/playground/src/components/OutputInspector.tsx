/**
 * OutputInspector — the "what does this emit to my backend?" panel.
 *
 * Every demo in the playground mounts one of these at the bottom so
 * you can toggle between the two backend-shaped outputs that real
 * apps typically consume:
 *
 *   1. "Full phone" — a single E.164 string like "+573105551234".
 *      Store this in ONE database column, submit it in ONE form
 *      field. Preferred by most modern backends and matches the
 *      E.164 standard for phone number interchange.
 *
 *   2. "Separate" — two fields: the dial code (e.g. "+57") and the
 *      national portion (e.g. "310 555 1234"). Common in legacy
 *      backends that model phone numbers as (country, number) or
 *      when the dial code needs to be indexed separately for
 *      reporting.
 *
 * Two flavors of this component ship together:
 *
 *   • <OutputInspector api={api} />            — for demos that call
 *                                                 usePhoneInput() directly
 *   • <OutputInspectorInContext />             — for demos wrapped in
 *                                                 <PhoneInput.Root> (uses
 *                                                 usePhoneInputContext)
 *
 * Both render identical UI — only the state source differs.
 */

import { useId, useState } from 'react';
import { usePhoneInputContext } from '@intl-ui/react';
import type { UsePhoneInputReturn } from '@intl-ui/react';

type OutputFormat = 'full' | 'separate';

interface OutputInspectorViewProps {
  api: UsePhoneInputReturn;
}

/**
 * Stateful UI — the part that doesn't care where `api` came from.
 * Both wrappers below render this.
 */
function OutputInspectorView({ api }: OutputInspectorViewProps) {
  const [format, setFormat] = useState<OutputFormat>('full');
  const radioName = useId();

  const fullValue = api.value || '';
  const dialCode = api.country ? `+${api.country.dialCode}` : '';
  const national = api.parsed?.national ?? '';
  const international = api.parsed?.international ?? '';

  return (
    <div className="mt-4 space-y-3">
      {/* ─── Format toggle ─────────────────────────────────────── */}
      <div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Output format
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={radioName}
              value="full"
              checked={format === 'full'}
              onChange={() => setFormat('full')}
            />
            <span>Full phone (E.164)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={radioName}
              value="separate"
              checked={format === 'separate'}
              onChange={() => setFormat('separate')}
            />
            <span>Separate dial code + national</span>
          </label>
        </div>
      </div>

      {/* ─── The live output in the selected shape ─────────────── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
        <div className="text-xs font-semibold text-emerald-900 uppercase tracking-wide mb-2">
          What your backend would receive
        </div>
        {format === 'full' ? (
          <div>
            <div className="text-[11px] text-emerald-700 mb-1">
              phone (E.164)
            </div>
            <div className="font-mono text-sm text-emerald-900 break-all">
              {fullValue || <span className="text-emerald-400">—</span>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-emerald-700 mb-1">dialCode</div>
              <div className="font-mono text-sm text-emerald-900">
                {dialCode || <span className="text-emerald-400">—</span>}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-emerald-700 mb-1">national</div>
              <div className="font-mono text-sm text-emerald-900 break-all">
                {national || <span className="text-emerald-400">—</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Expandable reference view ─────────────────────────── */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-semibold uppercase tracking-wide">
          All formats (for reference)
        </summary>
        <pre className="mt-2 bg-slate-50 border border-slate-200 rounded p-3 overflow-auto text-xs">
{`value (E.164 canonical): ${fullValue || '—'}
inputValue (displayed):  ${api.inputValue || '—'}
national:                ${national || '—'}
international:           ${international || '—'}
dialCode:                ${dialCode || '—'}
country:                 ${api.country?.name ?? '—'} (${api.country?.iso2 ?? '—'})
capital:                 ${api.country?.capital ?? '—'}
isValid:                 ${api.isValid}
isOpen:                  ${api.isOpen}
focusedIndex:            ${api.focusedIndex}
filter:                  ${api.filter || '—'}`}
        </pre>
      </details>
    </div>
  );
}

/**
 * For demos that call usePhoneInput() themselves and pass the
 * returned object down as a prop.
 */
export function OutputInspector({ api }: { api: UsePhoneInputReturn }) {
  return <OutputInspectorView api={api} />;
}

/**
 * For demos wrapped in <PhoneInput.Root>. Reads the api from the
 * React context that Root publishes. Must be rendered inside the
 * Root tree or usePhoneInputContext() throws a clear error.
 */
export function OutputInspectorInContext() {
  const api = usePhoneInputContext();
  return <OutputInspectorView api={api} />;
}
