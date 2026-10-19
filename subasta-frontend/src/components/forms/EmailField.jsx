import React from "react";
import { Check, Mail } from "lucide-react";
import FormField from "./FormField.jsx";

export default function EmailField({
  email,
  setEmail,
  isEmailVerified,
  verifiedEmail,
  onEmailChange,
  onTriggerEmailVerification
}) {
  const verified = isEmailVerified && email.trim().toLowerCase() === verifiedEmail.trim().toLowerCase();

  const handleChange = (event) => {
    setEmail(event.target.value);
    onEmailChange?.(event.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
        <div className="flex-1">
          <FormField
            label="Correo electrónico"
            name="email"
            type="email"
            value={email}
            onChange={handleChange}
            placeholder="postor@ejemplo.com"
            autoComplete="email"
            required
            tabular
          />
        </div>
        <button
          type="button"
          onClick={() => onTriggerEmailVerification(email)}
          disabled={verified || !email.trim()}
          className={`h-[42px] px-4 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out border ${
            verified
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 cursor-default"
              : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-neutral-200 dark:border-white/[0.1] active:scale-[0.98]"
          }`}
        >
          {verified ? (
            <>
              <Check size={14} className="stroke-[2.5]" />
              <span>Verificado</span>
            </>
          ) : (
            <>
              <Mail size={14} />
              <span>Verificar correo</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
        {verified ? (
          <span className="text-emerald-600 dark:text-emerald-400/90 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Dirección validada para recibir notificaciones de adjudicación.
          </span>
        ) : (
          <span>Se enviará un código de verificación para autorizar el expediente.</span>
        )}
      </div>
    </div>
  );
}
