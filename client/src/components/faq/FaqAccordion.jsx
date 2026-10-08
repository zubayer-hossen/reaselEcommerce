import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { localized } from '../../utils/format.js';

// One answer open at a time; smooth height animation (instant for people who prefer reduced motion — see global CSS).
export default function FaqAccordion({ faqs }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(null);
  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-surface">
      {faqs.map((f) => {
        const isOpen = open === f._id;
        return (
          <li key={f._id}>
            <h3>
              <button
                type="button" aria-expanded={isOpen} aria-controls={`faq-${f._id}`} id={`faq-q-${f._id}`}
                onClick={() => setOpen(isOpen ? null : f._id)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-start font-semibold"
              >
                <span>{localized(f.question, lang)}</span>
                <ChevronDown size={20} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-${f._id}`} role="region" aria-labelledby={`faq-q-${f._id}`}
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }} className="overflow-hidden"
                >
                  <p className="whitespace-pre-line px-4 pb-4 text-muted">{localized(f.answer, lang)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
