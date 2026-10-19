import { FileUp, FileText, X } from 'lucide-react';

export default function DocumentUpload({ name, label, accept = '.pdf,.jpg,.jpeg,.png', file, onChange, required = false }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <label className={`upload-box ${file ? 'has-file' : ''}`} htmlFor={name}>
        {file ? <FileText size={21} /> : <FileUp size={21} />}
        <span>
          <strong>{file ? file.name : 'Seleccionar documento'}</strong>
          <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, JPG o PNG'}</small>
        </span>
        {file && (
          <button
            type="button"
            className="icon-button"
            aria-label={`Quitar ${label}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange(null);
            }}
          >
            <X size={16} />
          </button>
        )}
        <input
          id={name}
          name={name}
          type="file"
          accept={accept}
          required={required && !file}
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}
