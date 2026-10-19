import React, { useState } from "react";
import { Check, Copy, ArrowLeft } from "lucide-react";

export default function SuccessView({ folio, tipo, onReset }) {
  const [copied, setCopied] = useState(false);

  const copyFolio = async () => {
    try {
      await navigator.clipboard.writeText(String(folio));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="py-6 sm:py-10 text-center max-w-lg mx-auto space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-[#193783]/10 dark:bg-amber-400/10 border border-[#193783]/20 dark:border-amber-400/20 text-[#193783] dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
        <Check size={28} className="stroke-[2.5]" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#193783] dark:text-amber-400 font-semibold">
          DICTAMEN EN PROCESO
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-[#f5f5f7]">
          Expediente Registrado con Éxito
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
          Su solicitud como <strong className="text-neutral-800 dark:text-neutral-200">{tipo === "comprador" ? "postor participante" : "entidad vendedora"}</strong> ha sido transmitida a la mesa de control documental.
        </p>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/[0.08] flex items-center justify-between gap-4 max-w-sm mx-auto shadow-sm">
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Folio Único de Seguimiento
          </span>
          <span className="font-mono text-xl font-semibold text-[#193783] dark:text-amber-400 tracking-wider tabular-nums">
            {folio}
          </span>
        </div>

        <button
          type="button"
          onClick={copyFolio}
          className="h-9 px-3 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-neutral-100 dark:hover:bg-white/[0.1] border border-neutral-200 dark:border-white/[0.08] text-xs font-medium text-neutral-700 dark:text-neutral-200 transition-colors flex items-center gap-1.5 shadow-sm"
          aria-label="Copiar folio"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
        Conserve este identificador para consultar el estatus de validación y la asignación de límites de puja.
      </p>

      <div className="pt-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors py-2 px-4 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.04]"
        >
          <ArrowLeft size={14} />
          <span>Iniciar otro registro</span>
        </button>
      </div>
    </div>
  );
}
