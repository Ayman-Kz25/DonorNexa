import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useApi } from "../hooks/useApi";

function DonorAvailability() {
  const { request } = useApi();

  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [reasons, setReasons] = useState([]);

  // Load donor profile
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
          error.response?.data?.message || "Unable to load donor profile."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadDonor();

    // Reload profile whenever DonorProfileForm saves it
    const handleProfileUpdate = () => {
      loadDonor();
    };

    window.addEventListener("donor-profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener(
        "donor-profile-updated",
        handleProfileUpdate
      );
    };
  }, [loadDonor]);

  // Toggle donor availability
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
      }));

      setMessage(response.data.message || "Availability updated successfully.");
    } catch (error) {
      console.error("Update availability error:", error);

      setMessage(
        error.response?.data?.message || "Unable to update availability."
      );

      setReasons(error.response?.data?.reasons || []);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-[#FFF8FA] py-12 text-[#96334F]"
        role="status"
      >
        <Loader2 size={20} className="animate-spin text-[#BE4565]" />
        <p className="font-medium">Loading availability...</p>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="rounded-xl border border-rose-200 bg-[#FCE7ED] p-5">
        <p className="text-sm font-medium text-[#96334F]">
          {message || "Donor profile is not available."}
        </p>

        <button
          type="button"
          onClick={loadDonor}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#96334F] transition hover:bg-[#FFF8FA]"
        >
          <RefreshCw size={15} />
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Availability Status + Toggle */}
      <div
        className={`flex items-center justify-between gap-5 rounded-2xl border p-5 transition-colors duration-300 sm:p-6 ${
          donor.isAvailable
            ? "border-rose-200 bg-gradient-to-r from-[#FCE7ED] to-[#FFF8FA]"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div>
          <p className="font-semibold text-[#29232A]">
            Availability Status
          </p>

          <p
            className={`mt-1 flex items-center gap-2 text-sm font-medium ${
              donor.isAvailable ? "text-[#BE4565]" : "text-gray-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                donor.isAvailable ? "bg-[#BE4565]" : "bg-gray-400"
              }`}
            />
            {donor.isAvailable ? "Available" : "Unavailable"}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {updating
              ? "Updating..."
              : donor.isAvailable
                ? "Tap the switch to turn availability OFF"
                : "Tap the switch to turn availability ON"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold tracking-wider ${
              donor.isAvailable ? "text-[#96334F]" : "text-gray-400"
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
            className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full p-1 shadow-inner outline-none transition-colors duration-300 focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70 ${
              donor.isAvailable
                ? "bg-gradient-to-r from-[#BE4565] to-[#96334F] shadow-rose-900/20"
                : "bg-gray-300 shadow-gray-400/30"
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
                donor.isAvailable ? "translate-x-7" : "translate-x-0"
              }`}
            >
              {updating && (
                <Loader2
                  size={15}
                  className="animate-spin text-[#BE4565]"
                />
              )}
            </span>
          </button>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-rose-200 bg-[#FCE7ED] px-4 py-3 text-sm font-medium text-[#96334F]"
        >
          {message}
        </div>
      )}

      {reasons.length > 0 && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <p className="mb-3 flex items-center gap-2 font-semibold text-orange-800">
            <AlertTriangle size={18} />
            Eligibility requirements not met:
          </p>

          <ul className="list-inside list-disc space-y-1.5 text-sm leading-6 text-gray-700">
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