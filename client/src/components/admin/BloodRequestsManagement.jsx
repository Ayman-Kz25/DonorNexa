import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Droplet,
  CalendarDays,
  MapPin,
  Building2,
  AlertCircle,
  Download,
  Clock3,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { formatDateTime } from "../../utils/dateTime";

const statusStyles = {
  open: "bg-rose-50 text-[#963D54]",
  fulfilled: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-amber-50 text-amber-700",
};

const urgencyStyles = {
  normal: "bg-gray-100 text-gray-600",
  urgent: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

const BloodRequestsManagement = () => {
  const { request } = useApi();

  const [bloodRequests, setBloodRequests] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    limit: 10,
  });

  const [status, setStatus] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [urgency, setUrgency] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const fetchBloodRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/blood-requests",
        params: {
          page: pagination.currentPage,
          limit: 10,
          ...(status && { status }),
          ...(bloodGroup && { bloodGroup }),
          ...(urgency && { urgency }),
          sortBy,
        },
      });

      setBloodRequests(response.data.bloodRequests || []);

      setPagination(
        response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRequests: 0,
          limit: 10,
        },
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load blood requests.");
    } finally {
      setLoading(false);
    }
  }, [request, pagination.currentPage, status, bloodGroup, urgency, sortBy]);

  useEffect(() => {
    fetchBloodRequests();
  }, [fetchBloodRequests]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const changePage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;

    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/admin/blood-requests/export",
        params: {
          ...(status && { status }),
          ...(bloodGroup && { bloodGroup }),
          ...(urgency && { urgency }),
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.setAttribute("download", "donornexa-blood-requests.csv");

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError("Unable to export blood requests. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const RequestBadges = ({ item }) => (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
          urgencyStyles[item.urgency] || urgencyStyles.normal
        }`}
      >
        {item.urgency || "Normal"}
      </span>

      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
          statusStyles[item.status] || "bg-gray-100 text-gray-600"
        }`}
      >
        {item.status || "Unknown"}
      </span>
    </div>
  );

  return (
    <div className="min-w-0 w-full space-y-4 sm:space-y-5">
      {/* Overview */}
      <div className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-[#81756A] sm:text-sm">
              Total requests matching your filters
            </p>

            <h2 className="mt-1 text-2xl font-semibold tabular-nums text-[#782B40] sm:text-3xl">
              {pagination.totalRequests}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              onClick={handleExportCSV}
              disabled={loading || exporting || pagination.totalRequests === 0}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#782B40] px-3 py-2.5 text-xs font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              {exporting ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span>{exporting ? "Exporting..." : "Export CSV"}</span>
            </button>

            <button
              onClick={fetchBloodRequests}
              disabled={loading}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-xs font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 sm:p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#302923]">
            Filter requests
          </h3>
          <p className="mt-1 text-xs text-[#81756A]">
            Narrow down requests by status, blood group, or urgency.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => handleFilterChange(setStatus, e.target.value)}
            className="min-w-0 w-full rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-sm text-[#302923] outline-none focus:border-[#963D54]"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>

          <select
            aria-label="Filter by blood group"
            value={bloodGroup}
            onChange={(e) => handleFilterChange(setBloodGroup, e.target.value)}
            className="min-w-0 w-full rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-sm text-[#302923] outline-none focus:border-[#963D54]"
          >
            <option value="">All blood groups</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by urgency"
            value={urgency}
            onChange={(e) => handleFilterChange(setUrgency, e.target.value)}
            className="min-w-0 w-full rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-sm text-[#302923] outline-none focus:border-[#963D54] sm:col-span-2 lg:col-span-1"
          >
            <option value="">All urgency levels</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Sorting */}
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <label
          htmlFor="request-sort"
          className="text-xs font-semibold text-[#71665F] sm:text-sm"
        >
          Sort requests by
        </label>

        <select
          id="request-sort"
          value={sortBy}
          onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
          className="min-w-0 w-full rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-2.5 text-sm text-[#302923] outline-none transition focus:border-[#963D54] sm:w-auto sm:min-w-[220px]"
        >
          <option value="newest">Newest created</option>
          <option value="oldest">Oldest created</option>
          <option value="required_soonest">Required date (earliest)</option>
          <option value="required_latest">Required date (latest)</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex min-w-0 items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:p-4 sm:text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 break-words">{error}</p>
          <button
            onClick={fetchBloodRequests}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Requests */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9]">
        <div className="border-b border-[#E8DDD4] px-4 py-4 sm:px-5">
          <h3 className="font-serif text-base font-semibold text-[#302923] sm:text-lg">
            Blood Requests
          </h3>
          <p className="mt-1 text-xs text-[#81756A]">
            Requests submitted by registered hospitals
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="animate-spin text-[#963D54]" size={24} />
          </div>
        ) : error ? null : bloodRequests.length === 0 ? (
          <div className="px-4 py-14 text-center sm:px-5">
            <Droplet size={32} className="mx-auto text-[#A45B6D]" />
            <p className="mt-3 text-sm font-medium text-[#302923]">
              No blood requests found
            </p>
            <p className="mt-1 text-xs text-[#81756A] sm:text-sm">
              Try changing your filters.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-[#E8DDD4] sm:hidden">
              {bloodRequests.map((item) => (
                <article key={item._id} className="space-y-3 p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC]">
                        <Building2 size={17} className="text-[#963D54]" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="break-words text-sm font-semibold text-[#302923]">
                          {item.hospital?.hospitalName || "Unknown hospital"}
                        </h4>
                        <p className="mt-1 flex items-center gap-1 break-words text-xs text-[#81756A]">
                          <MapPin size={12} className="shrink-0" />
                          {item.city || item.hospital?.city || "—"}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#F2E2DC] px-2.5 py-1.5 text-sm font-bold text-[#782B40]">
                      <Droplet size={14} />
                      {item.bloodGroup}
                    </span>
                  </div>

                  <RequestBadges item={item} />

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F8F5EF] p-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#81756A]">
                        Units required
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#302923]">
                        {item.unitsRequired ?? 0}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] text-[#81756A]">
                        Reserved / fulfilled
                      </p>
                      <p className="mt-1 break-words text-xs font-medium text-[#302923]">
                        {item.unitsReserved || 0} / {item.unitsFulfilled || 0}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs text-[#71665F] min-[400px]:grid-cols-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <CalendarDays
                        size={14}
                        className="mt-0.5 shrink-0 text-[#A45B6D]"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#81756A]">
                          Required by
                        </p>
                        <p className="break-words font-medium text-[#302923]">
                          {formatDateTime(item.requiredBy)}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-2">
                      <Clock3
                        size={14}
                        className="mt-0.5 shrink-0 text-[#A45B6D]"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#81756A]">Created</p>
                        <p className="break-words font-medium text-[#302923]">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Tablet and desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#F8F5EF] text-[11px] uppercase tracking-wide text-[#81756A]">
                  <tr>
                    <th className="px-4 py-4 font-semibold lg:px-5">
                      Hospital
                    </th>
                    <th className="px-4 py-4 font-semibold lg:px-5">
                      Blood Group
                    </th>
                    <th className="px-4 py-4 font-semibold lg:px-5">Units</th>
                    <th className="px-4 py-4 font-semibold lg:px-5">Urgency</th>
                    <th className="px-4 py-4 font-semibold lg:px-5">
                      Required By
                    </th>
                    <th className="px-4 py-4 font-semibold lg:px-5">Status</th>
                    <th className="px-4 py-4 font-semibold lg:px-5">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E8DDD4]">
                  {bloodRequests.map((item) => (
                    <tr
                      key={item._id}
                      className="transition hover:bg-[#FCF8F5]"
                    >
                      <td className="max-w-[220px] px-4 py-4 lg:px-5">
                        <div className="flex min-w-0 items-start gap-2">
                          <Building2
                            size={17}
                            className="mt-0.5 shrink-0 text-[#963D54]"
                          />
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-[#302923]">
                              {item.hospital?.hospitalName ||
                                "Unknown hospital"}
                            </p>
                            <p className="mt-1 flex items-center gap-1 break-words text-xs text-[#81756A]">
                              <MapPin size={12} className="shrink-0" />
                              {item.city || item.hospital?.city || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 lg:px-5">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#782B40]">
                          <Droplet size={15} />
                          {item.bloodGroup}
                        </span>
                      </td>

                      <td className="px-4 py-4 lg:px-5">
                        <p className="whitespace-nowrap text-sm font-medium text-[#302923]">
                          {item.unitsRequired} required
                        </p>
                        <p className="mt-1 whitespace-nowrap text-xs text-[#81756A]">
                          {item.unitsReserved || 0} reserved ·{" "}
                          {item.unitsFulfilled || 0} fulfilled
                        </p>
                      </td>

                      <td className="px-4 py-4 lg:px-5">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            urgencyStyles[item.urgency] || urgencyStyles.normal
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </td>

                      <td className="px-4 py-4 lg:px-5">
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[#302923]">
                          <CalendarDays
                            size={14}
                            className="shrink-0 text-[#A45B6D]"
                          />
                          {formatDateTime(item.requiredBy)}
                        </span>
                      </td>

                      <td className="px-4 py-4 lg:px-5">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusStyles[item.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-[#81756A] lg:px-5">
                        {formatDateTime(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-[#E8DDD4] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-center text-xs text-[#81756A] sm:text-left sm:text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
                {" · "}
                {pagination.totalRequests} requests
              </p>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => changePage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1 || loading}
                  aria-label="Previous page"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8DDD4] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="min-w-[70px] text-center text-xs font-medium text-[#71665F]">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => changePage(pagination.currentPage + 1)}
                  disabled={
                    pagination.currentPage >= pagination.totalPages || loading
                  }
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
    </div>
  );
};

export default BloodRequestsManagement;
