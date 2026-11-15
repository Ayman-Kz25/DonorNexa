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
        className="flex items-center justify-center gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] py-12 text-[#782B40]"
        role="status"
      >
        <Loader2 size={20} className="animate-spin" />
        <p className="font-medium">Loading availability...</p>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5">
        <p className="text-sm font-medium text-[#782B40]">
          {message || "Donor profile is not available."}
        </p>

        <button
          type="button"
          onClick={loadDonor}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#612033]"
        >
          <RefreshCw size={15} />
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
    <div className="w-full space-y-4">
      {/* Availability toggle */}
      <div
        className={`flex items-center justify-between gap-5 rounded-xl border p-5 transition-colors duration-300 sm:p-6 ${
          donor.isAvailable
            ? "border-[#E8C9CE] bg-[#F7E9E7]"
            : "border-[#E8DDD4] bg-[#F1EDE6]"
        }`}
      >
        <div>
          <p className="font-semibold text-[#302923]">Availability Status</p>

          <p
            className={`mt-1 flex items-center gap-2 text-sm font-medium ${
              donor.isAvailable ? "text-[#782B40]" : "text-[#81756A]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                donor.isAvailable ? "bg-[#963D54]" : "bg-[#A79B91]"
              }`}
            />
            {donor.isAvailable ? "Available" : "Unavailable"}
          </p>

          <p className="mt-2 text-xs text-[#81756A]">
            {updating
              ? "Updating..."
              : donor.isAvailable
                ? "Turn availability OFF when you cannot donate."
                : "Turn availability ON when you are ready to donate."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold tracking-wider ${
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
            className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full p-1 shadow-inner outline-none transition-colors duration-300 focus-visible:ring-4 focus-visible:ring-[#E8C9CE] disabled:cursor-not-allowed disabled:opacity-70 ${
              donor.isAvailable ? "bg-[#782B40]" : "bg-[#B8AEA5]"
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
                donor.isAvailable ? "translate-x-7" : "translate-x-0"
              }`}
            >
              {updating && (
                <Loader2 size={15} className="animate-spin text-[#782B40]" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Donation dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        {!donor.isAvailable && lastDonationDate && (
          <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4">
            <div className="flex items-center gap-2 text-[#81756A]">
              <CalendarDays size={17} />
              <p className="text-xs font-semibold uppercase tracking-wide">
                Last Donation Date
              </p>
            </div>

            <p className="mt-3 text-base font-semibold text-[#302923]">
              {formatDate(lastDonationDate)}
            </p>
          </div>
        )}

        {isCoolingDown && (
          <div className="rounded-xl border border-[#E8C9CE] bg-[#F7E9E7] p-4">
            <div className="flex items-center gap-2 text-[#782B40]">
              <Clock size={17} />
              <p className="text-xs font-semibold uppercase tracking-wide">
                Eligible Again On
              </p>
            </div>

            <p className="mt-3 text-base font-semibold text-[#782B40]">
              {formatDate(eligibleAgainDate)}
            </p>

            <p className="mt-1 text-xs text-[#81756A]">
              Your donation cooldown period is still active.
            </p>
          </div>
        )}
      </div>

      {/* Status message */}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-[#E8C9CE] bg-[#F7E9E7] px-4 py-3 text-sm font-medium text-[#782B40]"
        >
          {message}
        </div>
      )}

      {/* Eligibility reasons */}
      {reasons.length > 0 && (
        <div className="rounded-xl border border-[#E8D5B9] bg-[#FBF3E8] p-5">
          <p className="mb-3 flex items-center gap-2 font-semibold text-[#895B2D]">
            <AlertTriangle size={18} />
            Eligibility requirements not met:
          </p>

          <ul className="list-inside list-disc space-y-1.5 text-sm leading-6 text-[#62564C]">
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
