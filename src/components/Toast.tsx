import { useEffect } from 'react';
import { Activity, X } from 'lucide-react';

export interface ToastProps {
  msg: string;
  type?: 'success' | 'error' | 'info';
  close: () => void;
}

const C = {
  green:  '#20c997',
  red:    '#dc3545',
  violet: '#6f42c1',
};

export default function Toast({ msg, type = 'info', close }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(close, 4500);
    return () => clearTimeout(t);
  }, [close]);

  const clr = type === 'error' ? C.red : type === 'success' ? C.green : C.violet;

  return (
    <div className="toast" style={{ border: `1px solid ${clr}33`, background: 'rgba(5,8,20,0.95)' }} role="alert" aria-live="assertive">
      <Activity size={16} style={{ color: clr, flexShrink: 0 }} aria-hidden="true" />
      <span style={{ fontSize: 13, color: '#ddd', flex: 1 }}>{msg}</span>
      <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)' }} aria-label="Close notification">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
