import { useEffect, useState } from "react";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Download,
  Loader2,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { formatDateTime } from "../../utils/dateTime";

function AuditLogs() {
  const { request } = useApi();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
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
      setPagination(
        response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalLogs: 0,
        },
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/audit-logs/export",
        params: { action },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.setAttribute("download", "donornexa-audit-logs.csv");

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError("Unable to export audit logs. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action]);

  const isSystemAction = (log) => log.action?.startsWith("AUTO_");

  const actionColors = {
    USER_BLOCKED: "bg-red-50 text-red-700",
    USER_UNBLOCKED: "bg-[#F2E2DC] text-[#782B40]",

    CITY_ADDED: "bg-[#F2E2DC] text-[#782B40]",
    CITY_ACTIVATED: "bg-[#F2E2DC] text-[#782B40]",
    CITY_DEACTIVATED: "bg-amber-50 text-amber-700",

    HOSPITAL_APPROVED: "bg-[#F2E2DC] text-[#782B40]",
    HOSPITAL_REJECTED: "bg-red-50 text-red-700",
    HOSPITAL_ACTIVATED: "bg-[#F2E2DC] text-[#782B40]",
    HOSPITAL_DEACTIVATED: "bg-amber-50 text-amber-700",

    BLOOD_REQUEST_CREATED: "bg-[#F2E2DC] text-[#782B40]",
    BLOOD_REQUEST_CANCELLED: "bg-red-50 text-red-700",
    BLOOD_REQUEST_FULFILLED: "bg-[#F2E2DC] text-[#782B40]",

    MATCH_ACCEPTED: "bg-[#F2E2DC] text-[#782B40]",
    MATCH_DECLINED: "bg-amber-50 text-amber-700",
    MATCH_EXPIRED: "bg-[#F0EAE3] text-[#81756A]",
    MATCH_COMPLETED: "bg-[#F2E2DC] text-[#782B40]",

    AUTO_EXPIRE_BLOOD_REQUEST: "bg-[#F0EAE3] text-[#6F6258]",
    AUTO_EXPIRE_MATCH: "bg-[#F0EAE3] text-[#6F6258]",
    AUTO_MARK_MATCH_NO_RESPONSE: "bg-amber-50 text-amber-700",

    DONATION_CONFIRMED: "bg-[#F2E2DC] text-[#782B40]",
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="text-[#87364D]" size={21} />
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Audit Logs
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#81756A]">
            Track administrative and automated activities on DonorNexa.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading || pagination.totalLogs === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-[#302923]">
          Filter by action
        </label>

        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-sm text-[#302923] outline-none transition focus:border-[#A45B6D] sm:w-72"
        >
          <option value="">All Actions</option>

          <option value="USER_BLOCKED">User blocked</option>
          <option value="USER_UNBLOCKED">User unblocked</option>

          <option value="CITY_ADDED">City added</option>
          <option value="CITY_ACTIVATED">City activated</option>
          <option value="CITY_DEACTIVATED">City deactivated</option>

          <option value="HOSPITAL_APPROVED">Hospital approved</option>
          <option value="HOSPITAL_REJECTED">Hospital rejected</option>
          <option value="HOSPITAL_ACTIVATED">Hospital activated</option>
          <option value="HOSPITAL_DEACTIVATED">Hospital deactivated</option>

          <option value="BLOOD_REQUEST_CREATED">Blood request created</option>
          <option value="BLOOD_REQUEST_CANCELLED">
            Blood request cancelled
          </option>
          <option value="BLOOD_REQUEST_FULFILLED">
            Blood request fulfilled
          </option>

          <option value="MATCH_ACCEPTED">Match accepted</option>
          <option value="MATCH_DECLINED">Match declined</option>
          <option value="MATCH_EXPIRED">Match expired</option>
          <option value="MATCH_COMPLETED">Match completed</option>

          <option value="AUTO_EXPIRE_BLOOD_REQUEST">
            Automatic request expiry
          </option>
          <option value="AUTO_EXPIRE_MATCH">Automatic match expiry</option>
          <option value="AUTO_MARK_MATCH_NO_RESPONSE">
            Automatic no response
          </option>

          <option value="DONATION_CONFIRMED">Donation confirmed</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[#81756A]">
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center">
          <ClipboardList size={34} className="mx-auto mb-3 text-[#C8BDB3]" />
          <p className="text-sm font-medium text-[#302923]">
            No audit logs found.
          </p>
          <p className="mt-1 text-xs text-[#81756A]">
            Administrative and automated activities will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#E8DDD4]">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-[#E8DDD4] bg-[#F8F5EF] text-[#81756A]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Performed By</th>
                  <th className="px-4 py-3 font-semibold">Changes</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0EAE3]">
                {logs.map((log) => {
                  const systemAction = isSystemAction(log);

                  return (
                    <tr key={log._id} className="transition hover:bg-[#FAF6F1]">
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                            actionColors[log.action] ||
                            "bg-[#F0EAE3] text-[#81756A]"
                          }`}
                        >
                          {log.action.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="max-w-xs px-4 py-4 text-[#302923]">
                        {log.description}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {systemAction && (
                            <Settings size={15} className="text-[#87364D]" />
                          )}
                          <p className="font-medium text-[#302923]">
                            {systemAction
                              ? "System"
                              : log.user?.name || log.admin?.name || "Unknown"}
                          </p>
                        </div>
                        <p className="mt-1 text-xs capitalize text-[#81756A]">
                          {systemAction
                            ? "Automated process"
                            : log.user?.role ||
                              (log.admin ? "admin" : "Unknown")}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <details className="group cursor-pointer text-xs">
                          <summary className="font-medium text-[#87364D] marker:text-[#87364D] hover:text-[#782B40]">
                            View changes
                          </summary>

                          <div className="mt-3 min-w-48 space-y-3">
                            <div>
                              <p className="mb-1 font-semibold text-[#302923]">
                                Old value
                              </p>
                              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] p-2 text-[11px] text-[#6F6258]">
                                {JSON.stringify(log.oldValue ?? null, null, 2)}
                              </pre>
                            </div>

                            <div>
                              <p className="mb-1 font-semibold text-[#302923]">
                                New value
                              </p>
                              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] p-2 text-[11px] text-[#6F6258]">
                                {JSON.stringify(log.newValue ?? null, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[#81756A]">
                        {log.ipAddress ||
                          (systemAction
                            ? "System-generated action"
                            : "Not recorded")}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[#81756A]">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#81756A]">
              Total logs: {pagination.totalLogs}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page <= 1 || loading}
                className="rounded-xl border border-[#E8DDD4] p-2 text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="text-sm text-[#6F6258]">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= pagination.totalPages || loading}
                className="rounded-xl border border-[#E8DDD4] p-2 text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
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
