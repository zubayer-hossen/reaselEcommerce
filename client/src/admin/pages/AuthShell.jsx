import { motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

// Shared frame for login / forgot / reset screens.
export default function AuthShell({ title, subtitle, children }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-4xl font-bold text-primary">{t('brand')}</p>
          <div className="mt-2 h-1 w-14 rounded-full bg-accent" />
        </div>
        <div className="flex gap-1">
          <button onClick={toggleLang} className="min-h-11 rounded-control px-3 text-sm font-medium hover:bg-surface-2">{lang === 'bn' ? 'EN' : 'বাং'}</button>
          <button onClick={toggleTheme} aria-label={t('common.theme')} className="grid size-11 place-items-center rounded-control hover:bg-surface-2">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-card border border-line bg-surface p-6 shadow-soft">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </motion.section>
    </main>
  );
}
