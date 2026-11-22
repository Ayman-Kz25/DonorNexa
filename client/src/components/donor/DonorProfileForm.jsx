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
  Sparkle,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { useUser } from "@clerk/react";
import { formatDate } from "../../utils/dateTime";

const TOAST_DURATION = 4000;
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ALLOWED_PHOTO_EXTENSIONS = ["jpg", "jpeg", "png"];

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
  const { user } = useUser();

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

  // Notifications
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(""), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [message, messageType]);

  // Load donor profile
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

  // Cleanup temporary photo previews
  useEffect(() => {
    if (!photoPreview || !photoPreview.startsWith("blob:")) return;

    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  // Profile photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name
      .substring(file.name.lastIndexOf(".") + 1)
      .toLowerCase();

    if (!ALLOWED_PHOTO_EXTENSIONS.includes(extension)) {
      setPhotoFile(null);
      setPhotoPreview("");
      setMessage("Only JPG, JPEG and PNG images are allowed.");
      setMessageType("error");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoFile(null);
      setPhotoPreview("");
      setMessage("Profile photo must not exceed 2 MB.");
      setMessageType("error");
      e.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setMessage("");
  };

  // Upload profile photo
  const handlePhotoUpload = async () => {
    if (!photoFile || !hasProfile || isUploadingPhoto) return;

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

      const uploadedPhotoUrl = response.data.profilePhoto.url;
      setProfilePhoto(uploadedPhotoUrl);

      try {
        if (!user) {
          throw new Error("Clerk user is not available.");
        }

        await user.setProfileImage({ file: photoFile });

        setMessage("Profile photo updated successfully.");
        setMessageType("success");
      } catch (clerkError) {
        console.error("Clerk profile image update error:", clerkError);

        setMessage(
          "DonorNexa photo saved, but Clerk profile image could not be updated.",
        );
        setMessageType("error");
      }

      setPhotoFile(null);
      setPhotoPreview("");

      const fileInput = document.getElementById("donorProfilePhoto");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Profile photo upload error:", error);

      setMessage(
        error.response?.data?.message || "Unable to upload profile photo.",
      );
      setMessageType("error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Cancel selected photo
  const handleCancelPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setMessage("");

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

  // Date limits
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
      <p className="mt-1.5 break-words text-[11px] font-medium leading-5 text-[#A33E4E] sm:mt-2 sm:text-xs">
        {fieldErrors[field]}
      </p>
    ) : null;

  const displayPhoto = photoPreview || profilePhoto;

  // Loading
  if (isLoading) {
    return (
      <div
        className="flex min-h-[220px] items-center justify-center gap-2.5 rounded-lg border border-[#E3D5C8] bg-[#F8F5EF] px-3 sm:min-h-[280px] sm:gap-3 sm:rounded-xl"
        role="status"
      >
        <Loader2 size={19} className="animate-spin text-[#963D54]" />
        <p className="text-xs text-[#81756A] sm:text-sm">
          Loading your profile...
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full min-w-0 rounded-none border-0 border-b border-[#DCCFC2] bg-transparent py-2.5 text-xs text-[#302923] outline-none transition placeholder:text-[#A99B90] focus:border-[#963D54] focus:ring-0 sm:py-3 sm:text-sm";

  return (
    <div className="w-full min-w-0 space-y-6 text-[#302923] sm:space-y-8 lg:space-y-10">
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
          className={`fixed right-3 top-20 z-[60] w-[calc(100%-1.5rem)] max-w-sm overflow-hidden rounded-lg border bg-[#FFFDF9] shadow-xl sm:right-6 sm:top-24 ${
            messageType === "error" ? "border-[#E8C9C9]" : "border-[#E5C8C0]"
          }`}
        >
          <div className="flex min-w-0 items-start gap-2.5 p-3 sm:gap-3 sm:p-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${
                messageType === "error"
                  ? "bg-[#FBEEEE] text-[#A33E4E]"
                  : "bg-[#F2E2DC] text-[#963D54]"
              }`}
            >
              {messageType === "error" ? (
                <AlertCircle size={17} />
              ) : (
                <CheckCircle2 size={17} />
              )}
            </span>

            <p
              className={`min-w-0 flex-1 break-words pt-1 text-xs font-medium leading-5 sm:text-sm ${
                messageType === "error" ? "text-[#A33E4E]" : "text-[#963D54]"
              }`}
            >
              {message}
            </p>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-1.5 text-[#9B8D83] transition hover:bg-[#F2E2DC]"
            >
              <X size={15} />
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

      {/* Profile Introduction */}
      <section className="flex min-w-0 flex-col justify-between gap-3 border-b border-[#E8DDD4] pb-4 sm:flex-row sm:items-center sm:gap-4 sm:pb-5">
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-[#963D54] sm:text-xs">
            Account details
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-[#302923] sm:text-lg">
            Donor profile
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-sm">
            View and manage your personal information.
          </p>
        </div>

        {hasProfile && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#963D54] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#7D3045] sm:w-auto sm:shrink-0 sm:px-5 sm:text-sm"
          >
            <Pencil size={14} />
            Edit profile
          </button>
        )}
      </section>

      <form onSubmit={handleSubmit} className="min-w-0 space-y-7 sm:space-y-9">
        {/* Profile Identity */}
        <section className="grid min-w-0 gap-5 sm:gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:gap-9">
          {/* Photo Area */}
          <div className="relative flex min-h-[230px] items-center justify-center overflow-hidden rounded-lg bg-[#F0EAE0] p-5 sm:min-h-[290px] sm:rounded-xl sm:p-7 lg:min-h-[330px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(#D9BFAF 0.8px, transparent 0.8px)",
                backgroundSize: "12px 12px",
              }}
            />

            <div className="pointer-events-none absolute h-[210px] w-[210px] rounded-full border border-[#D5C2B3] sm:h-[280px] sm:w-[280px] lg:h-[340px] lg:w-[340px]" />
            <div className="pointer-events-none absolute h-[170px] w-[170px] rounded-full border border-[#D5C2B3] sm:h-[220px] sm:w-[220px] lg:h-[275px] lg:w-[275px]" />

            <div className="relative z-10">
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-[5px] border-[#FFFDF9] bg-[#E8D8CC] shadow-[0_15px_45px_rgba(80,48,40,0.12)] sm:h-48 sm:w-48 sm:border-[7px] lg:h-56 lg:w-56">
                {displayPhoto ? (
                  <img
                    src={displayPhoto}
                    alt="Donor profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound
                    size={58}
                    strokeWidth={1.1}
                    className="text-[#963D54] sm:h-[76px] sm:w-[76px]"
                  />
                )}
              </div>

              {hasProfile && (
                <label
                  htmlFor="donorProfilePhoto"
                  title="Change profile photo"
                  className={`absolute bottom-1 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-[3px] border-[#F0EAE0] bg-[#963D54] text-white shadow-md transition hover:bg-[#7D3045] sm:bottom-2 sm:right-1 sm:h-11 sm:w-11 ${
                    isUploadingPhoto ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <Camera size={16} className="sm:h-[18px] sm:w-[18px]" />
                </label>
              )}
            </div>

            <span className="absolute left-3 top-3 text-[#B27A70] sm:left-6 sm:top-6">
              <Sparkle
                size={17}
                className="sm:h-[23px] sm:w-[23px]"
                strokeWidth={1.2}
              />
            </span>

            <span className="absolute bottom-4 right-4 text-[#B27A70] sm:bottom-7 sm:right-7">
              <Sparkle
                size={15}
                className="sm:h-[18px] sm:w-[18px]"
                strokeWidth={1.2}
              />
            </span>
          </div>

          {/* Identity Details */}
          <div className="flex min-w-0 flex-col justify-center py-1 sm:py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#963D54] sm:text-[11px] sm:tracking-[0.2em]">
              {hasProfile ? "Donor identity" : "Your donor journey"}
            </p>

            <h3 className="mt-1.5 text-base font-semibold text-[#302923] sm:mt-2 sm:text-lg">
              Profile overview
            </h3>

            <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-sm sm:leading-6">
              Your donor details and profile photo.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2.5 sm:mt-7 sm:gap-3">
              <div className="min-w-0 rounded-lg border-l-2 border-[#963D54] bg-[#F0EAE0] px-3 py-3 sm:rounded-xl sm:px-4 sm:py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#81756A] sm:text-[10px] sm:tracking-[0.16em]">
                  Blood group
                </p>

                <p className="mt-1.5 font-serif text-2xl text-[#963D54] sm:mt-2 sm:text-4xl">
                  {hasProfile && formData.bloodGroup
                    ? formData.bloodGroup
                    : "—"}
                </p>
              </div>

              <div className="min-w-0 rounded-lg border-l-2 border-[#C9A99B] bg-[#F0EAE0] px-3 py-3 sm:rounded-xl sm:px-4 sm:py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#81756A] sm:text-[10px] sm:tracking-[0.16em]">
                  Location
                </p>

                <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[#302923] sm:gap-2 sm:text-sm">
                  <MapPin size={14} className="shrink-0 text-[#963D54]" />
                  <span className="min-w-0 truncate">
                    {hasProfile && formData.city ? formData.city : "Not set"}
                  </span>
                </p>
              </div>
            </div>

            {/* Photo Upload Controls */}
            <div className="mt-5 min-w-0 border-t border-[#E3D5C8] pt-4 sm:mt-7 sm:pt-5">
              <input
                id="donorProfilePhoto"
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handlePhotoSelect}
                disabled={!hasProfile || isUploadingPhoto}
                className="sr-only"
              />

              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <p className="mr-auto min-w-0 text-[10px] leading-5 text-[#81756A] sm:text-xs">
                  Profile image · JPG or PNG · Maximum 2 MB
                </p>

                {photoFile && (
                  <>
                    <button
                      type="button"
                      onClick={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#963D54] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#7D3045] disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                      {isUploadingPhoto ? "Uploading..." : "Upload photo"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelPhoto}
                      disabled={isUploadingPhoto}
                      aria-label="Cancel photo selection"
                      className="rounded-lg border border-[#DCCFC2] p-2 text-[#81756A] transition hover:bg-[#F0EAE0] disabled:opacity-50 sm:p-2.5"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>

              {!hasProfile && (
                <p className="mt-2 text-[11px] leading-5 text-[#98602F] sm:text-xs">
                  Save your donor profile before uploading a photo.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="min-w-0 border-t border-[#E3D5C8] pt-6 sm:pt-8">
          <div className="flex min-w-0 flex-col justify-between gap-2.5 sm:flex-row sm:items-end sm:gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#963D54] sm:text-[11px] sm:tracking-[0.2em]">
                The essentials
              </p>

              <h3 className="mt-1.5 text-base font-semibold text-[#302923] sm:mt-2 sm:text-lg">
                Personal information
              </h3>
            </div>

            <p className="max-w-xs text-[11px] leading-5 text-[#81756A] sm:text-xs sm:leading-6">
              Your details are used for donor eligibility and matching. Keep
              them correct.
            </p>
          </div>

          {/* Blood Group */}
          <div className="border-y border-[#E3D5C8] py-5 sm:py-6">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-[#302923] sm:text-sm">
                  Your blood group
                </label>

                <p className="mt-1 text-[11px] leading-5 text-[#81756A] sm:text-xs">
                  Select the blood group shown in your medical records.
                </p>
              </div>

              {hasProfile && !isEditing && (
                <span className="text-[10px] font-semibold text-[#963D54] sm:text-xs">
                  Saved information
                </span>
              )}
            </div>

            <div
              role="radiogroup"
              aria-label="Blood group"
              className="mt-4 grid grid-cols-4 gap-2 sm:mt-5 sm:grid-cols-8"
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
                    className={`flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition sm:h-12 sm:gap-1.5 sm:text-sm ${
                      selected
                        ? "border-[#963D54] bg-[#963D54] text-white"
                        : isEditing
                          ? "border-[#DCCFC2] bg-[#F0EAE0] text-[#55483F] hover:border-[#963D54] hover:text-[#963D54]"
                          : "border-[#E3D5C8] bg-[#F0EAE0] text-[#655A51]"
                    } disabled:cursor-default`}
                  >
                    {selected && <Droplet size={13} className="shrink-0" />}
                    {group}
                  </button>
                );
              })}
            </div>

            {renderFieldError("bloodGroup")}
          </div>

          {/* Personal Detail Fields */}
          <div className="grid min-w-0 gap-x-8 gap-y-6 py-6 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8 sm:py-8 lg:gap-x-12">
            {/* City */}
            <div className="min-w-0">
              <label
                htmlFor="city"
                className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#81756A] sm:mb-3 sm:text-xs sm:tracking-[0.12em]"
              >
                <MapPin size={14} className="text-[#963D54]" />
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
                <p className="break-words border-b border-[#DCCFC2] py-2.5 text-xs font-medium sm:py-3 sm:text-sm">
                  {formData.city || "Not provided"}
                </p>
              )}

              {renderFieldError("city")}
            </div>

            {/* Weight */}
            <div className="min-w-0">
              <label
                htmlFor="weight"
                className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#81756A] sm:mb-3 sm:text-xs sm:tracking-[0.12em]"
              >
                <Scale size={14} className="text-[#963D54]" />
                Weight
              </label>

              {isEditing ? (
                <div className="relative min-w-0">
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

                  <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[11px] text-[#81756A] sm:text-xs">
                    kg
                  </span>
                </div>
              ) : (
                <p className="border-b border-[#DCCFC2] py-2.5 text-xs font-medium sm:py-3 sm:text-sm">
                  {formData.weight ? `${formData.weight} kg` : "Not provided"}
                </p>
              )}

              {renderFieldError("weight")}
            </div>

            {/* Date of Birth */}
            <div className="min-w-0">
              <label
                htmlFor="dateOfBirth"
                className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#81756A] sm:mb-3 sm:text-xs sm:tracking-[0.12em]"
              >
                <CalendarDays size={14} className="text-[#963D54]" />
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
                <p className="break-words border-b border-[#DCCFC2] py-2.5 text-xs font-medium sm:py-3 sm:text-sm">
                  {formatDate(formData.dateOfBirth)}
                </p>
              )}

              {renderFieldError("dateOfBirth")}
            </div>

            {/* Phone */}
            <div className="min-w-0">
              <label
                htmlFor="phone"
                className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#81756A] sm:mb-3 sm:text-xs sm:tracking-[0.12em]"
              >
                <Phone size={14} className="text-[#963D54]" />
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
                <p className="break-words border-b border-[#DCCFC2] py-2.5 text-xs font-medium sm:py-3 sm:text-sm">
                  {formData.phone || "Not provided"}
                </p>
              )}

              {renderFieldError("phone")}
            </div>
          </div>
        </section>

        {/* Privacy Note */}
        <section className="flex min-w-0 flex-col gap-3 border-y border-[#E3D5C8] py-5 sm:flex-row sm:items-center sm:gap-4 sm:py-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0E2DA] text-[#963D54] sm:h-11 sm:w-11">
            <ShieldCheck size={19} className="sm:h-[21px] sm:w-[21px]" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#302923] sm:text-sm">
              Your information matters.
            </h4>

            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#81756A] sm:text-xs sm:leading-6">
              Your contact details are not displayed on public emergency
              listings. Hospitals can access your phone number only after you
              accept a matched donation request.
            </p>
          </div>
        </section>

        {/* Edit Actions */}
        {isEditing && (
          <section className="flex min-w-0 flex-col gap-4 border-t border-[#E3D5C8] pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
            <div className="min-w-0">
              <p className="font-serif text-lg sm:text-xl">
                {hasProfile ? "Ready to update?" : "Ready to get started?"}
              </p>

              <p className="mt-1 text-[11px] leading-5 text-[#81756A] sm:text-xs">
                {isDirty
                  ? "You have unsaved changes."
                  : "Complete all required information before saving."}
              </p>
            </div>

            <div className="flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row sm:gap-3">
              {hasProfile && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#DCCFC2] px-4 py-2.5 text-xs font-semibold text-[#655A51] transition hover:bg-[#F0EAE0] disabled:opacity-50 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  <X size={15} />
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving || (hasProfile && !isDirty)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#963D54] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#7D3045] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-3 sm:px-7 sm:py-3 sm:text-sm"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
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

        {/* View Mode Footer */}
        {!isEditing && hasProfile && (
          <div className="flex min-w-0 flex-col gap-3 border-t border-[#E3D5C8] pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:pt-6">
            <div className="flex items-center gap-2 text-[11px] text-[#81756A] sm:text-xs">
              <CheckCircle2 size={14} className="shrink-0 text-[#963D54]" />
              <span>Your profile information is saved.</span>
            </div>

            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-2 self-start text-xs font-semibold text-[#963D54] transition hover:text-[#7D3045] sm:self-auto sm:text-sm"
            >
              Update information
              <ArrowUpRight size={15} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default DonorProfileForm;
