import { useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const shortDate = (key, lang) => new Date(`${key}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-BD' : 'bn-BD', { day: 'numeric', month: 'short' });

// Light-weight bar chart (plain HTML, no chart library): tap or drag across the bars to read a day.
// data = [{ key: 'YYYY-MM-DD', value }]
export default function BarChart({ data, format, label }) {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const [sel, setSel] = useState(null);
  const idx = sel ?? data.length - 1;
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  const pick = (e) => {
    const r = ref.current.getBoundingClientRect();
    setSel(Math.min(data.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * data.length))));
  };

  const cur = data[idx];
  return (
    <div>
      <p className="mb-2 flex items-baseline justify-between gap-3 text-sm" aria-live="polite">
        <span className="text-muted">{cur ? shortDate(cur.key, lang) : ''}</span>
        <span className="text-lg font-bold text-primary">{cur ? format(cur.value) : ''}</span>
      </p>
      <div
        ref={ref} role="img" aria-label={`${label}: ${format(total)}`}
        onPointerDown={pick} onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && pick(e)}
        className="flex h-44 cursor-pointer items-end gap-px"
        style={{ touchAction: 'pan-y' }}
      >
        {data.map((d, i) => (
          <div key={d.key} className="flex h-full min-w-0 flex-1 items-end">
            <div
              className={`w-full rounded-t-sm transition-colors ${d.value === 0 ? 'bg-line' : i === idx ? 'bg-primary' : 'bg-primary/35'}`}
              style={{ height: d.value === 0 ? '2px' : `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted" aria-hidden="true">
        <span>{data[0] && shortDate(data[0].key, lang)}</span>
        <span>{data[Math.floor(data.length / 2)] && shortDate(data[Math.floor(data.length / 2)].key, lang)}</span>
        <span>{data.at(-1) && shortDate(data.at(-1).key, lang)}</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>{data.map((d) => <tr key={d.key}><th scope="row">{d.key}</th><td>{format(d.value)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
