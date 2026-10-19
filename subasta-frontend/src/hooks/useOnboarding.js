import { useCallback, useRef, useState } from 'react';
import { requestEmailCode, confirmEmailCode } from '../services/verificationService.js';
import { registerOnboarding } from '../services/onboardingService.js';

const initialVerification = {
  modalOpen: false,
  targetEmail: '',
  challengeToken: null,
  verifiedToken: null,
  verifiedEmail: ''
};

export function useOnboarding(activeTab) {
  const [verification, setVerification] = useState(initialVerification);
  const [submitting, setSubmitting] = useState(false);
  const [successFolio, setSuccessFolio] = useState(null);
  const [notice, setNotice] = useState(null);
  const submissionLock = useRef(false);
  const verificationRequestId = useRef(0);

  const showNotice = useCallback((type, message) => {
    setNotice({ id: Date.now(), type, message });
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const clearVerification = useCallback(() => {
    verificationRequestId.current += 1;
    setVerification(initialVerification);
  }, []);

  const sendVerificationCode = useCallback(async (email, options = {}) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showNotice('error', 'Ingresa un correo electrónico válido.');
      return;
    }

    const requestId = ++verificationRequestId.current;
    setVerification(current => ({
      ...current,
      targetEmail: normalizedEmail,
      modalOpen: Boolean(options.resend) ? current.modalOpen : false,
      challengeToken: options.resend ? current.challengeToken : null,
      verifiedToken: null,
      verifiedEmail: ''
    }));

    try {
      const data = await requestEmailCode(normalizedEmail);
      if (requestId !== verificationRequestId.current) return;
      if (!data?.challengeToken) {
        throw new Error('El servidor no devolvió un token de desafío.');
      }
      setVerification(current => ({
        ...current,
        targetEmail: normalizedEmail,
        challengeToken: data.challengeToken,
        modalOpen: true
      }));
      showNotice('success', 'Te enviamos un código de verificación.');
    } catch (error) {
      if (requestId !== verificationRequestId.current) return;
      showNotice('error', error.message || 'No se pudo enviar el código.');
    }
  }, [showNotice]);

  const verifyEmailCode = useCallback(async ({ code }) => {
    if (!verification.challengeToken) {
      showNotice('error', 'Solicita un nuevo código de verificación.');
      return false;
    }

    try {
      const data = await confirmEmailCode({
        challengeToken: verification.challengeToken,
        code
      });
      const token = data?.verifiedEmailToken || data?.token;
      if (!token) throw new Error('El servidor no devolvió el token de verificación.');

      setVerification(current => ({
        ...current,
        modalOpen: false,
        verifiedToken: token,
        verifiedEmail: current.targetEmail
      }));
      showNotice('success', 'Correo verificado correctamente.');
      return true;
    } catch (error) {
      showNotice('error', error.message || 'El código no es válido o ha expirado.');
      return false;
    }
  }, [verification.challengeToken, showNotice]);

  const closeVerification = useCallback(() => {
    setVerification(current => ({ ...current, modalOpen: false }));
  }, []);

  const submitRegistration = useCallback(async ({ type, payload, files }) => {
    if (submissionLock.current) return;
    if (!verification.verifiedToken || !verification.verifiedEmail) {
      showNotice('error', 'Verifica tu correo antes de enviar el registro.');
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);
    try {
      const data = await registerOnboarding({
        type,
        payload,
        files,
        token: verification.verifiedToken
      });
      if (!data?.folio) throw new Error('El servidor no devolvió un folio de registro.');
      setSuccessFolio(data.folio);
    } catch (error) {
      showNotice('error', error.message || 'No se pudo enviar la solicitud.');
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }, [verification, showNotice]);

  const resetRegistration = useCallback(() => {
    setSuccessFolio(null);
    setSubmitting(false);
    submissionLock.current = false;
  }, []);

  return {
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
  };
}
