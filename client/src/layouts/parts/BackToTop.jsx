import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

// Sits at the bottom-end; the chatbot (Phase 9) is placed higher so the two never overlap.
export default function BackToTop() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('public.backToTop')}
          className="fixed end-4 z-30 grid size-12 place-items-center rounded-full bg-primary text-primary-fg shadow-soft"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
        >
          <ArrowUp size={22} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
