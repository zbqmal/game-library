interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  text,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label={text || "Loading"}
      />
      {text && <p className="text-gray-600 text-sm font-medium">{text}</p>}
    </div>
  );
}
