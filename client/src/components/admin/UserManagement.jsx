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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0ECE6] px-3 py-1 text-xs font-semibold text-[#81756A] ring-1 ring-[#E8DDD4]">
          <Building2 size={12} />
          Profile not found
        </span>
      );
    }

    if (user.hospital.verificationStatus !== "verified") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700 ring-1 ring-amber-200">
          <Building2 size={12} />
          {user.hospital.verificationStatus}
        </span>
      );
    }

    const inactive = user.hospital.isActive === false;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
          inactive
            ? "bg-[#F0ECE6] text-[#81756A] ring-[#E8DDD4]"
            : "bg-[#F2E2DC] text-[#87364D] ring-[#D8B9BE]"
        }`}
      >
        <Building2 size={12} />
        Hospital {inactive ? "inactive" : "active"}
      </span>
    );
  };

  const firstItem = pagination.totalUsers > 0 ? (page - 1) * 10 + 1 : 0;
  const lastItem = Math.min(page * 10, pagination.totalUsers || 0);

  return (
    <section className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 sm:p-7">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-[#EAE2DB] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#87364D]">
            <Users size={22} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl font-semibold text-[#302923]">
                User Management
              </h2>

              <span className="rounded-full bg-[#F2E2DC] px-2.5 py-1 text-xs font-semibold text-[#87364D]">
                {pagination.totalUsers || 0} users
              </span>
            </div>

            <p className="mt-1 text-sm text-[#81756A]">
              View, search, and manage registered accounts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading || pagination.totalUsers === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-semibold text-[#782B40] transition hover:border-[#D8B9BE] hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 space-y-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A45B6D]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
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

        {/* Role Filters */}
        <div
          role="tablist"
          aria-label="Filter by role"
          className="flex flex-wrap gap-2"
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
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? "bg-[#782B40] text-white"
                    : "border border-[#E8DDD4] bg-[#FFFDF9] text-[#71665F] hover:border-[#D8B9BE] hover:bg-[#F2E2DC] hover:text-[#782B40]"
                }`}
              >
                <Icon size={15} />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sorting */}
      <div className="flex flex-wrap justify-end mb-3 items-center gap-3">
        <label
          htmlFor="user-sort"
          className="text-sm font-semibold text-[#71665F]"
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
          className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm text-[#302923] outline-none transition focus:border-[#A45B6D] focus:ring-2 focus:ring-[#F2E2DC]"
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
          className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss message"
            className="rounded-lg p-1.5 transition hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Users */}
      <div className="space-y-3">
        {loading ? (
          <div role="status" aria-label="Loading users" className="space-y-3">
            <p className="flex items-center justify-center gap-3 py-3 text-sm font-medium text-[#87364D]">
              <Loader2 size={18} className="animate-spin" />
              Loading users...
            </p>

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl border border-[#E8DDD4] bg-[#F8F5EF]"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8C3B5] bg-[#F8F5EF] px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F2E2DC] text-[#87364D]">
              <Users size={28} />
            </div>

            <h3 className="mt-4 font-serif text-xl font-semibold text-[#302923]">
              No users found
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-[#81756A]">
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
                className={`relative overflow-hidden rounded-xl border p-4 pl-5 transition sm:p-5 sm:pl-6 ${
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

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Identity */}
                  <div className="flex min-w-0 items-center gap-3 lg:w-[34%]">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-semibold uppercase ${
                        blocked
                          ? "from-[#EEE9E2] to-[#DED5CA] text-[#81756A]"
                          : roleStyle.avatar
                      }`}
                    >
                      {user.name?.charAt(0) || "?"}
                    </span>

                    <div className="min-w-0">
                      <p
                        className={`truncate font-semibold ${
                          blocked ? "text-[#81756A]" : "text-[#302923]"
                        }`}
                      >
                        {user.name}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#81756A]">
                        <Mail size={12} className="shrink-0 text-[#A45B6D]" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status and Role */}
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${roleStyle.badge}`}
                    >
                      <RoleIcon size={12} />
                      {user.role}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
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

                    <span className="inline-flex items-center gap-1.5 text-xs text-[#81756A]">
                      <CalendarDays size={13} className="text-[#A45B6D]" />
                      Joined {formatDate(user.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#EEE9E2] px-3 py-2 text-xs font-semibold text-[#62564D] ring-1 ring-[#D8CEC2]">
                        <ShieldCheck size={14} />
                        Protected
                      </span>
                    ) : (
                      <button
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
                    )}

                    {user.role === "hospital" &&
                      user.hospital?.verificationStatus === "verified" && (
                        <button
                          onClick={() => handleHospitalStatusChange(user)}
                          disabled={processingHospitalId === user.hospital._id}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.hospital.isActive === false
                              ? "bg-[#F2E2DC] text-[#87364D] hover:bg-[#E8CDD0]"
                              : "border border-red-200 bg-[#FFFDF9] text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {processingHospitalId === user.hospital._id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Power size={14} />
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE2DB] pt-5">
          <div>
            <p className="text-sm font-semibold text-[#302923]">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <p className="mt-1 text-xs text-[#81756A]">
              Showing {firstItem}–{lastItem} of {pagination.totalUsers} users
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((previous) => previous - 1)}
              disabled={page <= 1 || loading}
              aria-label="Previous page"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] transition hover:border-[#D8B9BE] hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => setPage((previous) => previous + 1)}
              disabled={page >= pagination.totalPages || loading}
              aria-label="Next page"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] transition hover:border-[#D8B9BE] hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default UserManagement;
