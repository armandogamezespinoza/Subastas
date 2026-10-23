import React, { useEffect } from "react";
import { Check, AlertCircle, X } from "lucide-react";

export default function Toast({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) return null;
  const isError = notice.type === "error";

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 py-3.5 px-4 rounded-xl border backdrop-blur-xl shadow-xl max-w-md animate-in slide-in-from-bottom-5 duration-200 ${
        isError
          ? "bg-rose-50 border-rose-200 text-rose-950 dark:bg-[#181112]/95 dark:border-rose-500/30 dark:text-rose-200 shadow-rose-900/10"
          : "bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-[#101714]/95 dark:border-emerald-500/30 dark:text-emerald-200 shadow-emerald-900/10"
      }`}
      role={isError ? "alert" : "status"}
    >
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
        isError 
          ? "bg-rose-200/80 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400" 
          : "bg-emerald-200/80 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
      }`}>
        {isError ? <AlertCircle size={14} /> : <Check size={14} className="stroke-[2.5]" />}
      </div>
      <span className="text-xs font-medium leading-relaxed flex-1">
        {notice.message}
      </span>
      <button 
        type="button" 
        onClick={onDismiss} 
        aria-label="Cerrar mensaje"
        className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
