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
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

// Form fields grouped into two friendly sections
const sections = [
  {
    title: "About the hospital",
    description: "Who you are and how you're licensed.",
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
    ],
  },
  {
    title: "Contact & location",
    description: "So donors and administrators can reach the right place.",
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
  { icon: FileText, label: "Submit your details", state: "current" },
  { icon: ShieldCheck, label: "Administrator review", state: "upcoming" },
  { icon: Droplet, label: "Start requesting blood", state: "upcoming" },
];

function HospitalRegistrationForm({ onRegistered }) {
  const { request } = useApi();

  const [formData, setFormData] = useState({
    hospitalName: "",
    licenseNumber: "",
    contactPerson: "",
    address: "",
    city: "",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await request({
        method: "POST",
        url: "/api/hospitals/register",
        data: formData,
      });

      const registeredHospital = response.data.hospital || response.data;

      setSuccess("Hospital registration submitted successfully.");

      onRegistered(registeredHospital);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Hospital registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Display-only: how many fields are filled in
  const fieldNames = Object.keys(formData);
  const filledCount = fieldNames.filter(
    (name) => formData[name].trim() !== "",
  ).length;
  const progress = Math.round((filledCount / fieldNames.length) * 100);

  const inputClass =
    "peer w-full rounded-2xl border border-rose-100 bg-[#FFF8FA] py-3.5 pl-12 pr-11 text-sm text-[#29232A] outline-none transition duration-200 placeholder:text-gray-400 hover:border-rose-200 focus:border-[#BE4565] focus:bg-white focus:shadow-lg focus:shadow-rose-100/70 focus:ring-4 focus:ring-rose-100";

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-rose-200/50 ring-1 ring-rose-200/40 lg:grid-cols-5">
      {/* Left: purpose and progress */}
      <aside className="relative overflow-hidden bg-gradient-to-br from-[#96334F] to-[#7A2840] p-8 text-white sm:p-10 lg:col-span-2">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#BE4565]/40 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
            <HeartHandshake size={30} />
          </span>

          <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
            Hospital Registration
          </h2>

          <p className="mt-3 text-sm leading-7 text-rose-100">
            Register your hospital with DonorNexa. Your information will be
            reviewed by the administrator.
          </p>

          {/* Journey */}
          <ol className="mt-8 space-y-5">
            {journey.map((step, index) => {
              const Icon = step.icon;
              const current = step.state === "current";

              return (
                <li key={step.label} className="relative flex items-center gap-4">
                  {index < journey.length - 1 && (
                    <span className="absolute left-5 top-11 h-5 w-px bg-white/25" />
                  )}

                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                      current
                        ? "bg-white text-[#96334F] shadow-lg shadow-black/20"
                        : "border border-white/25 bg-white/10 text-rose-100"
                    }`}
                  >
                    <Icon size={18} />
                  </span>

                  <span
                    className={`text-sm font-semibold ${
                      current ? "text-white" : "text-rose-200"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Live completion */}
          <div className="mt-auto pt-10">
            <div className="flex items-end justify-between text-sm">
              <span className="font-semibold">Form completion</span>
              <span className="text-rose-100">
                {filledCount} of {fieldNames.length} fields
              </span>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-200 to-white transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-rose-100">
              <ShieldCheck size={14} className="shrink-0" />
              Only verified hospitals can create blood requests.
            </p>
          </div>
        </div>
      </aside>

      {/* Right: the form */}
      <div className="p-6 sm:p-10 lg:col-span-3">
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-[#FCE7ED] px-4 py-3 text-sm font-medium text-[#96334F]"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#BE4565]" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-9">
          {sections.map((section, sectionIndex) => (
            <fieldset key={section.title} className="space-y-5">
              <legend className="mb-1 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FCE7ED] text-sm font-bold text-[#96334F]">
                  {sectionIndex + 1}
                </span>
                <span>
                  <span className="block text-lg font-bold text-[#29232A]">
                    {section.title}
                  </span>
                  <span className="block text-xs font-normal text-gray-500">
                    {section.description}
                  </span>
                </span>
              </legend>

              {section.fields.map((field) => {
                const Icon = field.icon;
                const filled = formData[field.name].trim() !== "";

                return (
                  <div key={field.name}>
                    <label
                      htmlFor={`hospital-${field.name}`}
                      className="mb-2 block text-sm font-semibold text-[#29232A]"
                    >
                      {field.label}
                    </label>

                    <div className="relative">
                      <Icon
                        size={18}
                        className={`pointer-events-none absolute left-4 transition-colors duration-200 peer-focus:text-[#BE4565] ${
                          field.multiline ? "top-4" : "top-1/2 -translate-y-1/2"
                        } ${filled ? "text-[#BE4565]" : "text-rose-300"}`}
                      />

                      {field.multiline ? (
                        <textarea
                          id={`hospital-${field.name}`}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          rows={3}
                          className={`${inputClass} resize-none`}
                          required
                        />
                      ) : (
                        <input
                          id={`hospital-${field.name}`}
                          type="text"
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          className={inputClass}
                          required
                        />
                      )}

                      <CheckCircle2
                        size={18}
                        className={`pointer-events-none absolute right-4 text-[#BE4565] transition-all duration-300 ${
                          field.multiline ? "top-4" : "top-1/2 -translate-y-1/2"
                        } ${filled ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </fieldset>
          ))}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-6 py-4 font-semibold text-white shadow-lg shadow-rose-400/30 ring-1 ring-white/30 transition duration-200 hover:-translate-y-0.5 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ClipboardCheck size={18} />
              )}

              {loading ? "Submitting..." : "Submit Registration"}

              {!loading && (
                <ArrowRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              )}
            </button>

            <p className="mt-4 text-center text-xs text-gray-500">
              You'll be able to create blood requests once an administrator
              verifies your hospital.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HospitalRegistrationForm;