
import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Download,
  Loader2,
  AlertCircle,
  CalendarDays,
  UserRound,
  Globe,
  FileText,
  X,
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

  const fetchLogs = useCallback(async () => {
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
  }, [request, page, action]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

      window.setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      setError("Unable to export audit logs. Please try again.");
    } finally {
      setExporting(false);
    }
  };

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
    HOSPITAL_INVENTORY_UPDATED: "bg-[#F2E2DC] text-[#782B40]",
    DONOR_PHONE_REVEALED: "bg-[#F2E2DC] text-[#782B40]",
  };

  const getPerformer = (log) => {
    const systemAction = isSystemAction(log);

    return {
      name: systemAction
        ? "System"
        : log.user?.name || log.admin?.name || "Unknown",
      role: systemAction
        ? "Automated process"
        : log.user?.role || (log.admin ? "admin" : "Unknown"),
      systemAction,
    };
  };

  const renderChanges = (log) => (
    <details className="group min-w-0">
      <summary className="w-fit cursor-pointer text-xs font-semibold text-[#87364D] marker:text-[#87364D] hover:text-[#782B40]">
        View changes
      </summary>

      <div className="mt-3 space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold text-[#302923]">
            Old value
          </p>

          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] p-3 text-[11px] leading-5 text-[#6F6258]">
            {JSON.stringify(log.oldValue ?? null, null, 2)}
          </pre>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-[#302923]">
            New value
          </p>

          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] p-3 text-[11px] leading-5 text-[#6F6258]">
            {JSON.stringify(log.newValue ?? null, null, 2)}
          </pre>
        </div>
      </div>
    </details>
  );

  const renderActionBadge = (log) => (
    <span
      className={`inline-flex max-w-full rounded-full px-3 py-1 text-[11px] font-semibold leading-4 ${
        actionColors[log.action] || "bg-[#F0EAE3] text-[#81756A]"
      }`}
    >
      <span className="break-words">
        {log.action?.replaceAll("_", " ") || "Unknown action"}
      </span>
    </span>
  );

  return (
    <section className="min-w-0 w-full space-y-4 sm:space-y-5">
      {/* Main card */}
      <div className="min-w-0 rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 shadow-sm sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ClipboardList
                className="shrink-0 text-[#87364D]"
                size={21}
              />

              <h2 className="font-serif text-lg font-semibold text-[#302923] sm:text-xl">
                Audit Logs
              </h2>
            </div>

            <p className="mt-1 text-xs leading-5 text-[#81756A] sm:text-sm">
              Track administrative and automated activities on DonorNexa.
            </p>

            <p className="mt-2 text-xs font-medium text-[#87364D]">
              {pagination.totalLogs} total logs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              onClick={handleExportCSV}
              disabled={exporting || loading || pagination.totalLogs === 0}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#782B40] px-3 py-2.5 text-xs font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              {exporting ? (
                <Loader2 size={15} className="shrink-0 animate-spin" />
              ) : (
                <Download size={15} className="shrink-0" />
              )}

              <span>{exporting ? "Exporting..." : "Export CSV"}</span>
            </button>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-xs font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              <RefreshCw
                size={15}
                className={`shrink-0 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-5 border-t border-[#E8DDD4] pt-5">
          <label
            htmlFor="audit-action-filter"
            className="mb-2 block text-xs font-semibold text-[#302923] sm:text-sm"
          >
            Filter by action
          </label>

          <select
            id="audit-action-filter"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-sm text-[#302923] outline-none transition focus:border-[#A45B6D] sm:max-w-sm"
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
            <option value="HOSPITAL_INVENTORY_UPDATED">
              Hospital inventory updated
            </option>
            <option value="DONOR_PHONE_REVEALED">Donor phone revealed</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex min-w-0 items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:text-sm">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />

            <p className="min-w-0 flex-1 break-words">{error}</p>

            <button
              onClick={fetchLogs}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw
              size={24}
              className="animate-spin text-[#963D54]"
            />
            <p className="mt-3 text-sm text-[#81756A]">
              Loading audit logs...
            </p>
          </div>
        ) : error ? null : logs.length === 0 ? (
          <div className="py-14 text-center">
            <ClipboardList
              size={34}
              className="mx-auto mb-3 text-[#C8BDB3]"
            />

            <p className="text-sm font-medium text-[#302923]">
              No audit logs found.
            </p>

            <p className="mt-1 text-xs text-[#81756A] sm:text-sm">
              Administrative and automated activities will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="mt-5 space-y-3 sm:hidden">
              {logs.map((log) => {
                const performer = getPerformer(log);

                return (
                  <article
                    key={log._id}
                    className="min-w-0 space-y-3 rounded-xl border border-[#E8DDD4] bg-white p-3.5"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        {renderActionBadge(log)}
                      </div>

                      {performer.systemAction && (
                        <Settings
                          size={16}
                          className="shrink-0 text-[#87364D]"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#81756A]">
                        Description
                      </p>

                      <p className="mt-1 break-words text-sm leading-5 text-[#302923]">
                        {log.description || "No description available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <UserRound
                          size={15}
                          className="mt-0.5 shrink-0 text-[#A45B6D]"
                        />

                        <div className="min-w-0">
                          <p className="text-[11px] text-[#81756A]">
                            Performed by
                          </p>

                          <p className="break-words text-xs font-semibold text-[#302923]">
                            {performer.name}
                          </p>

                          <p className="mt-0.5 text-[11px] capitalize text-[#81756A]">
                            {performer.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-start gap-2">
                        <CalendarDays
                          size={15}
                          className="mt-0.5 shrink-0 text-[#A45B6D]"
                        />

                        <div className="min-w-0">
                          <p className="text-[11px] text-[#81756A]">
                            Date & Time
                          </p>

                          <p className="break-words text-xs font-medium text-[#302923]">
                            {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-2">
                      <Globe
                        size={15}
                        className="mt-0.5 shrink-0 text-[#A45B6D]"
                      />

                      <div className="min-w-0">
                        <p className="text-[11px] text-[#81756A]">
                          IP Address
                        </p>

                        <p className="break-all text-xs text-[#302923]">
                          {log.ipAddress ||
                            (performer.systemAction
                              ? "System-generated action"
                              : "Not recorded")}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#F0EAE3] pt-3">
                      {renderChanges(log)}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Tablet and desktop table */}
            <div className="mt-5 hidden overflow-x-auto rounded-xl border border-[#E8DDD4] sm:block">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-[#E8DDD4] bg-[#F8F5EF] text-xs text-[#81756A]">
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
                    const performer = getPerformer(log);

                    return (
                      <tr
                        key={log._id}
                        className="transition hover:bg-[#FAF6F1]"
                      >
                        <td className="max-w-[190px] px-4 py-4">
                          {renderActionBadge(log)}
                        </td>

                        <td className="max-w-[240px] px-4 py-4 text-[#302923]">
                          <p className="break-words">
                            {log.description || "No description available"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {performer.systemAction && (
                              <Settings
                                size={15}
                                className="shrink-0 text-[#87364D]"
                              />
                            )}

                            <p className="font-medium text-[#302923]">
                              {performer.name}
                            </p>
                          </div>

                          <p className="mt-1 text-xs capitalize text-[#81756A]">
                            {performer.role}
                          </p>
                        </td>

                        <td className="max-w-[200px] px-4 py-4">
                          {renderChanges(log)}
                        </td>

                        <td className="max-w-[180px] px-4 py-4 text-xs text-[#81756A]">
                          <p className="break-all">
                            {log.ipAddress ||
                              (performer.systemAction
                                ? "System-generated action"
                                : "Not recorded")}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-[#81756A]">
                          {formatDateTime(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex flex-col gap-3 border-t border-[#E8DDD4] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-xs text-[#81756A] sm:text-left sm:text-sm">
                Showing page {pagination.currentPage} of{" "}
                {pagination.totalPages} · {pagination.totalLogs} logs
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={page <= 1 || loading}
                  aria-label="Previous page"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8DDD4] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="min-w-[90px] text-center text-xs font-medium text-[#6F6258]">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page >= pagination.totalPages || loading}
                  aria-label="Next page"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8DDD4] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default AuditLogs;
