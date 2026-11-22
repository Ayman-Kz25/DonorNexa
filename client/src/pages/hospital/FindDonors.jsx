import { useCallback, useEffect, useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Search,
  XCircle,
} from "lucide-react";

import { useApi } from "../../hooks/useApi";
import { formatDateTime } from "../../utils/dateTime";

const REQUESTS_PER_PAGE = 5;
const DONORS_PER_PAGE = 2;

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    const end = Math.min(totalPages, start + 2);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 sm:gap-2 sm:pt-4">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-8 items-center gap-1 rounded-lg border border-[#E8DDD4] bg-white px-2 text-xs font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:px-3"
      >
        <ChevronLeft size={14} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {getPages().map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-xs text-[#A09489]"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition sm:h-9 sm:min-w-9 ${
              currentPage === page
                ? "bg-[#782B40] text-white"
                : "border border-[#E8DDD4] bg-white text-[#6F6258] hover:bg-[#F2E2DC] hover:text-[#782B40]"
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-8 items-center gap-1 rounded-lg border border-[#E8DDD4] bg-white px-2 text-xs font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:px-3"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

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

  const [requestPage, setRequestPage] = useState(1);
  const [donorPages, setDonorPages] = useState({});

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

      setRequestPage(1);
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

      const responseMap = new Map();

      responses.forEach((match) => {
        const donorId = String(
          match.donorId || match.donor?._id || match.donor?.donorId || "",
        );

        if (donorId) responseMap.set(donorId, match);
      });

      const mergedDonors = rankedDonors.map((donor, index) => {
        const donorId = String(
          donor.donorId ||
            donor._id ||
            donor.id ||
            donor.donor?._id ||
            donor.donor?.donorId ||
            "",
        );

        return {
          ...donor,
          donorId,
          rank: index + 1,
          response: responseMap.get(donorId) || null,
        };
      });

      const rankedIds = new Set(
        mergedDonors.map((donor) => donor.donorId).filter(Boolean),
      );

      const historicalDonors = responses
        .filter((match) => {
          const donorId = String(
            match.donorId || match.donor?._id || match.donor?.donorId || "",
          );

          return donorId && !rankedIds.has(donorId);
        })
        .map((match) => ({
          ...match,
          donorId: String(
            match.donorId || match.donor?._id || match.donor?.donorId || "",
          ),
          rank: null,
          response: match,
        }));

      const allDonors = [...mergedDonors, ...historicalDonors];

      setDonorData((previous) => ({
        ...previous,
        [requestId]: {
          donors: allDonors,
          compatibleGroups: matchingResponse.data?.compatibleGroups || [],
          count: allDonors.length,
          loadedAt: new Date(),
        },
      }));

      setDonorPages((previous) => ({
        ...previous,
        [requestId]: 1,
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
      case "not_notified":
        return "bg-[#F1EDE7] text-[#81756A]";
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

  const getDonorResponseStatus = (donor) =>
    donor.response?.status || "not_notified";

  const getResponseCounts = (donors = []) => {
    const getStatus = (donor) =>
      (donor.response?.status || donor.status || "not_notified").toLowerCase();

    return {
      accepted: donors.filter((donor) => getStatus(donor) === "accepted")
        .length,
      completed: donors.filter((donor) => getStatus(donor) === "completed")
        .length,
      pending: donors.filter((donor) => getStatus(donor) === "pending").length,
    };
  };

  const activeRequests = requests.filter((item) => item.status === "open");

  const totalMatchedDonors = Object.values(donorData).reduce(
    (total, data) => total + (data?.donors?.length || 0),
    0,
  );

  const totalRequestPages = Math.ceil(requests.length / REQUESTS_PER_PAGE);

  const paginatedRequests = useMemo(() => {
    const start = (requestPage - 1) * REQUESTS_PER_PAGE;
    return requests.slice(start, start + REQUESTS_PER_PAGE);
  }, [requests, requestPage]);

  const getDonorPagination = (requestId, donors) => {
    const currentPage = donorPages[requestId] || 1;
    const totalPages = Math.ceil(donors.length / DONORS_PER_PAGE);
    const start = (currentPage - 1) * DONORS_PER_PAGE;

    return {
      currentPage,
      totalPages,
      donors: donors.slice(start, start + DONORS_PER_PAGE),
    };
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-4 pt-3 sm:space-y-5 sm:pt-5 lg:space-y-6 lg:pt-6">
      {/* Heading */}
      <section className="flex min-w-0 flex-col justify-between gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-semibold text-[#302923] sm:text-xl">
            Donor Matching
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#81756A] sm:text-sm">
            Select a request to view its ranked compatible donors.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-2 text-xs font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:min-h-10 sm:w-auto sm:px-4 sm:text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Requests
        </button>
      </section>

      {/* Overview */}
      <section className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:gap-4 sm:p-4 lg:p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-11 sm:w-11 sm:rounded-xl">
            <ClipboardList size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] leading-tight text-[#81756A] sm:text-sm">
              Open Requests
            </p>
            <p className="mt-1 text-lg font-semibold text-[#302923] sm:text-2xl">
              {activeRequests.length}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:gap-4 sm:p-4 lg:p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-11 sm:w-11 sm:rounded-xl">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] leading-tight text-[#81756A] sm:text-sm">
              Loaded Matches
            </p>
            <p className="mt-1 text-lg font-semibold text-[#302923] sm:text-2xl">
              {totalMatchedDonors}
            </p>
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] py-8 sm:py-12">
          <RefreshCw size={18} className="animate-spin text-[#963D54]" />
          <span className="ml-3 text-xs text-[#81756A] sm:text-sm">
            Loading blood requests...
          </span>
        </div>
      )}

      {/* Main error */}
      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-5"
        >
          <div className="flex items-start gap-2 text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p className="text-xs font-medium leading-relaxed sm:text-sm">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchRequests}
            className="mt-3 text-xs font-semibold text-red-700 underline sm:text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty requests */}
      {!loading && !error && requests.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#DCCBC2] bg-[#FFFDF9] px-3 py-8 text-center sm:px-6 sm:py-12">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#963D54] sm:h-14 sm:w-14 sm:rounded-xl">
            <ClipboardList size={21} />
          </div>
          <h3 className="mt-3 font-serif text-base font-semibold text-[#302923] sm:mt-4 sm:text-xl">
            No blood requests yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#81756A] sm:text-sm">
            Create a blood request first. Once your request is active, you can
            find compatible donors here.
          </p>
        </div>
      )}

      {/* Request cards */}
      {!loading && !error && requests.length > 0 && (
        <>
          <div className="space-y-2.5 sm:space-y-4">
            {paginatedRequests.map((item) => {
              const isExpanded = expandedRequest === item._id;
              const data = donorData[item._id];
              const donors = data?.donors || [];
              const counts = getResponseCounts(donors);
              const isActive = item.status === "open";

              const donorPagination = getDonorPagination(item._id, donors);

              return (
                <article
                  key={item._id}
                  className="min-w-0 overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] shadow-sm"
                >
                  {/* Request information */}
                  <div className="p-3 sm:p-4 md:p-5">
                    <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#F2E2DC] px-2 py-1 text-xs font-semibold text-[#782B40] sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-sm">
                            <Droplet size={13} />
                            {item.bloodGroup}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize sm:px-2.5 sm:text-xs ${getRequestStatusStyle(item.status)}`}
                          >
                            {item.status}
                          </span>

                          {item.urgency && (
                            <span className="rounded-full bg-[#F8F5EF] px-2 py-1 text-[10px] font-medium capitalize text-[#81756A] sm:px-2.5 sm:text-xs">
                              {item.urgency}
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 break-all text-[10px] leading-relaxed text-[#A09489] sm:mt-2 sm:text-xs">
                          ID: {item._id}
                        </p>

                        {item.requiredBy && (
                          <p className="mt-1.5 flex min-w-0 items-start gap-1.5 text-[11px] leading-relaxed text-[#81756A] sm:mt-2 sm:items-center sm:text-sm">
                            <Clock
                              size={13}
                              className="mt-0.5 shrink-0 text-[#A45B6D] sm:mt-0"
                            />
                            <span className="min-w-0 break-words">
                              Required by: {formatDateTime(item.requiredBy)}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Units */}
                      <div className="flex min-w-0 items-center gap-2 rounded-lg bg-[#F8F5EF] px-2.5 py-2 sm:w-auto sm:shrink-0 sm:gap-3 sm:rounded-xl sm:px-3.5 sm:py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#963D54] sm:h-9 sm:w-9 sm:rounded-lg">
                          <Users size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-[#81756A] sm:text-xs">
                            Required Units
                          </p>
                          <p className="text-base font-semibold leading-tight text-[#302923] sm:text-lg">
                            {item.unitsRequired}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Matching controls */}
                    <div className="mt-3 flex min-w-0 flex-col gap-2 border-t border-[#EFE6DF] pt-2.5 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-3">
                      <div className="min-w-0">
                        {data && (
                          <p className="text-[11px] text-[#81756A] sm:text-sm">
                            <span className="font-semibold text-[#782B40]">
                              {donors.length}
                            </span>{" "}
                            compatible donors found
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDonors(item._id)}
                        disabled={loadingRequest === item._id}
                        aria-expanded={isExpanded}
                        className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#782B40] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#642235] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
                      >
                        {loadingRequest === item._id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Search size={14} />
                        )}

                        <span>
                          {loadingRequest === item._id
                            ? "Loading Donors..."
                            : isExpanded
                              ? "Hide Donor Records"
                              : isActive
                                ? "View Matched Donors"
                                : "View Donor History"}
                        </span>

                        {!loadingRequest &&
                          (isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          ))}
                      </button>
                    </div>
                  </div>

                  {/* Ranked donor section */}
                  {isExpanded && (
                    <div className="min-w-0 border-t border-[#E8DDD4] bg-[#FCF9F5] p-3 sm:p-4 md:p-5">
                      <div className="mb-3 flex min-w-0 flex-col justify-between gap-2.5 sm:mb-4 sm:flex-row sm:items-center sm:gap-3">
                        <div className="min-w-0">
                          <h3 className="font-serif text-base font-semibold text-[#302923] sm:text-xl">
                            Ranked Compatible Donors
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-[#81756A] sm:text-sm">
                            Donors are displayed in the order returned by your
                            matching algorithm.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => fetchDonors(item._id)}
                          disabled={loadingRequest === item._id}
                          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#E8DDD4] bg-white px-3 py-2 text-xs font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50 sm:w-auto sm:rounded-xl sm:text-sm"
                        >
                          <RefreshCw
                            size={13}
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
                          className="mb-3 flex min-w-0 items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs leading-relaxed text-red-700 sm:mb-4 sm:rounded-xl sm:p-4 sm:text-sm"
                        >
                          <AlertCircle size={15} className="mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1 break-words">
                            {requestErrors[item._id]}
                            <button
                              type="button"
                              onClick={() => fetchDonors(item._id)}
                              className="ml-1 font-semibold underline"
                            >
                              Try again
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Matching loading */}
                      {loadingRequest === item._id && (
                        <div className="flex items-center justify-center rounded-lg border border-[#E8DDD4] bg-white py-7 sm:rounded-xl sm:py-10">
                          <RefreshCw
                            size={17}
                            className="animate-spin text-[#963D54]"
                          />
                          <span className="ml-2.5 text-xs text-[#81756A] sm:ml-3 sm:text-sm">
                            Finding and ranking compatible donors...
                          </span>
                        </div>
                      )}

                      {/* Empty matches */}
                      {!loadingRequest &&
                        !requestErrors[item._id] &&
                        donors.length === 0 &&
                        data && (
                          <div className="rounded-lg border border-dashed border-[#DCCBC2] bg-white px-3 py-6 text-center sm:rounded-xl sm:px-5 sm:py-10">
                            <Users
                              size={22}
                              className="mx-auto text-[#A45B6D]"
                            />
                            <h4 className="mt-2.5 text-sm font-semibold text-[#302923] sm:mt-3 sm:text-base">
                              No Compatible Donors Found
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-[#81756A] sm:text-sm">
                              No currently eligible and available donors match
                              this blood request.
                            </p>
                          </div>
                        )}

                      {/* Donor summary and paginated records */}
                      {!loadingRequest && donors.length > 0 && (
                        <>
                          <div className="mb-2.5 grid grid-cols-3 gap-1.5 sm:mb-3 sm:gap-3">
                            <div className="min-w-0 rounded-lg bg-white p-2 text-center sm:rounded-xl sm:p-3">
                              <p className="text-sm font-semibold text-[#782B40] sm:text-lg">
                                {donors.length}
                              </p>
                              <p className="text-[10px] text-[#81756A] sm:text-xs">
                                Matched
                              </p>
                            </div>

                            <div className="min-w-0 rounded-lg bg-white p-2 text-center sm:rounded-xl sm:p-3">
                              <p className="text-sm font-semibold text-[#782B40] sm:text-lg">
                                {counts.accepted}
                              </p>
                              <p className="text-[10px] text-[#81756A] sm:text-xs">
                                Accepted
                              </p>
                            </div>

                            <div className="min-w-0 rounded-lg bg-white p-2 text-center sm:rounded-xl sm:p-3">
                              <p className="text-sm font-semibold text-[#782B40] sm:text-lg">
                                {counts.completed}
                              </p>
                              <p className="text-[10px] text-[#81756A] sm:text-xs">
                                Completed
                              </p>
                            </div>
                          </div>

                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-[#81756A] sm:text-xs">
                              Showing{" "}
                              <span className="font-semibold text-[#302923]">
                                {(donorPagination.currentPage - 1) *
                                  DONORS_PER_PAGE +
                                  1}
                                –
                                {Math.min(
                                  donorPagination.currentPage * DONORS_PER_PAGE,
                                  donors.length,
                                )}
                              </span>{" "}
                              of {donors.length} donors
                            </p>
                          </div>

                          {/* Donor cards */}
                          <div className="space-y-2 sm:space-y-3">
                            {donorPagination.donors.map((donor) => {
                              const response = donor.response;
                              const status = getDonorResponseStatus(donor);
                              const score = getDonorScore(donor);

                              return (
                                <article
                                  key={donor.donorId || donor.rank}
                                  className="min-w-0 rounded-lg border border-[#E8DDD4] bg-white p-3 sm:rounded-xl sm:p-4 md:p-5"
                                >
                                  <div className="flex min-w-0 flex-col justify-between gap-2.5 sm:flex-row sm:items-start sm:gap-3">
                                    <div className="flex min-w-0 gap-2 sm:gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F2E2DC] text-[11px] font-bold text-[#782B40] sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm">
                                        {donor.rank ? `#${donor.rank}` : "—"}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <h4 className="break-words text-sm font-semibold text-[#302923] sm:text-base">
                                          {getDonorName(donor)}
                                        </h4>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#81756A] sm:mt-2 sm:gap-x-4 sm:text-sm">
                                          <span className="inline-flex items-center gap-1">
                                            <Droplet
                                              size={13}
                                              className="shrink-0 text-[#963D54]"
                                            />
                                            {getDonorBloodGroup(donor)}
                                          </span>

                                          <span className="inline-flex min-w-0 items-center gap-1">
                                            <MapPin
                                              size={13}
                                              className="shrink-0 text-[#963D54]"
                                            />
                                            <span className="break-words">
                                              {getDonorCity(donor)}
                                            </span>
                                          </span>
                                        </div>

                                        <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-[#81756A] sm:mt-2 sm:text-xs">
                                          <Award
                                            size={12}
                                            className="shrink-0 text-[#A45B6D]"
                                          />
                                          Previous donations:{" "}
                                          {getDonorTotalDonations(donor)}
                                        </p>

                                        {score !== null &&
                                          score !== undefined && (
                                            <p className="mt-1.5 text-xs font-medium text-[#782B40] sm:mt-2">
                                              Matching score: {score}
                                            </p>
                                          )}

                                        {response?.respondedAt && (
                                          <p className="mt-1.5 break-words text-[11px] leading-relaxed text-[#81756A] sm:mt-2 sm:text-xs">
                                            Responded:{" "}
                                            {formatDateTime(
                                              response.respondedAt,
                                            )}
                                          </p>
                                        )}

                                        {response?.phone && (
                                          <a
                                            href={`tel:${response.phone}`}
                                            className="mt-2 inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg text-xs font-medium text-[#963D54] hover:text-[#782B40] sm:mt-3 sm:min-h-9 sm:gap-2 sm:text-sm"
                                          >
                                            <Phone
                                              size={13}
                                              className="shrink-0"
                                            />
                                            <span className="break-all">
                                              {response.phone}
                                            </span>
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end sm:gap-2">
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold capitalize sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs ${getStatusStyle(status)}`}
                                      >
                                        {["accepted", "completed"].includes(
                                          status,
                                        ) && <CheckCircle2 size={12} />}
                                        {status === "declined" && (
                                          <XCircle size={12} />
                                        )}
                                        {status === "pending" && (
                                          <Clock size={12} />
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
                                            disabled={
                                              confirmingMatchId !== null
                                            }
                                            className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#782B40] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#642235] disabled:opacity-50 sm:min-h-9 sm:w-auto sm:rounded-xl sm:px-3 sm:py-2"
                                          >
                                            {confirmingMatchId ===
                                            response.matchId ? (
                                              <RefreshCw
                                                size={13}
                                                className="animate-spin"
                                              />
                                            ) : (
                                              <CheckCircle2 size={13} />
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

                          {/* Donor pagination */}
                          <Pagination
                            currentPage={donorPagination.currentPage}
                            totalPages={donorPagination.totalPages}
                            onPageChange={(page) =>
                              setDonorPages((previous) => ({
                                ...previous,
                                [item._id]: page,
                              }))
                            }
                          />
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Request pagination */}
          <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-3 py-3 sm:px-4">
            <div className="text-center text-[11px] text-[#81756A] sm:text-xs">
              Showing{" "}
              <span className="font-semibold text-[#302923]">
                {(requestPage - 1) * REQUESTS_PER_PAGE + 1}–
                {Math.min(requestPage * REQUESTS_PER_PAGE, requests.length)}
              </span>{" "}
              of {requests.length} blood requests
            </div>

            <Pagination
              currentPage={requestPage}
              totalPages={totalRequestPages}
              onPageChange={setRequestPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FindDonors;
