import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Ban,
  Unlock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  Droplet,
  Building2,
  ShieldCheck,
  CalendarDays,
  Mail,
  AlertCircle,
  Loader2,
  X,
  Power,
  Download,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { formatDate } from "../../utils/dateTime";

const ROLE_FILTERS = [
  { value: "", label: "All", icon: Users },
  { value: "donor", label: "Donors", icon: Droplet },
  { value: "hospital", label: "Hospitals", icon: Building2 },
  { value: "admin", label: "Admins", icon: ShieldCheck },
];

const ROLE_STYLES = {
  donor: {
    icon: Droplet,
    badge: "bg-[#F2E2DC] text-[#87364D] ring-[#D8B9BE]",
    avatar: "from-[#F2E2DC] to-[#E8CDD0] text-[#87364D]",
  },
  hospital: {
    icon: Building2,
    badge: "bg-[#F5EDE5] text-[#80634E] ring-[#E5D5C5]",
    avatar: "from-[#F5EDE5] to-[#EADCCE] text-[#80634E]",
  },
  admin: {
    icon: ShieldCheck,
    badge: "bg-[#EEE9E2] text-[#62564D] ring-[#D8CEC2]",
    avatar: "from-[#EEE9E2] to-[#DED5CA] text-[#62564D]",
  },
};

function UserManagement() {
  const { request } = useApi();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [role, setRole] = useState("");
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
  const [sortBy, setSortBy] = useState("newest");
  const [processingHospitalId, setProcessingHospitalId] = useState(null);

  const fetchUsers = useCallback(async () => {
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
          role,
          sortBy,
        },
      });

      setUsers(response.data.users || []);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [request, page, appliedSearch, role, sortBy]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/users/export",
        params: {
          search: appliedSearch,
          role,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.setAttribute("download", "donornexa-users.csv");

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError("Unable to export users. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleRoleChange = (value) => {
    setRole(value);
    setPage(1);
  };

  const handleStatusChange = async (user) => {
    try {
      setProcessingId(user._id);
      setError("");

      await request({
        method: "PATCH",
        url: `/api/admin/users/${user._id}/status`,
        data: {
          isActive: !user.isActive,
        },
      });

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item._id === user._id ? { ...item, isActive: !item.isActive } : item,
        ),
      );
    } catch (err) {
      console.error("Update user status error:", err);
      setError(err.response?.data?.message || "Unable to update user status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleHospitalStatusChange = async (user) => {
    const hospital = user.hospital;

    if (!hospital?._id) return;

    const isActive = hospital.isActive === false;
    let reason = "";

    if (isActive) {
      reason = window.prompt(
        "Enter the reason for deactivating this hospital:",
      );

      if (!reason?.trim()) return;
    }

    try {
      setProcessingHospitalId(hospital._id);
      setError("");

      await request({
        method: "PATCH",
        url: `/api/admin/hospitals/${hospital._id}/status`,
        data: {
          isActive,
          ...(isActive ? {} : { reason: reason.trim() }),
        },
      });

      await fetchUsers();
    } catch (err) {
      console.error("Update hospital status error:", err);
      setError(
        err.response?.data?.message || "Unable to update hospital status.",
      );
    } finally {
      setProcessingHospitalId(null);
    }
  };

  const renderHospitalStatus = (user) => {
    if (user.role !== "hospital") return null;

    if (!user.hospital) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0ECE6] px-2 py-1 text-[10px] font-semibold text-[#81756A] ring-1 ring-[#E8DDD4] sm:gap-1.5 sm:px-3 sm:text-xs">
          <Building2 size={11} />
          Profile not found
        </span>
      );
    }

    if (user.hospital.verificationStatus !== "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold capitalize text-amber-700 ring-1 ring-amber-200 sm:gap-1.5 sm:px-3 sm:text-xs">
          <Building2 size={11} />
          {user.hospital.verificationStatus}
        </span>
      );
    }

    const inactive = user.hospital.isActive === false;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 sm:gap-1.5 sm:px-3 sm:text-xs ${
          inactive
            ? "bg-[#F0ECE6] text-[#81756A] ring-[#E8DDD4]"
            : "bg-[#F2E2DC] text-[#87364D] ring-[#D8B9BE]"
        }`}
      >
        <Building2 size={11} />
        Hospital {inactive ? "inactive" : "active"}
      </span>
    );
  };

  const firstItem = pagination.totalUsers > 0 ? (page - 1) * 10 + 1 : 0;
  const lastItem = Math.min(page * 10, pagination.totalUsers || 0);

  return (
    <section className="min-w-0 w-full rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 min-[400px]:p-3.5 sm:rounded-2xl sm:p-5 lg:p-6">
      {/* Header */}
      <div className="mb-4 flex min-w-0 flex-col gap-3 border-b border-[#EAE2DB] pb-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#87364D] sm:h-11 sm:w-11 sm:rounded-xl">
            <Users size={18} className="sm:hidden" />
            <Users size={22} className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="font-serif text-base font-semibold text-[#302923] min-[400px]:text-lg sm:text-2xl">
                User Management
              </h2>

              <span className="rounded-full bg-[#F2E2DC] px-2 py-0.5 text-[10px] font-semibold text-[#87364D] sm:px-2.5 sm:py-1 sm:text-xs">
                {pagination.totalUsers || 0} users
              </span>
            </div>

            <p className="mt-0.5 text-[10px] leading-4 text-[#81756A] min-[400px]:text-[11px] sm:mt-1 sm:text-sm">
              View, search, and manage registered accounts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading || pagination.totalUsers === 0}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#782B40] px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {exporting ? (
              <Loader2 size={13} className="shrink-0 animate-spin" />
            ) : (
              <Download size={13} className="shrink-0" />
            )}
            <span className="truncate">
              {exporting ? "Exporting..." : "Export CSV"}
            </span>
          </button>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-2.5 py-2 text-[11px] font-semibold text-[#782B40] transition hover:border-[#D8B9BE] hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <RefreshCw
              size={13}
              className={`shrink-0 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
        <form
          onSubmit={handleSearch}
          className="flex min-w-0 flex-col gap-2 sm:flex-row"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A45B6D] sm:left-4 sm:size-[17px]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] py-2.5 pl-9 pr-3 text-xs text-[#302923] outline-none transition placeholder:text-[#A3978C] focus:border-[#A45B6D] focus:bg-white focus:ring-2 focus:ring-[#F2E2DC] sm:rounded-xl sm:py-3 sm:pl-11 sm:pr-4 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-[#782B40] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#963D54] sm:rounded-xl sm:px-6 sm:py-3 sm:text-sm"
          >
            Search
          </button>
        </form>

        <div
          role="tablist"
          aria-label="Filter by role"
          className="grid grid-cols-2 gap-2 min-[480px]:flex min-[480px]:flex-wrap"
        >
          {ROLE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const selected = role === filter.value;

            return (
              <button
                key={filter.label}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleRoleChange(filter.value)}
                className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${
                  selected
                    ? "bg-[#782B40] text-white"
                    : "border border-[#E8DDD4] bg-[#FFFDF9] text-[#71665F] hover:border-[#D8B9BE] hover:bg-[#F2E2DC] hover:text-[#782B40]"
                }`}
              >
                <Icon size={13} className="shrink-0 sm:size-[15px]" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sorting */}
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <label
          htmlFor="user-sort"
          className="text-[11px] font-semibold text-[#71665F] sm:text-sm"
        >
          Sort by:
        </label>

        <select
          id="user-sort"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="max-w-full rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-2.5 py-2 text-[11px] text-[#302923] outline-none transition focus:border-[#A45B6D] focus:ring-2 focus:ring-[#F2E2DC] sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
        >
          <option value="newest">Newest joined</option>
          <option value="oldest">Oldest joined</option>
          <option value="name_asc">Name (A–Z)</option>
          <option value="name_desc">Name (Z–A)</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex min-w-0 items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 sm:mb-5 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 sm:size-[18px]" />
          <span className="min-w-0 flex-1 break-words">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss message"
            className="shrink-0 rounded-lg p-1 transition hover:bg-white sm:p-1.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Users */}
      <div className="min-w-0 space-y-2.5 sm:space-y-3">
        {loading ? (
          <div role="status" aria-label="Loading users" className="space-y-3">
            <p className="flex items-center justify-center gap-2 py-3 text-xs font-medium text-[#87364D] sm:gap-3 sm:text-sm">
              <Loader2 size={16} className="animate-spin sm:size-[18px]" />
              Loading users...
            </p>

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] sm:h-24 sm:rounded-xl"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#D8C3B5] bg-[#F8F5EF] px-3 py-9 text-center sm:rounded-xl sm:px-5 sm:py-14">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F2E2DC] text-[#87364D] sm:h-16 sm:w-16">
              <Users size={22} className="sm:size-7" />
            </div>

            <h3 className="mt-3 font-serif text-lg font-semibold text-[#302923] sm:mt-4 sm:text-xl">
              No users found
            </h3>

            <p className="mx-auto mt-1.5 max-w-sm text-xs text-[#81756A] sm:mt-2 sm:text-sm">
              Try a different search or role filter.
            </p>
          </div>
        ) : (
          users.map((user) => {
            const roleStyle = ROLE_STYLES[user.role] || ROLE_STYLES.donor;
            const RoleIcon = roleStyle.icon;
            const blocked = !user.isActive;

            return (
              <article
                key={user._id}
                className={`relative min-w-0 overflow-hidden rounded-lg border p-3 pl-4 transition min-[400px]:p-3.5 min-[400px]:pl-4.5 sm:rounded-xl sm:p-5 sm:pl-6 ${
                  blocked
                    ? "border-[#E8DDD4] bg-[#F8F5EF]"
                    : "border-[#E8DDD4] bg-[#FFFDF9] hover:border-[#D8B9BE]"
                }`}
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${
                    blocked ? "bg-[#C9BFB5]" : "bg-[#963D54]"
                  }`}
                />

                <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Identity */}
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 lg:w-[34%]">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold uppercase min-[400px]:h-10 min-[400px]:w-10 sm:h-12 sm:w-12 sm:text-lg ${
                        blocked
                          ? "from-[#EEE9E2] to-[#DED5CA] text-[#81756A]"
                          : roleStyle.avatar
                      }`}
                    >
                      {user.name?.charAt(0) || "?"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-semibold min-[400px]:text-sm sm:text-base ${
                          blocked ? "text-[#81756A]" : "text-[#302923]"
                        }`}
                      >
                        {user.name}
                      </p>

                      <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[10px] text-[#81756A] sm:gap-1.5 sm:text-xs">
                        <Mail
                          size={11}
                          className="shrink-0 text-[#A45B6D] sm:size-3"
                        />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status and Role */}
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ring-1 sm:gap-1.5 sm:px-3 sm:text-xs ${roleStyle.badge}`}
                    >
                      <RoleIcon size={11} />
                      {user.role}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 sm:gap-1.5 sm:px-3 sm:text-xs ${
                        user.isActive
                          ? "bg-[#F2E2DC] text-[#87364D] ring-[#D8B9BE]"
                          : "bg-[#F0ECE6] text-[#81756A] ring-[#E8DDD4]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.isActive ? "bg-[#963D54]" : "bg-[#A3978C]"
                        }`}
                      />
                      {user.isActive ? "Active" : "Blocked"}
                    </span>

                    {renderHospitalStatus(user)}

                    <span className="inline-flex items-center gap-1 text-[10px] text-[#81756A] sm:gap-1.5 sm:text-xs">
                      <CalendarDays
                        size={11}
                        className="shrink-0 text-[#A45B6D] sm:size-[13px]"
                      />
                      Joined {formatDate(user.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2 lg:justify-end">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#EEE9E2] px-2.5 py-1.5 text-[10px] font-semibold text-[#62564D] ring-1 ring-[#D8CEC2] sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
                        <ShieldCheck size={12} />
                        Protected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user)}
                        disabled={processingId === user._id}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-xs ${
                          user.isActive
                            ? "border border-red-200 bg-[#FFFDF9] text-red-600 hover:bg-red-50"
                            : "bg-[#782B40] text-white hover:bg-[#963D54]"
                        }`}
                      >
                        {processingId === user._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : user.isActive ? (
                          <Ban size={12} />
                        ) : (
                          <Unlock size={12} />
                        )}

                        {processingId === user._id
                          ? "Processing..."
                          : user.isActive
                            ? "Block"
                            : "Unblock"}
                      </button>
                    )}

                    {user.role === "hospital" &&
                      user.hospital?.verificationStatus === "verified" && (
                        <button
                          onClick={() => handleHospitalStatusChange(user)}
                          disabled={processingHospitalId === user.hospital._id}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-xs ${
                            user.hospital.isActive === false
                              ? "bg-[#F2E2DC] text-[#87364D] hover:bg-[#E8CDD0]"
                              : "border border-red-200 bg-[#FFFDF9] text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {processingHospitalId === user.hospital._id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Power size={12} />
                          )}

                          {processingHospitalId === user.hospital._id
                            ? "Processing..."
                            : user.hospital.isActive === false
                              ? "Activate Hospital"
                              : "Deactivate Hospital"}
                        </button>
                      )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalUsers > 0 && (
        <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE2DB] pt-4 sm:mt-6 sm:pt-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#302923] sm:text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <p className="mt-1 text-[10px] text-[#81756A] sm:text-xs">
              Showing {firstItem}–{lastItem} of {pagination.totalUsers} users
            </p>
          </div>

          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <button
              onClick={() => setPage((previous) => previous - 1)}
              disabled={page <= 1 || loading}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] transition hover:border-[#D8B9BE] hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl"
            >
              <ChevronLeft size={16} className="sm:size-[18px]" />
            </button>

            <button
              onClick={() => setPage((previous) => previous + 1)}
              disabled={page >= pagination.totalPages || loading}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] transition hover:border-[#D8B9BE] hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:rounded-xl"
            >
              <ChevronRight size={16} className="sm:size-[18px]" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default UserManagement;
