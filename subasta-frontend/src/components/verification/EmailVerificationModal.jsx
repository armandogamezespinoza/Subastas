import React, { useEffect, useRef, useState } from "react";
import { Mail, X, Check } from "lucide-react";

export default function EmailVerificationModal({
  isOpen,
  email,
  challengeToken,
  onClose,
  onVerified,
  onResendCode
}) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, challengeToken]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !verifying && !resending) onClose();
      if (event.key === "Tab") {
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
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !verifying && !resending) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-white/[0.1] shadow-2xl p-6 sm:p-8 space-y-6 text-neutral-900 dark:text-[#f5f5f7] transition-colors"
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="verification-title"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          disabled={verifying || resending}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
        >
          <X size={16} />
        </button>

        <div className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#193783]/10 dark:bg-amber-400/10 border border-[#193783]/20 dark:border-amber-400/20 text-[#193783] dark:text-amber-400 flex items-center justify-center mb-4">
            <Mail size={20} strokeWidth={1.75} />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#193783] dark:text-amber-400 font-semibold">
            AUTORIZACIÓN DIGITAL
          </span>
          <h2 id="verification-title" className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Código de Verificación
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Hemos transmitido un código numérico a <strong className="text-neutral-900 dark:text-white font-medium">{email}</strong>. Ingréselo para validar la autenticidad del remitente.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="verification-code" className="text-[11px] font-medium tracking-wide uppercase text-neutral-600 dark:text-neutral-400 mb-2 block">
              Código de 6 dígitos
            </label>
            <input
              ref={inputRef}
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
              className="w-full bg-neutral-50 dark:bg-[#0b0b0c] border border-neutral-300 dark:border-white/[0.12] focus:border-[#193783] dark:focus:border-amber-400/60 focus:ring-1 focus:ring-[#193783]/20 dark:focus:ring-amber-400/40 rounded-xl py-3 px-4 text-center font-mono text-2xl tracking-[0.35em] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-700 outline-none transition-all tabular-nums"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || code.length !== 6 || !challengeToken}
            className="w-full h-11 rounded-xl bg-[#193783] hover:bg-[#142c6a] dark:bg-amber-400 dark:hover:bg-amber-300 disabled:opacity-30 text-white dark:text-neutral-950 font-semibold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md dark:shadow-lg dark:shadow-amber-500/10"
          >
            {verifying ? (
              <span className="w-4 h-4 border-2 border-white/40 dark:border-neutral-950/40 border-t-white dark:border-t-neutral-950 rounded-full animate-spin" />
            ) : (
              <>
                <Check size={16} className="stroke-[2.5]" />
                <span>Validar Código</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-neutral-200 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={resend}
            disabled={resending || verifying}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors disabled:opacity-50 font-medium"
          >
            {resending ? "Generando nuevo código..." : "¿No recibió el código? Reenviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
