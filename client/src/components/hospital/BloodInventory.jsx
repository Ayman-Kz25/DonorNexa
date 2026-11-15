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
  Package,
  TrendingDown,
  CircleAlert,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const LOW_STOCK_LIMIT = 5;

const cardStyle = "rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]";

const labelClass = "mb-2 block text-sm font-medium text-[#302923]";

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

    const quantity = Number(units);

    if (units.trim() === "" || !Number.isInteger(quantity) || quantity < 0) {
      setError("Please enter a valid whole number of units.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await request({
        method: "PUT",
        url: "/api/inventory",
        data: {
          bloodGroup: selectedGroup,
          unitsAvailable: quantity,
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
        text: "text-[#81756A]",
      };
    }

    if (count < LOW_STOCK_LIMIT) {
      return {
        label: "Low stock",
        badge: "bg-[#F8EDE2] text-[#98602F] ring-[#E8D4BF]",
        fill: "fill-[#B47A45]",
        text: "text-[#98602F]",
      };
    }

    return {
      label: "In stock",
      badge: "bg-[#F2E2DC] text-[#782B40] ring-[#E8DDD4]",
      fill: "fill-[#963D54]",
      text: "text-[#782B40]",
    };
  };

  const lowCount = bloodGroups.filter((group) => {
    const count = getUnits(group);
    return count > 0 && count < LOW_STOCK_LIMIT;
  }).length;

  const outCount = bloodGroups.filter((group) => getUnits(group) <= 0).length;

  const currentSelectedUnits = getUnits(selectedGroup);
  const hasNewValue =
    units.trim() !== "" &&
    Number.isInteger(Number(units)) &&
    Number(units) >= 0;

  const changeUnits = (delta) => {
    const base = units === "" ? currentSelectedUnits : Number(units) || 0;
    setUnits(String(Math.max(0, base + delta)));
  };

  const summaryCards = [
    {
      label: "Total Units",
      value: totalUnits,
      description: "Across all blood groups",
      icon: Droplet,
      style: "bg-[#782B40] text-white",
      subStyle: "text-[#E8C9CE]",
      iconStyle: "bg-white/10 text-white",
    },
    {
      label: "Low Stock Groups",
      value: lowCount,
      description: `Below ${LOW_STOCK_LIMIT} available units`,
      icon: TrendingDown,
      style: "bg-[#FFF8F0] border border-[#E8D4BF]",
      textStyle: "text-[#98602F]",
      subStyle: "text-[#A17D5D]",
      iconStyle: "bg-[#F8EDE2] text-[#98602F]",
    },
    {
      label: "Out of Stock",
      value: outCount,
      description: "Groups with zero units",
      icon: CircleAlert,
      style: "bg-[#F8F5EF] border border-[#E8DDD4]",
      textStyle: "text-[#302923]",
      subStyle: "text-[#81756A]",
      iconStyle: "bg-[#EDE6DE] text-[#81756A]",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E8DDD4] bg-gradient-to-r from-[#FFF8F8] via-[#FFFDF9] to-[#F8F0EC] p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
            <Droplet size={24} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
              Hospital Portal
            </p>

            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#302923] sm:text-3xl">
              Blood Inventory
            </h2>

            <p className="mt-1 text-sm text-[#81756A]">
              Monitor and manage your hospital's blood supply.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-sm font-semibold text-[#782B40] shadow-sm transition hover:bg-[#F8F1ED] disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="rounded-lg p-1 transition hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-[#E8DDD4] bg-[#F2E2DC] px-4 py-3 text-sm text-[#782B40]"
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="flex-1">{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="rounded-lg p-1 transition hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-5" role="status" aria-label="Loading inventory">
          <div className="flex items-center gap-3 text-sm font-medium text-[#782B40]">
            <Loader2 size={19} className="animate-spin" />
            Loading blood inventory...
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-xl bg-[#F5EFE8]"
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {bloodGroups.map((group) => (
              <div
                key={group}
                className="h-44 animate-pulse rounded-xl bg-[#F5EFE8]"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Inventory Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            {summaryCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`rounded-xl p-5 shadow-sm ${item.style}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.12em] ${
                          item.textStyle || "text-[#F2E2DC]"
                        }`}
                      >
                        {item.label}
                      </p>

                      <p
                        className={`mt-3 text-3xl font-semibold tabular-nums ${
                          item.textStyle || "text-white"
                        }`}
                      >
                        {item.value}
                      </p>

                      <p className={`mt-1 text-xs ${item.subStyle}`}>
                        {item.description}
                      </p>
                    </div>

                    <div className={`rounded-xl p-3 ${item.iconStyle}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Blood Group Inventory */}
          <div className={`${cardStyle} p-5 sm:p-6`}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#302923]">
                  Blood Group Availability
                </h3>
                <p className="mt-1 text-sm text-[#81756A]">
                  Select a group to update its available units.
                </p>
              </div>

              <span className="rounded-lg bg-[#F2E2DC] px-3 py-1.5 text-xs font-semibold text-[#782B40]">
                8 Blood Groups
              </span>
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
                    onClick={() => {
                      setSelectedGroup(group);
                      setUnits("");
                      setSuccess("");
                    }}
                    aria-pressed={selected}
                    aria-label={`${group}: ${count} units available. Select to update.`}
                    className={`relative flex min-w-0 flex-col items-center rounded-xl border p-3.5 text-center transition duration-200 sm:p-4 ${
                      selected
                        ? "border-[#963D54] bg-[#FFF8F8] ring-2 ring-[#F2E2DC]"
                        : "border-[#E8DDD4] bg-white hover:border-[#C99AA5] hover:bg-[#FFF9F7]"
                    }`}
                  >
                    <span
                      className={`absolute right-2 top-2 rounded-lg px-2 py-1 text-[9px] font-semibold ring-1 ${state.badge}`}
                    >
                      {state.label}
                    </span>

                    <svg
                      viewBox="0 0 24 30"
                      className="mt-7 h-14 w-11"
                      aria-hidden="true"
                    >
                      <defs>
                        <clipPath id={`inventory-drop-${index}`}>
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
                        clipPath={`url(#inventory-drop-${index})`}
                        className={`${state.fill} transition-all duration-700`}
                      />

                      <path
                        d="M12 2 C12 2 4 12 4 19 a8 8 0 0 0 16 0 C20 12 12 2 12 2 Z"
                        className="fill-none stroke-[#782B40]/40"
                        strokeWidth="0.8"
                      />
                    </svg>

                    <p className="mt-2 text-2xl font-semibold text-[#782B40]">
                      {group}
                    </p>

                    <p className="mt-1 text-sm text-[#81756A]">
                      <span className="font-semibold text-[#302923]">
                        {count}
                      </span>{" "}
                      {count === 1 ? "unit" : "units"}
                    </p>

                    <span
                      className={`mt-3 text-xs font-semibold ${
                        selected ? "text-[#782B40]" : "text-[#A45B6D]"
                      }`}
                    >
                      {selected ? "Currently selected" : "Select group"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stock Legend */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#EFE6DF] pt-4">
              <div className="flex items-center gap-2 text-xs text-[#81756A]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#963D54]" />
                In stock ({LOW_STOCK_LIMIT}+ units)
              </div>

              <div className="flex items-center gap-2 text-xs text-[#81756A]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#B47A45]" />
                Low stock (1–{LOW_STOCK_LIMIT - 1} units)
              </div>

              <div className="flex items-center gap-2 text-xs text-[#81756A]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D6C9C0]" />
                Out of stock (0 units)
              </div>
            </div>
          </div>

          {/* Update Inventory */}
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE6DF] bg-gradient-to-r from-[#FFF8F8] to-[#F8F5EF] p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A45B6D]">
                  Inventory Management
                </p>

                <h3 className="mt-1 font-serif text-xl font-semibold text-[#302923]">
                  Update Blood Units
                </h3>

                <p className="mt-1 text-sm text-[#81756A]">
                  Enter the latest available quantity for the selected group.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5">
                <Droplet size={17} className="text-[#963D54]" />

                <span className="text-sm font-semibold text-[#782B40]">
                  {selectedGroup}
                </span>

                <span className="text-xs text-[#81756A]">
                  · {currentSelectedUnits} available
                </span>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
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
                        onClick={() => {
                          setSelectedGroup(group);
                          setUnits("");
                          setSuccess("");
                        }}
                        className={`flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                          selected
                            ? "border-[#782B40] bg-[#782B40] text-white"
                            : "border-[#E8DDD4] bg-white text-[#782B40] hover:border-[#A45B6D] hover:bg-[#F8F1ED]"
                        }`}
                      >
                        {group}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Units */}
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

                {/* Live Quantity Preview */}
                {hasNewValue && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFF9F7] px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#81756A]">
                      Quantity preview
                    </span>

                    <div className="ml-auto flex items-center gap-2 text-sm font-semibold text-[#782B40]">
                      <span>{selectedGroup}</span>
                      <span className="text-[#81756A]">
                        {currentSelectedUnits}
                      </span>
                      <ArrowRight size={15} />
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
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-3 border-t border-[#EFE6DF] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[#81756A]">
                  Saving will replace the current available quantity for{" "}
                  <span className="font-semibold text-[#782B40]">
                    {selectedGroup}
                  </span>
                  .
                </p>

                <button
                  type="submit"
                  disabled={saving || !hasNewValue}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#612235] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "Saving..." : "Save Inventory"}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </section>
  );
}

export default BloodInventory;
