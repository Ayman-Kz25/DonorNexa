import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Droplet,
  Send,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  FileText,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { getMinDateTimeLocal } from "../../utils/dateTime";

const inputClass =
  "w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none transition placeholder:text-[#A69A96] hover:border-[#D8BBC3] focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC]";

const labelClass = "mb-2 block text-sm font-semibold text-[#40343A]";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const URGENCY_LEVELS = ["normal", "urgent", "critical"];

const INITIAL_FORM_DATA = {
  bloodGroup: "",
  unitsRequired: "",
  urgency: "normal",
  requiredBy: "",
  ward: "",
  hospitalNotes: "",
};

const CreateRequest = () => {
  const { request } = useApi();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update form fields.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  };

  // Validate all form fields before submission.
  const validateForm = () => {
    if (
      !formData.bloodGroup ||
      !formData.unitsRequired ||
      !formData.requiredBy
    ) {
      return "Please complete all required fields.";
    }

    if (!BLOOD_GROUPS.includes(formData.bloodGroup)) {
      return "Please select a valid blood group.";
    }

    if (!URGENCY_LEVELS.includes(formData.urgency)) {
      return "Please select a valid urgency level.";
    }

    const units = Number(formData.unitsRequired);

    if (!Number.isSafeInteger(units) || units < 1) {
      return "Units required must be a positive whole number.";
    }

    if (formData.ward.trim().length > 100) {
      return "Ward name cannot exceed 100 characters.";
    }

    if (formData.hospitalNotes.trim().length > 500) {
      return "Additional notes cannot exceed 500 characters.";
    }

    const requiredByDate = new Date(formData.requiredBy);

    if (
      !formData.requiredBy ||
      Number.isNaN(requiredByDate.getTime()) ||
      requiredByDate.getTime() <= Date.now()
    ) {
      return "Required By must be a valid future date and time.";
    }

    return null;
  };

  // Submit blood request.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const requiredByDate = new Date(formData.requiredBy);

      const payload = {
        bloodGroup: formData.bloodGroup,
        unitsRequired: Number(formData.unitsRequired),
        urgency: formData.urgency,
        requiredBy: requiredByDate.toISOString(),
        ward: formData.ward.trim(),
        hospitalNotes: formData.hospitalNotes.trim(),
      };

      await request({
        method: "POST",
        url: "/api/blood-requests",
        data: payload,
      });

      setSuccess("Blood request created successfully!");

      setFormData({ ...INITIAL_FORM_DATA });

      navigate("/hospital/requests", {
        state: {
          success: "Blood request created successfully!",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create blood request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Page Heading */}
      <section className="relative overflow-hidden rounded-xl border border-[#EAD9DE] bg-gradient-to-r from-[#FFF8F8] via-[#FFFDF9] to-[#F8F0EC] p-6 sm:p-7">
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[#EAD9DE] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#963D54]">
              <span className="size-1.5 rounded-full bg-[#963D54]" />
              Hospital Portal
            </div>

            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#302923] sm:text-4xl">
              Create Blood Request
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-[#81756A]">
              Submit your hospital's blood requirements and connect with
              eligible donors.
            </p>
          </div>

          <div className="flex size-[76px] shrink-0 items-center justify-center rounded-xl border border-[#EAD9DE] bg-white/80 text-[#963D54] shadow-sm">
            <Droplet size={35} strokeWidth={1.5} />
          </div>
        </div>

        <div className="absolute -right-8 -top-12 size-40 rounded-full border-[20px] border-[#F2E2DC]/50" />
      </section>

      {/* Form Card */}
      <section className="mx-auto overflow-hidden rounded-xl border border-[#E8DDD4] bg-white shadow-sm">
        {/* Form Header */}
        <div className="border-b border-[#EDE2DD] bg-[#FCF8F4] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#782B40] text-white shadow-sm">
              <ClipboardList size={21} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#302923]">
                Request Information
              </h2>

              <p className="mt-0.5 text-xs text-[#81756A]">
                Enter the details of the required blood donation.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-7">
          {/* Feedback */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] p-3.5 text-sm text-[#963D54]"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-6 flex items-start gap-2 rounded-xl border border-[#EADDE1] bg-[#FFF8FA] p-3.5 text-sm text-[#782B40]"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* Blood Requirements */}
          <div className="mb-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#F8E9EC] text-[#963D54]">
                <Droplet size={17} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#302923]">
                  Blood Requirements
                </h3>

                <p className="text-xs text-[#91848A]">
                  Specify the blood group, quantity and urgency.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#F0E5E1] bg-[#FFFCFA] p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                {/* Blood Group */}
                <div>
                  <label htmlFor="bloodGroup" className={labelClass}>
                    Blood Group <span className="text-[#963D54]">*</span>
                  </label>

                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="">Select blood group</option>

                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Units Required */}
                <div>
                  <label htmlFor="unitsRequired" className={labelClass}>
                    Units Required <span className="text-[#963D54]">*</span>
                  </label>

                  <input
                    id="unitsRequired"
                    type="number"
                    name="unitsRequired"
                    value={formData.unitsRequired}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    required
                    disabled={loading}
                    placeholder="Enter number of units"
                    className={inputClass}
                  />
                </div>

                {/* Urgency */}
                <div>
                  <label htmlFor="urgency" className={labelClass}>
                    Urgency <span className="text-[#963D54]">*</span>
                  </label>

                  <select
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Required By */}
                <div>
                  <label htmlFor="requiredBy" className={labelClass}>
                    Required By <span className="text-[#963D54]">*</span>
                  </label>

                  <div className="relative">
                    <Clock3
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A18A90]"
                    />

                    <input
                      id="requiredBy"
                      type="datetime-local"
                      name="requiredBy"
                      value={formData.requiredBy}
                      onChange={handleChange}
                      min={getMinDateTimeLocal()}
                      required
                      disabled={loading}
                      className={`${inputClass} pr-10`}
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-[#91848A]">
                    Choose a future date and time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Location */}
          <div className="mb-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#F8E9EC] text-[#963D54]">
                <MapPin size={17} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#302923]">
                  Request Location
                </h3>

                <p className="text-xs text-[#91848A]">
                  Help donors identify where the blood is needed.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#F0E5E1] bg-[#FFFCFA] p-4 sm:p-5">
              <label htmlFor="ward" className={labelClass}>
                Ward
                <span className="ml-1.5 font-normal text-[#91848A]">
                  (Optional)
                </span>
              </label>

              <input
                id="ward"
                type="text"
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                maxLength={100}
                disabled={loading}
                placeholder="e.g. ICU, Emergency Ward, Surgical Ward"
                className={inputClass}
              />

              <p className="mt-1.5 text-right text-xs text-[#91848A]">
                {formData.ward.length}/100
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#F8E9EC] text-[#963D54]">
                <FileText size={17} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#302923]">
                  Additional Information
                </h3>

                <p className="text-xs text-[#91848A]">
                  Include any relevant instructions or details.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#F0E5E1] bg-[#FFFCFA] p-4 sm:p-5">
              <label htmlFor="hospitalNotes" className={labelClass}>
                Additional Notes
                <span className="ml-1.5 font-normal text-[#91848A]">
                  (Optional)
                </span>
              </label>

              <textarea
                id="hospitalNotes"
                name="hospitalNotes"
                value={formData.hospitalNotes}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                disabled={loading}
                placeholder="Add any additional information about this request..."
                className={`${inputClass} min-h-28 resize-y`}
              />

              <p className="mt-1.5 text-right text-xs text-[#91848A]">
                {formData.hospitalNotes.length}/500
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EDE2DD] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#91848A]">
              <span className="text-[#963D54]">*</span> Required fields
            </p>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#612235] hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />

              {loading ? "Submitting..." : "Submit Blood Request"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CreateRequest;
