import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { useApi } from "../../hooks/useApi";

const CreateRequest = () => {
  const { request } = useApi();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bloodGroup: "",
    unitsRequired: "",
    urgency: "normal",
    requiredBy: "",
    hospitalNotes: "",
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
    setError("");
    setSuccess("");

    if (
      !formData.bloodGroup ||
      !formData.unitsRequired ||
      !formData.requiredBy
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (Number(formData.unitsRequired) <= 0) {
      setError("Units required must be greater than zero.");
      return;
    }

    try {
      setLoading(true);

      await request({
        method: "POST",
        url: "/api/blood-requests",
        data: {
          ...formData,
          unitsRequired: Number(formData.unitsRequired),
        },
      });

      setSuccess("Blood request created successfully!");

      setFormData({
        bloodGroup: "",
        unitsRequired: "",
        urgency: "normal",
        requiredBy: "",
        hospitalNotes: "",
      });

      setTimeout(() => {
        navigate("/hospital/requests");
      }, 1200);
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
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
          Hospital Portal
        </p>

        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
          Create Blood Request
        </h1>

        <p className="mt-3 text-sm text-[#81756A]">
          Submit a request for the blood group and quantity your hospital needs.
        </p>
      </section>

      <section className="max-w-3xl rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-xl bg-[#F2E2DC] p-3 text-[#963D54]">
            <Droplet size={22} />
          </div>

          <div>
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Request Information
            </h2>
            <p className="mt-1 text-xs text-[#81756A]">
              Fields marked with * are required.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#302923]">
                Blood Group *
              </label>

              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC]"
              >
                <option value="">Select blood group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#302923]">
                Units Required *
              </label>

              <input
                type="number"
                name="unitsRequired"
                value={formData.unitsRequired}
                onChange={handleChange}
                min="1"
                required
                placeholder="Enter number of units"
                className="w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#302923]">
                Urgency *
              </label>

              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC]"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#302923]">
                Required By *
              </label>

              <input
                type="datetime-local"
                name="requiredBy"
                value={formData.requiredBy}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                required
                className="w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#302923]">
              Additional Notes
            </label>

            <textarea
              name="hospitalNotes"
              value={formData.hospitalNotes}
              onChange={handleChange}
              rows="4"
              placeholder="Add any additional information about this request..."
              className="w-full resize-none rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC]"
            />
          </div>

          <div className="flex justify-end border-t border-[#EFE6DF] pt-5">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#612235] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CreateRequest;
