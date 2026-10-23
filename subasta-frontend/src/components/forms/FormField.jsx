import React from "react";

export default function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  autoComplete,
  error,
  hint,
  tabular = false,
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label 
        htmlFor={name}
        className="text-[11px] font-medium tracking-wide uppercase text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center"
      >
        <span>{label}</span>
        {required && <span className="text-[#193783] dark:text-amber-400/80 ml-1" aria-hidden="true">*</span>}
      </label>

      {children || (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
          className={`w-full bg-white dark:bg-[#0b0b0c]/60 border rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-[#f5f5f7] placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none transition-all duration-200 ease-out ${
            tabular ? "tabular-nums" : ""
          } ${
            error 
              ? "border-rose-400 dark:border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 bg-rose-50/50 dark:bg-rose-500/[0.02]" 
              : "border-neutral-300 dark:border-white/[0.08] hover:border-neutral-400 dark:hover:border-white/[0.14] focus:border-[#193783] focus:ring-1 focus:ring-[#193783]/20 dark:focus:border-amber-400/50 dark:focus:ring-amber-400/30"
          }`}
          {...props}
        />
      )}

      {error ? (
        <small className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium" id={`${name}-error`}>
          {error}
        </small>
      ) : hint ? (
        <small className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-1" id={`${name}-hint`}>
          {hint}
        </small>
      ) : null}
    </div>
  );
}
