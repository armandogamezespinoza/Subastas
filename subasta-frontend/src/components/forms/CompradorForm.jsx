import React, { useState } from "react";
import { ArrowRight, User, Building2 } from "lucide-react";
import FormField from "./FormField.jsx";
import EmailField from "./EmailField.jsx";
import DocumentUpload from "./DocumentUpload.jsx";

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

export default function CompradorForm({
  isEmailVerified,
  verifiedEmail,
  onEmailChange,
  onTriggerEmailVerification,
  onSubmitRegistration,
  submitting
}) {
  const [tipoPersona, setTipoPersona] = useState("fisica");

  const [form, setForm] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    fechaNacimiento: "",
    curp: "",
    contactoEmergencia: "",

    razonSocial: "",
    fechaConstitucion: "",
    rfcRepresentante: "",
    correoCorporativo: "",
    contactoCompras: "",

    rfc: "",
    calle: "",
    codigoPostal: "",
    colonia: "",
    ciudad: "",
    estado: "Ciudad de México",

    email: "",
    telefono: "",
    password: ""
  });

  const [files, setFiles] = useState({
    "cd-ine": null,
    "cd-curp": null,
    "cd-rfc": null,
    "cd-dom": null,
    "cd-estado-cuenta": null
  });

  const [errors, setErrors] = useState({});

  const update = (key) => (event) => {
    let val = event.target.value;
    if (key === "rfc" || key === "curp" || key === "rfcRepresentante") {
      val = val.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, "");
    } else if (key === "telefono" || key === "codigoPostal") {
      val = val.replace(/\D/g, "");
    }
    setForm((current) => ({ ...current, [key]: val }));
    if (errors[key]) {
      setErrors((curr) => ({ ...curr, [key]: null }));
    }
  };

  const setEmail = (email) => {
    setForm((current) => ({ ...current, email }));
    if (errors.email) {
      setErrors((curr) => ({ ...curr, email: null }));
    }
  };

  const handleFileChange = (key) => (file) => {
    setFiles((current) => ({ ...current, [key]: file }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email || !form.email.includes("@")) errs.email = "Correo electrónico no válido";
    if (!form.telefono || form.telefono.length !== 10) errs.telefono = "Debe contener 10 dígitos numéricos";

    if (tipoPersona === "fisica") {
      if (!form.nombres.trim()) errs.nombres = "Campo obligatorio";
      if (!form.apellidoPaterno.trim()) errs.apellidoPaterno = "Campo obligatorio";
      if (!form.apellidoMaterno.trim()) errs.apellidoMaterno = "Campo obligatorio";
      if (!form.fechaNacimiento) errs.fechaNacimiento = "Requerido (mayor de 18 años)";
      if (!form.curp || form.curp.length !== 18) errs.curp = "La CURP debe tener 18 caracteres";
      if (!form.rfc || (form.rfc.length !== 12 && form.rfc.length !== 13)) {
        errs.rfc = "RFC inválido (12-13 caracteres)";
      }
    } else {
      if (!form.razonSocial.trim()) errs.razonSocial = "Razón social requerida";
      if (!form.rfc || form.rfc.length !== 12) errs.rfc = "RFC de persona moral debe tener 12 caracteres";
      if (!form.fechaConstitucion) errs.fechaConstitucion = "Fecha requerida";
      if (!form.rfcRepresentante || form.rfcRepresentante.length !== 13) {
        errs.rfcRepresentante = "RFC del representante (13 caracteres)";
      }
    }

    if (!form.calle.trim()) errs.calle = "Calle y número requeridos";
    if (!form.codigoPostal || form.codigoPostal.length !== 5) errs.codigoPostal = "CP de 5 dígitos";
    if (!form.colonia.trim()) errs.colonia = "Colonia requerida";
    if (!form.ciudad.trim()) errs.ciudad = "Ciudad requerida";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      tipoPersona,
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      password: form.password || undefined,
      rfc: form.rfc.trim().toUpperCase(),
      calle: form.calle.trim(),
      codigoPostal: form.codigoPostal.trim(),
      colonia: form.colonia.trim(),
      ciudad: form.ciudad.trim(),
      estado: form.estado,
      ...(tipoPersona === "fisica"
        ? {
          nombres: form.nombres.trim(),
          apellidoPaterno: form.apellidoPaterno.trim(),
          apellidoMaterno: form.apellidoMaterno.trim(),
          fechaNacimiento: form.fechaNacimiento,
          curp: form.curp.trim().toUpperCase(),
          contactoEmergencia: form.contactoEmergencia.trim() || undefined
        }
        : {
          razonSocial: form.razonSocial.trim(),
          fechaConstitucion: form.fechaConstitucion,
          rfcRepresentante: form.rfcRepresentante.trim().toUpperCase(),
          correoCorporativo: form.correoCorporativo.trim() || undefined,
          contactoCompras: form.contactoCompras.trim() || undefined
        })
    };

    onSubmitRegistration(payload, files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* 01 // Modalidad de Postor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            01 / Modalidad de Postor
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {tipoPersona === "fisica" ? "Persona Física " : "Persona Moral · "}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neutral-200/50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/[0.08]">
          <button
            type="button"
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${tipoPersona === "fisica"
                ? "bg-white text-neutral-900 border border-neutral-300 shadow-sm dark:bg-white/[0.08] dark:text-white dark:border-white/[0.1]"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            onClick={() => setTipoPersona("fisica")}
          >
            <User size={14} className={tipoPersona === "fisica" ? "text-[#193783] dark:text-amber-400" : ""} />
            <span>Persona Física</span>
          </button>

          <button
            type="button"
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${tipoPersona === "moral"
                ? "bg-white text-neutral-900 border border-neutral-300 shadow-sm dark:bg-white/[0.08] dark:text-white dark:border-white/[0.1]"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            onClick={() => setTipoPersona("moral")}
          >
            <Building2 size={14} className={tipoPersona === "moral" ? "text-[#193783] dark:text-amber-400" : ""} />
            <span>Persona Moral (Empresa)</span>
          </button>
        </div>
      </div>

      {/* 02 // Información de Identidad */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
            02 / Información de Identidad
          </span>
        </div>

        {tipoPersona === "fisica" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Nombre(s)" name="nombres" value={form.nombres} onChange={update("nombres")} error={errors.nombres} placeholder="Ej. Carlos" required />
            <FormField label="Apellido Paterno" name="apellidoPaterno" value={form.apellidoPaterno} onChange={update("apellidoPaterno")} error={errors.apellidoPaterno} placeholder="Ej. Mendoza" required />
            <FormField label="Apellido Materno" name="apellidoMaterno" value={form.apellidoMaterno} onChange={update("apellidoMaterno")} error={errors.apellidoMaterno} placeholder="Ej. Valenzuela" required />
            <FormField label="Fecha de Nacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={update("fechaNacimiento")} error={errors.fechaNacimiento} hint="Mayoría de edad (18+) requerida" required tabular />
            <FormField label="CURP (18 caracteres)" name="curp" value={form.curp} onChange={update("curp")} error={errors.curp} placeholder="AAAA000000XXXXXX00" maxLength={18} required tabular />
            <FormField label="RFC con Homoclave (13)" name="rfc" value={form.rfc} onChange={update("rfc")} error={errors.rfc} placeholder="AAAA000000XXX" maxLength={13} required tabular />
            <div className="sm:col-span-3">
              <FormField label="Contacto de Emergencia (Opcional)" name="contactoEmergencia" value={form.contactoEmergencia} onChange={update("contactoEmergencia")} placeholder="Nombre y teléfono de referencia" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Razón Social (Denominación)" name="razonSocial" value={form.razonSocial} onChange={update("razonSocial")} error={errors.razonSocial} placeholder="Ej. Distribuidora Automotriz del Norte S.A. de C.V." required />
            </div>
            <FormField label="RFC de la Empresa (12 caracteres)" name="rfc" value={form.rfc} onChange={update("rfc")} error={errors.rfc} placeholder="AAA000000XXX" maxLength={12} required tabular />
            <FormField label="Fecha de Constitución" name="fechaConstitucion" type="date" value={form.fechaConstitucion} onChange={update("fechaConstitucion")} error={errors.fechaConstitucion} required tabular />
            <FormField label="RFC Representante Legal (13)" name="rfcRepresentante" value={form.rfcRepresentante} onChange={update("rfcRepresentante")} error={errors.rfcRepresentante} placeholder="AAAA000000XXX" maxLength={13} required tabular />
            <FormField label="Correo Corporativo" name="correoCorporativo" type="email" value={form.correoCorporativo} onChange={update("correoCorporativo")} placeholder="contacto@empresa.com" />
            <div className="sm:col-span-2">
              <FormField label="Contacto de Compras / Flotillas" name="contactoCompras" value={form.contactoCompras} onChange={update("contactoCompras")} placeholder="Nombre del director o gerente de adquisiciones" />
            </div>
          </div>
        )}
      </div>

      {/* 03 // Domicilio Fiscal */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
            03 / Domicilio Fiscal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <FormField label="Calle y Número" name="calle" value={form.calle} onChange={update("calle")} error={errors.calle} placeholder="Av. Insurgentes Sur 1450, Piso 4" required />
          </div>
          <FormField label="Código Postal (5)" name="codigoPostal" value={form.codigoPostal} onChange={update("codigoPostal")} error={errors.codigoPostal} placeholder="03920" maxLength={5} required tabular />
          <FormField label="Colonia" name="colonia" value={form.colonia} onChange={update("colonia")} error={errors.colonia} placeholder="Actipan" required />
          <FormField label="Ciudad / Municipio" name="ciudad" value={form.ciudad} onChange={update("ciudad")} error={errors.ciudad} placeholder="Benito Juárez" required />
          <div className="flex flex-col">
            <label htmlFor="estado" className="text-[11px] font-medium tracking-wide uppercase text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center">
              <span>Estado</span>
              <span className="text-[#193783] dark:text-amber-400/80 ml-1">*</span>
            </label>
            <select
              id="estado"
              name="estado"
              value={form.estado}
              onChange={update("estado")}
              className="w-full bg-white dark:bg-[#0b0b0c]/60 border border-neutral-300 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#193783] focus:ring-1 focus:ring-[#193783]/20 dark:focus:border-amber-400/50 dark:focus:ring-amber-400/30 transition-all duration-200 cursor-pointer"
            >
              {ESTADOS_MEXICO.map((edo) => (
                <option key={edo} value={edo} className="bg-white text-neutral-900 dark:bg-[#141416] dark:text-[#f5f5f7]">
                  {edo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 04 // Contacto y Credenciales */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
            04 / Contacto y Credenciales
          </span>
        </div>

        <EmailField
          email={form.email}
          setEmail={setEmail}
          isEmailVerified={isEmailVerified}
          verifiedEmail={verifiedEmail}
          onEmailChange={onEmailChange}
          onTriggerEmailVerification={onTriggerEmailVerification}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Teléfono Móvil (10 dígitos)" name="telefono" type="tel" value={form.telefono} onChange={update("telefono")} error={errors.telefono} placeholder="5512345678" maxLength={10} required tabular />
          <FormField label="Contraseña de Acceso" name="password" type="password" value={form.password} onChange={update("password")} placeholder="Mínimo 8 caracteres" hint="Para ingresar a su panel de postor" />
        </div>
      </div>

      {/* 05 // Documentación Obligatoria */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
            05 / Documentación Obligatoria (PDF)
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            Archivos originales ≤ 10 MB
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DocumentUpload name="cd-ine" label="Identificación Oficial (INE / Pasaporte)" file={files["cd-ine"]} onChange={handleFileChange("cd-ine")} required />
          <DocumentUpload name="cd-curp" label="Constancia de CURP Oficial" file={files["cd-curp"]} onChange={handleFileChange("cd-curp")} required={tipoPersona === "fisica"} />
          <DocumentUpload name="cd-rfc" label="Constancia de Situación Fiscal (SAT)" file={files["cd-rfc"]} onChange={handleFileChange("cd-rfc")} required hint="Vigencia no mayor a 90 días" />
          <DocumentUpload name="cd-dom" label="Comprobante de Domicilio" file={files["cd-dom"]} onChange={handleFileChange("cd-dom")} required hint="CFE, agua o predial reciente" />
          <div className="sm:col-span-2">
            <DocumentUpload name="cd-estado-cuenta" label="Carátula de Estado de Cuenta Bancario" file={files["cd-estado-cuenta"]} onChange={handleFileChange("cd-estado-cuenta")} hint="Solo primera hoja con CLABE para reembolsos de garantía" />
          </div>
        </div>
      </div>

      {/* Acciones de envío */}
      <div className="pt-6 border-t border-neutral-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-neutral-500">
          Los campos marcados con <span className="text-[#193783] dark:text-amber-400/80 font-bold">*</span> son requeridos por la mesa de control.
        </span>

        <button
          type="submit"
          disabled={submitting || !isEmailVerified || form.email.trim().toLowerCase() !== verifiedEmail.trim().toLowerCase()}
          className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#193783] hover:bg-[#142c6a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-semibold text-xs uppercase tracking-wider transition-all duration-200 ease-out flex items-center justify-center gap-2.5 shadow-md shadow-[#193783]/15 dark:shadow-lg dark:shadow-amber-500/10 disabled:opacity-30 disabled:hover:bg-[#193783] dark:disabled:hover:bg-amber-400 active:scale-[0.98]"
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white/40 dark:border-neutral-950/40 border-t-white dark:border-t-neutral-950 rounded-full animate-spin" />
          ) : (
            <>
              <span>Enviar Expediente de Comprador</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
