import { useEffect, useState } from "react";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

function AuditLogs() {
  const { request } = useApi();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await request({
        method: "GET",
        url: "/api/admin/audit-logs",
        params: {
          page,
          limit: 10,
          action,
        },
      });

      setLogs(response.data.logs || []);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const actionColors = {
    USER_BLOCKED: "bg-red-50 text-red-600",
    USER_UNBLOCKED: "bg-green-50 text-green-700",
    CITY_ADDED: "bg-rose-50 text-[#BE4565]",
    CITY_ACTIVATED: "bg-green-50 text-green-700",
    CITY_DEACTIVATED: "bg-orange-50 text-orange-700",
    HOSPITAL_APPROVED: "bg-green-50 text-green-700",
    HOSPITAL_REJECTED: "bg-red-50 text-red-600",
  };

  return (
    <section className="mt-8 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="text-[#BE4565]" size={22} />
            <h2 className="text-xl font-semibold text-[#29232A]">Audit Logs</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Track administrative activities on DonorNexa.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm text-[#BE4565] transition hover:bg-rose-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-[#29232A]">
          Filter by action
        </label>

        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-rose-100 bg-white px-3 py-2 text-sm outline-none focus:border-[#BE4565] sm:w-64"
        >
          <option value="">All actions</option>
          <option value="USER_BLOCKED">User blocked</option>
          <option value="USER_UNBLOCKED">User unblocked</option>
          <option value="CITY_ADDED">City added</option>
          <option value="CITY_ACTIVATED">City activated</option>
          <option value="CITY_DEACTIVATED">City deactivated</option>
          <option value="HOSPITAL_APPROVED">Hospital approved</option>
          <option value="HOSPITAL_REJECTED">Hospital rejected</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Loading audit logs...
        </p>
      ) : logs.length === 0 ? (
        <div className="py-10 text-center">
          <ClipboardList size={35} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No audit logs found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-rose-100 text-gray-500">
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                          actionColors[log.action] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {log.action.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[#29232A]">
                      {log.description}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {log.admin?.name || "Unknown"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Total logs: {pagination.totalLogs}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-rose-200 p-2 text-[#BE4565] disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= pagination.totalPages || loading}
                className="rounded-lg border border-rose-200 p-2 text-[#BE4565] disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default AuditLogs;
