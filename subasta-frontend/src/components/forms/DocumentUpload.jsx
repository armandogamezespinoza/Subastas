import React from "react";
import { FileUp, FileText, X } from "lucide-react";

export default function DocumentUpload({
  name,
  label,
  accept = ".pdf,application/pdf",
  file,
  onChange,
  required = false,
  hint
}) {
  return (
    <div className="flex flex-col">
      <label 
        htmlFor={name}
        className="text-[11px] font-medium tracking-wide uppercase text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center justify-between"
      >
        <span>
          {label}
          {required && <span className="text-[#193783] dark:text-amber-400/80 ml-1" aria-hidden="true">*</span>}
        </span>
        {hint && <span className="text-[10px] text-neutral-500 font-normal lowercase">{hint}</span>}
      </label>

      <label
        htmlFor={name}
        className={`relative flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
          file
            ? "bg-neutral-100/80 dark:bg-white/[0.04] border-neutral-300 dark:border-white/[0.14] text-neutral-900 dark:text-neutral-200"
            : "bg-neutral-50/70 hover:bg-neutral-100/70 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] border-dashed border-neutral-300 hover:border-[#193783]/50 dark:border-white/[0.12] dark:hover:border-amber-400/40 text-neutral-600 dark:text-neutral-400"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            file 
              ? "bg-[#193783]/10 text-[#193783] dark:bg-amber-400/10 dark:text-amber-400" 
              : "bg-neutral-200/60 text-neutral-500 group-hover:text-[#193783] dark:bg-white/[0.03] dark:text-neutral-500 dark:group-hover:text-amber-400"
          }`}>
            {file ? <FileText size={16} /> : <FileUp size={16} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium tracking-tight truncate text-neutral-900 dark:text-[#f5f5f7]">
              {file ? file.name : "Seleccionar documento"}
            </span>
            <span className="text-[10px] text-neutral-500 tabular-nums">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · PDF cargado` : "Formato PDF (máximo 10 MB)"}
            </span>
          </div>
        </div>

        {file ? (
          <button
            type="button"
            aria-label={`Quitar ${label}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/[0.08] transition-colors"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange(null);
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <span className="text-[11px] font-medium text-[#193783] dark:text-amber-400/80 dark:group-hover:text-amber-400 transition-colors uppercase tracking-wider font-mono">
            Adjuntar
          </span>
        )}

        <input
          id={name}
          name={name}
          type="file"
          accept={accept}
          required={required && !file}
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}
