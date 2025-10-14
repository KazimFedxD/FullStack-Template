export default function LoadingSpinner({ size = "medium", color = "white" }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };

  const colorClasses = {
    white: "border-white/30 border-t-white",
    indigo: "border-indigo-300 border-t-indigo-600",
    pink: "border-pink-300 border-t-pink-600",
    gray: "border-gray-300 border-t-gray-600"
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-2 border-solid rounded-full animate-spin
      `}
    />
  );
}
