import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { useApi } from "../../hooks/useApi";
import HospitalMatchResponses from "../../components/hospital/HospitalMatchResponses";

const BloodRequests = () => {
  const { request } = useApi();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

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

      setRequests(
        Array.isArray(data)
          ? data
          : data?.requests || data?.bloodRequests || [],
      );
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
        return "bg-[#E5EFE8] text-[#456B50]";
      case "cancelled":
        return "bg-[#F3E7E3] text-[#98604F]";
      case "expired":
        return "bg-[#F1EDE7] text-[#81756A]";
      default:
        return "bg-[#F1EDE7] text-[#81756A]";
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

            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
              date.getDate(),
            )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  return (
    <div className="space-y-7">
      {/* Page Heading */}
      <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#E8DDD4] bg-gradient-to-r from-[#FFF8F8] via-[#FFFDF9] to-[#F8F0EC] p-5 sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
            Hospital Portal
          </p>

          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
            Blood Requests
          </h1>

          <p className="mt-2 max-w-lg text-sm leading-6 text-[#81756A]">
            Track your hospital's blood requests, manage their status, and
            review donor responses.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-sm font-semibold text-[#782B40] shadow-sm transition hover:border-[#D9BFC5] hover:bg-[#FDF6F5] disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Summary Cards */}
      {!loading && !error && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#81756A]">
                      {item.label}
                    </p>

                    <p className="mt-3 text-3xl font-semibold tabular-nums text-[#302923]">
                      {item.value}
                    </p>

                    <p className="mt-1 text-xs text-[#A49A91]">
                      {item.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F2E2DC] p-3 text-[#963D54]">
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] py-16">
          <RefreshCw className="animate-spin text-[#963D54]" size={22} />
          <span className="text-sm text-[#81756A]">
            Loading blood requests...
          </span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={19} />
            <p className="text-sm font-medium">{error}</p>
          </div>

          <button
            onClick={fetchRequests}
            className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#DCCBC2] bg-[#FFFDF9] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54]">
            <ClipboardList size={25} />
          </div>

          <h2 className="mt-4 font-serif text-xl font-semibold text-[#302923]">
            No blood requests yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#81756A]">
            Your hospital's submitted blood requests will appear here once you
            create one.
          </p>
        </div>
      )}

      {/* Request List */}
      {!loading && !error && requests.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Submitted Requests
            </h2>

            <span className="rounded-lg bg-[#F2E2DC] px-3 py-1.5 text-xs font-semibold text-[#963D54]">
              {requests.length} {requests.length === 1 ? "Request" : "Requests"}
            </span>
          </div>

          {requests.map((item) => {
            const status = item.status?.toLowerCase();
            const isOpen = status === "open";
            const isActionLoading = actionLoading === item._id;
            console.log("Blood request item:", item._id);

            return (
              <article
                key={item._id}
                className="overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm"
              >
                {/* Request Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-[#EFE6DF] bg-gradient-to-r from-[#FFF9F8] to-[#FFFDF9] p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-[#F2E2DC] px-3 py-2 text-sm font-bold text-[#782B40]">
                        <Droplet size={16} />
                        {item.bloodGroup}
                      </span>

                      <span
                        className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${getStatusStyle(
                          item.status,
                        )}`}
                      >
                        {item.status || "Unknown"}
                      </span>

                      <span
                        className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${getUrgencyStyle(
                          item.urgency,
                        )}`}
                      >
                        {item.urgency || "Normal"} Priority
                      </span>
                    </div>

                    <p className="mt-3 break-all text-xs text-[#A49A91]">
                      Request ID: {item._id}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-[#EFE6DF] bg-white px-4 py-3 sm:min-w-[140px] sm:flex-col sm:items-end sm:gap-1">
                    <p className="text-xs text-[#81756A]">Units Required</p>

                    <p className="text-2xl font-semibold tabular-nums text-[#302923]">
                      {item.unitsRequired}
                    </p>
                  </div>
                </div>

                {/* Request Details */}
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl bg-[#F8F5EF] p-4">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <CalendarDays size={16} />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Required By
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-[#302923]">
                        {formatDateTime(item.requiredBy)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F8F5EF] p-4">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <Activity size={16} />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Urgency
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-semibold capitalize text-[#302923]">
                        {item.urgency || "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F8F5EF] p-4">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <ClipboardList size={16} />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Request Status
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-semibold capitalize text-[#302923]">
                        {item.status || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {/* Ward */}
                  {item.ward?.trim() && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFF9F7] p-4">
                      <div className="rounded-lg bg-[#F2E2DC] p-2 text-[#963D54]">
                        <MapPin size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#81756A]">
                          Ward / Department
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#302923]">
                          {item.ward}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hospital Notes */}
                  {item.hospitalNotes?.trim() && (
                    <div className="mt-4 rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-4">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <FileText size={16} />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Additional Notes
                        </p>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#51463F]">
                        {item.hospitalNotes}
                      </p>
                    </div>
                  )}

                  {editingId === item._id && (
                    <div className="mt-5 rounded-xl border border-[#D9BFC5] bg-[#FFF9F7] p-5 sm:p-6">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <h3 className="font-serif text-lg font-semibold text-[#302923]">
                          Edit Blood Request
                        </h3>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditError("");
                          }}
                          disabled={editLoading}
                          className="rounded-lg p-2 text-[#81756A] transition hover:bg-[#F2E2DC] hover:text-[#782B40]"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {editError && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <AlertCircle size={17} className="mt-0.5 shrink-0" />
                          {editError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#51463F]">
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
                            className="w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none focus:border-[#963D54]"
                          />

                          <p className="mt-1 text-xs text-[#81756A]">
                            Reserved: {item.unitsReserved || 0} · Fulfilled:{" "}
                            {item.unitsFulfilled || 0}
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#51463F]">
                            Urgency
                          </label>

                          <select
                            name="urgency"
                            value={editForm.urgency}
                            onChange={handleEditChange}
                            className="w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none focus:border-[#963D54]"
                          >
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#51463F]">
                            Required By
                          </label>

                          <input
                            type="datetime-local"
                            name="requiredBy"
                            value={editForm.requiredBy}
                            min={getMinDateTimeLocal()}
                            onChange={handleEditChange}
                            required
                            className="w-full min-w-0 rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none focus:border-[#963D54]"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[#51463F]">
                            Ward / Department
                          </label>

                          <input
                            type="text"
                            name="ward"
                            maxLength={100}
                            value={editForm.ward}
                            onChange={handleEditChange}
                            placeholder="e.g. Emergency Ward"
                            className="w-full rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none focus:border-[#963D54]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-[#51463F]">
                            Additional Notes
                          </label>

                          <textarea
                            name="hospitalNotes"
                            rows={3}
                            maxLength={500}
                            value={editForm.hospitalNotes}
                            onChange={handleEditChange}
                            placeholder="Additional information for donors..."
                            className="w-full resize-y rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none focus:border-[#963D54]"
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditError("");
                          }}
                          disabled={editLoading}
                          className="rounded-xl border border-[#E8DDD4] bg-white px-5 py-2.5 text-sm font-semibold text-[#81756A] hover:bg-[#F8F5EF] disabled:opacity-50"
                        >
                          Discard
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateRequest(item._id)}
                          disabled={editLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#612235] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {editLoading ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}

                          {editLoading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Request Actions */}
                  {isOpen && (
                    <div className="mt-5 flex flex-col gap-3 border-t border-[#EFE6DF] pt-5 sm:flex-row">
                      <button
                        onClick={() => handleEditClick(item)}
                        disabled={isActionLoading || editLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9BFC5] bg-white px-5 py-2.5 text-sm font-semibold text-[#782B40] transition hover:bg-[#F8F5EF] disabled:opacity-50"
                      >
                        <Pencil size={16} />
                        Edit Request
                      </button>

                      <button
                        onClick={() => handleRequestAction(item._id, "fulfill")}
                        disabled={isActionLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#612235] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Mark as Fulfilled
                      </button>

                      <button
                        onClick={() => handleRequestAction(item._id, "cancel")}
                        disabled={isActionLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-5 py-2.5 text-sm font-semibold text-[#81756A] transition hover:border-[#D9BFC5] hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Cancel Request
                      </button>
                    </div>
                  )}

                  {/* Donor Responses */}
                  <div className="mt-6 border-t border-[#EFE6DF] pt-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#302923]">
                      <Droplet size={16} className="text-[#963D54]" />
                      Donor Responses
                    </h3>

                    <HospitalMatchResponses
                      requestId={item._id}
                      onDonationConfirmed={fetchRequests}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default BloodRequests;
