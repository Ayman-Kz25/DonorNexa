import { LoaderCircle } from "lucide-react";

function LoadingSpinner({
  message = "Loading...",
  size = "md",
  className = "",
}) {
  const sizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-11 w-11",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className={`${sizes[size] || sizes.md} animate-spin text-[#87364D]`}
        strokeWidth={2}
      />

      <p className="text-sm font-medium text-[#59483F]">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
