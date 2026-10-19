import React from "react";
import { Gauge, Sun, Moon } from "lucide-react";

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <nav className="w-full h-16 px-6 sm:px-10 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0b0b0c]/80 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#193783]/10 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-amber-500/5 border border-[#193783]/20 dark:border-amber-500/30 flex items-center justify-center text-[#193783] dark:text-amber-400 transition-colors">
          <Gauge size={18} strokeWidth={1.75} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-900 dark:text-[#f5f5f7]">
            SUBASTA
          </span>
          <span className="text-[10px] text-neutral-500 tracking-wider uppercase font-mono">
            Expediente de Admisión
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-[#193783] dark:bg-amber-400/80" />
          <span>PORTAL DE ADMISIÓN 2026</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-white/[0.08] bg-neutral-100/80 dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all duration-200"
          title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
        >
          {theme === "dark" ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-[#193783]" />
          )}
        </button>
      </div>
    </nav>
  );
}
