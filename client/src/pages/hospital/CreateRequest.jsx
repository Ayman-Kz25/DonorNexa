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
  "w-full min-w-0 rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-[13px] text-[#302923] outline-none transition placeholder:text-[#A69A96] hover:border-[#D8BBC3] focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC] disabled:cursor-not-allowed disabled:bg-[#F8F5EF] disabled:opacity-70 sm:px-4 sm:py-3 sm:text-sm";

const labelClass =
  "mb-1.5 block text-xs font-semibold text-[#40343A] sm:mb-2 sm:text-sm";

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
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-5 lg:space-y-7">
      {/* Page Heading */}
      <section className="relative min-w-0 overflow-hidden rounded-xl border border-[#EAD9DE] bg-gradient-to-r from-[#FFF8F8] via-[#FFFDF9] to-[#F8F0EC] p-4 sm:p-6 lg:p-7">
        <div className="relative z-10 flex min-w-0 flex-col-reverse justify-between gap-3 min-[480px]:flex-row min-[480px]:items-center sm:gap-5">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-[#EAD9DE] bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-[#963D54] sm:mb-3 sm:rounded-xl sm:px-3 sm:text-xs">
              <span className="size-1.5 shrink-0 rounded-full bg-[#963D54]" />
              Hospital Portal
            </div>

            <h1 className="break-words font-serif text-[22px] font-semibold leading-tight tracking-tight text-[#302923] sm:text-3xl lg:text-4xl">
              Create Blood Request
            </h1>

            <p className="mt-2 max-w-lg text-xs leading-5 text-[#81756A] sm:text-sm sm:leading-6">
              Submit your hospital's blood requirements and connect with
              eligible donors.
            </p>
          </div>

          <div className="flex size-11 shrink-0 items-center justify-center self-end rounded-xl border border-[#EAD9DE] bg-white/80 text-[#963D54] shadow-sm min-[480px]:size-14 min-[480px]:self-center sm:size-[68px] lg:size-[76px]">
            <Droplet
              size={23}
              strokeWidth={1.5}
              className="min-[480px]:size-7 lg:size-[35px]"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-full border-[20px] border-[#F2E2DC]/50" />
      </section>

      {/* Form Card */}
      <section className="mx-auto w-full min-w-0 overflow-hidden rounded-xl border border-[#E8DDD4] bg-white shadow-sm">
        {/* Form Header */}
        <div className="border-b border-[#EDE2DD] bg-[#FCF8F4] px-4 py-4 sm:px-6 sm:py-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#782B40] text-white shadow-sm sm:size-11 sm:rounded-xl">
              <ClipboardList size={18} className="sm:size-[21px]" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#302923] sm:text-base">
                Request Information
              </h2>

              <p className="mt-0.5 text-[11px] leading-4 text-[#81756A] sm:text-xs sm:leading-5">
                Enter the details of the required blood donation.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="min-w-0 p-4 sm:p-6 lg:p-7"
        >
          {/* Feedback */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex min-w-0 items-start gap-2 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] p-3 text-xs leading-5 text-[#963D54] sm:mb-6 sm:p-3.5 sm:text-sm"
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 sm:size-[18px]"
              />
              <p className="min-w-0 break-words">{error}</p>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-4 flex min-w-0 items-start gap-2 rounded-xl border border-[#EADDE1] bg-[#FFF8FA] p-3 text-xs leading-5 text-[#782B40] sm:mb-6 sm:p-3.5 sm:text-sm"
            >
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 sm:size-[18px]"
              />
              <p className="min-w-0 break-words">{success}</p>
            </div>
          )}

          {/* Blood Requirements */}
          <div className="mb-5 sm:mb-7">
            <div className="mb-3 flex min-w-0 items-center gap-2.5 sm:mb-5 sm:gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F8E9EC] text-[#963D54] sm:rounded-xl">
                <Droplet size={16} className="sm:size-[17px]" />
              </div>

              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-[#302923] sm:text-sm">
                  Blood Requirements
                </h3>

                <p className="mt-0.5 text-[11px] leading-4 text-[#91848A] sm:text-xs">
                  Specify the blood group, quantity and urgency.
                </p>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-[#F0E5E1] bg-[#FFFCFA] p-3.5 sm:p-5">
              <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 sm:gap-y-5">
                {/* Blood Group */}
                <div className="min-w-0">
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
                <div className="min-w-0">
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
                <div className="min-w-0">
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
                <div className="min-w-0">
                  <label htmlFor="requiredBy" className={labelClass}>
                    Required By <span className="text-[#963D54]">*</span>
                  </label>

                  <div className="relative min-w-0">
                    <Clock3
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#A18A90] sm:right-4 sm:size-4"
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
                      className={`${inputClass} min-w-0 pr-9 sm:pr-10`}
                    />
                  </div>

                  <p className="mt-1.5 text-[10px] leading-4 text-[#91848A] sm:text-xs">
                    Choose a future date and time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Location */}
          <div className="mb-5 sm:mb-7">
            <div className="mb-3 flex min-w-0 items-center gap-2.5 sm:mb-5 sm:gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F8E9EC] text-[#963D54] sm:rounded-xl">
                <MapPin size={16} className="sm:size-[17px]" />
              </div>

              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-[#302923] sm:text-sm">
                  Request Location
                </h3>

                <p className="mt-0.5 text-[11px] leading-4 text-[#91848A] sm:text-xs">
                  Help donors identify where the blood is needed.
                </p>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-[#F0E5E1] bg-[#FFFCFA] p-3.5 sm:p-5">
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

              <p className="mt-1.5 text-right text-[10px] text-[#91848A] sm:text-xs">
                {formData.ward.length}/100
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-5 sm:mb-7">
            <div className="mb-3 flex min-w-0 items-center gap-2.5 sm:mb-5 sm:gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F8E9EC] text-[#963D54] sm:rounded-xl">
                <FileText size={16} className="sm:size-[17px]" />
              </div>

              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-[#302923] sm:text-sm">
                  Additional Information
                </h3>

                <p className="mt-0.5 text-[11px] leading-4 text-[#91848A] sm:text-xs">
                  Include any relevant instructions or details.
                </p>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-[#F0E5E1] bg-[#FFFCFA] p-3.5 sm:p-5">
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
                className={`${inputClass} min-h-24 resize-y sm:min-h-28`}
              />

              <p className="mt-1.5 text-right text-[10px] text-[#91848A] sm:text-xs">
                {formData.hospitalNotes.length}/500
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex min-w-0 flex-col-reverse gap-3 border-t border-[#EDE2DD] pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
            <p className="text-[11px] text-[#91848A] sm:text-xs">
              <span className="text-[#963D54]">*</span> Required fields
            </p>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#782B40] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#612235] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:w-auto sm:px-7 sm:py-3 sm:text-sm"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Send size={15} className="sm:size-4" />
              )}

              {loading ? "Submitting..." : "Submit Blood Request"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CreateRequest;
