import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Droplet,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  MapPin,
  Award,
  Phone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Search,
  XCircle,
} from "lucide-react";

import { useApi } from "../../hooks/useApi";
import { formatDateTime } from "../../utils/dateTime";

const FindDonors = () => {
  const { request } = useApi();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedRequest, setExpandedRequest] = useState(null);
  const [donorData, setDonorData] = useState({});
  const [loadingRequest, setLoadingRequest] = useState(null);
  const [requestErrors, setRequestErrors] = useState({});

  const [confirmingMatchId, setConfirmingMatchId] = useState(null);

  // Fetch hospital requests
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

  // Fetch ranked donors and their response statuses
  const fetchDonors = async (requestId) => {
    setLoadingRequest(requestId);

    setRequestErrors((previous) => ({
      ...previous,
      [requestId]: "",
    }));

    try {
      const [matchingResponse, responsesResponse] = await Promise.all([
        request({
          method: "GET",
          url: `/api/blood-requests/${requestId}/matches`,
        }),
        request({
          method: "GET",
          url: `/api/blood-requests/${requestId}/matches/responses`,
        }),
      ]);

      const rankedDonors = matchingResponse.data?.donors || [];
      const responses = responsesResponse.data?.responses || [];

      // Connect each ranked donor with their response using donorId.
      const responseMap = new Map(
        responses.map((response) => [String(response.donorId), response]),
      );

      const mergedDonors = rankedDonors.map((donor, index) => {
        const donorId =
          donor.donorId ||
          donor._id ||
          donor.id ||
          donor.donor?._id ||
          donor.donor?.donorId;

        const donorResponse = donorId ? responseMap.get(String(donorId)) : null;

        return {
          ...donor,
          donorId,
          rank: index + 1,
          response: donorResponse || null,
        };
      });

      setDonorData((previous) => ({
        ...previous,
        [requestId]: {
          donors: mergedDonors,
          compatibleGroups: matchingResponse.data?.compatibleGroups || [],
          count: matchingResponse.data?.count ?? mergedDonors.length,
          loadedAt: new Date(),
        },
      }));
    } catch (err) {
      setRequestErrors((previous) => ({
        ...previous,
        [requestId]:
          err.response?.data?.message || "Unable to load matching donors.",
      }));
    } finally {
      setLoadingRequest(null);
    }
  };

  const toggleDonors = async (requestId) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
      return;
    }

    setExpandedRequest(requestId);

    if (!donorData[requestId]) {
      await fetchDonors(requestId);
    }
  };

  // Confirm an accepted donor's donation
  const handleConfirmDonation = async (requestId, matchId) => {
    const confirmed = window.confirm(
      "Have you verified that this donor has completed the donation?",
    );

    if (!confirmed) return;

    setConfirmingMatchId(matchId);

    setRequestErrors((previous) => ({
      ...previous,
      [requestId]: "",
    }));

    try {
      await request({
        method: "PATCH",
        url: `/api/blood-requests/matches/${matchId}/confirm-donation`,
      });

      await fetchDonors(requestId);
      await fetchRequests();
    } catch (err) {
      setRequestErrors((previous) => ({
        ...previous,
        [requestId]:
          err.response?.data?.message || "Unable to confirm donation.",
      }));
    } finally {
      setConfirmingMatchId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-[#F2E2DC] text-[#782B40]";

      case "completed":
        return "bg-[#EEE8E1] text-[#6E5949]";

      case "declined":
        return "bg-[#F1EDE7] text-[#81756A]";

      case "expired":
        return "bg-[#F8EBDD] text-[#94633C]";

      case "no_response":
        return "bg-[#F1EDE7] text-[#81756A]";

      default:
        return "bg-[#F8F1DF] text-[#92702F]";
    }
  };

  const getRequestStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-[#F2E2DC] text-[#782B40]";

      case "fulfilled":
        return "bg-[#EEE8E1] text-[#6E5949]";

      case "cancelled":
        return "bg-[#F3E7E3] text-[#98604F]";

      default:
        return "bg-[#F1EDE7] text-[#81756A]";
    }
  };

  const getDonorName = (donor) =>
    donor.donorName ||
    donor.name ||
    donor.user?.name ||
    donor.donor?.user?.name ||
    "Matched Donor";

  const getDonorBloodGroup = (donor) =>
    donor.bloodGroup || donor.donor?.bloodGroup || "—";

  const getDonorCity = (donor) => donor.city || donor.donor?.city || "—";

  const getDonorTotalDonations = (donor) =>
    donor.totalDonations ?? donor.donor?.totalDonations ?? 0;

  const getDonorScore = (donor) => donor.matchScore ?? null;

  const getDonorResponseStatus = (donor) => donor.response?.status || "pending";

  const getResponseCounts = (donors = []) => ({
    accepted: donors.filter((donor) => donor.response?.status === "accepted")
      .length,
    completed: donors.filter((donor) => donor.response?.status === "completed")
      .length,
    pending: donors.filter(
      (donor) => !donor.response || donor.response.status === "pending",
    ).length,
  });

  const activeRequests = requests.filter((item) => item.status === "open");

  const totalMatchedDonors = Object.values(donorData).reduce(
    (total, data) => total + (data?.donors?.length || 0),
    0,
  );

  return (
    <div className="space-y-7">
      {/* Overview */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
            <ClipboardList size={23} />
          </div>

          <div>
            <p className="text-sm text-[#81756A]">Open Requests</p>
            <p className="mt-1 text-2xl font-semibold text-[#302923]">
              {activeRequests.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
            <Users size={23} />
          </div>

          <div>
            <p className="text-sm text-[#81756A]">Loaded Matches</p>
            <p className="mt-1 text-2xl font-semibold text-[#302923]">
              {totalMatchedDonors}
            </p>
          </div>
        </div>
      </section>

      {/* Request list heading */}
      <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#302923]">
            Donor Matching
          </h2>
          <p className="mt-1 text-sm text-[#81756A]">
            Select an active request to view its ranked compatible donors.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Requests
        </button>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] py-14">
          <RefreshCw size={21} className="animate-spin text-[#963D54]" />
          <span className="ml-3 text-sm text-[#81756A]">
            Loading blood requests...
          </span>
        </div>
      )}

      {/* Main error */}
      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={18} />
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

      {/* Empty requests */}
      {!loading && !error && requests.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#DCCBC2] bg-[#FFFDF9] px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#963D54]">
            <ClipboardList size={25} />
          </div>

          <h3 className="mt-4 font-serif text-xl font-semibold text-[#302923]">
            No blood requests yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-[#81756A]">
            Create a blood request first. Once your request is active, you can
            find compatible donors here.
          </p>
        </div>
      )}

      {/* Request cards */}
      {!loading && !error && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((item) => {
            const isExpanded = expandedRequest === item._id;
            const data = donorData[item._id];
            const donors = data?.donors || [];
            const counts = getResponseCounts(donors);
            const isActive = item.status === "open";

            return (
              <article
                key={item._id}
                className="overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm"
              >
                {/* Request information */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-[#F2E2DC] px-3 py-2 text-sm font-semibold text-[#782B40]">
                          <Droplet size={16} />
                          {item.bloodGroup}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getRequestStatusStyle(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>

                        {item.urgency && (
                          <span className="rounded-full bg-[#F8F5EF] px-3 py-1.5 text-xs font-medium capitalize text-[#81756A]">
                            {item.urgency} urgency
                          </span>
                        )}
                      </div>

                      <p className="mt-3 break-all text-xs text-[#A09489]">
                        Request ID: {item._id}
                      </p>

                      {item.requiredBy && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#81756A]">
                          <Clock size={15} className="text-[#A45B6D]" />
                          Required by: {formatDateTime(item.requiredBy)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-[#F8F5EF] px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#963D54]">
                        <Users size={19} />
                      </div>

                      <div>
                        <p className="text-xs text-[#81756A]">Required Units</p>
                        <p className="text-xl font-semibold text-[#302923]">
                          {item.unitsRequired}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Matching controls */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE6DF] pt-4">
                    <div>
                      {data && (
                        <p className="text-sm text-[#81756A]">
                          <span className="font-semibold text-[#782B40]">
                            {donors.length}
                          </span>{" "}
                          compatible donors found
                        </p>
                      )}
                    </div>

                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => toggleDonors(item._id)}
                        disabled={loadingRequest === item._id}
                        aria-expanded={isExpanded}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#642235] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loadingRequest === item._id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Search size={16} />
                        )}

                        {loadingRequest === item._id
                          ? "Finding Donors..."
                          : isExpanded
                            ? "Hide Matched Donors"
                            : "View Matched Donors"}

                        {!loadingRequest &&
                          (isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          ))}
                      </button>
                    ) : (
                      <p className="text-xs text-[#81756A]">
                        Donor matching is available for open requests.
                      </p>
                    )}
                  </div>
                </div>

                {/* Ranked donor section */}
                {isExpanded && (
                  <div className="border-t border-[#E8DDD4] bg-[#FCF9F5] p-5 sm:p-6">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="font-serif text-xl font-semibold text-[#302923]">
                          Ranked Compatible Donors
                        </h3>
                        <p className="mt-1 text-sm text-[#81756A]">
                          Donors are displayed in the order returned by your
                          matching algorithm.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => fetchDonors(item._id)}
                        disabled={loadingRequest === item._id}
                        className="inline-flex items-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-white px-3 py-2 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
                      >
                        <RefreshCw
                          size={15}
                          className={
                            loadingRequest === item._id ? "animate-spin" : ""
                          }
                        />
                        Refresh Matches
                      </button>
                    </div>

                    {/* Request-specific error */}
                    {requestErrors[item._id] && (
                      <div
                        role="alert"
                        className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                      >
                        <AlertCircle size={17} className="mt-0.5 shrink-0" />
                        <div className="flex-1">
                          {requestErrors[item._id]}
                          <button
                            type="button"
                            onClick={() => fetchDonors(item._id)}
                            className="ml-2 font-semibold underline"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Matching loading */}
                    {loadingRequest === item._id && (
                      <div className="flex items-center justify-center rounded-xl border border-[#E8DDD4] bg-white py-12">
                        <RefreshCw
                          size={20}
                          className="animate-spin text-[#963D54]"
                        />
                        <span className="ml-3 text-sm text-[#81756A]">
                          Finding and ranking compatible donors...
                        </span>
                      </div>
                    )}

                    {/* Empty matches */}
                    {!loadingRequest &&
                      !requestErrors[item._id] &&
                      donors.length === 0 &&
                      data && (
                        <div className="rounded-xl border border-dashed border-[#DCCBC2] bg-white px-5 py-10 text-center">
                          <Users size={26} className="mx-auto text-[#A45B6D]" />
                          <h4 className="mt-3 font-semibold text-[#302923]">
                            No Compatible Donors Found
                          </h4>
                          <p className="mt-1 text-sm text-[#81756A]">
                            No currently eligible and available donors match
                            this blood request.
                          </p>
                        </div>
                      )}

                    {/* Donor summary */}
                    {!loadingRequest && donors.length > 0 && (
                      <>
                        <div className="mb-4 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-white p-3 text-center">
                            <p className="text-lg font-semibold text-[#782B40]">
                              {donors.length}
                            </p>
                            <p className="text-xs text-[#81756A]">Matched</p>
                          </div>

                          <div className="rounded-xl bg-white p-3 text-center">
                            <p className="text-lg font-semibold text-[#782B40]">
                              {counts.accepted}
                            </p>
                            <p className="text-xs text-[#81756A]">Accepted</p>
                          </div>

                          <div className="rounded-xl bg-white p-3 text-center">
                            <p className="text-lg font-semibold text-[#782B40]">
                              {counts.completed}
                            </p>
                            <p className="text-xs text-[#81756A]">Completed</p>
                          </div>
                        </div>

                        {/* Ranked donor cards */}
                        <div className="space-y-3">
                          {donors.map((donor) => {
                            const response = donor.response;
                            const status = getDonorResponseStatus(donor);
                            const score = getDonorScore(donor);

                            return (
                              <article
                                key={donor.donorId || donor.rank}
                                className="rounded-xl border border-[#E8DDD4] bg-white p-4 sm:p-5"
                              >
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                  <div className="flex min-w-0 gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] text-sm font-bold text-[#782B40]">
                                      #{donor.rank}
                                    </div>

                                    <div className="min-w-0">
                                      <h4 className="font-semibold text-[#302923]">
                                        {getDonorName(donor)}
                                      </h4>

                                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#81756A]">
                                        <span className="inline-flex items-center gap-1.5">
                                          <Droplet
                                            size={15}
                                            className="text-[#963D54]"
                                          />
                                          {getDonorBloodGroup(donor)}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5">
                                          <MapPin
                                            size={15}
                                            className="text-[#963D54]"
                                          />
                                          {getDonorCity(donor)}
                                        </span>
                                      </div>

                                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#81756A]">
                                        <Award
                                          size={14}
                                          className="text-[#A45B6D]"
                                        />
                                        Previous donations:{" "}
                                        {getDonorTotalDonations(donor)}
                                      </p>

                                      {score !== null &&
                                        score !== undefined && (
                                          <p className="mt-2 text-xs font-medium text-[#782B40]">
                                            Matching score: {score}
                                          </p>
                                        )}

                                      {response?.respondedAt && (
                                        <p className="mt-2 text-xs text-[#81756A]">
                                          Responded:{" "}
                                          {formatDateTime(response.respondedAt)}
                                        </p>
                                      )}

                                      {response?.phone && (
                                        <a
                                          href={`tel:${response.phone}`}
                                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#963D54] hover:text-[#782B40]"
                                        >
                                          <Phone size={15} />
                                          {response.phone}
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                                        status,
                                      )}`}
                                    >
                                      {status === "accepted" && (
                                        <CheckCircle2 size={13} />
                                      )}

                                      {status === "completed" && (
                                        <CheckCircle2 size={13} />
                                      )}

                                      {status === "declined" && (
                                        <XCircle size={13} />
                                      )}

                                      {status === "pending" && (
                                        <Clock size={13} />
                                      )}

                                      {status.replace("_", " ")}
                                    </span>

                                    {status === "accepted" &&
                                      response?.matchId && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleConfirmDonation(
                                              item._id,
                                              response.matchId,
                                            )
                                          }
                                          disabled={confirmingMatchId !== null}
                                          className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#642235] disabled:opacity-50"
                                        >
                                          {confirmingMatchId ===
                                          response.matchId ? (
                                            <RefreshCw
                                              size={14}
                                              className="animate-spin"
                                            />
                                          ) : (
                                            <CheckCircle2 size={14} />
                                          )}

                                          {confirmingMatchId ===
                                          response.matchId
                                            ? "Confirming..."
                                            : "Confirm Donation"}
                                        </button>
                                      )}
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FindDonors;
