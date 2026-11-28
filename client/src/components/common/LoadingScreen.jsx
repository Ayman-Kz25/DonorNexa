import { HeartHandshake } from "lucide-react";

function LoadingScreen({ message = "Preparing something meaningful..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-[#F8F5EF]">
      <div className="flex flex-col items-center px-6 text-center">
        {/* Animated Logo */}
        <div className="relative mb-7 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#963D54]/10" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#782B40] shadow-lg shadow-[#782B40]/20">
            <HeartHandshake
              size={34}
              strokeWidth={1.8}
              className="text-[#F8F5EF]"
            />
          </div>
        </div>

        {/* Brand */}
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-[#782B40]">
          DonorNexa
        </h1>

        <p className="mt-2 text-sm font-medium text-[#59483F]">
          Connecting donors. Saving lives.
        </p>

        {/* Loading Indicator */}
        <div className="mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-[#E8DDD4]">
          <div className="h-full w-1/2 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-[#963D54]" />
        </div>

        <p className="mt-4 text-xs tracking-wide text-[#59483F]">{message}</p>
      </div>

      <style>
        {`
          @keyframes loading {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(200%);
            }
          }
        `}
      </style>
    </div>
  );
}

export default LoadingScreen;
