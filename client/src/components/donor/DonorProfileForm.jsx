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

const TOAST_DURATION = 4000;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const initialFormData = {
  bloodGroup: "",
  dateOfBirth: "",
  weight: "",
  city: "",
  phone: "",
};

const labelClass = "mb-2 block text-sm font-semibold text-[#55483F]";

const inputClass =
  "w-full rounded-xl border border-[#E5D8CE] bg-[#F8F5EF] py-3 pl-11 pr-4 text-[#302923] outline-none transition placeholder:text-[#A99B90] hover:border-[#CDA5A5] focus:border-[#963D54] focus:bg-[#FFFDF9] focus:ring-4 focus:ring-[#F2E2DC] disabled:cursor-not-allowed disabled:bg-[#F1EFEC] disabled:text-[#8F857D]";

const iconClass =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A45B6D]";

const toComparable = (data) => ({
  bloodGroup: data.bloodGroup || "",
  dateOfBirth: data.dateOfBirth || "",
  weight: String(data.weight ?? ""),
  city: (data.city || "").trim(),
  phone: (data.phone || "").trim(),
});

function DonorProfileForm({ onRegistered }) {
  const { request } = useApi();

  const [formData, setFormData] = useState(initialFormData);
  const [savedData, setSavedData] = useState(initialFormData);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [fieldErrors, setFieldErrors] = useState({});

  const isDirty =
    JSON.stringify(toComparable(formData)) !==
    JSON.stringify(toComparable(savedData));

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(""), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [message, messageType]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleBloodGroupSelect = (group) => {
    if (!isEditing) return;

    setFormData((previous) => ({
      ...previous,
      bloodGroup: group,
    }));
  };

  const handleCancelEdit = () => {
    setFormData(savedData);
    setIsEditing(false);
    setMessage("");
    setFieldErrors({});
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);

    let age = today.getFullYear() - birthDate.getFullYear();

    const hasBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassed) age--;

    return age;
  };

  const validateField = (name, value) => {
    switch (name) {
      case "city":
        if (!value.trim()) return "City is required.";

        if (!/^(?=.*[A-Za-z])[A-Za-z ]{3,20}$/.test(value.trim())) {
          return "City must contain 3–20 letters only.";
        }
        break;

      case "weight":
        if (value === "" || !Number.isFinite(Number(value))) {
          return "Please enter a valid weight.";
        }

        if (Number(value) < 50) {
          return "Donor weight must be at least 50 kg.";
        }
        break;

      case "dateOfBirth": {
        if (!value) return "Date of birth is required.";

        const age = calculateAge(value);

        if (age < 18 || age > 60) {
          return "Donor age must be between 18 and 60 years.";
        }
        break;
      }

      case "phone":
        if (!/^(03[0-9]{9}|\+92[0-9]{10})$/.test(value)) {
          return "Enter a valid Pakistani number (03XXXXXXXXX or +92XXXXXXXXXX).";
        }
        break;

      default:
        break;
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    ["city", "weight", "dateOfBirth", "phone"].forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setMessage("Please correct the highlighted fields.");
      setMessageType("error");
      return;
    }

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
      onRegistered?.(response.data.donor || synced);
    } catch (error) {
  console.error("Save donor profile error:", error);

  const responseErrors = error.response?.data?.errors;

  if (responseErrors) {
    setFieldErrors(responseErrors);

    setMessage(Object.values(responseErrors).join(" "));
  } else {
    setMessage(
      error.response?.data?.message || "Unable to save donor profile.",
    );
  }

  setMessageType("error");
} finally {
  setIsSaving(false);
}
  };

  const getDateLimits = () => {
    const today = new Date();

    const minDate = new Date(today);
    minDate.setFullYear(today.getFullYear() - 60);

    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() - 18);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    return {
      min: formatDate(minDate),
      max: formatDate(maxDate),
    };
  };

  const dateLimits = getDateLimits();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center gap-3 rounded-2xl border border-[#E8DDD4] bg-[#F8F5EF] py-12 text-[#782B40]"
        role="status"
      >
        <Loader2 size={20} className="animate-spin" />
        <p className="text-sm font-medium">Loading profile...</p>
      </div>
    );
  }

  const renderFieldError = (field) =>
    fieldErrors[field] ? (
      <p className="mt-1.5 text-xs text-[#A33E4E]">{fieldErrors[field]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <style>{`
        @keyframes donor-toast-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes donor-toast-bar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Toast Notification */}
      {message && (
        <div
          role="status"
          style={{ animation: "donor-toast-in 0.3s ease-out" }}
          className={`fixed right-4 top-24 z-[60] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border bg-[#FFFDF9] shadow-xl sm:right-6 ${
            messageType === "error" ? "border-[#E8C9C9]" : "border-[#E5C8C0]"
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                messageType === "error"
                  ? "bg-[#FBEEEE] text-[#A33E4E]"
                  : "bg-[#F2E2DC] text-[#782B40]"
              }`}
            >
              {messageType === "error" ? (
                <AlertCircle size={19} />
              ) : (
                <CheckCircle2 size={19} />
              )}
            </span>

            <p
              className={`flex-1 pt-1.5 text-sm font-medium ${
                messageType === "error" ? "text-[#A33E4E]" : "text-[#782B40]"
              }`}
            >
              {message}
            </p>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss notification"
              className="rounded-full p-1.5 text-[#9B8D83] transition hover:bg-[#F2E2DC] hover:text-[#782B40]"
            >
              <X size={16} />
            </button>
          </div>

          <div
            key={message}
            style={{
              animation: `donor-toast-bar ${TOAST_DURATION}ms linear forwards`,
            }}
            className={`h-1 ${
              messageType === "error" ? "bg-[#A33E4E]" : "bg-[#963D54]"
            }`}
          />
        </div>
      )}

      {/* Form Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Donor Information
            </h2>

            {!isEditing && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2E2DC] px-3 py-1 text-xs font-semibold text-[#782B40]">
                <CheckCircle2 size={13} />
                Saved
              </span>
            )}

            {isEditing && isDirty && (
              <span className="rounded-xl bg-[#F8F1DF] px-3 py-1 text-xs font-semibold text-[#92702F]">
                Unsaved changes
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-[#81756A]">
            Keep your donor details accurate and up to date.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setMessage("");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCCBC3] bg-[#FFFDF9] px-4 py-2 text-sm font-semibold text-[#782B40] transition hover:border-[#A45B6D] hover:bg-[#F2E2DC]"
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Blood Group */}
      <div>
        <label className={labelClass}>Blood Group</label>

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
                className={`flex h-11 items-center justify-center gap-1 rounded-xl border text-sm font-semibold transition disabled:cursor-not-allowed ${
                  selected
                    ? "border-[#782B40] bg-[#782B40] text-white shadow-sm"
                    : isEditing
                      ? "border-[#E5D8CE] bg-[#F8F5EF] text-[#55483F] hover:border-[#A45B6D] hover:bg-[#F2E2DC]"
                      : "border-[#E8DDD4] bg-[#F1EFEC] text-[#9B9189]"
                }`}
              >
                {selected && <Droplet size={13} />}
                {group}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Fields */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelClass}>
            City
          </label>

          <div className="relative">
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
              minLength={3}
              maxLength={20}
              pattern="(?=.*[A-Za-z])[A-Za-z ]{3,20}"
              title="City must contain 3–20 letters."
              required
            />
          </div>
          {renderFieldError("city")}
        </div>

        <div>
          <label htmlFor="weight" className={labelClass}>
            Weight (kg)
          </label>

          <div className="relative">
            <Scale size={18} className={iconClass} />
            <input
              id="weight"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g. 65"
              disabled={!isEditing}
              min="50"
              step="0.1"
              required
              className={inputClass}
            />
          </div>
          {renderFieldError("weight")}
        </div>

        <div>
          <label htmlFor="dateOfBirth" className={labelClass}>
            Date of Birth
          </label>

          <div className="relative">
            <CalendarDays size={18} className={iconClass} />
            <input
              id="dateOfBirth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={!isEditing}
              required
              min={dateLimits.min}
              max={dateLimits.max}
              className={inputClass}
            />
          </div>
          {renderFieldError("dateOfBirth")}
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone Number
          </label>

          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="03XXXXXXXXX or +92XXXXXXXXXX"
            disabled={!isEditing}
            required
            maxLength={13}
            pattern="(03[0-9]{9}|\+92[0-9]{10})"
            title="Enter 03XXXXXXXXX or +92XXXXXXXXXX without spaces or symbols."
            className="w-full rounded-xl border border-[#E5D8CE] bg-[#F8F5EF] px-4 py-3 text-[#302923] outline-none transition placeholder:text-[#A99B90] hover:border-[#CDA5A5] focus:border-[#963D54] focus:bg-[#FFFDF9] focus:ring-4 focus:ring-[#F2E2DC] disabled:cursor-not-allowed disabled:bg-[#F1EFEC] disabled:text-[#8F857D]"
          />
          {renderFieldError("phone")}
        </div>
      </div>

      {/* Form Actions */}
      {isEditing && (
        <div className="mt-8 flex flex-col gap-3 border-t border-[#E8DDD4] pt-6 sm:flex-row sm:items-center">
          {isDirty ? (
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#782B40] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#602032] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          ) : (
            <p className="flex items-center gap-2 rounded-xl bg-[#F8F5EF] px-4 py-3 text-sm text-[#81756A]">
              <Info size={16} className="shrink-0 text-[#963D54]" />
              {hasProfile
                ? "Make a change to enable saving."
                : "Fill in your details to save your profile."}
            </p>
          )}

          {hasProfile && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#DCCBC3] bg-[#FFFDF9] px-6 py-3 text-sm font-semibold text-[#655A51] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <X size={17} />
              Cancel
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default DonorProfileForm;
