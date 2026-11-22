import { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  User,
  FileText,
  Droplet,
  ShieldCheck,
  ClipboardCheck,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Upload,
  CalendarDays,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

const sections = [
  {
    title: "Hospital information",
    description: "Tell us about your registered hospital.",
    fields: [
      {
        name: "hospitalName",
        label: "Hospital Name",
        icon: Building2,
        placeholder: "Enter hospital name",
      },
      {
        name: "licenseNumber",
        label: "License Number",
        icon: FileText,
        placeholder: "Enter hospital license number",
      },
      {
        name: "licenseExpiryDate",
        label: "License Expiry Date",
        icon: CalendarDays,
        type: "date",
      },
    ],
  },
  {
    title: "Contact and location",
    description: "Provide details for communication and verification.",
    fields: [
      {
        name: "contactPerson",
        label: "Contact Person",
        icon: User,
        placeholder: "Enter contact person's name",
      },
      {
        name: "city",
        label: "City",
        icon: MapPin,
        placeholder: "Enter city",
      },
      {
        name: "address",
        label: "Hospital Address",
        icon: MapPin,
        placeholder: "Enter complete hospital address",
        multiline: true,
      },
    ],
  },
];

const journey = [
  { icon: FileText, label: "Submit hospital details" },
  { icon: ShieldCheck, label: "Administrator verification" },
  { icon: Droplet, label: "Access blood requests" },
];

const initialFormData = {
  hospitalName: "",
  licenseNumber: "",
  licenseExpiryDate: "",
  contactPerson: "",
  address: "",
  city: "",
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function HospitalRegistrationForm({ onRegistered }) {
  const { request } = useApi();

  const [formData, setFormData] = useState(initialFormData);
  const [licenseFile, setLicenseFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cities, setCities] = useState([]);
  const [isCitiesLoading, setIsCitiesLoading] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    setError("");

    if (!file) return;

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a PDF license document.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("License document must not exceed 5 MB.");
      e.target.value = "";
      return;
    }

    setLicenseFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const trimmedFields = [
      ["hospitalName", "Hospital name"],
      ["licenseNumber", "License number"],
      ["contactPerson", "Contact person"],
      ["address", "Hospital address"],
    ];

    for (const [field, label] of trimmedFields) {
      if (!formData[field].trim()) {
        setError(`${label} cannot be empty.`);
        return;
      }
    }

    if (!licenseFile) {
      setError("Please upload your hospital license document.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const submissionData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        submissionData.append(key, value);
      });

      submissionData.append("licenseDocument", licenseFile);

      const response = await request({
        method: "POST",
        url: "/api/hospitals/register",
        data: submissionData,
      });

      const registeredHospital = response.data.hospital || response.data;

      setSuccess("Hospital registration submitted successfully.");
      onRegistered?.(registeredHospital);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Hospital registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

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
        setError("Unable to load available cities. Please try again.");
      } finally {
        setIsCitiesLoading(false);
      }
    };

    loadCities();
  }, [request]);

  const fieldNames = Object.keys(formData);
  const totalFields = fieldNames.length + 1;

  const filledCount =
    fieldNames.filter((name) => formData[name].trim() !== "").length +
    (licenseFile ? 1 : 0);

  const progress = Math.round((filledCount / totalFields) * 100);

  const inputClass =
    "block w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] py-2.5 pl-10 pr-3 text-xs text-[#302923] outline-none transition placeholder:text-[#A99B90] hover:border-[#CDA5A5] focus:border-[#963D54] focus:bg-[#FFFDF9] focus:ring-2 focus:ring-[#F2E2DC] sm:rounded-xl sm:py-3 sm:pl-12 sm:pr-4 sm:text-sm sm:focus:ring-4";

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm sm:rounded-3xl lg:grid-cols-5">
      {/* Registration overview */}
      <aside className="relative min-w-0 overflow-hidden bg-[#782B40] p-4 text-white sm:p-6 md:p-8 lg:col-span-2 lg:p-7 xl:p-9">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#963D54] opacity-30 blur-3xl sm:-right-20 sm:-top-20 sm:h-64 sm:w-64" />

        <div className="relative flex h-full min-w-0 flex-col">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 sm:h-14 sm:w-14 sm:rounded-2xl">
            <HeartHandshake size={22} className="sm:h-[27px] sm:w-[27px]" />
          </div>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8C7CE] sm:mt-7 sm:text-xs sm:tracking-[0.18em]">
            DonorNexa
          </p>

          <h2 className="mt-1.5 max-w-md break-words font-serif text-2xl font-semibold leading-tight sm:mt-2 sm:text-3xl lg:text-[28px] xl:text-3xl">
            Hospital Registration
          </h2>

          <p className="mt-3 max-w-lg text-xs leading-5 text-[#F1DDE1] sm:mt-4 sm:text-sm sm:leading-7">
            Register your hospital to connect with eligible blood donors and
            manage blood requests through DonorNexa.
          </p>

          <div className="mt-6 sm:mt-10">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-[#E8C7CE] sm:mb-6 sm:text-xs">
              Registration process
            </p>

            <ol className="space-y-4 sm:space-y-6">
              {journey.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    key={step.label}
                    className="relative flex min-w-0 items-center gap-3 sm:gap-4"
                  >
                    {index !== journey.length - 1 && (
                      <span className="absolute left-[18px] top-9 h-7 w-px bg-white/20 sm:left-5 sm:top-11" />
                    )}

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                        index === 0
                          ? "bg-[#FFFDF9] text-[#782B40]"
                          : "border border-white/20 bg-white/10 text-[#E8C7CE]"
                      }`}
                    >
                      <Icon size={16} className="sm:h-[18px] sm:w-[18px]" />
                    </span>

                    <span
                      className={`min-w-0 break-words text-xs font-medium sm:text-sm ${
                        index === 0 ? "text-white" : "text-[#E8C7CE]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-7 border-t border-white/10 pt-5 sm:mt-auto sm:border-0 sm:pt-10 lg:pt-12">
            <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">
              <span className="font-semibold text-white">Form completion</span>
              <span className="text-right text-[#E8C7CE]">
                {filledCount}/{totalFields} fields
              </span>
            </div>

            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15 sm:mt-3 sm:h-2"
              role="progressbar"
              aria-label="Form completion"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#F2D7D9] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-[#E8C7CE] sm:mt-6 sm:text-xs">
              <ShieldCheck
                size={14}
                className="mt-0.5 shrink-0 sm:h-[15px] sm:w-[15px]"
              />
              <span>Only verified hospitals can create blood requests.</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Registration form */}
      <div className="min-w-0 p-4 sm:p-6 md:p-8 lg:col-span-3 lg:p-6 xl:p-9">
        <div className="mb-6 sm:mb-8">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#963D54] sm:text-xs">
            Get started
          </span>

          <h3 className="mt-1.5 font-serif text-xl font-semibold text-[#302923] sm:mt-2 sm:text-2xl">
            Hospital details
          </h3>

          <p className="mt-2 max-w-lg text-xs leading-5 text-[#81756A] sm:text-sm sm:leading-6">
            Complete the information below to submit your registration for
            administrator review.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex min-w-0 items-start gap-2.5 rounded-lg border border-[#E8C9C9] bg-[#FBEEEE] px-3 py-3 text-xs leading-5 text-[#A33E4E] sm:mb-6 sm:gap-3 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0 sm:h-[19px] sm:w-[19px]"
            />
            <p className="min-w-0 break-words">{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 flex min-w-0 items-start gap-2.5 rounded-lg border border-[#E5C8C0] bg-[#F2E2DC] px-3 py-3 text-xs leading-5 text-[#782B40] sm:mb-6 sm:gap-3 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 sm:h-[19px] sm:w-[19px]"
            />
            <p className="min-w-0 break-words">{success}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="min-w-0 space-y-6 sm:space-y-8"
        >
          {sections.map((section, sectionIndex) => (
            <fieldset
              key={section.title}
              className="min-w-0 space-y-4 sm:space-y-5"
            >
              <legend className="mb-4 flex w-full min-w-0 items-center gap-2.5 sm:gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2E2DC] text-xs font-semibold text-[#782B40] sm:h-8 sm:w-8 sm:text-sm">
                  {sectionIndex + 1}
                </span>

                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-[#302923] sm:text-base">
                    {section.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-[#81756A] sm:text-xs sm:leading-5">
                    {section.description}
                  </span>
                </span>
              </legend>

              {section.fields.map((field) => {
                const Icon = field.icon;

                return (
                  <div key={field.name} className="min-w-0">
                    <label
                      htmlFor={`hospital-${field.name}`}
                      className="mb-1.5 block text-xs font-semibold text-[#55483F] sm:mb-2 sm:text-sm"
                    >
                      {field.label}
                    </label>

                    <div className="relative min-w-0">
                      <Icon
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A45B6D] sm:left-4 sm:h-[18px] sm:w-[18px]"
                      />

                      {field.name === "city" ? (
                        <select
                          id="hospital-city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          disabled={isCitiesLoading}
                          className={inputClass}
                          required
                        >
                          <option value="">
                            {isCitiesLoading
                              ? "Loading cities..."
                              : "Select your city"}
                          </option>

                          {cities.map((city) => (
                            <option key={city._id} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`hospital-${field.name}`}
                          type={field.type || "text"}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          min={
                            field.type === "date" ? getTodayDate() : undefined
                          }
                          className={inputClass}
                          required
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </fieldset>
          ))}

          {/* License document upload */}
          <fieldset className="min-w-0 space-y-3">
            <legend className="mb-3 flex w-full min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2E2DC] text-xs font-semibold text-[#782B40] sm:h-8 sm:w-8 sm:text-sm">
                3
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#302923] sm:text-base">
                  License document
                </span>
                <span className="mt-0.5 block text-[10px] leading-4 text-[#81756A] sm:text-xs sm:leading-5">
                  Upload your valid hospital license.
                </span>
              </span>
            </legend>

            <label
              htmlFor="hospital-licenseDocument"
              className="flex min-w-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#DCC7C4] bg-[#F8F5EF] px-3 py-6 text-center transition hover:border-[#963D54] hover:bg-[#F2E2DC]/50 sm:rounded-xl sm:px-5 sm:py-7"
            >
              <span className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F2E2DC] text-[#782B40] sm:mb-3 sm:h-12 sm:w-12">
                <Upload size={18} className="sm:h-[21px] sm:w-[21px]" />
              </span>

              <span className="max-w-full break-all text-xs font-semibold text-[#55483F] sm:text-sm">
                {licenseFile ? licenseFile.name : "Choose license PDF"}
              </span>

              <span className="mt-1 text-[10px] leading-4 text-[#81756A] sm:text-xs">
                PDF format only · Maximum size 5 MB
              </span>

              <input
                id="hospital-licenseDocument"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="sr-only"
                required={!licenseFile}
              />
            </label>
          </fieldset>

          <div className="border-t border-[#E8DDD4] pt-5 sm:pt-6">
            <button
              type="submit"
              disabled={loading || filledCount !== totalFields}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#782B40] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#602032] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-12 sm:rounded-full sm:px-6 sm:text-sm"
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin sm:h-[18px] sm:w-[18px]"
                />
              ) : (
                <ClipboardCheck size={16} className="sm:h-[18px] sm:w-[18px]" />
              )}

              {loading ? "Submitting..." : "Submit Registration"}

              {!loading && (
                <ArrowRight size={15} className="sm:h-[17px] sm:w-[17px]" />
              )}
            </button>

            <p className="mx-auto mt-3 max-w-md text-center text-[10px] leading-5 text-[#81756A] sm:mt-4 sm:text-xs">
              Your hospital profile will remain pending until an administrator
              completes verification.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HospitalRegistrationForm;
