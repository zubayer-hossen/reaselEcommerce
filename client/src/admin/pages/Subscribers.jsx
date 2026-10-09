import { useCallback, useEffect, useState } from 'react';
import { Mail, Trash2, UserCheck, UserX } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmSheet from '../../components/ui/ConfirmSheet.jsx';

export default function Subscribers() {
  const { t } = useLanguage(); const toast = useToast();
  const [items,setItems]=useState(null), [q,setQ]=useState(''), [status,setStatus]=useState('subscribed'), [del,setDel]=useState(null), [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{try{const r=await api.get('/admin/subscribers',{params:{q:q||undefined,status,limit:100}});setItems(r.data.subscribers||[]);}catch(e){toast.error(e.message);}},[q,status,toast]);
  useEffect(()=>{load();},[load]);
  const toggle=async(s)=>{try{await api.patch(`/admin/subscribers/${s._id}/status`,{status:s.status==='subscribed'?'unsubscribed':'subscribed'});load();}catch(e){toast.error(e.message);}};
  const remove=async()=>{setBusy(true);try{await api.delete(`/admin/subscribers/${del._id}`);setDel(null);toast.success(t('admin.subscribers.deleted'));load();}catch(e){toast.error(e.message);}finally{setBusy(false);}};
  return <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Input label={t('admin.subscribers.search')} value={q} onChange={e=>setQ(e.target.value)} placeholder={t('admin.subscribers.searchPlaceholder')}/></div><label className="flex flex-col gap-1.5 text-sm font-medium">{t('admin.subscribers.status')}<select value={status} onChange={e=>setStatus(e.target.value)} className="min-h-12 rounded-control border border-line bg-surface px-4"><option value="subscribed">{t('admin.subscribers.subscribed')}</option><option value="unsubscribed">{t('admin.subscribers.unsubscribed')}</option></select></label></div>
    {!items?<div className="h-32 animate-pulse rounded-card bg-surface-2"/>:items.length===0?<div className="rounded-card border border-dashed border-line p-10 text-center"><Mail className="mx-auto text-accent" size={32}/><p className="mt-3 font-semibold">{t('admin.subscribers.empty')}</p></div>:<div className="overflow-x-auto rounded-card border border-line bg-surface"><table className="w-full min-w-[620px] text-sm"><thead className="border-b border-line bg-surface-2"><tr><th className="px-4 py-3 text-start">{t('admin.subscribers.email')}</th><th className="px-4 py-3 text-start">{t('admin.subscribers.source')}</th><th className="px-4 py-3 text-start">{t('admin.subscribers.date')}</th><th className="px-4 py-3 text-end">{t('admin.subscribers.actions')}</th></tr></thead><tbody>{items.map(s=><tr key={s._id} className="border-b border-line last:border-0"><td className="px-4 py-3 font-medium">{s.email}</td><td className="px-4 py-3 text-muted">{s.source}</td><td className="px-4 py-3 text-muted">{new Date(s.subscribedAt||s.createdAt).toLocaleDateString()}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button variant="ghost" onClick={()=>toggle(s)}>{s.status==='subscribed'?<UserX size={16}/>:<UserCheck size={16}/>}</Button><Button variant="ghost" className="text-danger" onClick={()=>setDel(s)}><Trash2 size={16}/></Button></div></td></tr>)}</tbody></table></div>}
    <ConfirmSheet open={!!del} onClose={()=>setDel(null)} onConfirm={remove} busy={busy} danger title={t('admin.subscribers.deleteTitle')} text={del?.email||''} confirmLabel={t('admin.subscribers.delete')} cancelLabel={t('admin.marketing.cancel')} closeLabel={t('admin.common.close')}/>
  </div>;
}
