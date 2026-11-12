import { useEffect, useState } from "react";
import { Settings, Save, Loader2, Clock3 } from "lucide-react";
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
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#963D54]">
          Administration
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-[#81756A]">
          Manage system-wide donation and eligibility settings.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54]">
            <Settings size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-[#302923]">
              Donation Eligibility
            </h2>
            <p className="mt-1 text-xs text-[#81756A]">
              Configure the minimum waiting period between donations.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-[#81756A]">
            <Loader2 size={17} className="animate-spin" />
            Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label
                htmlFor="cooldownDays"
                className="mb-2 block text-sm font-medium text-[#302923]"
              >
                Donation Cooldown Period (Days)
              </label>

              <div className="relative">
                <Clock3
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3978C]"
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

              <p className="mt-2 text-xs text-[#81756A]">
                Donors must wait this many days after their last donation before
                becoming eligible again. Allowed range: 1–365 days.
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#963D54] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#782B40] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminSettings;
