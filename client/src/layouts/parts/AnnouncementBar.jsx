import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { localized } from '../../utils/format.js';

const HEX = /^#[0-9a-f]{6}$/i;

// Text, link, colors and dates are all controlled from the admin panel (settings.announcement).
export default function AnnouncementBar() {
  const { settings } = useSettings();
  const { lang } = useLanguage();
  const a = settings?.announcement;
  if (!a) return null;

  const text = localized(a.text, lang);
  if (!text) return null;
  const bg = HEX.test(a.background || '') ? a.background : '#B8913A';
  const inner = <span className="font-medium">{text}</span>;
  const cls = 'block px-4 py-2 text-center text-sm text-[#1d1523]';

  return (
    <div style={{ backgroundColor: bg }}>
      {a.link
        ? a.link.startsWith('/')
          ? <Link to={a.link} className={cls}>{inner}</Link>
          : <a href={a.link} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
        : <p className={cls}>{inner}</p>}
    </div>
  );
}
