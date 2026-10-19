export default function FormField({
  label, name, value, onChange, type = 'text', placeholder = '',
  required = false, autoComplete, error, children, ...props
}) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={name}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {children || (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
      )}
      {error && <small className="field-error" id={`${name}-error`}>{error}</small>}
    </div>
  );
}
