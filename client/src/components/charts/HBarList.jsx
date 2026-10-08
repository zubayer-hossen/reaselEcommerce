// Ranked list with proportional bars. items = [{ key, label, value, text, sub? }] (value drives the bar width).
export default function HBarList({ items, empty }) {
  if (!items.length) return <p className="py-4 text-center text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{i.label}</span>
            <span className="shrink-0 font-semibold">{i.text}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2" role="presentation">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, (i.value / max) * 100)}%` }} />
          </div>
          {i.sub && <p className="mt-0.5 text-xs text-muted">{i.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
