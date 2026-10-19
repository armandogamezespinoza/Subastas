import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import FormField from './FormField.jsx';

export default function EmailField({
  email, setEmail, isEmailVerified, verifiedEmail,
  onEmailChange, onTriggerEmailVerification
}) {
  const verified = isEmailVerified && email.trim().toLowerCase() === verifiedEmail.trim().toLowerCase();

  const handleChange = (event) => {
    setEmail(event.target.value);
    onEmailChange?.(event.target.value);
  };

  return (
    <div className="email-field-group">
      <FormField
        label="Correo electrónico"
        name="email"
        type="email"
        value={email}
        onChange={handleChange}
        placeholder="nombre@correo.com"
        autoComplete="email"
        required
      />
      <button
        className={`button button-secondary verify-button ${verified ? 'is-verified' : ''}`}
        type="button"
        onClick={() => onTriggerEmailVerification(email)}
        disabled={verified}
      >
        {verified ? <CheckCircle2 size={17} /> : <Mail size={17} />}
        {verified ? 'Correo verificado' : 'Verificar correo'}
      </button>
      <p className={`verification-hint ${verified ? 'verified' : ''}`}>
        <ShieldCheck size={14} />
        {verified ? 'La dirección de correo fue verificada.' : 'Necesitas verificar tu correo para enviar el registro.'}
      </p>
    </div>
  );
}
