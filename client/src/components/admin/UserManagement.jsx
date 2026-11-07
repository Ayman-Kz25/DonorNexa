
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Ban,
  Unlock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

function UserManagement() {
  const { request } = useApi();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

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
        },
      });

      setUsers(response.data.users || []);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(
        err.response?.data?.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, [request, page, appliedSearch, role]);

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
          item._id === user._id
            ? { ...item, isActive: !item.isActive }
            : item
        )
      );
    } catch (err) {
      console.error("Update user status error:", err);
      setError(
        err.response?.data?.message || "Unable to update user status."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-[#F3DCE3] bg-white p-5 shadow-sm sm:p-7">
      {/* Section Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#29232A]">
            <Users size={22} className="text-[#BE4565]" />
            User Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View, search, and manage registered accounts.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-[#EAC5D0] px-4 py-2 text-sm font-medium text-[#96334F] transition hover:bg-[#FCE7ED] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#BE4565] focus:ring-2 focus:ring-[#FCE7ED]"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-[#BE4565] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#96334F]"
          >
            Search
          </button>
        </form>

        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#BE4565]"
        >
          <option value="">All Roles</option>
          <option value="donor">Donors</option>
          <option value="hospital">Hospitals</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* User Count */}
      <div className="mb-4 text-sm text-gray-500">
        Total registered users:{" "}
        <span className="font-semibold text-[#96334F]">
          {pagination.totalUsers || 0}
        </span>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#F3DCE3] bg-[#FFF8FA] text-gray-600">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-100 transition hover:bg-[#FFF8FA]"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#29232A]">
                      {user.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {user.email}
                    </p>
                  </td>

                  <td className="px-4 py-4 capitalize text-gray-600">
                    {user.role}
                  </td>

                  <td className="px-4 py-4 text-gray-500">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        user.isActive
                          ? "bg-rose-50 text-[#96334F]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.isActive ? "Active" : "Blocked"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    {user.role === "admin" ? (
                      <span className="text-xs text-gray-400">
                        Protected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user)}
                        disabled={processingId === user._id}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
                          user.isActive
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-[#FCE7ED] text-[#96334F] hover:bg-[#F7D5DF]"
                        }`}
                      >
                        {user.isActive ? (
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && pagination.totalUsers > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((previous) => previous - 1)}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-[#FFF8FA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => setPage((previous) => previous + 1)}
              disabled={page >= pagination.totalPages || loading}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-[#FFF8FA] disabled:cursor-not-allowed disabled:opacity-40"
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
