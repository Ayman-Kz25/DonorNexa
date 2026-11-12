import { useState } from "react";
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
    setLicenseFile(null);

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

  const fieldNames = Object.keys(formData);
  const totalFields = fieldNames.length + 1;

  const filledCount =
    fieldNames.filter((name) => formData[name].trim() !== "").length +
    (licenseFile ? 1 : 0);

  const progress = Math.round((filledCount / totalFields) * 100);

  const inputClass =
    "w-full rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] py-3 pl-12 pr-4 text-sm text-[#302923] outline-none transition placeholder:text-[#A99B90] hover:border-[#CDA5A5] focus:border-[#963D54] focus:bg-[#FFFDF9] focus:ring-4 focus:ring-[#F2E2DC]";

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm lg:grid-cols-5">
      {/* Registration overview */}
      <aside className="relative overflow-hidden bg-[#782B40] p-7 text-white sm:p-9 lg:col-span-2">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#963D54] opacity-30 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <HeartHandshake size={27} />
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-[#E8C7CE]">
            DonorNexa
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight">
            Hospital Registration
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#F1DDE1]">
            Register your hospital to connect with eligible blood donors and
            manage blood requests through DonorNexa.
          </p>

          <div className="mt-10">
            <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-[#E8C7CE]">
              Registration process
            </p>

            <ol className="space-y-6">
              {journey.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    key={step.label}
                    className="relative flex items-center gap-4"
                  >
                    {index !== journey.length - 1 && (
                      <span className="absolute left-5 top-11 h-7 w-px bg-white/20" />
                    )}

                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        index === 0
                          ? "bg-[#FFFDF9] text-[#782B40]"
                          : "border border-white/20 bg-white/10 text-[#E8C7CE]"
                      }`}
                    >
                      <Icon size={18} />
                    </span>

                    <span
                      className={`text-sm font-medium ${
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

          <div className="mt-auto pt-12">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Form completion</span>
              <span className="text-[#E8C7CE]">
                {filledCount}/{totalFields} fields
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#F2D7D9] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[#E8C7CE]">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              Only verified hospitals can create blood requests.
            </p>
          </div>
        </div>
      </aside>

      {/* Registration form */}
      <div className="p-6 sm:p-9 lg:col-span-3">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#963D54]">
            Get started
          </span>

          <h3 className="mt-2 font-serif text-2xl font-semibold text-[#302923]">
            Hospital details
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#81756A]">
            Complete the information below to submit your registration for
            administrator review.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] px-4 py-3 text-sm text-[#A33E4E]"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-[#E5C8C0] bg-[#F2E2DC] px-4 py-3 text-sm text-[#782B40]"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {sections.map((section, sectionIndex) => (
            <fieldset key={section.title} className="space-y-5">
              <legend className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2E2DC] text-sm font-semibold text-[#782B40]">
                  {sectionIndex + 1}
                </span>

                <span>
                  <span className="block text-base font-semibold text-[#302923]">
                    {section.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#81756A]">
                    {section.description}
                  </span>
                </span>
              </legend>

              {section.fields.map((field) => {
                const Icon = field.icon;

                return (
                  <div key={field.name}>
                    <label
                      htmlFor={`hospital-${field.name}`}
                      className="mb-2 block text-sm font-semibold text-[#55483F]"
                    >
                      {field.label}
                    </label>

                    <div className="relative">
                      <Icon
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A45B6D]"
                      />

                      <input
                        id={`hospital-${field.name}`}
                        type={field.type || "text"}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        min={field.type === "date" ? getTodayDate() : undefined}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </fieldset>
          ))}

          {/* License document upload */}
          <fieldset className="space-y-3">
            <legend className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2E2DC] text-sm font-semibold text-[#782B40]">
                3
              </span>

              <span>
                <span className="block text-base font-semibold text-[#302923]">
                  License document
                </span>
                <span className="mt-0.5 block text-xs text-[#81756A]">
                  Upload your valid hospital license.
                </span>
              </span>
            </legend>

            <label
              htmlFor="hospital-licenseDocument"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DCC7C4] bg-[#F8F5EF] px-5 py-7 text-center transition hover:border-[#963D54] hover:bg-[#F2E2DC]/50"
            >
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F2E2DC] text-[#782B40]">
                <Upload size={21} />
              </span>

              <span className="text-sm font-semibold text-[#55483F]">
                {licenseFile ? licenseFile.name : "Choose license PDF"}
              </span>

              <span className="mt-1 text-xs text-[#81756A]">
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

          <div className="border-t border-[#E8DDD4] pt-6">
            <button
              type="submit"
              disabled={loading || filledCount !== totalFields}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#782B40] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#602032] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ClipboardCheck size={18} />
              )}

              {loading ? "Submitting..." : "Submit Registration"}

              {!loading && <ArrowRight size={17} />}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-[#81756A]">
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
