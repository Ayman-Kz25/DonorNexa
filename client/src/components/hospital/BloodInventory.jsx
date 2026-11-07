import { useEffect, useState } from "react";
import { Droplet, RefreshCw, Save } from "lucide-react";
import { useApi } from "../../hooks/useApi";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function BloodInventory() {
  const { request } = useApi();

  const [inventory, setInventory] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("A+");
  const [units, setUnits] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchInventory = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await request({
        method: "GET",
        url: "/api/inventory",
      });

      setInventory(response.data.inventory || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load blood inventory.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await request({
        method: "PUT",
        url: "/api/inventory",
        data: {
          bloodGroup: selectedGroup,
          unitsAvailable: Number(units),
        },
      });

      setSuccess(`${selectedGroup} inventory updated successfully.`);
      setUnits("");
      await fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update inventory.");
    } finally {
      setSaving(false);
    }
  };

  const getUnits = (group) => {
    const record = inventory.find((item) => item.bloodGroup === group);

    return record?.unitsAvailable ?? 0;
  };

  return (
    <section className="mt-8 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Droplet size={23} className="text-[#BE4565]" />
            <h2 className="text-xl font-semibold text-[#29232A]">
              Blood Inventory
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Manage your hospital's available blood units.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm text-[#BE4565] hover:bg-rose-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-[#96334F]">
          {success}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Loading inventory...
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {bloodGroups.map((group) => (
              <div
                key={group}
                className="rounded-xl border border-rose-100 bg-[#FFF8FA] p-4"
              >
                <p className="text-sm font-medium text-gray-500">Blood Group</p>

                <h3 className="mt-1 text-2xl font-semibold text-[#BE4565]">
                  {group}
                </h3>

                <p className="mt-2 text-sm text-[#29232A]">
                  {getUnits(group)} units available
                </p>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7 rounded-xl border border-rose-100 p-5"
          >
            <h3 className="mb-4 font-semibold text-[#29232A]">
              Update Inventory
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#29232A]">
                  Blood Group
                </label>

                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full rounded-lg border border-rose-100 px-3 py-3 text-sm outline-none focus:border-[#BE4565]"
                >
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#29232A]">
                  Available Units
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  placeholder="Enter available units"
                  required
                  className="w-full rounded-lg border border-rose-100 px-3 py-3 text-sm outline-none focus:border-[#BE4565]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-[#BE4565] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#96334F] disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Inventory"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default BloodInventory;
