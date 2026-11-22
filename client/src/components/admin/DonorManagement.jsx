
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Droplet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  CalendarDays,
  Weight,
  HeartPulse,
  Ban,
  Unlock,
  AlertCircle,
  Loader2,
  X,
  Users,
  Download,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/dateTime";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DonorManagement = () => {
  const { request } = useApi();

  const [donors, setDonors] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [availability, setAvailability] = useState("all");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/users",
        params: {
          page,
          limit: 10,
          search: appliedSearch,
          role: "donor",
        },
      });

      let donorUsers = (response.data.users || []).filter(
        (user) => user.role === "donor" && user.donor,
      );

      if (bloodGroup) {
        donorUsers = donorUsers.filter(
          (user) => user.donor.bloodGroup === bloodGroup,
        );
      }

      if (availability === "available") {
        donorUsers = donorUsers.filter(
          (user) => user.donor.isAvailable === true,
        );
      } else if (availability === "unavailable") {
        donorUsers = donorUsers.filter(
          (user) => user.donor.isAvailable === false,
        );
      }

      setDonors(donorUsers);
      setPagination(
        response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 0,
        },
      );
    } catch (err) {
      console.error("Fetch donors error:", err);
      setError(err.response?.data?.message || "Unable to load donors.");
    } finally {
      setLoading(false);
    }
  }, [request, page, appliedSearch, bloodGroup, availability]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/donors/export",
        params: {
          search: appliedSearch,
          bloodGroup,
          availability,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = fileUrl;
      link.download = "donornexa-donors.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Export donors error:", err);
      setError("Unable to export donor records.");
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleStatusChange = async (user) => {
    const isActive = !user.isActive;

    if (
      !window.confirm(
        `Are you sure you want to ${isActive ? "unblock" : "block"} this donor account?`,
      )
    ) {
      return;
    }

    try {
      setProcessingId(user._id);
      setError("");

      await request({
        method: "PATCH",
        url: `/api/admin/users/${user._id}/status`,
        data: { isActive },
      });

      setDonors((previous) =>
        previous.map((item) =>
          item._id === user._id ? { ...item, isActive } : item,
        ),
      );
    } catch (err) {
      console.error("Update donor status error:", err);
      setError(err.response?.data?.message || "Unable to update donor status.");
    } finally {
      setProcessingId(null);
    }
  };

  const firstItem = pagination.totalUsers > 0 ? (page - 1) * 10 + 1 : 0;
  const lastItem = Math.min(page * 10, pagination.totalUsers || 0);

  const availableCount = donors.filter(
    (user) => user.donor.isAvailable,
  ).length;

  const activeCount = donors.filter((user) => user.isActive).length;

  return (
    <section className="min-w-0 w-full space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-5 lg:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#87364D] sm:h-12 sm:w-12">
            <Droplet size={21} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-lg font-semibold text-[#302923] sm:text-xl lg:text-2xl">
                Donor Management
              </h2>
              <span className="rounded-full bg-[#F2E2DC] px-2.5 py-1 text-[10px] font-semibold text-[#87364D] sm:text-xs">
                {pagination.totalUsers || 0} accounts
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-sm">
              Manage donor profiles, availability, and account status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting || pagination.totalUsers === 0}
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg bg-[#782B40] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            {exporting ? (
              <Loader2 size={15} className="shrink-0 animate-spin" />
            ) : (
              <Download size={15} className="shrink-0" />
            )}
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>

          <button
            type="button"
            onClick={fetchDonors}
            disabled={loading}
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-2.5 text-xs font-semibold text-[#782B40] transition hover:border-[#D8B9BE] hover:bg-[#F8F5EF] disabled:opacity-50 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            <RefreshCw
              size={15}
              className={`shrink-0 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:gap-4">
        <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:p-4">
          <div className="flex items-center gap-2 text-[#81756A]">
            <Users size={16} className="shrink-0" />
            <span className="text-[11px] font-medium sm:text-xs">
              Loaded donors
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold text-[#302923] sm:text-2xl">
            {loading ? "—" : donors.length}
          </p>
          <p className="mt-0.5 text-[10px] text-[#A3978C] sm:text-xs">
            Current page
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:p-4">
          <div className="flex items-center gap-2 text-[#81756A]">
            <HeartPulse size={16} className="shrink-0" />
            <span className="text-[11px] font-medium sm:text-xs">
              Available donors
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold text-[#87364D] sm:text-2xl">
            {loading ? "—" : availableCount}
          </p>
          <p className="mt-0.5 text-[10px] text-[#A3978C] sm:text-xs">
            Ready to donate
          </p>
        </div>

        <div className="col-span-2 min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:col-span-1 sm:p-4">
          <div className="flex items-center gap-2 text-[#81756A]">
            <Unlock size={16} className="shrink-0" />
            <span className="text-[11px] font-medium sm:text-xs">
              Active accounts
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold text-[#302923] sm:text-2xl">
            {loading ? "—" : activeCount}
          </p>
          <p className="mt-0.5 text-[10px] text-[#A3978C] sm:text-xs">
            On current page
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:rounded-2xl sm:p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#302923] sm:text-base">
            Find donors
          </h3>
          <p className="mt-1 text-[11px] text-[#81756A] sm:text-xs">
            Search by name or email, or narrow the results using filters.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex min-w-0 flex-col gap-2 sm:flex-row"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A45B6D]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search donor by name or email..."
              className="w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] py-2.5 pl-10 pr-3 text-xs text-[#302923] outline-none transition placeholder:text-[#A3978C] focus:border-[#A45B6D] focus:bg-white focus:ring-2 focus:ring-[#F2E2DC] sm:rounded-xl sm:py-3 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#782B40] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#963D54] sm:rounded-xl sm:px-6 sm:py-3 sm:text-sm"
          >
            <Search size={14} />
            Search
          </button>
        </form>

        <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor="donor-blood-group"
              className="mb-1.5 block text-[11px] font-semibold text-[#71665F] sm:text-xs"
            >
              Blood Group
            </label>
            <select
              id="donor-blood-group"
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
              className="w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] px-3 py-2.5 text-xs text-[#302923] outline-none focus:border-[#A45B6D] sm:rounded-xl sm:py-3 sm:text-sm"
            >
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="donor-availability"
              className="mb-1.5 block text-[11px] font-semibold text-[#71665F] sm:text-xs"
            >
              Availability
            </label>
            <select
              id="donor-availability"
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setPage(1);
              }}
              className="w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] px-3 py-2.5 text-xs text-[#302923] outline-none focus:border-[#A45B6D] sm:rounded-xl sm:py-3 sm:text-sm"
            >
              <option value="all">All Donors</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700 sm:px-4 sm:text-sm"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1 break-words">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss message"
            className="shrink-0 rounded-md p-0.5 transition hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Donor list */}
      <div className="min-w-0 space-y-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#302923] sm:text-base">
              Donor Records
            </h3>
            <p className="mt-0.5 text-[11px] text-[#81756A] sm:text-xs">
              {pagination.totalUsers} donor accounts found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] py-12 text-xs font-medium text-[#87364D] sm:py-16 sm:text-sm">
            <Loader2 size={18} className="animate-spin" />
            Loading donors...
          </div>
        ) : donors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8C3B5] bg-[#FFFDF9] px-3 py-10 text-center sm:py-14">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F2E2DC] text-[#87364D] sm:h-14 sm:w-14">
              <Droplet size={24} />
            </div>
            <h3 className="mt-3 font-serif text-lg font-semibold text-[#302923] sm:text-xl">
              No donors found
            </h3>
            <p className="mt-1.5 text-xs text-[#81756A] sm:text-sm">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          donors.map((user) => {
            const donor = user.donor;

            return (
              <article
                key={user._id}
                className="relative min-w-0 overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] transition hover:border-[#D8B9BE]"
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${
                    user.isActive ? "bg-[#963D54]" : "bg-[#C9BFB5]"
                  }`}
                />

                <div className="min-w-0 p-3.5 pl-4 sm:p-5 sm:pl-6">
                  {/* Profile header */}
                  <div className="flex min-w-0 flex-col gap-3 border-b border-[#EAE2DB] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2E2DC] text-base font-semibold uppercase text-[#87364D] sm:h-12 sm:w-12 sm:text-lg">
                        {user.name?.charAt(0) || "?"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="break-words text-sm font-semibold text-[#302923] sm:text-base">
                          {user.name || "Unnamed donor"}
                        </h4>
                        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-[#81756A] sm:text-xs">
                          <Mail
                            size={13}
                            className="shrink-0 text-[#A45B6D]"
                          />
                          <span className="min-w-0 break-all">
                            {user.email || "No email"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 sm:text-xs ${
                          donor.isAvailable
                            ? "bg-[#F2E2DC] text-[#87364D] ring-[#D8B9BE]"
                            : "bg-[#F0ECE6] text-[#81756A] ring-[#E8DDD4]"
                        }`}
                      >
                        {donor.isAvailable ? "Available" : "Unavailable"}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 sm:text-xs ${
                          user.isActive
                            ? "bg-[#F2E2DC] text-[#87364D] ring-[#D8B9BE]"
                            : "bg-[#F0ECE6] text-[#81756A] ring-[#E8DDD4]"
                        }`}
                      >
                        {user.isActive ? "Active" : "Blocked"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(user)}
                        disabled={processingId === user._id}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-xs ${
                          user.isActive
                            ? "border border-red-200 bg-[#FFFDF9] text-red-600 hover:bg-red-50"
                            : "bg-[#782B40] text-white hover:bg-[#963D54]"
                        }`}
                      >
                        {processingId === user._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : user.isActive ? (
                          <Ban size={13} />
                        ) : (
                          <Unlock size={13} />
                        )}
                        {processingId === user._id
                          ? "Processing..."
                          : user.isActive
                            ? "Block Account"
                            : "Unblock Account"}
                      </button>
                    </div>
                  </div>

                  {/* Donor information */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-4 py-4 min-[480px]:grid-cols-3 sm:gap-x-5 sm:gap-y-5 lg:grid-cols-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-[#A3978C] sm:text-[11px]">
                        Blood Group
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#F2E2DC] px-2.5 py-1 text-[10px] font-bold text-[#87364D] sm:text-xs">
                        <Droplet size={12} />
                        {donor.bloodGroup || "—"}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-[#A3978C] sm:text-[11px]">
                        City
                      </p>
                      <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs font-medium text-[#51463F] sm:text-sm">
                        <MapPin
                          size={13}
                          className="shrink-0 text-[#A45B6D]"
                        />
                        <span className="break-words">
                          {donor.city || "—"}
                        </span>
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-[#A3978C] sm:text-[11px]">
                        Weight
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#51463F] sm:text-sm">
                        <Weight
                          size={13}
                          className="shrink-0 text-[#A45B6D]"
                        />
                        {donor.weight ? `${donor.weight} kg` : "—"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-[#A3978C] sm:text-[11px]">
                        Total Donations
                      </p>
                      <p className="mt-1.5 text-xs font-semibold text-[#51463F] sm:text-sm">
                        {donor.totalDonations ?? 0}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-[#A3978C] sm:text-[11px]">
                        Joined
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#51463F] sm:text-sm">
                        <CalendarDays
                          size={13}
                          className="shrink-0 text-[#A45B6D]"
                        />
                        <span>{formatDate(user.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Donation history */}
                  {(donor.lastDonationDate || donor.eligibleAgainDate) && (
                    <div className="flex min-w-0 flex-col gap-2 border-t border-[#EAE2DB] pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                      {donor.lastDonationDate && (
                        <p className="flex min-w-0 items-center gap-1.5 text-[10px] text-[#81756A] sm:text-xs">
                          <HeartPulse
                            size={13}
                            className="shrink-0 text-[#A45B6D]"
                          />
                          <span>
                            <span className="font-semibold text-[#51463F]">
                              Last Donation:
                            </span>{" "}
                            {formatDate(donor.lastDonationDate)}
                          </span>
                        </p>
                      )}

                      {donor.eligibleAgainDate && (
                        <p className="flex min-w-0 items-center gap-1.5 text-[10px] text-[#81756A] sm:text-xs">
                          <CalendarDays
                            size={13}
                            className="shrink-0 text-[#A45B6D]"
                          />
                          <span>
                            <span className="font-semibold text-[#51463F]">
                              Eligible Again:
                            </span>{" "}
                            {formatDate(donor.eligibleAgainDate)}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalUsers > 0 && (
        <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#302923] sm:text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <p className="mt-1 text-[10px] text-[#81756A] sm:text-xs">
              Showing {firstItem}–{lastItem} of {pagination.totalUsers} donor
              accounts
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage((previous) => previous - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8DDD4] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => setPage((previous) => previous + 1)}
              disabled={page >= pagination.totalPages}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8DDD4] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default DonorManagement;
