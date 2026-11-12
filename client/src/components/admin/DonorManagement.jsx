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
    )
      return;

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

  const availableCount = donors.filter((user) => user.donor.isAvailable).length;

  const activeCount = donors.filter((user) => user.isActive).length;

  return (
    <section className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 sm:p-7">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-[#EAE2DB] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#87364D]">
            <Droplet size={22} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl font-semibold text-[#302923]">
                Donor Management
              </h2>

              <span className="rounded-full bg-[#F2E2DC] px-2.5 py-1 text-xs font-semibold text-[#87364D]">
                {pagination.totalUsers || 0} accounts
              </span>
            </div>

            <p className="mt-1 text-sm text-[#81756A]">
              View donor profiles, blood groups, and availability.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || pagination.totalUsers === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            onClick={fetchDonors}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] px-4 py-2.5 text-sm font-semibold text-[#782B40] transition hover:border-[#D8B9BE] hover:bg-[#F2E2DC] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics from current filtered page */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-4">
          <div className="flex items-center gap-2 text-[#81756A]">
            <Users size={17} />
            <span className="text-xs font-medium">Loaded donors</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#302923]">
            {loading ? "—" : donors.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-4">
          <div className="flex items-center gap-2 text-[#81756A]">
            <HeartPulse size={17} />
            <span className="text-xs font-medium">Available donors</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#87364D]">
            {loading ? "—" : availableCount}
          </p>
        </div>

        <div className="rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-4">
          <div className="flex items-center gap-2 text-[#81756A]">
            <Unlock size={17} />
            <span className="text-xs font-medium">Active accounts</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[#302923]">
            {loading ? "—" : activeCount}
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A45B6D]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search donor by name or email..."
              className="w-full rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] py-3 pl-11 pr-4 text-sm text-[#302923] outline-none transition placeholder:text-[#A3978C] focus:border-[#A45B6D] focus:bg-white focus:ring-2 focus:ring-[#F2E2DC]"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#782B40] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#963D54]"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#71665F]">
              Blood Group
            </label>

            <select
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-3 text-sm text-[#302923] outline-none focus:border-[#A45B6D]"
            >
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-[#71665F]">
              Availability
            </label>

            <select
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-3 text-sm text-[#302923] outline-none focus:border-[#A45B6D]"
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
          className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Donor list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm font-medium text-[#87364D]">
            <Loader2 size={19} className="animate-spin" />
            Loading donors...
          </div>
        ) : donors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8C3B5] bg-[#F8F5EF] px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F2E2DC] text-[#87364D]">
              <Droplet size={28} />
            </div>

            <h3 className="mt-4 font-serif text-xl font-semibold text-[#302923]">
              No donors found
            </h3>

            <p className="mt-2 text-sm text-[#81756A]">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          donors.map((user) => {
            const donor = user.donor;

            return (
              <article
                key={user._id}
                className="relative overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 pl-5 transition hover:border-[#D8B9BE] sm:p-5 sm:pl-6"
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${
                    user.isActive ? "bg-[#963D54]" : "bg-[#C9BFB5]"
                  }`}
                />

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Donor identity */}
                  <div className="flex min-w-0 items-center gap-3 lg:w-[32%]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F2E2DC] text-lg font-semibold uppercase text-[#87364D]">
                      {user.name?.charAt(0) || "?"}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-[#302923]">
                        {user.name || "Unnamed donor"}
                      </h3>

                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#81756A]">
                        <Mail size={12} className="shrink-0 text-[#A45B6D]" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Donor details */}
                  <div className="flex flex-1 flex-wrap gap-x-5 gap-y-3">
                    <div>
                      <p className="text-[11px] font-medium text-[#A3978C]">
                        Blood Group
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#F2E2DC] px-3 py-1 text-xs font-bold text-[#87364D]">
                        <Droplet size={12} />
                        {donor.bloodGroup || "—"}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-[#A3978C]">
                        City
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#51463F]">
                        <MapPin size={13} className="text-[#A45B6D]" />
                        {donor.city || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-[#A3978C]">
                        Weight
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#51463F]">
                        <Weight size={13} className="text-[#A45B6D]" />
                        {donor.weight ? `${donor.weight} kg` : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-[#A3978C]">
                        Total Donations
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#51463F]">
                        {donor.totalDonations ?? 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-[#A3978C]">
                        Joined
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#51463F]">
                        <CalendarDays size={13} className="text-[#A45B6D]" />
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Status and action */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                        donor.isAvailable
                          ? "bg-[#F2E2DC] text-[#87364D] ring-[#D8B9BE]"
                          : "bg-[#F0ECE6] text-[#81756A] ring-[#E8DDD4]"
                      }`}
                    >
                      {donor.isAvailable ? "Available" : "Unavailable"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
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
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        user.isActive
                          ? "border border-red-200 bg-[#FFFDF9] text-red-600 hover:bg-red-50"
                          : "bg-[#782B40] text-white hover:bg-[#963D54]"
                      }`}
                    >
                      {processingId === user._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : user.isActive ? (
                        <Ban size={14} />
                      ) : (
                        <Unlock size={14} />
                      )}

                      {processingId === user._id
                        ? "Processing..."
                        : user.isActive
                          ? "Block"
                          : "Unblock"}
                    </button>
                  </div>
                </div>

                {donor.lastDonationDate && (
                  <p className="mt-4 border-t border-[#EAE2DB] pt-3 text-xs text-[#81756A]">
                    Last donation:{" "}
                    {new Date(donor.lastDonationDate).toLocaleDateString()}
                    {donor.eligibleAgainDate && (
                      <>
                        {" · "}Eligible again:{" "}
                        {new Date(donor.eligibleAgainDate).toLocaleDateString()}
                      </>
                    )}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalUsers > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE2DB] pt-5">
          <div>
            <p className="text-sm font-semibold text-[#302923]">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <p className="mt-1 text-xs text-[#81756A]">
              Showing {firstItem}–{lastItem} of {pagination.totalUsers} donor
              accounts
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((previous) => previous - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8DDD4] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => setPage((previous) => previous + 1)}
              disabled={page >= pagination.totalPages}
              aria-label="Next page"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8DDD4] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
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
