import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  CalendarDays,
  Clock,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/dateTime";

function DonorAvailability() {
  const { request } = useApi();

  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [reasons, setReasons] = useState([]);

  const loadDonor = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await request({
        method: "GET",
        url: "/api/donors/profile",
      });

      setDonor(response.data.donor || null);
    } catch (error) {
      console.error("Load donor availability error:", error);

      setDonor(null);

      if (error.response?.status === 404) {
        setMessage("Donor profile not found. Please save your profile first.");
      } else {
        setMessage(
          error.response?.data?.message || "Unable to load donor profile.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadDonor();

    const handleProfileUpdate = () => {
      loadDonor();
    };

    window.addEventListener("donor-profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("donor-profile-updated", handleProfileUpdate);
    };
  }, [loadDonor]);

  const handleAvailability = async () => {
    if (!donor || updating) return;

    try {
      setUpdating(true);
      setMessage("");
      setReasons([]);

      const response = await request({
        method: "PATCH",
        url: "/api/donors/availability",
        data: {
          isAvailable: !donor.isAvailable,
        },
      });

      setDonor((previous) => ({
        ...previous,
        isAvailable: response.data.isAvailable,
        ...(response.data.eligibleAgainDate && {
          eligibleAgainDate: response.data.eligibleAgainDate,
        }),
      }));

      setMessage(response.data.message || "Availability updated successfully.");
    } catch (error) {
      console.error("Update availability error:", error);

      setMessage(
        error.response?.data?.message || "Unable to update availability.",
      );

      setReasons(error.response?.data?.reasons || []);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-32 items-center justify-center gap-2.5 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-8 text-[#782B40] sm:gap-3 sm:rounded-xl sm:py-10"
        role="status"
      >
        <Loader2 size={19} className="shrink-0 animate-spin sm:h-5 sm:w-5" />
        <p className="text-xs font-medium sm:text-sm">
          Loading availability...
        </p>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:rounded-xl sm:p-5">
        <p className="break-words text-xs leading-5 text-[#782B40] sm:text-sm sm:leading-6">
          {message || "Donor profile is not available."}
        </p>

        <button
          type="button"
          onClick={loadDonor}
          disabled={loading}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#782B40] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#612033] disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          <RefreshCw size={14} />
          Check Again
        </button>
      </div>
    );
  }

  const lastDonationDate = donor.lastDonationDate || null;
  const eligibleAgainDate = donor.eligibleAgainDate || null;

  const isCoolingDown =
    eligibleAgainDate &&
    !Number.isNaN(new Date(eligibleAgainDate).getTime()) &&
    new Date(eligibleAgainDate).getTime() > Date.now();

  return (
    <div className="w-full min-w-0 space-y-3.5 text-[#302923] sm:space-y-4">
      {/* Availability toggle */}
      <div
        className={`flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors duration-300 sm:gap-5 sm:rounded-xl sm:p-5 lg:p-6 ${
          donor.isAvailable
            ? "border-[#E8C9CE] bg-[#F7E9E7]"
            : "border-[#E8DDD4] bg-[#F1EDE6]"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#302923] sm:text-base">
            Availability Status
          </p>

          <p
            className={`mt-1.5 flex items-center gap-2 text-xs font-medium sm:text-sm ${
              donor.isAvailable ? "text-[#782B40]" : "text-[#81756A]"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                donor.isAvailable ? "bg-[#963D54]" : "bg-[#A79B91]"
              }`}
            />
            {donor.isAvailable ? "Available" : "Unavailable"}
          </p>

          <p className="mt-1.5 max-w-md text-[11px] leading-5 text-[#81756A] sm:mt-2 sm:text-xs sm:leading-5">
            {updating
              ? "Updating..."
              : donor.isAvailable
                ? "Turn availability OFF when you cannot donate."
                : "Turn availability ON when you are ready to donate."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className={`text-[10px] font-bold tracking-wider sm:text-xs ${
              donor.isAvailable ? "text-[#782B40]" : "text-[#81756A]"
            }`}
          >
            {donor.isAvailable ? "ON" : "OFF"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={donor.isAvailable}
            aria-label="Toggle donor availability"
            onClick={handleAvailability}
            disabled={updating}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 shadow-inner outline-none transition-colors duration-300 focus-visible:ring-4 focus-visible:ring-[#E8C9CE] disabled:cursor-not-allowed disabled:opacity-70 sm:h-9 sm:w-16 ${
              donor.isAvailable ? "bg-[#782B40]" : "bg-[#B8AEA5]"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-out sm:h-7 sm:w-7 ${
                donor.isAvailable
                  ? "translate-x-6 sm:translate-x-7"
                  : "translate-x-0"
              }`}
            >
              {updating && (
                <Loader2 size={14} className="animate-spin text-[#782B40]" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Donation dates */}
      {(lastDonationDate && !donor.isAvailable) || isCoolingDown ? (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {!donor.isAvailable && lastDonationDate && (
            <div className="min-w-0 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:rounded-xl sm:p-4">
              <div className="flex items-center gap-2 text-[#81756A]">
                <CalendarDays size={16} className="shrink-0 text-[#963D54]" />
                <p className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
                  Last Donation Date
                </p>
              </div>

              <p className="mt-2.5 break-words text-sm font-semibold text-[#302923] sm:mt-3 sm:text-base">
                {formatDate(lastDonationDate)}
              </p>
            </div>
          )}

          {isCoolingDown && (
            <div className="min-w-0 rounded-lg border border-[#E8C9CE] bg-[#F7E9E7] p-3.5 sm:rounded-xl sm:p-4">
              <div className="flex items-center gap-2 text-[#782B40]">
                <Clock size={16} className="shrink-0" />
                <p className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
                  Eligible Again On
                </p>
              </div>

              <p className="mt-2.5 break-words text-sm font-semibold text-[#782B40] sm:mt-3 sm:text-base">
                {formatDate(eligibleAgainDate)}
              </p>

              <p className="mt-1.5 text-[11px] leading-5 text-[#81756A] sm:text-xs">
                Your donation cooldown period is still active.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Status message */}
      {message && (
        <div
          role="status"
          className="break-words rounded-lg border border-[#E8C9CE] bg-[#F7E9E7] px-3.5 py-3 text-xs font-medium leading-5 text-[#782B40] sm:rounded-xl sm:px-4 sm:text-sm"
        >
          {message}
        </div>
      )}

      {/* Eligibility reasons */}
      {reasons.length > 0 && (
        <div className="rounded-lg border border-[#E8D5B9] bg-[#FBF3E8] p-3.5 sm:rounded-xl sm:p-5">
          <p className="mb-2.5 flex items-start gap-2 text-xs font-semibold leading-5 text-[#895B2D] sm:mb-3 sm:text-sm">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            Eligibility requirements not met:
          </p>

          <ul className="list-inside list-disc space-y-1.5 break-words text-xs leading-5 text-[#62564C] sm:text-sm sm:leading-6">
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DonorAvailability;
