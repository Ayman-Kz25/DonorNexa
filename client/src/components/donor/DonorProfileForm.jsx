import { useState, useEffect, useCallback } from "react";
import {
  UserRound,
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
  Camera,
  ShieldCheck,
  Phone,
  ArrowUpRight,
  HeartHandshake,
  Plus,
  Sparkle,
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
  const [isEditing, setIsEditing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [fieldErrors, setFieldErrors] = useState({});

  const [cities, setCities] = useState([]);
  const [isCitiesLoading, setIsCitiesLoading] = useState(true);

  const [profilePhoto, setProfilePhoto] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const isDirty =
    JSON.stringify(toComparable(formData)) !==
    JSON.stringify(toComparable(savedData));

  // --------------------------------------------------
  // Notifications
  // --------------------------------------------------

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(""), TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [message, messageType]);

  // --------------------------------------------------
  // Load donor profile
  // --------------------------------------------------

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await request({
        method: "GET",
        url: "/api/donors/profile",
      });

      const donor = response.data.donor;

      if (!donor) {
        setHasProfile(false);
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
      setProfilePhoto(donor.profilePhoto?.url || "");
      setHasProfile(true);
      setIsEditing(false);
      setMessage("");
    } catch (error) {
      if (error.response?.status === 404) {
        setHasProfile(false);
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

  // Load cities
  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await request({
          method: "GET",
          url: "/api/cities",
        });

        setCities(response.data.cities || []);
      } catch (error) {
        console.error("Load cities error:", error);
        setMessage("Unable to load available cities.");
        setMessageType("error");
      } finally {
        setIsCitiesLoading(false);
      }
    };

    loadCities();
  }, [request]);

  // Temporary photo preview cleanup
  useEffect(() => {
    if (!photoPreview || !photoPreview.startsWith("blob:")) return;

    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  // Profile photo
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setMessage("Only JPG and PNG images are allowed.");
      setMessageType("error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Profile photo must not exceed 2 MB.");
      setMessageType("error");
      e.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !hasProfile) return;

    const uploadData = new FormData();
    uploadData.append("profilePhoto", photoFile);

    try {
      setIsUploadingPhoto(true);
      setMessage("");

      const response = await request({
        method: "POST",
        url: "/api/donors/profile/photo",
        data: uploadData,
      });

      setProfilePhoto(response.data.profilePhoto.url);
      setPhotoFile(null);
      setPhotoPreview("");

      const fileInput = document.getElementById("donorProfilePhoto");
      if (fileInput) fileInput.value = "";

      setMessage(
        response.data.message || "Profile photo uploaded successfully.",
      );
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to upload profile photo.",
      );
      setMessageType("error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");

    const fileInput = document.getElementById("donorProfilePhoto");
    if (fileInput) fileInput.value = "";
  };

  // Form fields
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

    setFieldErrors((previous) => ({
      ...previous,
      bloodGroup: "",
    }));
  };

  // Validation
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

        if (!cities.some((city) => city.name === value.trim())) {
          return "Please select a valid city.";
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

        const birthDate = new Date(`${value}T00:00:00`);

        if (Number.isNaN(birthDate.getTime())) {
          return "Please enter a valid date of birth.";
        }

        if (birthDate.getTime() > new Date().setHours(0, 0, 0, 0)) {
          return "Date of birth cannot be in the future.";
        }

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

      case "bloodGroup":
        if (!BLOOD_GROUPS.includes(value)) {
          return "Please select your blood group.";
        }
        break;

      default:
        break;
    }

    return "";
  };

  // Save profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    ["bloodGroup", "city", "weight", "dateOfBirth", "phone"].forEach(
      (field) => {
        const error = validateField(field, formData[field]);

        if (error) errors[field] = error;
      },
    );

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setMessage("Please correct the highlighted fields.");
      setMessageType("error");
      return;
    }

    if (!isDirty && hasProfile) {
      setIsEditing(false);
      return;
    }

    const payload = {
      bloodGroup: formData.bloodGroup,
      dateOfBirth: formData.dateOfBirth,
      weight: Number(formData.weight),
      city: formData.city.trim(),
      phone: formData.phone.trim(),
    };

    try {
      setIsSaving(true);
      setMessage("");

      const response = await request({
        method: "POST",
        url: "/api/donors/profile",
        data: payload,
      });

      let synced = {
        ...formData,
        weight: Number(formData.weight),
      };

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
      setHasProfile(true);
      setIsEditing(false);
      setFieldErrors({});

      onRegistered?.(response.data.donor || synced);

      setMessage(response.data.message || "Donor profile saved successfully.");
      setMessageType("success");
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

  // Edit actions
  const handleStartEdit = () => {
    setFormData(savedData);
    setFieldErrors({});
    setMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData(savedData);
    setFieldErrors({});
    setMessage("");
    setIsEditing(false);
  };

  // Formatting
  const formatDate = (date) => {
    if (!date) return "Not provided";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculateDateLimits = () => {
    const today = new Date();

    const minDate = new Date(today);
    minDate.setFullYear(today.getFullYear() - 60);

    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() - 18);

    const format = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    return {
      min: format(minDate),
      max: format(maxDate),
    };
  };

  const dateLimits = calculateDateLimits();

  const renderFieldError = (field) =>
    fieldErrors[field] ? (
      <p className="mt-2 text-xs font-medium text-[#A33E4E]">
        {fieldErrors[field]}
      </p>
    ) : null;

  const displayPhoto = photoPreview || profilePhoto;

  // Loading
  if (isLoading) {
    return (
      <div
        className="flex min-h-[360px] items-center justify-center gap-3 border border-[#E3D5C8] bg-[#F8F5EF]"
        role="status"
      >
        <Loader2 size={22} className="animate-spin text-[#963D54]" />
        <p className="text-sm text-[#81756A]">Loading your profile...</p>
      </div>
    );
  }

  // Reusable field styling
  const inputClass =
    "w-full rounded-none border-0 border-b border-[#DCCFC2] bg-transparent py-3 text-sm text-[#302923] outline-none transition placeholder:text-[#A99B90] focus:border-[#963D54] focus:ring-0";

  const iconClass =
    "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[#A45B6D]";

  return (
    <div className="w-full space-y-10 text-[#302923]">
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

      {/* Toast */}
      {message && (
        <div
          role="status"
          style={{ animation: "donor-toast-in 0.3s ease-out" }}
          className={`fixed right-4 top-24 z-[60] w-[calc(100%-2rem)] max-w-sm overflow-hidden border bg-[#FFFDF9] shadow-xl sm:right-6 ${
            messageType === "error" ? "border-[#E8C9C9]" : "border-[#E5C8C0]"
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center ${
                messageType === "error"
                  ? "bg-[#FBEEEE] text-[#A33E4E]"
                  : "bg-[#F2E2DC] text-[#963D54]"
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
                messageType === "error" ? "text-[#A33E4E]" : "text-[#963D54]"
              }`}
            >
              {message}
            </p>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss notification"
              className="p-1.5 text-[#9B8D83] transition hover:bg-[#F2E2DC]"
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

      {/* Profile introduction */}
      <section className="flex flex-col justify-between gap-4 border-b border-[#F0DDE3] pb-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-[#BE4565]">Account details</p>

          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#29232A]">
            Donor profile
          </h2>

          <p className="mt-1 text-sm text-[#817780]">
            View and manage your personal information.
          </p>
        </div>

        {hasProfile && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-[#96334F] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#7D3045] sm:self-auto"
          >
            <Pencil size={15} />
            Edit profile
          </button>
        )}
      </section>
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Profile identity composition */}
        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          {/* Photo area */}
          <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-xl bg-[#F0EAE0] p-8 sm:min-h-[390px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(#D9BFAF 0.8px, transparent 0.8px)",
                backgroundSize: "12px 12px",
              }}
            />

            <div className="pointer-events-none absolute h-[290px] w-[290px] rounded-full border border-[#D5C2B3] sm:h-[340px] sm:w-[340px]" />
            <div className="pointer-events-none absolute h-[230px] w-[230px] rounded-full border border-[#D5C2B3] sm:h-[275px] sm:w-[275px]" />

            <div className="relative z-10">
              <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-[7px] border-[#FFFDF9] bg-[#E8D8CC] shadow-[0_15px_45px_rgba(80,48,40,0.12)] sm:h-56 sm:w-56">
                {displayPhoto ? (
                  <img
                    src={displayPhoto}
                    alt="Donor profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound
                    size={76}
                    strokeWidth={1.1}
                    className="text-[#963D54]"
                  />
                )}
              </div>

              {hasProfile && (
                <label
                  htmlFor="donorProfilePhoto"
                  title="Change profile photo"
                  className={`absolute bottom-3 right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-[3px] border-[#F0EAE0] bg-[#963D54] text-white shadow-md transition hover:bg-[#7D3045] ${
                    isUploadingPhoto ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <Camera size={18} />
                </label>
              )}
            </div>

            <span className="absolute left-6 top-6 text-[#B27A70]">
              <Sparkle size={23} strokeWidth={1.2} />
            </span>

            <span className="absolute bottom-7 right-7 text-[#B27A70]">
              <Sparkle size={18} strokeWidth={1.2} />
            </span>
          </div>

          {/* Identity details */}
          <div className="flex flex-col justify-center py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#963D54]">
              {hasProfile ? "Donor identity" : "Your donor journey"}
            </p>

            <h3 className="mt-2 text-lg font-semibold text-[#29232A]">
              Profile overview
            </h3>

            <p className="mt-1 text-sm leading-6 text-[#817780]">
              Your donor details and profile photo.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="border-l-2 border-[#963D54] rounded-xl bg-[#F0EAE0] px-4 py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#81756A]">
                  Blood group
                </p>
                <p className="mt-2 font-serif text-4xl text-[#963D54]">
                  {hasProfile && formData.bloodGroup
                    ? formData.bloodGroup
                    : "—"}
                </p>
              </div>

              <div className="border-l-2 border-[#C9A99B] rounded-xl bg-[#F0EAE0] px-4 py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#81756A]">
                  Location
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#302923]">
                  <MapPin size={15} className="shrink-0 text-[#963D54]" />
                  <span className="truncate">
                    {hasProfile && formData.city ? formData.city : "Not set"}
                  </span>
                </p>
              </div>
            </div>

            {/* Photo upload controls */}
            <div className="mt-7 border-t border-[#E3D5C8] pt-5">
              <input
                id="donorProfilePhoto"
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handlePhotoSelect}
                disabled={!hasProfile || isUploadingPhoto}
                className="sr-only"
              />

              <div className="flex flex-wrap items-center gap-3">
                <p className="mr-auto text-xs text-[#81756A]">
                  Profile image · JPG or PNG · Maximum 2 MB
                </p>

                {photoFile && (
                  <>
                    <button
                      type="button"
                      onClick={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="inline-flex items-center gap-2 bg-[#963D54] px-4 py-2.5 text-xs font-semibold rounded-lg text-white transition hover:bg-[#7D3045] disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {isUploadingPhoto ? "Uploading..." : "Upload photo"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelPhoto}
                      disabled={isUploadingPhoto}
                      aria-label="Cancel photo selection"
                      className="border border-[#DCCFC2] rounded-lg p-2.5 text-[#81756A] transition hover:bg-[#F0EAE0] disabled:opacity-50"
                    >
                      <X size={15} />
                    </button>
                  </>
                )}
              </div>

              {!hasProfile && (
                <p className="mt-3 text-xs text-[#98602F]">
                  Save your donor profile before uploading a photo.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Information heading */}
        <section className="border-t border-[#E3D5C8] pt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#963D54]">
                The essentials
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#29232A]">
                Personal information
              </h3>
            </div>

            <p className="max-w-xs text-xs leading-6 text-[#81756A]">
              Your details are used for donor eligibility and matching. Keep
              them correct.
            </p>
          </div>

          {/* Blood group selector */}
          <div className="mt-9 border-y border-[#E3D5C8] py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="text-sm font-semibold text-[#302923]">
                  Your blood group
                </label>
                <p className="mt-1 text-xs text-[#81756A]">
                  Select the blood group shown in your medical records.
                </p>
              </div>

              {hasProfile && !isEditing && (
                <span className="text-xs font-semibold text-[#963D54]">
                  Saved information
                </span>
              )}
            </div>

            <div
              role="radiogroup"
              aria-label="Blood group"
              className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-8"
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
                    className={`flex h-12 items-center justify-center gap-1.5 border rounded-lg text-sm font-semibold transition ${
                      selected
                        ? "border-[#963D54] bg-[#963D54] text-white"
                        : isEditing
                          ? "border-[#DCCFC2] bg-[#F0EAE0] text-[#55483F] hover:border-[#963D54] hover:text-[#963D54]"
                          : "border-[#E3D5C8] bg-[#F0EAE0] text-[#655A51]"
                    } disabled:cursor-default`}
                  >
                    {selected && <Droplet size={14} />}
                    {group}
                  </button>
                );
              })}
            </div>

            {renderFieldError("bloodGroup")}
          </div>

          {/* Personal details */}
          <div className="grid gap-x-12 gap-y-8 py-8 sm:grid-cols-2">
            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#81756A]"
              >
                <MapPin size={15} className="text-[#963D54]" />
                City
              </label>

              {isEditing ? (
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isCitiesLoading}
                  required
                  className={inputClass}
                >
                  <option value="">
                    {isCitiesLoading ? "Loading cities..." : "Select city"}
                  </option>
                  {cities.map((city) => (
                    <option key={city._id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="border-b border-[#DCCFC2] py-3 text-sm font-medium">
                  {formData.city || "Not provided"}
                </p>
              )}

              {renderFieldError("city")}
            </div>

            {/* Weight */}
            <div>
              <label
                htmlFor="weight"
                className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#81756A]"
              >
                <Scale size={15} className="text-[#963D54]" />
                Weight
              </label>

              {isEditing ? (
                <div className="relative">
                  <input
                    id="weight"
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Enter your weight"
                    min="50"
                    step="0.1"
                    required
                    className={inputClass}
                  />
                  <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs text-[#81756A]">
                    kg
                  </span>
                </div>
              ) : (
                <p className="border-b border-[#DCCFC2] py-3 text-sm font-medium">
                  {formData.weight ? `${formData.weight} kg` : "Not provided"}
                </p>
              )}

              {renderFieldError("weight")}
            </div>

            {/* Date of birth */}
            <div>
              <label
                htmlFor="dateOfBirth"
                className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#81756A]"
              >
                <CalendarDays size={15} className="text-[#963D54]" />
                Date of birth
              </label>

              {isEditing ? (
                <input
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  min={dateLimits.min}
                  max={dateLimits.max}
                  className={inputClass}
                />
              ) : (
                <p className="border-b border-[#DCCFC2] py-3 text-sm font-medium">
                  {formatDate(formData.dateOfBirth)}
                </p>
              )}

              {renderFieldError("dateOfBirth")}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#81756A]"
              >
                <Phone size={15} className="text-[#963D54]" />
                Phone number
              </label>

              {isEditing ? (
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="03XXXXXXXXX or +92XXXXXXXXXX"
                  required
                  maxLength={13}
                  pattern="(03[0-9]{9}|\+92[0-9]{10})"
                  title="Enter 03XXXXXXXXX or +92XXXXXXXXXX without spaces or symbols."
                  className={inputClass}
                />
              ) : (
                <p className="border-b border-[#DCCFC2] py-3 text-sm font-medium">
                  {formData.phone || "Not provided"}
                </p>
              )}

              {renderFieldError("phone")}
            </div>
          </div>
        </section>

        {/* Privacy note */}
        <section className="flex flex-col gap-4 border-y border-[#E3D5C8] py-6 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0E2DA] text-[#963D54]">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#302923]">
              Your information matters.
            </h4>
            <p className="mt-1 max-w-2xl text-xs leading-6 text-[#81756A]">
              Your contact details are not displayed on public emergency
              listings. Hospitals can access your phone number only after you
              accept a matched donation request.
            </p>
          </div>
        </section>

        {/* Edit actions */}
        {isEditing && (
          <section className="flex flex-col gap-4 border-t border-[#E3D5C8] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-xl">
                {hasProfile ? "Ready to update?" : "Ready to get started?"}
              </p>
              <p className="mt-1 text-xs text-[#81756A]">
                {isDirty
                  ? "You have unsaved changes."
                  : "Complete all required information before saving."}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {hasProfile && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 border border-[#DCCFC2] rounded-lg px-5 py-3 text-sm font-semibold text-[#655A51] transition hover:bg-[#F0EAE0] disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving || (hasProfile && !isDirty)}
                className="inline-flex items-center justify-center gap-3 bg-[#963D54] rounded-lg px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#7D3045] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {isSaving
                  ? "Saving..."
                  : hasProfile
                    ? "Save changes"
                    : "Create donor profile"}
              </button>
            </div>
          </section>
        )}

        {/* View mode footer */}
        {!isEditing && hasProfile && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E3D5C8] rounded-lg pt-6">
            <div className="flex items-center gap-2 text-xs text-[#81756A]">
              <CheckCircle2 size={15} className="text-[#963D54]" />
              Your profile information is saved.
            </div>

            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#963D54] transition hover:text-[#7D3045]"
            >
              Update information
              <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default DonorProfileForm;
