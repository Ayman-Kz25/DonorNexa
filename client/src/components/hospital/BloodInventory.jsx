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
  TrendingDown,
  CircleAlert,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const LOW_STOCK_LIMIT = 5;

const cardStyle = "rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]";

const labelClass = "mb-2 block text-xs font-medium text-[#302923] sm:text-sm";

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
      };
    }

    if (count < LOW_STOCK_LIMIT) {
      return {
        label: "Low stock",
        badge: "bg-[#F8EDE2] text-[#98602F] ring-[#E8D4BF]",
        fill: "fill-[#B47A45]",
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
    <section className="w-full min-w-0 space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Page Header */}
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#E8DDD4] bg-gradient-to-r from-[#FFF8F8] via-[#FFFDF9] to-[#F8F0EC] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 lg:p-6">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40] sm:h-12 sm:w-12">
            <Droplet size={21} className="sm:hidden" />
            <Droplet size={24} className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A45B6D] sm:text-xs sm:tracking-[0.18em]">
              Hospital Portal
            </p>

            <h2 className="mt-1 font-serif text-xl font-semibold leading-tight text-[#302923] sm:text-2xl lg:text-3xl">
              Blood Inventory
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-[#81756A] sm:text-sm">
              Monitor and manage your hospital's blood supply.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          disabled={loading}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-white px-3 py-2 text-xs font-semibold text-[#782B40] shadow-sm transition hover:bg-[#F8F1ED] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-center sm:px-4 sm:py-2.5 sm:text-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs leading-relaxed text-red-700 sm:items-center sm:gap-3 sm:px-4 sm:text-sm"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0 sm:mt-0" />
          <span className="min-w-0 flex-1 break-words">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="shrink-0 rounded-lg p-1 transition hover:bg-white"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex min-w-0 items-start gap-2 rounded-xl border border-[#E8DDD4] bg-[#F2E2DC] px-3 py-3 text-xs leading-relaxed text-[#782B40] sm:items-center sm:gap-3 sm:px-4 sm:text-sm"
        >
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 sm:mt-0" />
          <span className="min-w-0 flex-1 break-words">{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="shrink-0 rounded-lg p-1 transition hover:bg-white"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div
          className="min-w-0 space-y-4 sm:space-y-5"
          role="status"
          aria-label="Loading inventory"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-[#782B40] sm:text-sm">
            <Loader2 size={18} className="animate-spin" />
            Loading blood inventory...
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-[#F5EFE8] sm:h-28"
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5 min-[420px]:gap-3 sm:grid-cols-4">
            {bloodGroups.map((group) => (
              <div
                key={group}
                className="h-36 animate-pulse rounded-xl bg-[#F5EFE8] sm:h-44"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Inventory Summary */}

          {/* Inventory Summary */}
          <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[420px]:grid-cols-3 sm:gap-3">
            {summaryCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`min-w-0 rounded-xl p-3 shadow-sm sm:p-3.5 lg:p-4 ${item.style}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] ${
                          item.textStyle || "text-[#F2E2DC]"
                        }`}
                      >
                        {item.label}
                      </p>

                      <p
                        className={`mt-1 text-xl font-semibold leading-tight tabular-nums sm:text-2xl ${
                          item.textStyle || "text-white"
                        }`}
                      >
                        {item.value}
                      </p>

                      <p
                        className={`mt-0.5 text-[10px] leading-snug sm:text-[11px] ${item.subStyle}`}
                      >
                        {item.description}
                      </p>
                    </div>

                    <div
                      className={`shrink-0 rounded-lg p-2 ${item.iconStyle}`}
                    >
                      <Icon size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Blood Group Inventory */}
          <div className={`${cardStyle} min-w-0 p-3.5 sm:p-5 lg:p-6`}>
            <div className="mb-4 flex min-w-0 flex-col gap-2.5 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between sm:mb-5">
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-semibold text-[#302923] sm:text-xl">
                  Blood Group Availability
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#81756A] sm:text-sm">
                  Select a group to update its available units.
                </p>
              </div>

              <span className="w-fit shrink-0 rounded-lg bg-[#F2E2DC] px-2.5 py-1.5 text-[10px] font-semibold text-[#782B40] sm:px-3 sm:text-xs">
                8 Blood Groups
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 min-[420px]:gap-3 sm:grid-cols-4 sm:gap-4">
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
                    className={`relative flex min-w-0 flex-col items-center rounded-xl border px-2 py-3 text-center transition duration-200 sm:p-4 ${
                      selected
                        ? "border-[#963D54] bg-[#FFF8F8] ring-2 ring-[#F2E2DC]"
                        : "border-[#E8DDD4] bg-white hover:border-[#C99AA5] hover:bg-[#FFF9F7]"
                    }`}
                  >
                    <span
                      className={`absolute right-1.5 top-1.5 max-w-[calc(100%-12px)] truncate rounded-md px-1.5 py-1 text-[8px] font-semibold ring-1 sm:right-2 sm:top-2 sm:rounded-lg sm:px-2 sm:text-[9px] ${state.badge}`}
                    >
                      {state.label}
                    </span>

                    <svg
                      viewBox="0 0 24 30"
                      className="mt-6 h-11 w-9 sm:mt-7 sm:h-14 sm:w-11"
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

                    <p className="mt-1.5 text-xl font-semibold text-[#782B40] sm:mt-2 sm:text-2xl">
                      {group}
                    </p>

                    <p className="mt-1 text-xs text-[#81756A] sm:text-sm">
                      <span className="font-semibold text-[#302923]">
                        {count}
                      </span>{" "}
                      {count === 1 ? "unit" : "units"}
                    </p>

                    <span
                      className={`mt-2 text-[10px] font-semibold sm:mt-3 sm:text-xs ${
                        selected ? "text-[#782B40]" : "text-[#A45B6D]"
                      }`}
                    >
                      {selected ? "Selected" : "Select group"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stock Legend */}
            <div className="mt-4 flex flex-col gap-2 border-t border-[#EFE6DF] pt-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:gap-x-4 sm:mt-5 sm:gap-x-5 sm:gap-y-2 sm:pt-4">
              <div className="flex items-center gap-2 text-[11px] text-[#81756A] sm:text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#963D54]" />
                In stock ({LOW_STOCK_LIMIT}+ units)
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#81756A] sm:text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#B47A45]" />
                Low stock (1–{LOW_STOCK_LIMIT - 1} units)
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#81756A] sm:text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#D6C9C0]" />
                Out of stock (0 units)
              </div>
            </div>
          </div>

          {/* Update Inventory */}
          <form
            onSubmit={handleSubmit}
            className="w-full min-w-0 overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]"
          >
            <div className="flex min-w-0 flex-col gap-3 border-b border-[#EFE6DF] bg-gradient-to-r from-[#FFF8F8] to-[#F8F5EF] p-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:gap-4 sm:p-5 lg:p-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#A45B6D] sm:text-xs sm:tracking-[0.15em]">
                  Inventory Management
                </p>

                <h3 className="mt-1 font-serif text-lg font-semibold text-[#302923] sm:text-xl">
                  Update Blood Units
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-[#81756A] sm:text-sm">
                  Enter the latest available quantity for the selected group.
                </p>
              </div>

              <div className="flex w-fit max-w-full items-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-3 py-2 sm:px-4 sm:py-2.5">
                <Droplet size={15} className="shrink-0 text-[#963D54]" />

                <span className="text-xs font-semibold text-[#782B40] sm:text-sm">
                  {selectedGroup}
                </span>

                <span className="text-[11px] text-[#81756A] sm:text-xs">
                  · {currentSelectedUnits} available
                </span>
              </div>
            </div>

            <div className="min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-5 lg:p-6">
              {/* Blood Group Selection */}
              <div className="min-w-0">
                <span className={labelClass}>Blood Group</span>

                <div
                  role="radiogroup"
                  aria-label="Blood group"
                  className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-2.5"
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
                        className={`flex min-h-10 min-w-0 items-center justify-center rounded-lg border text-xs font-semibold transition sm:h-11 sm:rounded-xl sm:text-sm ${
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
              <div className="min-w-0">
                <label htmlFor="inventory-units" className={labelClass}>
                  Available Units
                </label>

                <div className="flex w-full max-w-md items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease units"
                    onClick={() => changeUnits(-1)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E8DDD4] bg-white text-[#782B40] transition hover:bg-[#F2E2DC] active:scale-95 sm:h-12 sm:w-12"
                  >
                    <Minus size={17} />
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
                    className="h-11 w-full min-w-0 rounded-xl border border-[#E8DDD4] bg-white px-2 text-center text-sm font-semibold text-[#302923] outline-none transition placeholder:text-xs placeholder:font-normal focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC] sm:h-12 sm:px-4 sm:text-base sm:placeholder:text-sm"
                  />

                  <button
                    type="button"
                    aria-label="Increase units"
                    onClick={() => changeUnits(1)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E8DDD4] bg-white text-[#782B40] transition hover:bg-[#F2E2DC] active:scale-95 sm:h-12 sm:w-12"
                  >
                    <Plus size={17} />
                  </button>
                </div>

                {/* Live Quantity Preview */}
                {hasNewValue && (
                  <div className="mt-3 flex min-w-0 flex-col gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFF9F7] px-3 py-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:mt-4 sm:px-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#81756A] sm:text-xs">
                      Quantity preview
                    </span>

                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-semibold text-[#782B40] sm:gap-2 sm:text-sm">
                      <span>{selectedGroup}</span>
                      <span className="text-[#81756A]">
                        {currentSelectedUnits}
                      </span>
                      <ArrowRight size={14} className="shrink-0" />
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
              <div className="flex min-w-0 flex-col gap-3 border-t border-[#EFE6DF] pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
                <p className="text-[11px] leading-relaxed text-[#81756A] sm:max-w-md sm:text-xs sm:leading-5">
                  Saving will replace the current available quantity for{" "}
                  <span className="font-semibold text-[#782B40]">
                    {selectedGroup}
                  </span>
                  .
                </p>

                <button
                  type="submit"
                  disabled={saving || !hasNewValue}
                  className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#782B40] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#612235] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-7 sm:py-3 sm:text-sm"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
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
