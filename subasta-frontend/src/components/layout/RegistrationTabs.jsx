import React from "react";

export default function RegistrationTabs({ value, onChange, tabs }) {
  return (
    <div className="w-full">
      <div 
        className="grid grid-cols-2 p-1.5 rounded-2xl bg-neutral-200/50 dark:bg-[#141417]/80 border border-neutral-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-sm dark:shadow-lg dark:shadow-black/50 transition-colors duration-200"
        role="tablist" 
        aria-label="Tipo de registro"
      >
        {tabs.map(({ value: tabValue, label, detail, icon: Icon }) => {
          const active = value === tabValue;
          return (
            <button
              key={tabValue}
              type="button"
              role="tab"
              id={`tab-${tabValue}`}
              aria-selected={active}
              aria-controls={`panel-${tabValue}`}
              tabIndex={active ? 0 : -1}
              className={`relative flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-left transition-all duration-200 ease-out ${
                active
                  ? "bg-white dark:bg-white/[0.08] text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-white/[0.12] shadow-sm shadow-neutral-900/5 dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/30 dark:hover:bg-white/[0.03] border border-transparent"
              }`}
              onClick={() => onChange(tabValue)}
            >
              {active && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#193783] dark:bg-amber-400 rounded-full" />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                active 
                  ? "bg-[#193783]/10 text-[#193783] dark:bg-amber-400/10 dark:text-amber-400" 
                  : "bg-neutral-200/60 text-neutral-500 dark:bg-white/[0.04] dark:text-neutral-400"
              }`}>
                <Icon size={16} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-medium tracking-tight truncate">
                  {label}
                </span>
                <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-500 dark:text-neutral-500">
                  {detail}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
