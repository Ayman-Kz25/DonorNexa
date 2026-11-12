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
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

const statusStyles = {
  open: "bg-rose-50 text-[#963D54]",
  fulfilled: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-amber-50 text-amber-700",
};

const urgencyStyles = {
  normal: "bg-gray-100 text-gray-600",
  urgent: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#81756A]">
            Total requests matching your filters
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#782B40]">
            {pagination.totalRequests}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            disabled={loading || pagination.totalRequests === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#963D54] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            onClick={fetchBloodRequests}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 sm:grid-cols-3">
        <select
          value={status}
          onChange={(e) => handleFilterChange(setStatus, e.target.value)}
          className="rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-sm text-[#302923] outline-none focus:border-[#963D54]"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={bloodGroup}
          onChange={(e) => handleFilterChange(setBloodGroup, e.target.value)}
          className="rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-sm text-[#302923] outline-none focus:border-[#963D54]"
        >
          <option value="">All blood groups</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <select
          value={urgency}
          onChange={(e) => handleFilterChange(setUrgency, e.target.value)}
          className="rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-sm text-[#302923] outline-none focus:border-[#963D54]"
        >
          <option value="">All urgency levels</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Sorting */}
      <div className="flex flex-wrap justify-end items-center gap-3">
        <label
          htmlFor="request-sort"
          className="text-sm font-semibold text-[#71665F]"
        >
          Sort requests by:
        </label>

        <select
          id="request-sort"
          value={sortBy}
          onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
          className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm text-[#302923] outline-none transition focus:border-[#963D54]"
        >
          <option value="newest">Newest created</option>
          <option value="oldest">Oldest created</option>
          <option value="required_soonest">Required date (earliest)</option>
          <option value="required_latest">Required date (latest)</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
          <button
            onClick={fetchBloodRequests}
            className="ml-auto font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9]">
        <div className="border-b border-[#E8DDD4] px-5 py-4">
          <h3 className="font-serif text-lg font-semibold text-[#302923]">
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
          <div className="px-5 py-16 text-center">
            <Droplet size={32} className="mx-auto text-[#A45B6D]" />
            <p className="mt-3 font-medium text-[#302923]">
              No blood requests found
            </p>
            <p className="mt-1 text-sm text-[#81756A]">
              Try changing your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-[#F8F5EF] text-xs uppercase tracking-wide text-[#81756A]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Hospital</th>
                    <th className="px-5 py-4 font-semibold">Blood Group</th>
                    <th className="px-5 py-4 font-semibold">Units</th>
                    <th className="px-5 py-4 font-semibold">Urgency</th>
                    <th className="px-5 py-4 font-semibold">Required By</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E8DDD4]">
                  {bloodRequests.map((item) => (
                    <tr
                      key={item._id}
                      className="transition hover:bg-[#FCF8F5]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <Building2
                            size={17}
                            className="mt-0.5 text-[#963D54]"
                          />
                          <div>
                            <p className="font-medium text-[#302923]">
                              {item.hospital?.hospitalName ||
                                "Unknown hospital"}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-[#81756A]">
                              <MapPin size={12} />
                              {item.city || item.hospital?.city || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#782B40]">
                          <Droplet size={15} />
                          {item.bloodGroup}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-[#302923]">
                          {item.unitsRequired} required
                        </p>
                        <p className="mt-1 text-xs text-[#81756A]">
                          {item.unitsReserved || 0} reserved ·{" "}
                          {item.unitsFulfilled || 0} fulfilled
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            urgencyStyles[item.urgency] || urgencyStyles.normal
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-sm text-[#302923]">
                          <CalendarDays size={14} className="text-[#A45B6D]" />
                          {formatDate(item.requiredBy)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusStyles[item.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#81756A]">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DDD4] px-5 py-4">
              <p className="text-sm text-[#81756A]">
                Page {pagination.currentPage} of {pagination.totalPages}
                {" · "}
                {pagination.totalRequests} requests
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="rounded-lg border border-[#E8DDD4] p-2 text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  onClick={() => changePage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="rounded-lg border border-[#E8DDD4] p-2 text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40"
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
