import { useState } from 'react';
import { ArrowRight, UserRound, FileText } from 'lucide-react';
import FormField from './FormField.jsx';
import EmailField from './EmailField.jsx';
import DocumentUpload from './DocumentUpload.jsx';

export default function CompradorForm({
  isEmailVerified, verifiedEmail, onEmailChange,
  onTriggerEmailVerification, onSubmitRegistration, submitting
}) {
  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', telefono: '', rfc: '' });
  const [files, setFiles] = useState({ identificacion: null });
  const update = (key) => (event) => setForm(current => ({ ...current, [key]: event.target.value }));
  const setEmail = (email) => setForm(current => ({ ...current, email }));
  const setFile = (file) => setFiles(current => ({ ...current, identificacion: file }));

  const submit = (event) => {
    event.preventDefault();
    onSubmitRegistration(form, files);
  };

  return (
    <form id="panel-comprador" role="tabpanel" aria-labelledby="tab-comprador" className="registration-form" onSubmit={submit}>
      <div className="form-section-title"><UserRound size={18} /><span>Información personal</span></div>
      <div className="form-grid">
        <FormField label="Nombre(s)" name="nombre" value={form.nombre} onChange={update('nombre')} placeholder="Tu nombre" autoComplete="given-name" required />
        <FormField label="Apellidos" name="apellidos" value={form.apellidos} onChange={update('apellidos')} placeholder="Tus apellidos" autoComplete="family-name" required />
        <FormField label="Teléfono" name="telefono" value={form.telefono} onChange={update('telefono')} type="number" placeholder="10 dígitos" autoComplete="tel" required />
        <FormField label="RFC" name="rfc" value={form.rfc} onChange={update('rfc')} placeholder="RFC" required />
      </div>
      <EmailField
        email={form.email}
        setEmail={setEmail}
        isEmailVerified={isEmailVerified}
        verifiedEmail={verifiedEmail}
        onEmailChange={onEmailChange}
        onTriggerEmailVerification={onTriggerEmailVerification}
      />
      <div className="form-section-title document-title"><FileText size={18} /><span>Documentación</span></div>
      <DocumentUpload name="identificacion" label="Identificación oficial" file={files.identificacion} onChange={setFile} required />
      <div className="form-actions">
        <p>Los campos marcados con * son obligatorios.</p>
        <button className="button button-primary" type="submit" disabled={submitting || !isEmailVerified || form.email.trim().toLowerCase() !== verifiedEmail.trim().toLowerCase()}>
          {submitting ? <span className="spinner" /> : null}
          {submitting ? 'Enviando solicitud…' : 'Enviar registro'} {!submitting && <ArrowRight size={17} />}
        </button>
      </div>
    </form>
  );
}

