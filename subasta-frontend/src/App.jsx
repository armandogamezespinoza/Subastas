import React, { useState, useEffect } from "react";
import { UserCheck, Building, Check } from "lucide-react";
import Navbar from "./components/layout/Navbar.jsx";
import RegistrationTabs from "./components/layout/RegistrationTabs.jsx";
import CompradorForm from "./components/forms/CompradorForm.jsx";
import VendedorForm from "./components/forms/VendedorForm.jsx";
import EmailVerificationModal from "./components/verification/EmailVerificationModal.jsx";
import SuccessView from "./components/feedback/SuccessView.jsx";
import Toast from "./components/feedback/Toast.jsx";
import { useOnboarding } from "./hooks/useOnboarding.js";

const CURRENT_YEAR = new Date().getFullYear();

export default function App() {
  const [activeTab, setActiveTab] = useState("comprador");

  // Theme Management: Defaults to dark or user preference, with instant toggle
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("subasta_theme");
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem("subasta_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const onboarding = useOnboarding(activeTab);
  const {
    verification,
    sendVerificationCode,
    verifyEmailCode,
    closeVerification,
    clearVerification,
    submitRegistration,
    submitting,
    successFolio,
    resetRegistration,
    notice,
    dismissNotice
  } = onboarding;

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;
    setActiveTab(nextTab);
    clearVerification();
    resetRegistration({ preserveTab: true });
  };

  const handleEmailChange = (email) => {
    if (email.trim().toLowerCase() !== verification.verifiedEmail.trim().toLowerCase()) {
      clearVerification();
    }
  };

  const handleVerified = (token) => {
    verifyEmailCode(token);
  };

  const handleSubmit = (payload, files) => {
    return submitRegistration({ type: activeTab, payload, files });
  };

  const isVerified = Boolean(verification.verifiedToken);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0b0b0c] text-neutral-900 dark:text-[#f5f5f7] flex flex-col antialiased relative selection:bg-[#193783]/20 selection:text-[#193783] dark:selection:bg-amber-400/30 dark:selection:text-amber-100 transition-colors duration-200">
      {/* Ambient Lighting Depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-32 h-[420px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(25,55,131,0.04),transparent_75%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(245,158,11,0.06),transparent_75%)]"
      />

      {/* Global Navigation */}
      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      {/* Primary Layout Container */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-5 sm:px-8 pt-10 pb-20">
        {/* Clean Editorial Header */}
        <header className="mb-10 text-center sm:text-left space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-200/50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.08] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#193783] dark:bg-amber-400" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-600 dark:text-neutral-400 font-medium">
              · Admisión de Usuarios
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-[#f5f5f7] leading-tight">
            Expediente de Admisión y Registro
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl font-normal leading-relaxed">
            Plataforma de subastas vehiculares de alta gama. Integre sus datos fiscales y documentación para autorizar posturas de compra o publicación de inventario.
          </p>

          {isVerified && (
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check size={14} className="stroke-[2.5]" />
              <span>Correo validado: {verification.verifiedEmail}</span>
            </div>
          )}
        </header>

        {successFolio ? (
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121214]/80 backdrop-blur-2xl p-8 sm:p-12 shadow-sm dark:shadow-2xl dark:shadow-black/80">
            <SuccessView
              folio={successFolio}
              tipo={activeTab}
              onReset={() => {
                resetRegistration();
                clearVerification();
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Segmented Registration Tabs */}
            <RegistrationTabs
              value={activeTab}
              onChange={handleTabChange}
              tabs={[
                {
                  value: "comprador",
                  label: "Postor / Comprador",
                  detail: "Líneas de Puja",
                  icon: UserCheck
                },
                {
                  value: "vendedor",
                  label: "Entidad Vendedora",
                  detail: "Lotes y Liquidación",
                  icon: Building
                }
              ]}
            />

            {/* Clean Card Canvas */}
            <section
              className="relative overflow-hidden rounded-2xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121214]/80 backdrop-blur-2xl shadow-[0_4px_24px_-4px_rgba(15,23,42,0.05)] dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] transition-all duration-300"
              aria-live="polite"
            >
              {/* Form Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 sm:p-8 border-b border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-white/[0.01]">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
                    {activeTab === "comprador" ? "EXPEDIENTE // POSTOR REGISTRADO" : "EXPEDIENTE // CONCESIÓN Y DISPERSIÓN"}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-900 dark:text-[#f5f5f7] mt-1">
                    {activeTab === "comprador" ? "Datos del Comprador" : "Datos del Vendedor"}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {activeTab === "comprador"
                      ? "Complete sus datos fiscales y bancarios para habilitar pujas en tiempo real."
                      : "Registre la información legal y bancaria requerida para la liquidación de lotes adjudicados."}
                  </p>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-6 sm:p-8">
                {activeTab === "comprador" ? (
                  <CompradorForm
                    isEmailVerified={isVerified}
                    verifiedEmail={verification.verifiedEmail}
                    onEmailChange={handleEmailChange}
                    onTriggerEmailVerification={sendVerificationCode}
                    onSubmitRegistration={handleSubmit}
                    submitting={submitting}
                  />
                ) : (
                  <VendedorForm
                    isEmailVerified={isVerified}
                    verifiedEmail={verification.verifiedEmail}
                    onEmailChange={handleEmailChange}
                    onTriggerEmailVerification={sendVerificationCode}
                    onSubmitRegistration={handleSubmit}
                    submitting={submitting}
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Minimalist Editorial Footer */}
      <footer className="relative z-10 border-t border-neutral-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#0b0b0c]/90 backdrop-blur-md py-6 px-6 sm:px-8 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#193783] dark:bg-amber-400/80" />
            <span className="text-neutral-700 dark:text-neutral-400">Plataforma de Subastas</span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span>Mesa de Control y Dictamen</span>
          </div>
          <div className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600 tabular-nums">
            © {CURRENT_YEAR} SUBASTA. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Verification Dialog */}
      <EmailVerificationModal
        isOpen={verification.modalOpen}
        email={verification.targetEmail}
        challengeToken={verification.challengeToken}
        onClose={closeVerification}
        onVerified={handleVerified}
        onResendCode={() => sendVerificationCode(verification.targetEmail, { resend: true })}
      />

      {/* Notifications / Toast Alert System */}
      <Toast notice={notice} onDismiss={dismissNotice} />
    </div>
  );
}
