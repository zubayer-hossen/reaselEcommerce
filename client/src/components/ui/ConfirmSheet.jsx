import { Loader2 } from 'lucide-react';
import BottomSheet from './BottomSheet.jsx';
import Button from './Button.jsx';

// "Are you sure?" bottom sheet — big buttons so it is safe to use on a phone.
export default function ConfirmSheet({ open, title, text, confirmLabel, cancelLabel, closeLabel, danger = false, busy = false, onConfirm, onClose, children }) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} closeLabel={closeLabel}>
      {text && <p className="text-muted">{text}</p>}
      {children}
      <div className="mt-5 flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>{cancelLabel}</Button>
        <Button type="button" className={`flex-1 ${danger ? '!bg-danger !text-white' : ''}`} onClick={onConfirm} disabled={busy}>
          {busy && <Loader2 className="animate-spin" size={18} />} {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}
