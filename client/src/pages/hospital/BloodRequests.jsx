import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime, getMinDateTimeLocal } from "../../utils/dateTime";
import {
  ClipboardList,
  Droplet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  CalendarDays,
  FileText,
  Activity,
  Pencil,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import HospitalMatchResponses from "../../components/hospital/HospitalMatchResponses";

const ITEMS_PER_PAGE = 6;
const MAX_VISIBLE_PAGES = 2;

const BloodRequests = () => {
  const { request } = useApi();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [editForm, setEditForm] = useState({
    unitsRequired: "",
    urgency: "normal",
    requiredBy: "",
    ward: "",
    hospitalNotes: "",
  });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/blood-requests/my-requests",
      });

      const data = response.data;

      const fetchedRequests = Array.isArray(data)
        ? data
        : data?.requests || data?.bloodRequests || [];

      setRequests(fetchedRequests);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your blood requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);

  const visiblePages = useMemo(() => {
    const pageCount = Math.min(totalPages, MAX_VISIBLE_PAGES);

    if (pageCount === 0) return [];

    const startPage = Math.max(
      1,
      Math.min(
        currentPage - MAX_VISIBLE_PAGES + 1,
        totalPages - MAX_VISIBLE_PAGES + 1,
      ),
    );

    return Array.from({ length: pageCount }, (_, index) => startPage + index);
  }, [currentPage, totalPages]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return requests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [requests, currentPage]);

  const startItem =
    requests.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, requests.length);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setCurrentPage(page);
    setEditingId(null);
    setEditError("");
  };

  const handleRequestAction = async (requestId, action) => {
    const actionLabel = action === "cancel" ? "cancel" : "mark as fulfilled";

    if (
      !window.confirm(`Are you sure you want to ${actionLabel} this request?`)
    ) {
      return;
    }

    try {
      setActionLoading(requestId);
      setError("");

      await request({
        method: "PATCH",
        url: `/api/blood-requests/${requestId}/${action}`,
      });

      await fetchRequests();
    } catch (err) {
      setError(
        err.response?.data?.message || `Unable to ${action} this request.`,
      );
    } finally {
      setActionLoading("");
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-[#F2E2DC] text-[#963D54]";
      case "fulfilled":
        return "bg-[#F2E2DC] text-[#782B40]";
      case "cancelled":
        return "bg-[#F3E7E3] text-[#98604F]";
      case "expired":
        return "bg-[#F1EDE7] text-[#81756A]";
      default:
        return "bg-[#F1EDE7] text-[#81756A]";
    }
  };

  const getUrgencyStyle = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return "bg-[#963D54] text-white";
      case "urgent":
        return "bg-[#F2E2DC] text-[#963D54]";
      default:
        return "bg-[#F8F5EF] text-[#81756A]";
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setEditError("");

    setEditForm({
      unitsRequired: item.unitsRequired ?? "",
      urgency: item.urgency ?? "normal",
      requiredBy: item.requiredBy
        ? (() => {
            const date = new Date(item.requiredBy);
            const pad = (value) => String(value).padStart(2, "0");

            return `${date.getFullYear()}-${pad(
              date.getMonth() + 1,
            )}-${pad(date.getDate())}T${pad(
              date.getHours(),
            )}:${pad(date.getMinutes())}`;
          })()
        : "",
      ward: item.ward ?? "",
      hospitalNotes: item.hospitalNotes ?? "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateRequest = async (requestId) => {
    try {
      setEditLoading(true);
      setEditError("");
      setError("");

      await request({
        method: "PATCH",
        url: `/api/blood-requests/${requestId}`,
        data: {
          ...editForm,
          unitsRequired: Number(editForm.unitsRequired),
          requiredBy: new Date(editForm.requiredBy).toISOString(),
        },
      });

      setEditingId(null);
      await fetchRequests();
    } catch (err) {
      setEditError(
        err.response?.data?.message || "Unable to update blood request.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  const counts = {
    total: requests.length,
    open: requests.filter((r) => r.status?.toLowerCase() === "open").length,
    fulfilled: requests.filter((r) => r.status?.toLowerCase() === "fulfilled")
      .length,
  };

  const summaryCards = [
    {
      label: "Total Requests",
      value: counts.total,
      icon: ClipboardList,
      description: "All submitted requests",
    },
    {
      label: "Open Requests",
      value: counts.open,
      icon: Clock,
      description: "Currently active",
    },
    {
      label: "Fulfilled Requests",
      value: counts.fulfilled,
      icon: CheckCircle2,
      description: "Successfully completed",
    },
  ];

  const fieldClass =
    "w-full min-w-0 rounded-xl border border-[#E8DDD4] bg-white px-3 py-2.5 text-[13px] text-[#302923] outline-none transition focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC] sm:px-4 sm:py-3 sm:text-sm";

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 sm:space-y-6 lg:space-y-7">
      {/* Page Heading */}
      <section className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-[#E8DDD4] bg-gradient-to-r from-[#FFF8F8] via-[#FFFDF9] to-[#F8F0EC] p-4 sm:gap-5 sm:p-6 lg:flex-row lg:items-center lg:p-7">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A45B6D] sm:text-xs sm:tracking-[0.18em]">
            Hospital Portal
          </p>

          <h1 className="mt-1.5 break-words font-serif text-[22px] font-semibold leading-tight text-[#302923] sm:mt-2 sm:text-3xl lg:text-4xl">
            Blood Requests
          </h1>

          <p className="mt-2 max-w-lg text-[12px] leading-5 text-[#81756A] sm:text-sm sm:leading-6">
            Track your hospital's blood requests, manage their status, and
            review donor responses.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-xs font-semibold text-[#782B40] shadow-sm transition hover:border-[#D9BFC5] hover:bg-[#FDF6F5] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-center sm:text-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Summary Cards */}
      {!loading && !error && (
        <section className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 shadow-sm transition hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium leading-5 text-[#81756A] sm:text-sm">
                      {item.label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tabular-nums text-[#302923] sm:mt-3 sm:text-3xl">
                      {item.value}
                    </p>

                    <p className="mt-1 text-[11px] leading-4 text-[#A49A91] sm:text-xs">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54] sm:h-11 sm:w-11">
                    <Icon size={19} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Loading */}
      {loading && (
        <div
          className="flex min-h-40 items-center justify-center gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-12 sm:min-h-48"
          role="status"
        >
          <RefreshCw className="animate-spin text-[#963D54]" size={20} />
          <span className="text-xs text-[#81756A] sm:text-sm">
            Loading blood requests...
          </span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="min-w-0 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] p-4 sm:p-5">
          <div className="flex items-start gap-2 text-[#963D54]">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="min-w-0 break-words text-xs font-medium leading-5 sm:text-sm">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchRequests}
            className="mt-3 text-xs font-semibold text-[#963D54] underline underline-offset-2 sm:text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#DCCBC2] bg-[#FFFDF9] px-4 py-10 text-center sm:px-6 sm:py-14">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54] sm:h-14 sm:w-14">
            <ClipboardList size={23} />
          </div>

          <h2 className="mt-4 font-serif text-lg font-semibold text-[#302923] sm:text-xl">
            No blood requests yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#81756A] sm:text-sm sm:leading-6">
            Your hospital's submitted blood requests will appear here once you
            create one.
          </p>
        </div>
      )}

      {/* Request List */}
      {!loading && !error && requests.length > 0 && (
        <section className="min-w-0 space-y-4 sm:space-y-5">
          <div className="flex min-w-0 flex-col justify-between gap-2 min-[420px]:flex-row min-[420px]:items-center">
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-semibold text-[#302923] sm:text-xl">
                Submitted Requests
              </h2>

              <p className="mt-1 text-[11px] text-[#81756A] sm:text-xs">
                Showing {startItem}–{endItem} of {requests.length} requests
              </p>
            </div>

            <span className="self-start rounded-lg bg-[#F2E2DC] px-3 py-1.5 text-[11px] font-semibold text-[#963D54] sm:text-xs">
              {requests.length} {requests.length === 1 ? "Request" : "Requests"}
            </span>
          </div>

          {paginatedRequests.map((item) => {
            const status = item.status?.toLowerCase();
            const isOpen = status === "open";
            const isActionLoading = actionLoading === item._id;

            return (
              <article
                key={item._id}
                className="min-w-0 overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm"
              >
                {/* Request Header */}
                <div className="flex min-w-0 flex-col justify-between gap-3 border-b border-[#EFE6DF] bg-gradient-to-r from-[#FFF9F8] to-[#FFFDF9] p-4 sm:gap-4 sm:p-5 lg:flex-row lg:items-center lg:p-6">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2E2DC] px-2.5 py-1.5 text-xs font-bold text-[#782B40] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
                        <Droplet size={14} />
                        {item.bloodGroup}
                      </span>

                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold capitalize sm:px-3 sm:py-2 sm:text-xs ${getStatusStyle(
                          item.status,
                        )}`}
                      >
                        {item.status || "Unknown"}
                      </span>

                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold capitalize sm:px-3 sm:py-2 sm:text-xs ${getUrgencyStyle(
                          item.urgency,
                        )}`}
                      >
                        {item.urgency || "Normal"} Priority
                      </span>
                    </div>

                    <p className="mt-2 break-all text-[10px] leading-4 text-[#A49A91] sm:mt-3 sm:text-xs">
                      Request ID: {item._id}
                    </p>
                  </div>

                  <div className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-[#EFE6DF] bg-white px-3 py-2.5 sm:px-4 sm:py-3 lg:min-w-[140px] lg:flex-col lg:items-end lg:gap-1">
                    <p className="text-[11px] text-[#81756A] sm:text-xs">
                      Units Required
                    </p>

                    <p className="text-xl font-semibold tabular-nums text-[#302923] sm:text-2xl">
                      {item.unitsRequired}
                    </p>
                  </div>
                </div>

                {/* Request Details */}
                <div className="min-w-0 p-4 sm:p-5 lg:p-6">
                  <div className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3 sm:gap-4">
                    <div className="min-w-0 rounded-xl bg-[#F8F5EF] p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <CalendarDays size={15} className="shrink-0" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
                          Required By
                        </p>
                      </div>

                      <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#302923] sm:text-sm">
                        {formatDateTime(item.requiredBy)}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-xl bg-[#F8F5EF] p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <Activity size={15} className="shrink-0" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
                          Urgency
                        </p>
                      </div>

                      <p className="mt-2 break-words text-xs font-semibold capitalize text-[#302923] sm:text-sm">
                        {item.urgency || "Not specified"}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-xl bg-[#F8F5EF] p-3 sm:col-span-2 sm:p-4 xl:col-span-1">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <ClipboardList size={15} className="shrink-0" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
                          Request Status
                        </p>
                      </div>

                      <p className="mt-2 break-words text-xs font-semibold capitalize text-[#302923] sm:text-sm">
                        {item.status || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {/* Ward */}
                  {item.ward?.trim() && (
                    <div className="mt-3 flex min-w-0 items-start gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFF9F7] p-3 sm:mt-4 sm:p-4">
                      <div className="shrink-0 rounded-lg bg-[#F2E2DC] p-2 text-[#963D54]">
                        <MapPin size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#81756A] sm:text-xs">
                          Ward / Department
                        </p>

                        <p className="mt-1 break-words text-xs font-semibold text-[#302923] sm:text-sm">
                          {item.ward}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hospital Notes */}
                  {item.hospitalNotes?.trim() && (
                    <div className="mt-3 min-w-0 rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-3 sm:mt-4 sm:p-4">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <FileText size={15} />
                        <p className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
                          Additional Notes
                        </p>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[#51463F] sm:text-sm sm:leading-6">
                        {item.hospitalNotes}
                      </p>
                    </div>
                  )}

                  {/* Edit Form */}
                  {editingId === item._id && (
                    <div className="mt-4 min-w-0 rounded-xl border border-[#D9BFC5] bg-[#FFF9F7] p-3 sm:mt-5 sm:p-5 lg:p-6">
                      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                        <h3 className="font-serif text-base font-semibold text-[#302923] sm:text-lg">
                          Edit Blood Request
                        </h3>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditError("");
                          }}
                          disabled={editLoading}
                          aria-label="Close edit form"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#81756A] transition hover:bg-[#F2E2DC] hover:text-[#782B40] disabled:opacity-50"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {editError && (
                        <div className="mb-4 flex min-w-0 items-start gap-2 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] p-3 text-xs leading-5 text-[#963D54] sm:text-sm">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <span className="min-w-0 break-words">
                            {editError}
                          </span>
                        </div>
                      )}

                      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <div className="min-w-0">
                          <label className="mb-1.5 block text-xs font-medium text-[#51463F] sm:mb-2 sm:text-sm">
                            Units Required
                          </label>

                          <input
                            type="number"
                            name="unitsRequired"
                            min={Math.max(
                              1,
                              (item.unitsReserved || 0) +
                                (item.unitsFulfilled || 0),
                            )}
                            value={editForm.unitsRequired}
                            onChange={handleEditChange}
                            required
                            className={fieldClass}
                          />

                          <p className="mt-1 text-[10px] leading-4 text-[#81756A] sm:text-xs">
                            Reserved: {item.unitsReserved || 0} · Fulfilled:{" "}
                            {item.unitsFulfilled || 0}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <label className="mb-1.5 block text-xs font-medium text-[#51463F] sm:mb-2 sm:text-sm">
                            Urgency
                          </label>

                          <select
                            name="urgency"
                            value={editForm.urgency}
                            onChange={handleEditChange}
                            className={fieldClass}
                          >
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div className="min-w-0">
                          <label className="mb-1.5 block text-xs font-medium text-[#51463F] sm:mb-2 sm:text-sm">
                            Required By
                          </label>

                          <input
                            type="datetime-local"
                            name="requiredBy"
                            value={editForm.requiredBy}
                            min={getMinDateTimeLocal()}
                            onChange={handleEditChange}
                            required
                            className={fieldClass}
                          />
                        </div>

                        <div className="min-w-0">
                          <label className="mb-1.5 block text-xs font-medium text-[#51463F] sm:mb-2 sm:text-sm">
                            Ward / Department
                          </label>

                          <input
                            type="text"
                            name="ward"
                            maxLength={100}
                            value={editForm.ward}
                            onChange={handleEditChange}
                            placeholder="e.g. Emergency Ward"
                            className={fieldClass}
                          />
                        </div>

                        <div className="min-w-0 sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-medium text-[#51463F] sm:mb-2 sm:text-sm">
                            Additional Notes
                          </label>

                          <textarea
                            name="hospitalNotes"
                            rows={3}
                            maxLength={500}
                            value={editForm.hospitalNotes}
                            onChange={handleEditChange}
                            placeholder="Additional information for donors..."
                            className={`${fieldClass} resize-y`}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col-reverse gap-2 sm:mt-5 sm:flex-row sm:justify-end sm:gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditError("");
                          }}
                          disabled={editLoading}
                          className="min-h-10 w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-xs font-semibold text-[#81756A] transition hover:bg-[#F8F5EF] disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm"
                        >
                          Discard
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateRequest(item._id)}
                          disabled={editLoading}
                          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#612235] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm"
                        >
                          {editLoading ? (
                            <RefreshCw size={15} className="animate-spin" />
                          ) : (
                            <Save size={15} />
                          )}

                          {editLoading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Request Actions */}
                  {isOpen && (
                    <div className="mt-4 flex min-w-0 flex-col gap-2 border-t border-[#EFE6DF] pt-4 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-3 sm:pt-5">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        disabled={isActionLoading || editLoading}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D9BFC5] bg-white px-4 py-2.5 text-xs font-semibold text-[#782B40] transition hover:bg-[#F8F5EF] disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm"
                      >
                        <Pencil size={15} />
                        Edit Request
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestAction(item._id, "fulfill")}
                        disabled={isActionLoading}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#612235] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm"
                      >
                        {isActionLoading ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        Mark as Fulfilled
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestAction(item._id, "cancel")}
                        disabled={isActionLoading}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-xs font-semibold text-[#81756A] transition hover:border-[#D9BFC5] hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm"
                      >
                        <XCircle size={15} />
                        Cancel Request
                      </button>
                    </div>
                  )}

                  {/* Donor Responses */}
                  <div className="mt-5 min-w-0 border-t border-[#EFE6DF] pt-4 sm:mt-6 sm:pt-5">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#302923] sm:mb-4 sm:text-sm">
                      <Droplet size={15} className="text-[#963D54]" />
                      Donor Responses
                    </h3>

                    <div className="min-w-0">
                      <HospitalMatchResponses
                        requestId={item._id}
                        onDonationConfirmed={fetchRequests}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex min-w-0 flex-col items-center justify-between gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:flex-row sm:gap-4 sm:p-4">
              <p className="text-[11px] text-[#81756A] sm:text-xs">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex w-full flex-wrap items-center justify-center gap-1.5 sm:w-auto sm:gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Go to previous page"
                  className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[#E8DDD4] bg-white px-2.5 py-2 text-[11px] font-medium text-[#782B40] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    aria-label={`Go to page ${page}`}
                    className={`h-9 min-w-9 rounded-lg px-2.5 text-xs font-semibold transition sm:text-sm ${
                      currentPage === page
                        ? "bg-[#782B40] text-white"
                        : "border border-[#E8DDD4] bg-white text-[#81756A] hover:bg-[#F8F5EF]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Go to next page"
                  className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[#E8DDD4] bg-white px-2.5 py-2 text-[11px] font-medium text-[#782B40] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default BloodRequests;
