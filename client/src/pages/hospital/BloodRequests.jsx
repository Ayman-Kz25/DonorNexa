import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Droplet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatDateTime } from "../../utils/dateTime";

import { useApi } from "../../hooks/useApi";
import HospitalMatchResponses from "../../components/hospital/HospitalMatchResponses";

const BloodRequests = () => {
  const { request } = useApi();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

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

  const getCounts = () => ({
    total: requests.length,
    open: requests.filter((r) => r.status?.toLowerCase() === "open").length,
    fulfilled: requests.filter((r) => r.status?.toLowerCase() === "fulfilled")
      .length,
  });

  const counts = getCounts();

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
            Hospital Portal
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
            Blood Requests
          </h1>
          <p className="mt-3 text-sm text-[#81756A]">
            View and manage the blood requests submitted by your hospital.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Summary */}
      {!loading && !error && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Requests",
              value: counts.total,
              icon: ClipboardList,
            },
            {
              label: "Open Requests",
              value: counts.open,
              icon: Clock,
            },
            {
              label: "Fulfilled Requests",
              value: counts.fulfilled,
              icon: CheckCircle2,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#81756A]">{item.label}</p>
                  <div className="rounded-xl bg-[#F2E2DC] p-2.5 text-[#963D54]">
                    <Icon size={19} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-semibold text-[#302923]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] py-16">
          <RefreshCw className="animate-spin text-[#963D54]" size={24} />
          <span className="ml-3 text-sm text-[#81756A]">
            Loading blood requests...
          </span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={19} />
            <p className="text-sm font-medium">{error}</p>
          </div>

          <button
            onClick={fetchRequests}
            className="mt-3 text-sm font-semibold text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DCCBC2] bg-[#FFFDF9] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F2E2DC] text-[#963D54]">
            <ClipboardList size={25} />
          </div>

          <h2 className="mt-4 font-serif text-xl font-semibold text-[#302923]">
            No blood requests yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-[#81756A]">
            Your hospital's submitted blood requests will appear here.
          </p>
        </div>
      )}

      {/* Request List */}
      {!loading && !error && requests.length > 0 && (
        <section className="space-y-5">
          {requests.map((item) => {
            const status = item.status?.toLowerCase();
            const isOpen = status === "open";

            return (
              <article
                key={item._id}
                className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-[#F2E2DC] px-3 py-1.5 text-sm font-semibold text-[#782B40]">
                        <Droplet size={15} />
                        {item.bloodGroup}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-[#81756A]">
                      Request ID: {item._id}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-[#81756A]">Units Required</p>
                    <p className="mt-1 text-2xl font-semibold text-[#302923]">
                      {item.unitsRequired}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[#EFE6DF] pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-[#81756A]">Urgency</p>
                    <p className="mt-1 text-sm font-medium capitalize text-[#302923]">
                      {item.urgency || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#81756A]">Required By</p>
                    <p className="mt-1 text-sm font-medium text-[#302923]">
                      {formatDateTime(item.requiredBy)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#81756A]">Request Status</p>
                    <p className="mt-1 text-sm font-medium capitalize text-[#302923]">
                      {item.status}
                    </p>
                  </div>
                </div>

                {item.hospitalNotes && (
                  <div className="mt-5 rounded-xl bg-[#F8F5EF] p-4">
                    <p className="text-xs font-semibold text-[#81756A]">
                      Additional Notes
                    </p>
                    <p className="mt-1 text-sm text-[#302923]">
                      {item.hospitalNotes}
                    </p>
                  </div>
                )}

                {/* Request Actions */}
                {isOpen && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-[#EFE6DF] pt-5">
                    <button
                      onClick={() => handleRequestAction(item._id, "fulfill")}
                      disabled={actionLoading === item._id}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#612235] disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      Mark as Fulfilled
                    </button>

                    <button
                      onClick={() => handleRequestAction(item._id, "cancel")}
                      disabled={actionLoading === item._id}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] px-4 py-2.5 text-sm font-medium text-[#81756A] transition hover:bg-[#F8F5EF] disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Cancel Request
                    </button>
                  </div>
                )}

                {/* Donor Responses */}
                <div className="mt-5 border-t border-[#EFE6DF] pt-5">
                  <h3 className="mb-4 text-sm font-semibold text-[#302923]">
                    Donor Responses
                  </h3>
                  <HospitalMatchResponses
                    requestId={item._id}
                    onDonationConfirmed={fetchRequests}
                  />
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
