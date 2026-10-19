import { CheckCircle2, Copy, ArrowLeft } from 'lucide-react';

export default function SuccessView({ folio, tipo, onReset }) {
  const copyFolio = async () => {
    try {
      await navigator.clipboard.writeText(String(folio));
    } catch {
      // Clipboard access may be unavailable outside a secure context.
    }
  };

  return (
    <section className="success-card">
      <div className="success-icon"><CheckCircle2 size={32} /></div>
      <span className="section-kicker">SOLICITUD RECIBIDA</span>
      <h2>Registro enviado correctamente</h2>
      <p>Tu solicitud de {tipo === 'comprador' ? 'comprador' : 'vendedor'} se recibió. Guarda el folio para consultar su seguimiento.</p>
      <div className="folio-box">
        <span>Folio de registro</span>
        <strong>{folio}</strong>
        <button className="icon-button" type="button" onClick={copyFolio} aria-label="Copiar folio"><Copy size={17} /></button>
      </div>
      <button className="button button-primary" type="button" onClick={onReset}><ArrowLeft size={17} /> Volver al registro</button>
    </section>
  );
}
