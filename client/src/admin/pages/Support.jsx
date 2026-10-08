import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import TicketsPanel from '../components/TicketsPanel.jsx';
import MessagesPanel from '../components/MessagesPanel.jsx';

// /admin/support?tab=tickets|messages&open=<id>  (notifications link here)
export default function Support() {
  const { t } = useLanguage();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'messages' ? 'messages' : 'tickets';
  const openId = sp.get('open') || undefined;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 rounded-control bg-surface-2 p-1" role="tablist">
        {['tickets', 'messages'].map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setSp({ tab: k })} className={`min-h-11 rounded-control text-sm font-semibold ${tab === k ? 'bg-surface shadow' : 'text-muted'}`}>{t(`admin.support.tab_${k}`)}</button>
        ))}
      </div>
      {tab === 'tickets' ? <TicketsPanel key="t" openId={openId} /> : <MessagesPanel key="m" openId={openId} />}
    </div>
  );
}
