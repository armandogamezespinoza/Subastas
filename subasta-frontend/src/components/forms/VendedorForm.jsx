import { useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import FormField from './FormField.jsx';
import EmailField from './EmailField.jsx';
import DocumentUpload from './DocumentUpload.jsx';

export default function VendedorForm({
  isEmailVerified, verifiedEmail, onEmailChange,
  onTriggerEmailVerification, onSubmitRegistration, submitting
}) {
  const [form, setForm] = useState({ razonSocial: '', nombreContacto: '', email: '', telefono: '', rfc: '' });
  const [files, setFiles] = useState({ constanciaFiscal: null, documentoRepresentacion: null });
  const update = (key) => (event) => setForm(current => ({ ...current, [key]: event.target.value }));
  const setEmail = (email) => setForm(current => ({ ...current, email }));
  const setFile = (key) => (file) => setFiles(current => ({ ...current, [key]: file }));

  const submit = (event) => {
    event.preventDefault();
    onSubmitRegistration(form, files);
  };

  return (
    <form id="panel-vendedor" role="tabpanel" aria-labelledby="tab-vendedor" className="registration-form" onSubmit={submit}>
      <div className="form-section-title"><Building2 size={18} /><span>Información del negocio</span></div>
      <div className="form-grid">
        <FormField label="Razón social" name="razonSocial" value={form.razonSocial} onChange={update('razonSocial')} placeholder="Nombre legal del negocio" required />
        <FormField label="Nombre del contacto" name="nombreContacto" value={form.nombreContacto} onChange={update('nombreContacto')} placeholder="Nombre completo" required />
        <FormField label="Teléfono de contacto" name="telefono" value={form.telefono} onChange={update('telefono')} type="tel" placeholder="10 dígitos" autoComplete="tel" required />
        <FormField label="RFC del negocio" name="rfc" value={form.rfc} onChange={update('rfc')} placeholder="RFC" required />
      </div>
      <EmailField
        email={form.email}
        setEmail={setEmail}
        isEmailVerified={isEmailVerified}
        verifiedEmail={verifiedEmail}
        onEmailChange={onEmailChange}
        onTriggerEmailVerification={onTriggerEmailVerification}
      />
      <div className="form-section-title document-title"><span className="document-icon" aria-hidden="true">PDF</span><span>Documentación</span></div>
      <div className="form-grid">
        <DocumentUpload name="constanciaFiscal" label="Constancia de situación fiscal" file={files.constanciaFiscal} onChange={setFile('constanciaFiscal')} required />
        <DocumentUpload name="documentoRepresentacion" label="Documento de representación" file={files.documentoRepresentacion} onChange={setFile('documentoRepresentacion')} required />
      </div>
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
