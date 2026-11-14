
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
  ChevronRight,
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

    const timer = setTimeout(() => {
      setMessage("");
    }, TOAST_DURATION);

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

  // --------------------------------------------------
  // Load available cities
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Clean up temporary photo preview URL
  // --------------------------------------------------

  useEffect(() => {
    if (!photoPreview || !photoPreview.startsWith("blob:")) return;

    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  // --------------------------------------------------
  // Profile photo
  // --------------------------------------------------

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const validTypes = ["image/jpeg", "image/png"];

    if (!validTypes.includes(file.type)) {
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

  // --------------------------------------------------
  // Form fields
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Save profile
  // --------------------------------------------------

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

    if (!isDirty) {
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

      setMessage(
        response.data.message || "Donor profile saved successfully.",
      );
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

  // --------------------------------------------------
  // Edit actions
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Formatting helpers
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (isLoading) {
    return (
      <div
        className="flex min-h-[300px] items-center justify-center gap-3 rounded-3xl border border-[#E8DDD4] bg-[#FFFDF9]"
        role="status"
      >
        <Loader2 size={22} className="animate-spin text-[#963D54]" />
        <p className="text-sm font-medium text-[#81756A]">
          Loading your profile...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // Main account profile page
  // --------------------------------------------------

  return (
    <div className="w-full space-y-6">
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

      {/* Toast notification */}
      {message && (
        <div
          role="status"
          style={{ animation: "donor-toast-in 0.3s ease-out" }}
          className={`fixed right-4 top-24 z-[60] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border bg-[#FFFDF9] shadow-xl sm:right-6 ${
            messageType === "error"
              ? "border-[#E8C9C9]"
              : "border-[#E5C8C0]"
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
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
                messageType === "error"
                  ? "text-[#A33E4E]"
                  : "text-[#782B40]"
              }`}
            >
              {message}
            </p>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss notification"
              className="rounded-full p-1.5 text-[#9B8D83] transition hover:bg-[#F2E2DC]"
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

      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
            Account Settings
          </p>

          <h2 className="mt-1 font-serif text-2xl font-semibold text-[#302923] sm:text-3xl">
            My Profile
          </h2>

          <p className="mt-1 text-sm text-[#81756A]">
            Manage your personal details and donor information.
          </p>
        </div>

        {hasProfile && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-2 rounded-full bg-[#782B40] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#602032]"
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile overview */}
        <section className="overflow-hidden rounded-3xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm">
          <div className="h-2 bg-gradient-to-r from-[#782B40] via-[#A45B6D] to-[#D7A9A0]" />

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* Avatar: image only, no text overlay */}
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[5px] border-[#F2E2DC] bg-[#F8F1ED] shadow-sm sm:h-32 sm:w-32">
                  {photoPreview || profilePhoto ? (
                    <img
                      src={photoPreview || profilePhoto}
                      alt="Profile photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound
                      size={48}
                      strokeWidth={1.4}
                      className="text-[#A45B6D]"
                    />
                  )}
                </div>

                <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#FFFDF9] bg-[#782B40] text-white">
                  <Camera size={14} />
                </span>
              </div>

              {/* Profile information */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full bg-[#F2E2DC] px-3 py-1 text-xs font-semibold text-[#782B40]">
                    Donor Account
                  </span>

                  {hasProfile && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF4EB] px-3 py-1 text-xs font-semibold text-[#55744E]">
                      <CheckCircle2 size={13} />
                      Profile Complete
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-serif text-2xl font-semibold text-[#302923]">
                  {hasProfile ? "Your donor profile" : "Complete your profile"}
                </h3>

                <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-[#81756A] sm:mx-0">
                  {hasProfile
                    ? "Your information helps us match you with compatible blood donation requests."
                    : "Add your personal and donor information to start receiving compatible donation requests."}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  {hasProfile && formData.bloodGroup && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] px-3 py-2 text-sm font-semibold text-[#782B40]">
                      <Droplet size={15} />
                      {formData.bloodGroup}
                    </span>
                  )}

                  {hasProfile && formData.city && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] px-3 py-2 text-sm text-[#655A51]">
                      <MapPin size={15} className="text-[#A45B6D]" />
                      {formData.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Photo controls */}
            <div className="mt-7 border-t border-[#EEE5DE] pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#302923]">
                    Profile picture
                  </p>
                  <p className="mt-1 text-xs text-[#92857B]">
                    JPG or PNG · Maximum 2 MB
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="donorProfilePhoto"
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#DCCBC3] bg-[#FFFDF9] px-4 py-2.5 text-sm font-semibold text-[#782B40] transition hover:border-[#A45B6D] hover:bg-[#F8F1ED] ${
                      !hasProfile || isUploadingPhoto
                        ? "pointer-events-none opacity-50"
                        : ""
                    }`}
                  >
                    <Camera size={15} />
                    {profilePhoto ? "Change Photo" : "Choose Photo"}
                  </label>

                  <input
                    id="donorProfilePhoto"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handlePhotoSelect}
                    disabled={!hasProfile || isUploadingPhoto}
                    className="sr-only"
                  />

                  {photoFile && (
                    <>
                      <button
                        type="button"
                        onClick={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#602032] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Save size={15} />
                        )}
                        {isUploadingPhoto ? "Uploading..." : "Upload"}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelPhoto}
                        disabled={isUploadingPhoto}
                        aria-label="Cancel photo selection"
                        className="rounded-xl border border-[#E8DDD4] p-2.5 text-[#81756A] transition hover:bg-[#F8F5EF] disabled:opacity-50"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {!hasProfile && (
                <p className="mt-3 flex items-center gap-2 text-xs text-[#98602F]">
                  <Info size={14} />
                  Save your donor information before uploading a profile photo.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Personal information */}
        <section className="overflow-hidden rounded-3xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE5DE] px-5 py-5 sm:px-7">
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#302923]">
                Personal Information
              </h3>
              <p className="mt-1 text-sm text-[#81756A]">
                Your contact and personal details.
              </p>
            </div>

            {!isEditing && hasProfile && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2E2DC] px-3 py-1.5 text-xs font-semibold text-[#782B40]">
                <ShieldCheck size={14} />
                Saved Details
              </span>
            )}
          </div>

          <div className="p-5 sm:p-7">
            {/* Blood group */}
            <div className="mb-7">
              <label className="mb-3 block text-sm font-semibold text-[#55483F]">
                Blood Group
              </label>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
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
                      className={`flex h-12 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition ${
                        selected
                          ? "border-[#782B40] bg-[#782B40] text-white shadow-sm"
                          : isEditing
                            ? "border-[#E5D8CE] bg-[#F8F5EF] text-[#55483F] hover:border-[#A45B6D] hover:bg-[#F2E2DC]"
                            : "border-[#E8DDD4] bg-[#F8F5EF] text-[#655A51]"
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

            <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
              {/* City */}
              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-sm font-semibold text-[#55483F]"
                >
                  City
                </label>

                {isEditing ? (
                  <div className="relative">
                    <MapPin
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A45B6D]"
                    />

                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={isCitiesLoading}
                      required
                      className="w-full appearance-none rounded-xl border border-[#E5D8CE] bg-[#F8F5EF] py-3 pl-11 pr-4 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:bg-white focus:ring-4 focus:ring-[#F2E2DC] disabled:opacity-50"
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
                  </div>
                ) : (
                  <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-[#EEE5DE] bg-[#FAF8F4] px-4 py-3">
                    <MapPin size={17} className="shrink-0 text-[#A45B6D]" />
                    <span className="text-sm font-medium text-[#302923]">
                      {formData.city || "Not provided"}
                    </span>
                  </div>
                )}

                {renderFieldError("city")}
              </div>

              {/* Weight */}
              <div>
                <label
                  htmlFor="weight"
                  className="mb-2 block text-sm font-semibold text-[#55483F]"
                >
                  Weight
                </label>

                {isEditing ? (
                  <div className="relative">
                    <Scale
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A45B6D]"
                    />

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
                      className="w-full rounded-xl border border-[#E5D8CE] bg-[#F8F5EF] py-3 pl-11 pr-4 text-sm text-[#302923] outline-none transition placeholder:text-[#A99B90] focus:border-[#963D54] focus:bg-white focus:ring-4 focus:ring-[#F2E2DC]"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-[#EEE5DE] bg-[#FAF8F4] px-4 py-3">
                    <Scale size={17} className="shrink-0 text-[#A45B6D]" />
                    <span className="text-sm font-medium text-[#302923]">
                      {formData.weight
                        ? `${formData.weight} kg`
                        : "Not provided"}
                    </span>
                  </div>
                )}

                {renderFieldError("weight")}
              </div>

              {/* Date of birth */}
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="mb-2 block text-sm font-semibold text-[#55483F]"
                >
                  Date of Birth
                </label>

                {isEditing ? (
                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A45B6D]"
                    />

                    <input
                      id="dateOfBirth"
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      min={dateLimits.min}
                      max={dateLimits.max}
                      className="w-full rounded-xl border border-[#E5D8CE] bg-[#F8F5EF] py-3 pl-11 pr-4 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:bg-white focus:ring-4 focus:ring-[#F2E2DC]"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-[#EEE5DE] bg-[#FAF8F4] px-4 py-3">
                    <CalendarDays
                      size={17}
                      className="shrink-0 text-[#A45B6D]"
                    />
                    <span className="text-sm font-medium text-[#302923]">
                      {formatDate(formData.dateOfBirth)}
                    </span>
                  </div>
                )}

                {renderFieldError("dateOfBirth")}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-[#55483F]"
                >
                  Phone Number
                </label>

                {isEditing ? (
                  <div className="relative">
                    <Phone
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A45B6D]"
                    />

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
                      className="w-full rounded-xl border border-[#E5D8CE] bg-[#F8F5EF] py-3 pl-11 pr-4 text-sm text-[#302923] outline-none transition placeholder:text-[#A99B90] focus:border-[#963D54] focus:bg-white focus:ring-4 focus:ring-[#F2E2DC]"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-[#EEE5DE] bg-[#FAF8F4] px-4 py-3">
                    <Phone size={17} className="shrink-0 text-[#A45B6D]" />
                    <span className="text-sm font-medium text-[#302923]">
                      {formData.phone || "Not provided"}
                    </span>
                  </div>
                )}

                {renderFieldError("phone")}
              </div>
            </div>
          </div>
        </section>

        {/* Edit mode actions */}
        {isEditing && (
          <section className="rounded-3xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#302923]">
                  {hasProfile ? "Update your information" : "Create your profile"}
                </p>

                <p className="mt-1 text-xs text-[#81756A]">
                  {isDirty
                    ? "You have changes that have not been saved."
                    : "Complete all required fields before saving."}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {hasProfile && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCCBC3] bg-white px-5 py-3 text-sm font-semibold text-[#655A51] transition hover:bg-[#F8F5EF] disabled:opacity-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSaving || (hasProfile && !isDirty)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#602032] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {isSaving
                    ? "Saving..."
                    : hasProfile
                      ? "Save Changes"
                      : "Create Profile"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* View mode footer */}
        {!isEditing && hasProfile && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-xs text-[#81756A]">
              <ShieldCheck size={15} className="text-[#A45B6D]" />
              Your profile information is saved.
            </div>

            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#782B40] transition hover:text-[#A45B6D]"
            >
              Update information
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default DonorProfileForm;
