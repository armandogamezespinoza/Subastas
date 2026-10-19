import { ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="topbar" aria-label="Navegación principal">
      <a className="brand" href="/" aria-label="Inicio">
        <span className="brand-mark"><ShieldCheck size={20} /></span>
        <span className="brand-copy">
          <strong>PLATAFORMA</strong>
          <small>Centro de registro</small>
        </span>
      </a>
      <span className="topbar-status"><span className="status-dot" /> Conexión segura</span>
    </nav>
  );
}
