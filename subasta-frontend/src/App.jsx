import { useState } from 'react';
import { ShoppingBag, Store, ShieldCheck, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import Navbar from './components/layout/Navbar.jsx';
import RegistrationTabs from './components/layout/RegistrationTabs.jsx';
import CompradorForm from './components/forms/CompradorForm.jsx';
import VendedorForm from './components/forms/VendedorForm.jsx';
import EmailVerificationModal from './components/verification/EmailVerificationModal.jsx';
import SuccessView from './components/feedback/SuccessView.jsx';
import Toast from './components/feedback/Toast.jsx';
import { useOnboarding } from './hooks/useOnboarding.js';
import './styles/onboarding.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('comprador');
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
    <div className="min-h-screen bg-[#0b0b0c] text-[#f5f5f7] selection:bg-amber-500/30 selection:text-white flex flex-col antialiased relative selection:text-amber-100">
      {/* Cinematic subtle ambient glow anchor */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(245,158,11,0.08),transparent_75%)] opacity-80" 
      />

      {/* Global Navigation */}
      <Navbar />

      {/* Primary Layout Container */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-5 sm:px-8 pt-12 pb-24">
        {/* Page Header with High-End Restraint */}
        <header className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Protocolo de Verificación KYC / KYB
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5f5f7] leading-tight">
            Alta de Usuarios y Validación de Identidad
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-[#a1a1a6] max-w-2xl font-normal leading-relaxed">
            Acceso seguro a subastas vehiculares de alta gama. Registro cifrado para postores privados y concesionarias verificadas.
          </p>

          {/* Key Metric / Status Strip with Tabular Figures */}
          <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6 pt-5 border-t border-white/[0.05] text-xs text-[#a1a1a6]">
            <div className="flex items-center gap-2">
              <Lock size={13} className="text-amber-400/90" />
              <span>Cifrado TLS 1.3 de grado bancario</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#f5f5f7] bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.06] font-tabular">
                100%
              </span>
              <span>Cumplimiento regulatorio</span>
            </div>
            {isVerified && (
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} />
                <span className="font-medium">Correo verificado: {verification.verifiedEmail}</span>
              </div>
            )}
          </div>
        </header>

        {successFolio ? (
          <div className="rounded-2xl border border-white/[0.1] bg-[#121214]/80 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)]">
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
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214]/60 backdrop-blur-xl p-1.5 shadow-lg">
              <RegistrationTabs
                value={activeTab}
                onChange={handleTabChange}
                tabs={[
                  { 
                    value: 'comprador', 
                    label: 'Postor / Comprador', 
                    detail: 'Persona Física · KYC', 
                    icon: ShoppingBag 
                  },
                  { 
                    value: 'vendedor', 
                    label: 'Vendedor / Loteador', 
                    detail: 'Persona Moral · KYB', 
                    icon: Store 
                  }
                ]}
              />
            </div>

            {/* Apple-grade Obsidian Glass Form Shell */}
            <section 
              className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#121214]/75 backdrop-blur-2xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9),0_0_1px_1px_rgba(255,255,255,0.04)_inset] transition-all duration-300"
              aria-live="polite"
            >
              {/* Subtle Ambient Surface Specular Highlight */}
              <div 
                aria-hidden="true" 
                className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/[0.03] blur-3xl" 
              />

              {/* Form Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 border-b border-white/[0.07] bg-white/[0.015]">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 font-mono">
                    {activeTab === 'comprador' ? '01 // PERSONA FÍSICA' : '02 // PERSONA MORAL & CONSORCIO'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-[#f5f5f7] mt-1">
                    {activeTab === 'comprador' ? 'Expediente del Comprador' : 'Expediente de la Entidad Vendedora'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#a1a1a6] mt-1 font-normal">
                    {activeTab === 'comprador'
                      ? 'Proporcione su identificación oficial y datos fiscales para habilitar líneas de puja.'
                      : 'Adjunte acta constitutiva, poderes notariales y constancia de situación fiscal.'}
                  </p>
                </div>

                <div className="self-start sm:self-center flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-neutral-300">
                  <ShieldCheck size={15} className="text-amber-400" />
                  <span className="font-medium tracking-tight">Expediente blindado</span>
                </div>
              </div>

              {/* Dynamic Sub-form Area */}
              <div className="p-6 sm:p-8">
                {activeTab === 'comprador' ? (
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

      {/* Cinematic Minimalist Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#0b0b0c]/90 backdrop-blur-md py-6 px-6 sm:px-8 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6e6e73]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            <span className="text-[#a1a1a6]">Plataforma de Subastas Privadas</span>
            <span className="text-neutral-700">·</span>
            <span>Estándar ISO/IEC 27001</span>
          </div>
          <div className="font-tabular text-neutral-500">
            © {new Date().getFullYear()} Vault Auction Systems. Todos los derechos reservados.
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
