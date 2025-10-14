import LoadingSpinner from './LoadingSpinner';

export default function Button({ 
  children, 
  variant = "primary", 
  size = "medium", 
  loading = false, 
  disabled = false,
  onClick,
  type = "button",
  className = "",
  ...props 
}) {
  const baseClasses = "font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-400",
    secondary: "bg-pink-600 hover:bg-pink-500 text-white focus:ring-pink-400",
    outline: "border-2 border-white/20 bg-transparent hover:bg-white/10 text-white focus:ring-white/20",
    ghost: "bg-white/10 hover:bg-white/20 text-white focus:ring-white/20",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-400"
  };

  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    medium: "px-6 py-3 text-base",
    large: "px-8 py-4 text-lg"
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        flex items-center justify-center gap-2
      `}
      {...props}
    >
      {loading && <LoadingSpinner size="small" color="white" />}
      {children}
    </button>
  );
}
