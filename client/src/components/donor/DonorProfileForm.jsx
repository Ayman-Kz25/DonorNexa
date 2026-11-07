import { useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Save,
  Loader2,
  X,
  Droplet,
  MapPin,
  CalendarDays,
  Scale,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

const TOAST_DURATION = 4000; // ms — toast disappears after 4 seconds

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const labelClass = "mb-2 block text-sm font-semibold text-[#29232A]";

const inputClass =
  "w-full rounded-xl border border-rose-200 bg-[#FFF8FA] py-3 pl-11 pr-4 text-[#29232A] outline-none transition duration-200 placeholder:text-gray-400 hover:border-rose-300 focus:border-[#BE4565] focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500";

const iconClass =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-300 transition-colors duration-200 group-focus-within:text-[#BE4565]";

const initialFormData = {
  bloodGroup: "",
  dateOfBirth: "",
  weight: "",
  city: "",
  phone: "",
};

// Normalises form values so we can reliably tell if anything changed
const toComparable = (data) => ({
  bloodGroup: data.bloodGroup || "",
  dateOfBirth: data.dateOfBirth || "",
  weight: String(data.weight ?? ""),
  city: (data.city || "").trim(),
  phone: (data.phone || "").trim(),
});

function DonorProfileForm() {
  const { request } = useApi();

  const [formData, setFormData] = useState(initialFormData);
  const [savedData, setSavedData] = useState(initialFormData);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // True only when the user has actually changed something
  const isDirty =
    JSON.stringify(toComparable(formData)) !==
    JSON.stringify(toComparable(savedData));

  // Auto-dismiss the toast after a few seconds
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(""), TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [message, messageType]);

  // Load existing donor profile
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await request({
        method: "GET",
        url: "/api/donors/profile",
      });

      const donor = response.data.donor;

      if (!donor) {
        setIsEditing(true);
        return;
      }

      const loaded = {
        bloodGroup: donor.bloodGroup || "",
        dateOfBirth: donor.dateOfBirth
          ? new Date(donor.dateOfBirth).toISOString().split("T")[0]
          : "",
        weight: donor.weight ?? "",
        city: donor.city || "",
        phone: donor.phone || "",
      };

      setFormData(loaded);
      setSavedData(loaded);
      setHasProfile(true);
      setIsEditing(false);
      setMessage("");
    } catch (error) {
      if (error.response?.status === 404) {
        setIsEditing(true);
      } else {
        console.error("Load donor profile error:", error);
        setMessage("Unable to load donor profile.");
        setMessageType("error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle all form fields through one state object
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // Blood group chips update the same state object
  const handleBloodGroupSelect = (group) => {
    if (!isEditing) return;

    setFormData((previousData) => ({
      ...previousData,
      bloodGroup: group,
    }));
  };

  // Leave edit mode and discard unsaved changes
  const handleCancelEdit = () => {
    setFormData(savedData);
    setIsEditing(false);
    setMessage("");
  };

  // Save donor profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDirty) return;

    const payload = {
      bloodGroup: formData.bloodGroup,
      dateOfBirth: formData.dateOfBirth,
      weight: Number(formData.weight),
      city: formData.city.trim(),
      phone: formData.phone.trim(),
    };

    if (
      !payload.bloodGroup ||
      !payload.dateOfBirth ||
      !payload.city ||
      !payload.weight ||
      payload.weight <= 0
    ) {
      setMessage("Please provide all required information correctly.");
      setMessageType("error");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const response = await request({
        method: "POST",
        url: "/api/donors/profile",
        data: payload,
      });

      setMessage(response.data.message || "Donor profile saved successfully.");
      setMessageType("success");
      setIsEditing(false);
      setHasProfile(true);

      // Keep the form synchronized with the saved profile
      let synced = formData;

      if (response.data.donor) {
        const donor = response.data.donor;

        synced = {
          bloodGroup: donor.bloodGroup || "",
          dateOfBirth: donor.dateOfBirth
            ? new Date(donor.dateOfBirth).toISOString().split("T")[0]
            : payload.dateOfBirth,
          weight: donor.weight ?? payload.weight,
          city: donor.city || payload.city,
          phone: donor.phone || payload.phone,
        };
      }

      setFormData(synced);
      setSavedData(synced);
    } catch (error) {
      console.error("Save donor profile error:", error);

      setMessage(
        error.response?.data?.message || "Unable to save donor profile.",
      );
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-[#FFF8FA] py-12 text-[#96334F]"
        role="status"
      >
        <Loader2 size={20} className="animate-spin text-[#BE4565]" />
        <p className="font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Local keyframes for the toast */}
      <style>{`
        @keyframes donor-toast-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes donor-toast-bar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Toast notification (auto-dismisses) */}
      {message && (
        <div
          role="status"
          style={{ animation: "donor-toast-in 0.3s ease-out" }}
          className={`fixed right-4 top-24 z-[60] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border bg-white shadow-2xl sm:right-6 ${
            messageType === "error"
              ? "border-red-200 shadow-red-200/50"
              : "border-rose-200 shadow-rose-300/40"
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                messageType === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-[#FCE7ED] text-[#BE4565]"
              }`}
            >
              {messageType === "error" ? (
                <AlertCircle size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
            </span>

            <p
              className={`flex-1 pt-1.5 text-sm font-medium ${
                messageType === "error" ? "text-red-700" : "text-[#96334F]"
              }`}
            >
              {message}
            </p>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss notification"
              className="rounded-full p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-[#96334F]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Countdown bar */}
          <div
            key={message}
            style={{
              animation: `donor-toast-bar ${TOAST_DURATION}ms linear forwards`,
            }}
            className={`h-1 ${
              messageType === "error"
                ? "bg-gradient-to-r from-red-400 to-red-500"
                : "bg-gradient-to-r from-[#BE4565] to-[#96334F]"
            }`}
          />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-[#96334F]">Donor Profile</h2>

          {isEditing && isDirty && (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}

          {!isEditing && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCE7ED] px-3 py-1 text-xs font-semibold text-[#96334F] ring-1 ring-rose-200">
              <CheckCircle2 size={13} />
              Saved
            </span>
          )}
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setMessage("");
            }}
            className="group inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-[#BE4565] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#BE4565] hover:bg-[#FCE7ED] hover:text-[#96334F] hover:shadow-md"
          >
            <Pencil
              size={15}
              className="transition-transform duration-200 group-hover:-rotate-12"
            />
            Edit Profile
          </button>
        )}
      </div>

      {/* Blood Group chips */}
      <div>
        <span className={labelClass}>Blood Group</span>

        <div
          role="radiogroup"
          aria-label="Blood group"
          className="grid grid-cols-4 gap-2 sm:grid-cols-8"
        >
          {BLOOD_GROUPS.map((group) => {
            const selected = formData.bloodGroup === group;

            return (
              <button
                key={group}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!isEditing}
                onClick={() => handleBloodGroupSelect(group)}
                className={`flex h-12 items-center justify-center gap-1 rounded-xl border text-sm font-bold transition duration-200 disabled:cursor-not-allowed ${
                  selected
                    ? "scale-105 border-transparent bg-gradient-to-br from-[#BE4565] to-[#96334F] text-white shadow-lg shadow-rose-300/50"
                    : isEditing
                      ? "border-rose-200 bg-[#FFF8FA] text-[#96334F] hover:-translate-y-0.5 hover:border-[#BE4565] hover:bg-[#FCE7ED] hover:shadow-md"
                      : "border-gray-200 bg-gray-100 text-gray-400"
                }`}
              >
                {selected && <Droplet size={13} className="fill-white" />}
                {group}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {/* City */}
        <div>
          <label htmlFor="city" className={labelClass}>
            City
          </label>

          <div className="group relative">
            <MapPin size={18} className={iconClass} />
            <input
              id="city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter your city"
              disabled={!isEditing}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className={labelClass}>
            Weight (kg)
          </label>

          <div className="group relative">
            <Scale size={18} className={iconClass} />
            <input
              id="weight"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g. 65"
              disabled={!isEditing}
              min="1"
              step="0.1"
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className={labelClass}>
            Date of Birth
          </label>

          <div className="group relative">
            <CalendarDays size={18} className={iconClass} />
            <input
              id="dateOfBirth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={!isEditing}
              required
              max={new Date().toISOString().split("T")[0]}
              className={inputClass}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div >
          <label htmlFor="phone" className={labelClass}>
            Phone Number
          </label>

          <div className="group relative">
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 03XXXXXXXXX"
              disabled={!isEditing}
              required
              maxLength={20}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {isEditing && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Save only appears once something has actually changed */}
          {isDirty ? (
            <button
              type="submit"
              disabled={isSaving}
              style={{ animation: "donor-toast-in 0.25s ease-out" }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-6 py-3.5 font-semibold text-white shadow-lg shadow-rose-400/30 transition duration-200 hover:-translate-y-0.5 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-48"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          ) : (
            <p className="flex items-center gap-2 rounded-xl bg-[#FFF8FA] px-4 py-3 text-sm text-gray-500 ring-1 ring-rose-100">
              <Info size={16} className="shrink-0 text-[#BE4565]" />
              {hasProfile
                ? "Make a change to enable saving."
                : "Fill in your details to save your profile."}
            </p>
          )}

          {/* Let the donor leave edit mode without changing anything */}
          {hasProfile && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3.5 font-semibold text-gray-600 transition duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <X size={18} />
              Cancel
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default DonorProfileForm;
