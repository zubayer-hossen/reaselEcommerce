import { motion, useReducedMotion } from 'motion/react';
import { Check, X, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatDateTime, localized } from '../../utils/format.js';

const MAIN = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const TERMINAL = ['cancelled', 'failed', 'returned'];

// ✓ done · ● current (pulsing) · ○ still to come. For cancelled / failed / returned orders the line stops where the
// order got to and ends with a red step. Each step shows the date, time and message of its latest visible update.
export default function TrackTimeline({ status, lastMain, events }) {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const ended = TERMINAL.includes(status);
  const reached = MAIN.indexOf(lastMain);
  const last = (s) => [...events].reverse().find((e) => e.status === s);

  const steps = MAIN.map((key, i) => {
    let state = 'todo';
    if (i < reached) state = 'done';
    else if (i === reached) state = ended || key === 'delivered' ? 'done' : 'current';
    return { key, state, event: last(key) };
  }).filter((s) => !ended || s.state !== 'todo');
  if (ended) steps.push({ key: status, state: 'bad', event: last(status) });

  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const dot = s.state === 'done' ? 'bg-primary text-primary-fg' : s.state === 'bad' ? 'bg-danger text-white'
          : s.state === 'current' ? 'bg-accent text-ink' : 'border-2 border-line bg-surface text-transparent';
        return (
          <motion.li
            key={s.key}
            initial={reduce ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="relative flex gap-4 pb-7 last:pb-0"
            aria-current={s.state === 'current' ? 'step' : undefined}
          >
            {!isLast && (
              <span aria-hidden="true" className="absolute start-[15px] top-8 h-[calc(100%-2rem)] w-0.5 bg-line">
                {(s.state === 'done' || s.state === 'bad') && (
                  <motion.span className="block w-full origin-top bg-primary" style={{ height: '100%' }} initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.08 + 0.1, duration: 0.4 }} />
                )}
              </span>
            )}
            <span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ${dot}`}>
              {s.state === 'done' && <Check size={18} strokeWidth={3} />}
              {s.state === 'bad' && (s.key === 'returned' ? <RotateCcw size={16} /> : <X size={18} strokeWidth={3} />)}
              {s.state === 'current' && (
                <>
                  {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-accent/60" aria-hidden="true" />}
                  <span className="relative size-3 rounded-full bg-ink" />
                </>
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={`font-semibold ${s.state === 'todo' ? 'text-muted' : s.state === 'bad' ? 'text-danger' : ''}`}>
                {t(`public.track.status.${s.key}`)}
                {s.state === 'current' && <span className="ms-2 rounded-full bg-accent/25 px-2 py-0.5 text-xs font-medium">{t('public.track.now')}</span>}
              </p>
              {s.event && (
                <>
                  <p className="mt-0.5 text-sm">{localized(s.event.message, lang)}</p>
                  <p className="text-xs text-muted">{formatDateTime(s.event.createdAt, lang)}</p>
                </>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
