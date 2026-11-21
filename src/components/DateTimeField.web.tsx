import { createElement } from 'react';

import { C } from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const toInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** Parses "YYYY-MM-DDTHH:mm" as local time (no timezone surprises). */
const fromInput = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
};

/**
 * Web: a native <input type="datetime-local">. On iPhone, tapping it opens the
 * system date & time wheel.
 */
export function DateTimeChange({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  return createElement('input', {
    type: 'datetime-local',
    value: toInput(value),
    onChange: (e: { target: { value: string } }) => {
      const d = fromInput(e.target.value);
      if (d) onChange(d);
    },
    style: {
      background: C.panelHi,
      color: C.text,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      padding: '8px 14px',
      font: '500 14px -apple-system, system-ui, sans-serif',
      colorScheme: 'dark',
      minHeight: 36,
    },
  });
}
