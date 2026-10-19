import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Mail, X } from 'lucide-react';

export default function EmailVerificationModal({
  isOpen, email, challengeToken, onClose, onVerified, onResendCode
}) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, challengeToken]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !verifying && !resending) onClose();
      if (event.key === 'Tab') {
        const items = [closeRef.current, inputRef.current].filter(Boolean);
        if (items.length < 2) return;
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items[items.length - 1].focus();
        } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
          event.preventDefault();
          items[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, verifying, resending, onClose]);

  if (!isOpen) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    setVerifying(true);
    try {
      await onVerified({ code });
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await onResendCode();
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !verifying && !resending) onClose();
    }}>
      <section className="verification-modal" role="dialog" aria-modal="true" aria-labelledby="verification-title" aria-describedby="verification-description">
        <button ref={closeRef} className="modal-close icon-button" type="button" onClick={onClose} aria-label="Cerrar verificación" disabled={verifying || resending}><X size={18} /></button>
        <div className="modal-icon"><Mail size={23} /></div>
        <span className="section-kicker">VERIFICACIÓN DE CORREO</span>
        <h2 id="verification-title">Revisa tu bandeja de entrada</h2>
        <p id="verification-description">Enviamos un código de seis dígitos a <strong>{email}</strong>. Introduce el código para continuar.</p>
        <form onSubmit={submit}>
          <label className="otp-label" htmlFor="verification-code">Código de verificación</label>
          <input
            ref={inputRef}
            id="verification-code"
            className="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
          />
          <button className="button button-primary button-full" type="submit" disabled={verifying || code.length !== 6 || !challengeToken}>
            {verifying ? <span className="spinner" /> : <CheckCircle2 size={17} />}
            {verifying ? 'Verificando…' : 'Confirmar código'}
          </button>
        </form>
        <button className="text-button" type="button" onClick={resend} disabled={resending || verifying}>
          {resending ? 'Solicitando nuevo código…' : 'No recibí el código · Reenviar'}
        </button>
      </section>
    </div>
  );
}
