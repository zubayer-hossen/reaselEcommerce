import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((type, message) => {
    const id = crypto.randomUUID();
    setItems((list) => [...list, { id, type, message }]);
    setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 4000);
  }, []);

  const toast = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {items.map((i) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-control border border-line bg-surface px-4 py-3 text-sm shadow-soft"
            >
              {i.type === 'success'
                ? <CheckCircle2 size={20} className="shrink-0 text-success" />
                : <AlertCircle size={20} className="shrink-0 text-danger" />}
              <span>{i.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
