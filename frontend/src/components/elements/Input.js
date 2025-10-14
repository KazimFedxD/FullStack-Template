export default function Input({
  type = "text",
  placeholder = "",
  value,
  onChange,
  required = false,
  disabled = false,
  error = "",
  label = "",
  className = "",
  ...props
}) {
  const baseClasses = "w-full p-3 rounded-xl bg-white/10 backdrop-blur-md text-white placeholder-white/60 outline-none transition-all";
  const focusClasses = "focus:ring-2 focus:ring-indigo-400";
  const errorClasses = error ? "ring-2 ring-red-400" : "";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${focusClasses}
          ${errorClasses}
          ${disabledClasses}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
