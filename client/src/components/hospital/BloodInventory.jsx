import { useEffect, useState } from "react";
import {
  Droplet,
  RefreshCw,
  Save,
  Minus,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const LOW_STOCK_LIMIT = 5;

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

  const totalUnits = bloodGroups.reduce(
    (sum, group) => sum + getUnits(group),
    0,
  );

  const highestUnits = Math.max(
    10,
    ...bloodGroups.map((group) => getUnits(group)),
  );

  const getStockState = (count) => {
    if (count <= 0) {
      return {
        label: "Out of stock",
        badge: "bg-[#F1EDE7] text-[#81756A] ring-[#E8DDD4]",
        fill: "fill-[#D6C9C0]",
      };
    }

    if (count < LOW_STOCK_LIMIT) {
      return {
        label: "Low stock",
        badge: "bg-amber-50 text-amber-700 ring-amber-200",
        fill: "fill-amber-400",
      };
    }

    return {
      label: "In stock",
      badge: "bg-[#F2E2DC] text-[#782B40] ring-[#E8DDD4]",
      fill: "fill-[#963D54]",
    };
  };

  const lowCount = bloodGroups.filter((group) => {
    const count = getUnits(group);
    return count > 0 && count < LOW_STOCK_LIMIT;
  }).length;

  const outCount = bloodGroups.filter((group) => getUnits(group) <= 0).length;

  const currentSelectedUnits = getUnits(selectedGroup);
  const hasNewValue = units !== "" && !Number.isNaN(Number(units));

  const changeUnits = (delta) => {
    const base = units === "" ? currentSelectedUnits : Number(units) || 0;

    setUnits(String(Math.max(0, base + delta)));
  };

  const labelClass = "mb-2 block text-sm font-medium text-[#302923]";

  return (
    <section className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm sm:p-7">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6DF] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
            <Droplet size={22} />
          </div>

          <div>
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Inventory Overview
            </h2>
            <p className="mt-1 text-sm text-[#81756A]">
              Manage your hospital's available blood units.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={19} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss message"
            className="rounded-lg p-1 hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          role="status"
          className="mb-5 flex items-center gap-3 rounded-xl border border-[#E8DDD4] bg-[#F2E2DC] px-4 py-3 text-sm text-[#782B40]"
        >
          <CheckCircle2 size={19} className="shrink-0" />
          <span className="flex-1">{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
            className="rounded-lg p-1 hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div role="status" aria-label="Loading inventory">
          <p className="mb-5 flex items-center justify-center gap-3 text-sm text-[#782B40]">
            <Loader2 size={19} className="animate-spin" />
            Loading inventory...
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {bloodGroups.map((group) => (
              <div
                key={group}
                className="h-44 animate-pulse rounded-2xl border border-[#E8DDD4] bg-[#F8F5EF]"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stock Summary */}
          <div className="mb-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#782B40] p-5 text-white">
              <p className="text-xs font-medium tracking-wide text-[#F2E2DC]">
                TOTAL UNITS IN STOCK
              </p>
              <p className="mt-2 text-3xl font-semibold">{totalUnits}</p>
              <p className="mt-1 text-xs text-[#E8C9CE]">
                Across all blood groups
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-medium tracking-wide text-amber-700">
                LOW STOCK GROUPS
              </p>
              <p className="mt-2 text-3xl font-semibold text-amber-700">
                {lowCount}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Groups below {LOW_STOCK_LIMIT} units
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8DDD4] bg-[#F8F5EF] p-5">
              <p className="text-xs font-medium tracking-wide text-[#81756A]">
                OUT OF STOCK
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#302923]">
                {outCount}
              </p>
              <p className="mt-1 text-xs text-[#81756A]">
                Groups with zero units
              </p>
            </div>
          </div>

          {/* Blood Group Cards */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#302923]">
                Available Blood Groups
              </h3>
              <p className="mt-1 text-xs text-[#81756A]">
                Select a blood group to update its available units.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {bloodGroups.map((group, index) => {
                const count = getUnits(group);
                const state = getStockState(count);
                const level = Math.min(count / highestUnits, 1);
                const selected = selectedGroup === group;

                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    aria-pressed={selected}
                    aria-label={`${group}: ${count} units available. Select to update.`}
                    className={`relative flex flex-col items-center rounded-2xl border p-4 text-center transition duration-200 ${
                      selected
                        ? "border-[#963D54] bg-[#F8F5EF] ring-2 ring-[#F2E2DC]"
                        : "border-[#E8DDD4] bg-white hover:border-[#C99AA5] hover:bg-[#F8F5EF]"
                    }`}
                  >
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[9px] font-semibold ring-1 ${state.badge}`}
                    >
                      {state.label}
                    </span>

                    <svg
                      viewBox="0 0 24 30"
                      className="mt-6 h-16 w-12"
                      aria-hidden="true"
                    >
                      <defs>
                        <clipPath id={`drop-clip-${index}`}>
                          <path d="M12 2 C12 2 4 12 4 19 a8 8 0 0 0 16 0 C20 12 12 2 12 2 Z" />
                        </clipPath>
                      </defs>

                      <path
                        d="M12 2 C12 2 4 12 4 19 a8 8 0 0 0 16 0 C20 12 12 2 12 2 Z"
                        className="fill-[#F2E2DC]"
                      />

                      <rect
                        x="0"
                        y={28 - 26 * level}
                        width="24"
                        height={26 * level + 2}
                        clipPath={`url(#drop-clip-${index})`}
                        className={`${state.fill} transition-all duration-700`}
                      />

                      <path
                        d="M12 2 C12 2 4 12 4 19 a8 8 0 0 0 16 0 C20 12 12 2 12 2 Z"
                        className="fill-none stroke-[#782B40]/40"
                        strokeWidth="0.8"
                      />
                    </svg>

                    <h3 className="mt-3 text-2xl font-semibold text-[#782B40]">
                      {group}
                    </h3>

                    <p className="mt-1 text-sm text-[#81756A]">
                      <span className="font-semibold text-[#302923]">
                        {count}
                      </span>{" "}
                      {count === 1 ? "unit" : "units"}
                    </p>

                    <span
                      className={`mt-3 text-xs font-medium ${
                        selected ? "text-[#782B40]" : "text-[#A45B6D]"
                      }`}
                    >
                      {selected ? "Selected" : "Tap to update"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Update Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-[#E8DDD4] bg-[#F8F5EF] p-5 sm:p-7"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#302923]">
                  Update Inventory
                </h3>
                <p className="mt-1 text-xs text-[#81756A]">
                  Set the latest available quantity.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#782B40]">
                <Droplet size={15} />
                {selectedGroup}: {currentSelectedUnits} units
              </span>
            </div>

            <div className="space-y-6">
              {/* Blood Group Selection */}
              <div>
                <span className={labelClass}>Blood Group</span>

                <div
                  role="radiogroup"
                  aria-label="Blood group"
                  className="grid grid-cols-4 gap-2 sm:grid-cols-8"
                >
                  {bloodGroups.map((group) => {
                    const selected = selectedGroup === group;

                    return (
                      <button
                        key={group}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSelectedGroup(group)}
                        className={`flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                          selected
                            ? "border-[#782B40] bg-[#782B40] text-white"
                            : "border-[#E8DDD4] bg-white text-[#782B40] hover:border-[#A45B6D] hover:bg-[#F2E2DC]"
                        }`}
                      >
                        {group}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Units */}
              <div>
                <label htmlFor="inventory-units" className={labelClass}>
                  Available Units
                </label>

                <div className="flex max-w-md items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease units"
                    onClick={() => changeUnits(-1)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E8DDD4] bg-white text-[#782B40] transition hover:bg-[#F2E2DC] active:scale-95"
                  >
                    <Minus size={18} />
                  </button>

                  <input
                    id="inventory-units"
                    type="number"
                    min="0"
                    step="1"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    placeholder="Enter available units"
                    required
                    className="h-12 w-full rounded-xl border border-[#E8DDD4] bg-white px-4 text-center text-base font-semibold text-[#302923] outline-none transition placeholder:text-sm placeholder:font-normal focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC]"
                  />

                  <button
                    type="button"
                    aria-label="Increase units"
                    onClick={() => changeUnits(1)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E8DDD4] bg-white text-[#782B40] transition hover:bg-[#F2E2DC] active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Live Preview */}
                {hasNewValue && (
                  <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-4 py-2 text-sm font-medium text-[#782B40]">
                    {selectedGroup}
                    <span className="text-[#81756A]">
                      {currentSelectedUnits}
                    </span>
                    <ArrowRight size={14} />
                    <span>{Number(units)}</span>

                    {Number(units) !== currentSelectedUnits && (
                      <span
                        className={
                          Number(units) > currentSelectedUnits
                            ? "text-[#963D54]"
                            : "text-amber-700"
                        }
                      >
                        ({Number(units) > currentSelectedUnits ? "+" : ""}
                        {Number(units) - currentSelectedUnits})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !hasNewValue}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#782B40] px-7 py-3 text-sm font-medium text-white transition hover:bg-[#612235] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save Inventory"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default BloodInventory;
