import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Loader2,
  Clock3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

function AdminSettings() {
  const { request } = useApi();

  const [cooldownDays, setCooldownDays] = useState("90");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setError("");

        const response = await request({
          method: "GET",
          url: "/api/admin/settings",
        });

        setCooldownDays(String(response.data.settings.donationCooldownDays));
      } catch (err) {
        setError("Unable to load admin settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [request]);

  const handleSave = async (e) => {
    e.preventDefault();

    const days = Number(cooldownDays);

    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setError("Enter a whole number between 1 and 365.");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await request({
        method: "PATCH",
        url: "/api/admin/settings",
        data: {
          donationCooldownDays: days,
        },
      });

      setCooldownDays(String(response.data.settings.donationCooldownDays));

      setSuccess("Settings saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 w-full space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Page Header */}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#963D54] sm:text-xs sm:tracking-[0.16em]">
          Administration
        </p>

        <h1 className="mt-1 font-serif text-2xl font-semibold text-[#302923] sm:mt-2 sm:text-3xl">
          Settings
        </h1>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[#81756A] sm:mt-2 sm:text-sm">
          Manage system-wide donation and eligibility settings.
        </p>
      </div>

      {/* Settings Card */}
      <div className="w-full max-w-2xl rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 shadow-sm sm:p-6 lg:p-8">
        {/* Card Header */}
        <div className="mb-5 flex min-w-0 items-start gap-3 sm:mb-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54] sm:size-11">
            <Settings size={20} />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#302923] sm:text-base">
              Donation Eligibility
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#81756A]">
              Configure the minimum waiting period between donations.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E8DDD4] pt-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#81756A] sm:justify-start">
              <Loader2 size={18} className="animate-spin text-[#963D54]" />
              Loading settings...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Cooldown Input */}
              <div className="min-w-0">
                <label
                  htmlFor="cooldownDays"
                  className="mb-2 block text-xs font-semibold text-[#302923] sm:text-sm"
                >
                  Donation Cooldown Period (Days)
                </label>

                <div className="relative">
                  <Clock3
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3978C] sm:left-4"
                  />

                  <input
                    id="cooldownDays"
                    type="number"
                    min="1"
                    max="365"
                    step="1"
                    value={cooldownDays}
                    onChange={(e) => {
                      setCooldownDays(e.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    className="w-full rounded-xl border border-[#E8DDD4] bg-white py-3 pl-10 pr-4 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:ring-2 focus:ring-[#963D54]/10"
                    required
                  />
                </div>

                <p className="mt-2 text-[11px] leading-5 text-[#81756A] sm:text-xs">
                  Donors must wait this many days after their last donation
                  before becoming eligible again. Allowed range: 1–365 days.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 sm:text-sm"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <p className="min-w-0 break-words">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-xl border border-[#E8DDD4] bg-[#F2E2DC] p-3 text-xs leading-5 text-[#782B40] sm:text-sm"
                >
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              {/* Save Button */}
              <div className="border-t border-[#E8DDD4] pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#963D54] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#782B40] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
