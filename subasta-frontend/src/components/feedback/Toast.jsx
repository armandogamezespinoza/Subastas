import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) return null;
  const isError = notice.type === 'error';

  return (
    <div className={`toast ${isError ? 'toast-error' : 'toast-success'}`} role={isError ? 'alert' : 'status'}>
      {isError ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
      <span>{notice.message}</span>
      <button className="icon-button" type="button" onClick={onDismiss} aria-label="Cerrar mensaje"><X size={16} /></button>
    </div>
  );
}
