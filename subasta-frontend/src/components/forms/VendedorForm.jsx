import React, { useState } from "react";
import { ArrowRight, User, Building2 } from "lucide-react";
import FormField from "./FormField.jsx";
import EmailField from "./EmailField.jsx";
import DocumentUpload from "./DocumentUpload.jsx";

const REGIMENES_FISCALES_PF = [
  { value: "612", label: "612 — Personas Físicas con Actividades Empresariales y Profesionales" },
  { value: "626", label: "626 — Régimen Simplificado de Confianza (RESICO)" },
  { value: "605", label: "605 — Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { value: "606", label: "606 — Arrendamiento" },
  { value: "607", label: "607 — Enajenación o Adquisición de Bienes" },
  { value: "614", label: "614 — Intereses" },
  { value: "621", label: "621 — Incorporación Fiscal" },
  { value: "625", label: "625 — Plataformas Tecnológicas" }
];

const REGIMENES_FISCALES_PM = [
  { value: "601", label: "601 — General de Ley Personas Morales" },
  { value: "626", label: "626 — Régimen Simplificado de Confianza (RESICO Moral)" },
  { value: "603", label: "603 — Personas Morales con Fines no Lucrativos" },
  { value: "620", label: "620 — Sociedades Cooperativas de Producción" },
  { value: "622", label: "622 — Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { value: "624", label: "624 — Coordinados" }
];

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

export default function VendedorForm({
  isEmailVerified,
  verifiedEmail,
  onEmailChange,
  onTriggerEmailVerification,
  onSubmitRegistration,
  submitting
}) {
  const [tipoPersona, setTipoPersona] = useState("moral");
  const [opDistinto, setOpDistinto] = useState(false);

  const [form, setForm] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    fechaNacimiento: "",
    curp: "",
    fechaInicioActividades: "",

    razonSocial: "",
    fechaConstitucion: "",
    numeroNotaria: "",
    numeroEscritura: "",
    correoCorporativo: "",
    correoContador: "",
    repNombre: "",
    repRfc: "",

    rfc: "",
    regimenFiscal: "601",
    actividadEconomica: "",

    calle: "",
    numero: "",
    codigoPostal: "",
    colonia: "",
    ciudad: "",
    municipio: "",
    estado: "Ciudad de México",
    pais: "México",
    domicilioOperacion: "",

    email: "",
    telefono: "",
    password: ""
  });

  const [files, setFiles] = useState({
    "d-ine": null,
    "d-curp": null,
    "d-situacion": null,
    "d-dom": null,
    "d-estado-cuenta": null,
    "dm-acta": null,
    "dm-estatutos": null,
    "dm-ine-rep": null,
    "v-rep-poder": null,
    "v-aut-file": null
  });

  const [errors, setErrors] = useState({});

  const update = (key) => (event) => {
    let val = event.target.value;
    if (key === "rfc" || key === "curp" || key === "repRfc") {
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
    if (!form.email || !form.email.includes("@")) errs.email = "Correo electrónico requerido";
    if (!form.telefono || form.telefono.length !== 10) errs.telefono = "Debe tener 10 dígitos numéricos";

    if (tipoPersona === "fisica") {
      if (!form.nombres.trim()) errs.nombres = "Campo obligatorio";
      if (!form.apellidoPaterno.trim()) errs.apellidoPaterno = "Campo obligatorio";
      if (!form.apellidoMaterno.trim()) errs.apellidoMaterno = "Campo obligatorio";
      if (!form.curp || form.curp.length !== 18) errs.curp = "CURP de 18 caracteres";
      if (!form.rfc || (form.rfc.length !== 12 && form.rfc.length !== 13)) {
        errs.rfc = "RFC de 13 caracteres para persona física";
      }
    } else {
      if (!form.razonSocial.trim()) errs.razonSocial = "Razón social requerida";
      if (!form.rfc || form.rfc.length !== 12) errs.rfc = "RFC de 12 caracteres para persona moral";
      if (!form.fechaConstitucion) errs.fechaConstitucion = "Fecha requerida";
      if (!form.numeroNotaria.trim()) errs.numeroNotaria = "Número de notaría requerido";
      if (!form.numeroEscritura.trim()) errs.numeroEscritura = "Número de escritura requerido";
      if (!form.repNombre.trim()) errs.repNombre = "Nombre del representante legal requerido";
      if (!form.repRfc || form.repRfc.length !== 13) errs.repRfc = "RFC (13 caracteres)";
    }

    if (!form.calle.trim()) errs.calle = "Calle requerida";
    if (!form.numero.trim()) errs.numero = "Número requerido";
    if (!form.codigoPostal || form.codigoPostal.length !== 5) errs.codigoPostal = "CP de 5 dígitos";
    if (!form.colonia.trim()) errs.colonia = "Colonia requerida";
    if (!form.ciudad.trim()) errs.ciudad = "Ciudad requerida";
    if (!form.municipio.trim()) errs.municipio = "Municipio o alcaldía requerido";

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
      regimenFiscal: form.regimenFiscal,
      actividadEconomica: form.actividadEconomica.trim() || undefined,
      calle: form.calle.trim(),
      numero: form.numero.trim(),
      codigoPostal: form.codigoPostal.trim(),
      colonia: form.colonia.trim(),
      ciudad: form.ciudad.trim(),
      municipio: form.municipio.trim(),
      estado: form.estado,
      pais: form.pais || "México",
      domicilioOperacion: opDistinto && form.domicilioOperacion ? form.domicilioOperacion.trim() : undefined,
      ...(tipoPersona === "fisica"
        ? {
          nombres: form.nombres.trim(),
          apellidoPaterno: form.apellidoPaterno.trim(),
          apellidoMaterno: form.apellidoMaterno.trim(),
          fechaNacimiento: form.fechaNacimiento || undefined,
          curp: form.curp.trim().toUpperCase(),
          fechaInicioActividades: form.fechaInicioActividades || undefined
        }
        : {
          razonSocial: form.razonSocial.trim(),
          fechaConstitucion: form.fechaConstitucion,
          numeroNotaria: form.numeroNotaria.trim(),
          numeroEscritura: form.numeroEscritura.trim(),
          correoCorporativo: form.correoCorporativo.trim() || undefined,
          correoContador: form.correoContador.trim() || undefined,
          repNombre: form.repNombre.trim(),
          repRfc: form.repRfc.trim().toUpperCase()
        })
    };

    onSubmitRegistration(payload, files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* 01 // Modalidad de Vendedor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            01 / Modalidad de la Entidad Vendedora
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {tipoPersona === "moral" ? "Persona Moral ·  Empresarial" : "Persona Física · Loteador Independiente"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neutral-200/50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/[0.08]">
          <button
            type="button"
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${tipoPersona === "moral"
                ? "bg-white text-neutral-900 border border-neutral-300 shadow-sm dark:bg-white/[0.08] dark:text-white dark:border-white/[0.1]"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            onClick={() => {
              setTipoPersona("moral");
              setForm((f) => ({ ...f, regimenFiscal: "601" }));
            }}
          >
            <Building2 size={14} className={tipoPersona === "moral" ? "text-[#193783] dark:text-amber-400" : ""} />
            <span>Persona Moral (Agencia / Consorcio)</span>
          </button>

          <button
            type="button"
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${tipoPersona === "fisica"
                ? "bg-white text-neutral-900 border border-neutral-300 shadow-sm dark:bg-white/[0.08] dark:text-white dark:border-white/[0.1]"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            onClick={() => {
              setTipoPersona("fisica");
              setForm((f) => ({ ...f, regimenFiscal: "612" }));
            }}
          >
            <User size={14} className={tipoPersona === "fisica" ? "text-[#193783] dark:text-amber-400" : ""} />
            <span>Persona Física con Actividad Empresarial</span>
          </button>
        </div>
      </div>

      {/* 02 // Información Fiscal */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
            02 / Información Fiscal y Notarial
          </span>
        </div>

        {tipoPersona === "moral" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Razón Social (Denominación Legal)" name="razonSocial" value={form.razonSocial} onChange={update("razonSocial")} error={errors.razonSocial} placeholder="Ej. Automotriz Premier de México S.A. de C.V." required />
            </div>
            <FormField label="RFC de la Entidad (12)" name="rfc" value={form.rfc} onChange={update("rfc")} error={errors.rfc} placeholder="AAA000000XXX" maxLength={12} required tabular />
            <FormField label="Fecha de Constitución" name="fechaConstitucion" type="date" value={form.fechaConstitucion} onChange={update("fechaConstitucion")} error={errors.fechaConstitucion} required tabular />
            <FormField label="Número de Notaría" name="numeroNotaria" value={form.numeroNotaria} onChange={update("numeroNotaria")} error={errors.numeroNotaria} placeholder="Ej. Notaría Pública 142" required tabular />
            <FormField label="Número de Escritura" name="numeroEscritura" value={form.numeroEscritura} onChange={update("numeroEscritura")} error={errors.numeroEscritura} placeholder="Ej. 85,412" required tabular />
            <div className="sm:col-span-2">
              <label htmlFor="regimenFiscal" className="text-[11px] font-medium tracking-wide uppercase text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center">
                <span>Régimen Fiscal (SAT)</span>
                <span className="text-[#193783] dark:text-amber-400/80 ml-1">*</span>
              </label>
              <select
                id="regimenFiscal"
                name="regimenFiscal"
                value={form.regimenFiscal}
                onChange={update("regimenFiscal")}
                className="w-full bg-white dark:bg-[#0b0b0c]/60 border border-neutral-300 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#193783] focus:ring-1 focus:ring-[#193783]/20 dark:focus:border-amber-400/50 dark:focus:ring-amber-400/30 transition-all duration-200 cursor-pointer"
              >
                {REGIMENES_FISCALES_PM.map((r) => (
                  <option key={r.value} value={r.value} className="bg-white text-neutral-900 dark:bg-[#141416] dark:text-[#f5f5f7]">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <FormField label="Actividad Económica (CNAE / SAT)" name="actividadEconomica" value={form.actividadEconomica} onChange={update("actividadEconomica")} placeholder="Comercio de vehículos nuevos y usados" />
            <FormField label="Nombre del Representante Legal" name="repNombre" value={form.repNombre} onChange={update("repNombre")} error={errors.repNombre} placeholder="Nombre completo según poder" required />
            <FormField label="RFC Representante Legal (13)" name="repRfc" value={form.repRfc} onChange={update("repRfc")} error={errors.repRfc} placeholder="AAAA000000XXX" maxLength={13} required tabular />
            <FormField label="Correo Institucional" name="correoCorporativo" type="email" value={form.correoCorporativo} onChange={update("correoCorporativo")} placeholder="ventas@concesionario.com" />
            <div className="sm:col-span-3">
              <FormField label="Correo del Contador / Facturación" name="correoContador" type="email" value={form.correoContador} onChange={update("correoContador")} placeholder="facturacion@concesionario.com" hint="Para liquidación y timbrado de comprobantes fiscales CFDI" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Nombre(s)" name="nombres" value={form.nombres} onChange={update("nombres")} error={errors.nombres} placeholder="Ej. Roberto" required />
            <FormField label="Apellido Paterno" name="apellidoPaterno" value={form.apellidoPaterno} onChange={update("apellidoPaterno")} error={errors.apellidoPaterno} placeholder="Ej. Garza" required />
            <FormField label="Apellido Materno" name="apellidoMaterno" value={form.apellidoMaterno} onChange={update("apellidoMaterno")} error={errors.apellidoMaterno} placeholder="Ej. Sada" required />
            <FormField label="CURP (18)" name="curp" value={form.curp} onChange={update("curp")} error={errors.curp} placeholder="AAAA000000XXXXXX00" maxLength={18} required tabular />
            <FormField label="RFC con Homoclave (13)" name="rfc" value={form.rfc} onChange={update("rfc")} error={errors.rfc} placeholder="AAAA000000XXX" maxLength={13} required tabular />
            <FormField label="Fecha Inicio de Actividades" name="fechaInicioActividades" type="date" value={form.fechaInicioActividades} onChange={update("fechaInicioActividades")} tabular />
            <div className="sm:col-span-2">
              <label htmlFor="regimenFiscalPf" className="text-[11px] font-medium tracking-wide uppercase text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center">
                <span>Régimen Fiscal (SAT)</span>
                <span className="text-[#193783] dark:text-amber-400/80 ml-1">*</span>
              </label>
              <select
                id="regimenFiscalPf"
                name="regimenFiscal"
                value={form.regimenFiscal}
                onChange={update("regimenFiscal")}
                className="w-full bg-white dark:bg-[#0b0b0c]/60 border border-neutral-300 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-[#f5f5f7] focus:outline-none focus:border-[#193783] focus:ring-1 focus:ring-[#193783]/20 dark:focus:border-amber-400/50 dark:focus:ring-amber-400/30 transition-all duration-200 cursor-pointer"
              >
                {REGIMENES_FISCALES_PF.map((r) => (
                  <option key={r.value} value={r.value} className="bg-white text-neutral-900 dark:bg-[#141416] dark:text-[#f5f5f7]">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <FormField label="Actividad Económica" name="actividadEconomica" value={form.actividadEconomica} onChange={update("actividadEconomica")} placeholder="Compra-venta de automotores" />
          </div>
        )}
      </div>

      {/* 03 // Domicilio Fiscal */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
            03 / Domicilio Fiscal y Operativo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <FormField label="Calle" name="calle" value={form.calle} onChange={update("calle")} error={errors.calle} placeholder="Blvd. Adolfo López Mateos" required />
          </div>
          <FormField label="Número Ext / Int" name="numero" value={form.numero} onChange={update("numero")} error={errors.numero} placeholder="2305, Edif. A" required tabular />
          <FormField label="Código Postal (5)" name="codigoPostal" value={form.codigoPostal} onChange={update("codigoPostal")} error={errors.codigoPostal} placeholder="01010" maxLength={5} required tabular />
          <FormField label="Colonia" name="colonia" value={form.colonia} onChange={update("colonia")} error={errors.colonia} placeholder="Los Alpes" required />
          <FormField label="Municipio / Alcaldía" name="municipio" value={form.municipio} onChange={update("municipio")} error={errors.municipio} placeholder="Álvaro Obregón" required />
          <FormField label="Ciudad" name="ciudad" value={form.ciudad} onChange={update("ciudad")} error={errors.ciudad} placeholder="Ciudad de México" required />
          <div className="sm:col-span-2 flex flex-col">
            <label htmlFor="v-estado" className="text-[11px] font-medium tracking-wide uppercase text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center">
              <span>Estado</span>
              <span className="text-[#193783] dark:text-amber-400/80 ml-1">*</span>
            </label>
            <select
              id="v-estado"
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
          <div className="sm:col-span-2">
            <FormField label="País" name="pais" value={form.pais} readOnly className="opacity-70" />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={opDistinto}
              onChange={(e) => setOpDistinto(e.target.checked)}
              className="w-4 h-4 rounded bg-white dark:bg-[#0b0b0c] border border-neutral-300 dark:border-white/[0.15] accent-[#193783] dark:accent-amber-400 cursor-pointer"
            />
            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              El patio / punto de resguardo vehicular difiere del domicilio fiscal
            </span>
          </label>

          {opDistinto && (
            <div className="mt-3">
              <FormField
                label="Domicilio Operativo Completo (Patio de Resguardo)"
                name="domicilioOperacion"
                value={form.domicilioOperacion}
                onChange={update("domicilioOperacion")}
                placeholder="Calle, número, colonia, código postal y coordenadas de acceso"
              />
            </div>
          )}
        </div>
      </div>

      {/* 04 // Contacto Principal y Acceso */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
            04 / Contacto Principal y Acceso
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
          <FormField label="Teléfono de Contacto (10 dígitos)" name="telefono" type="tel" value={form.telefono} onChange={update("telefono")} error={errors.telefono} placeholder="5512345678" maxLength={10} required tabular />
          <FormField label="Contraseña del Portal de Vendedores" name="password" type="password" value={form.password} onChange={update("password")} placeholder="Mínimo 8 caracteres" hint="Para administrar inventario, lotes y dispersiones bancarias" />
        </div>
      </div>

      {/* 05 // Documentación Legal */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#193783] dark:text-amber-400 font-semibold">
            05 / Documentación Legal y Bancaria (PDF)
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            Archivos originales ≤ 10 MB
          </span>
        </div>

        {tipoPersona === "moral" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DocumentUpload name="dm-acta" label="Acta Constitutiva (con RPP)" file={files["dm-acta"]} onChange={handleFileChange("dm-acta")} required hint="Con sello de inscripción registral" />
            <DocumentUpload name="v-rep-poder" label="Poder Notarial del Representante" file={files["v-rep-poder"]} onChange={handleFileChange("v-rep-poder")} required hint="Facultades de administración o dominio" />
            <DocumentUpload name="dm-ine-rep" label="Identificación Oficial del Representante" file={files["dm-ine-rep"]} onChange={handleFileChange("dm-ine-rep")} required />
            <DocumentUpload name="d-situacion" label="Constancia de Situación Fiscal (SAT)" file={files["d-situacion"]} onChange={handleFileChange("d-situacion")} required hint="Vigencia menor a 90 días" />
            <DocumentUpload name="d-dom" label="Comprobante de Domicilio Fiscal" file={files["d-dom"]} onChange={handleFileChange("d-dom")} required />
            <DocumentUpload name="d-estado-cuenta" label="Carátula Bancaria para Dispersión" file={files["d-estado-cuenta"]} onChange={handleFileChange("d-estado-cuenta")} required hint="CLABE y razón social coincidentes" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DocumentUpload name="d-ine" label="Identificación Oficial (INE / Pasaporte)" file={files["d-ine"]} onChange={handleFileChange("d-ine")} required />
            <DocumentUpload name="d-curp" label="Constancia de CURP Oficial" file={files["d-curp"]} onChange={handleFileChange("d-curp")} required />
            <DocumentUpload name="d-situacion" label="Constancia de Situación Fiscal (SAT)" file={files["d-situacion"]} onChange={handleFileChange("d-situacion")} required hint="Vigencia menor a 90 días" />
            <DocumentUpload name="d-dom" label="Comprobante de Domicilio Fiscal" file={files["d-dom"]} onChange={handleFileChange("d-dom")} required />
            <div className="sm:col-span-2">
              <DocumentUpload name="d-estado-cuenta" label="Carátula Bancaria para Dispersión de Ventas" file={files["d-estado-cuenta"]} onChange={handleFileChange("d-estado-cuenta")} required hint="CLABE y titular coincidentes para transferencias SPEI" />
            </div>
          </div>
        )}
      </div>

      {/* Acciones de envío */}
      <div className="pt-6 border-t border-neutral-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-neutral-500">
          Los lotes vehiculares solo podrán publicarse una vez aprobado el dictamen documental.
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
              <span>Enviar Solicitud de Vendedor</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
