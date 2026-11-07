import { useState } from "react";
import { Building2, MapPin, User, FileText, Phone } from "lucide-react";
import { useApi } from "../../hooks/useApi";

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

  const inputClass =
    "w-full rounded-lg border border-rose-100 bg-white px-4 py-3 text-sm text-[#29232A] outline-none transition focus:border-[#BE4565] focus:ring-2 focus:ring-rose-100";

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-7">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCE7ED] text-[#BE4565]">
          <Building2 size={24} />
        </div>

        <h2 className="text-2xl font-semibold text-[#29232A]">
          Hospital Registration
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Register your hospital with DonorNexa. Your information will be
          reviewed by the administrator.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-[#96334F]">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#29232A]">
            Hospital Name
          </label>
          <div className="relative">
            <Building2
              size={18}
              className="absolute left-3 top-3.5 text-gray-400"
            />
            <input
              type="text"
              name="hospitalName"
              value={formData.hospitalName}
              onChange={handleChange}
              placeholder="Enter hospital name"
              className={`${inputClass} pl-10`}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#29232A]">
            License Number
          </label>
          <div className="relative">
            <FileText
              size={18}
              className="absolute left-3 top-3.5 text-gray-400"
            />
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="Enter hospital license number"
              className={`${inputClass} pl-10`}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#29232A]">
            Contact Person
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Enter contact person's name"
              className={`${inputClass} pl-10`}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#29232A]">
            Hospital Address
          </label>
          <div className="relative">
            <MapPin
              size={18}
              className="absolute left-3 top-3.5 text-gray-400"
            />
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete hospital address"
              rows={3}
              className={`${inputClass} resize-none pl-10`}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#29232A]">
            City
          </label>
          <div className="relative">
            <MapPin
              size={18}
              className="absolute left-3 top-3.5 text-gray-400"
            />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              className={`${inputClass} pl-10`}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#BE4565] px-5 py-3 font-medium text-white transition hover:bg-[#96334F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Registration"}
        </button>
      </form>
    </div>
  );
}

export default HospitalRegistrationForm;
