import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Droplet,
  RefreshCw,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

import { useApi } from "../../hooks/useApi";
import HospitalMatchResponses from "../../components/hospital/HospitalMatchResponses";

const FindDonors = () => {
  const { request } = useApi();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-[#F2E2DC] text-[#782B40]";
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

  return (
    <div className="space-y-8">
      {/* Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A45B6D]">
            Hospital Portal
          </p>

          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#302923] sm:text-4xl">
            Find Donors
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-[#81756A]">
            View donor responses to your blood requests and manage donation
            confirmations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] py-16">
          <RefreshCw size={22} className="animate-spin text-[#963D54]" />
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
            type="button"
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
            No blood requests found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-[#81756A]">
            Create a blood request first. Donor responses associated with your
            requests will appear here.
          </p>
        </div>
      )}

      {/* Requests */}
      {!loading && !error && requests.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Your Blood Requests
            </h2>

            <span className="rounded-full bg-[#F2E2DC] px-3 py-1 text-xs font-semibold text-[#782B40]">
              {requests.length} {requests.length === 1 ? "Request" : "Requests"}
            </span>
          </div>

          {requests.map((item) => (
            <article
              key={item._id}
              className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm sm:p-6"
            >
              {/* Request Details */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-[#F2E2DC] px-3 py-2 text-sm font-semibold text-[#782B40]">
                      <Droplet size={16} />
                      {item.bloodGroup}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[#81756A]">
                    Request ID: {item._id}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-[#F8F5EF] px-4 py-3">
                  <div className="rounded-lg bg-white p-2 text-[#963D54]">
                    <Users size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-[#81756A]">Required Units</p>
                    <p className="text-lg font-semibold text-[#302923]">
                      {item.unitsRequired}
                    </p>
                  </div>
                </div>
              </div>

              {/* Donor Responses */}
              <div className="mt-5 border-t border-[#EFE6DF] pt-4">
                <HospitalMatchResponses requestId={item._id} />
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default FindDonors;
