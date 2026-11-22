import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Droplet,
  MapPin,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Info,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDateTime } from "../../utils/dateTime";
import { useApi } from "../../hooks/useApi";

const ITEMS_PER_PAGE = 6;

const cardStyle =
  "rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] sm:rounded-xl";

const detailStyle =
  "flex min-w-0 items-start gap-2.5 rounded-lg bg-[#F8F5EF] p-2.5 sm:gap-3 sm:rounded-xl sm:p-3.5";

const labelStyle = "text-[10px] font-medium text-[#927E70] sm:text-xs";

const valueStyle =
  "mt-1 break-words text-xs font-semibold leading-5 text-[#302923] sm:text-sm";

export default function DonorMatchedRequests() {
  const { request } = useApi();

  const [matches, setMatches] = useState([]);
  const [donorBloodGroup, setDonorBloodGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/donors/my-matches",
      });

      setMatches(response.data.matches || []);
      setDonorBloodGroup(response.data.donorBloodGroup || "");
      setCurrentPage(1);
      setDeclineTarget(null);
      setDeclineReason("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load matched requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const totalPages = Math.ceil(matches.length / ITEMS_PER_PAGE);

  const paginatedMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return matches.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [matches, currentPage]);

  const startItem =
    matches.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, matches.length);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setCurrentPage(page);
    setDeclineTarget(null);
    setDeclineReason("");
  };

  const handleResponse = async (matchId, status, reason = "") => {
    const trimmedReason = typeof reason === "string" ? reason.trim() : "";

    if (status === "declined" && trimmedReason.length > 500) {
      setError("Decline reason cannot exceed 500 characters.");
      return;
    }

    try {
      setProcessingId(matchId);
      setError("");

      await request({
        method: "PATCH",
        url: `/api/donors/matches/${matchId}/respond`,
        data: {
          status,
          ...(status === "declined" && {
            declineReason: trimmedReason,
          }),
        },
      });

      setMatches((previous) =>
        previous.map((match) =>
          match._id === matchId
            ? {
                ...match,
                status,
                ...(status === "declined" && {
                  declineReason: trimmedReason,
                }),
              }
            : match,
        ),
      );

      setDeclineTarget(null);
      setDeclineReason("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to submit your response.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
      case "completed":
        return "bg-[#F2E2DC] text-[#782B40]";
      case "declined":
        return "bg-[#F1EFEC] text-[#756C65]";
      case "expired":
        return "bg-[#F8EDE2] text-[#98602F]";
      case "no_response":
        return "bg-[#FCE8E8] text-[#A33D45]";
      case "pending":
        return "bg-[#F8F1DF] text-[#92702F]";
      default:
        return "bg-[#F1EFEC] text-[#756C65]";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
      case "completed":
        return <CheckCircle2 size={12} />;
      case "declined":
        return <XCircle size={12} />;
      case "pending":
        return <Clock size={12} />;
      case "expired":
      case "no_response":
        return <AlertCircle size={12} />;
      default:
        return null;
    }
  };

  const getUrgencyStyle = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return "bg-[#F3DDE1] text-[#842B43]";
      case "urgent":
        return "bg-[#F8EDE2] text-[#98602F]";
      default:
        return "bg-[#F1EFEC] text-[#756C65]";
    }
  };

  const getUrgencyAccent = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return "border-l-[#842B43]";
      case "urgent":
        return "border-l-[#B47A45]";
      default:
        return "border-l-[#CDA5A5]";
    }
  };

  const getTimeLeft = (date) => {
    const difference = new Date(date).getTime() - Date.now();

    if (!Number.isFinite(difference) || difference <= 0) return null;

    const minutes = Math.floor(difference / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return {
        label: `Due in ${Math.max(minutes, 1)} min`,
        soon: true,
      };
    }

    if (hours < 24) {
      return {
        label: `Due in ${hours} h`,
        soon: true,
      };
    }

    return {
      label: `Due in ${days} ${days === 1 ? "day" : "days"}`,
      soon: false,
    };
  };

  const pendingCount = matches.filter(
    (match) => match.status?.toLowerCase() === "pending",
  ).length;

  return (
    <section className="min-w-0 w-full max-w-full space-y-3.5 sm:space-y-5">
      {/* Donor Summary */}
      <div
        className={`${cardStyle} flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-4`}
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-11 sm:w-11 sm:rounded-xl">
            <Droplet size={18} className="sm:hidden" />
            <Droplet size={20} className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <p className={labelStyle}>Your blood group</p>
            <p className={valueStyle}>{donorBloodGroup || "Not available"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tabular-nums text-[#302923] sm:text-xl">
              {matches.length}
            </p>
            <p className={labelStyle}>Total matches</p>
          </div>

          <div className="hidden h-9 w-px bg-[#E8DDD4] sm:block" />

          <div className="min-w-0">
            <p className="text-lg font-semibold tabular-nums text-[#782B40] sm:text-xl">
              {pendingCount}
            </p>
            <p className={labelStyle}>Awaiting response</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchMatches}
          disabled={loading}
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#E8DDD4] bg-white px-3 py-2 text-xs font-semibold text-[#782B40] transition hover:bg-[#F8F1ED] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:w-auto sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-[#E8C9C9] bg-[#FBEEEE] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:px-4"
        >
          <div className="flex min-w-0 items-start gap-2 text-xs leading-5 text-[#963D54] sm:text-sm">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 sm:h-[18px] sm:w-[18px]"
            />
            <span className="break-words">{error}</span>
          </div>

          <button
            type="button"
            onClick={fetchMatches}
            disabled={loading}
            className="self-start text-xs font-semibold text-[#782B40] underline underline-offset-2 disabled:opacity-50 sm:self-center sm:text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="min-w-0 space-y-3 sm:space-y-4" role="status">
          <div className="flex items-center gap-2.5 py-2 text-xs font-medium text-[#782B40] sm:gap-3 sm:py-3 sm:text-sm">
            <Loader2
              size={16}
              className="animate-spin sm:h-[18px] sm:w-[18px]"
            />
            Loading matched requests...
          </div>

          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-lg bg-[#F5EFE8] sm:h-40 sm:rounded-xl"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && matches.length === 0 && (
        <div
          className={`${cardStyle} border-dashed px-3.5 py-8 text-center sm:px-5 sm:py-14`}
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-14 sm:w-14 sm:rounded-xl">
            <Droplet size={22} className="sm:hidden" />
            <Droplet size={25} className="hidden sm:block" />
          </div>

          <h3 className="mt-3 font-serif text-lg font-semibold text-[#302923] sm:mt-4 sm:text-xl">
            No Matching Requests
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#81756A] sm:text-sm sm:leading-6">
            There are currently no blood requests matching your donor profile.
            New eligible requests will appear here.
          </p>

          <button
            type="button"
            onClick={fetchMatches}
            className="mt-4 text-xs font-semibold text-[#782B40] hover:text-[#602032] sm:mt-5 sm:text-sm"
          >
            Check again
          </button>
        </div>
      )}

      {/* Matched Requests */}
      {!loading && !error && matches.length > 0 && (
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <div className="flex min-w-0 flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-semibold text-[#302923] sm:text-xl">
                Matched Requests
              </h2>
              <p className="mt-0.5 text-[10px] text-[#81756A] sm:mt-1 sm:text-xs">
                Showing {startItem}–{endItem} of {matches.length} matches
              </p>
            </div>

            <span className="self-start rounded-md bg-[#F2E2DC] px-2.5 py-1 text-[10px] font-semibold text-[#963D54] sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
              {matches.length} {matches.length === 1 ? "Match" : "Matches"}
            </span>
          </div>

          <div className="min-w-0 space-y-3 sm:space-y-4">
            {paginatedMatches.map((match) => {
              const bloodRequest = match.bloodRequest;

              if (!bloodRequest) return null;

              const status = match.status?.toLowerCase();
              const isPending = status === "pending";
              const isProcessing = processingId === match._id;

              const now = Date.now();
              const responseDeadline = match.responseDeadlineAt
                ? new Date(match.responseDeadlineAt).getTime()
                : NaN;
              const requiredBy = new Date(bloodRequest.requiredBy).getTime();
              const expiresAt = new Date(bloodRequest.expiresAt).getTime();

              const active =
                bloodRequest.status?.toLowerCase() === "open" &&
                Number.isFinite(requiredBy) &&
                Number.isFinite(expiresAt) &&
                Number.isFinite(responseDeadline) &&
                requiredBy > now &&
                expiresAt > now &&
                responseDeadline > now;

              const responseTimeLeft = match.responseDeadlineAt
                ? getTimeLeft(match.responseDeadlineAt)
                : null;

              return (
                <article
                  key={match._id}
                  className={`${cardStyle} min-w-0 overflow-hidden border-l-4 ${getUrgencyAccent(
                    bloodRequest.urgency,
                  )}`}
                >
                  <div className="min-w-0 space-y-3 p-3 sm:space-y-5 sm:p-5">
                    {/* Request Header */}
                    <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] text-xs font-semibold text-[#782B40] sm:h-12 sm:w-12 sm:rounded-xl sm:text-sm">
                          {bloodRequest.bloodGroup}
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words text-xs font-semibold leading-5 text-[#302923] sm:text-base">
                            {bloodRequest.bloodGroup} blood needed
                          </h3>
                          <p className="mt-0.5 text-[10px] text-[#81756A] sm:mt-1 sm:text-sm">
                            {bloodRequest.unitsRequired} unit(s) required
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-wrap gap-1.5 sm:gap-2">
                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-semibold capitalize sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs ${getUrgencyStyle(
                            bloodRequest.urgency,
                          )}`}
                        >
                          {bloodRequest.urgency || "Normal"}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold capitalize sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs ${getStatusStyle(
                            status,
                          )}`}
                        >
                          {getStatusIcon(status)}
                          {status?.replace("_", " ") || "Unknown"}
                        </span>
                      </div>
                    </div>

                    {/* Request Information */}
                    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                      <div className={detailStyle}>
                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-[#963D54] sm:h-[17px] sm:w-[17px]"
                        />
                        <div className="min-w-0">
                          <p className={labelStyle}>Request City</p>
                          <p className={valueStyle}>
                            {bloodRequest.city || "Not specified"}
                          </p>
                        </div>
                      </div>

                      <div className={detailStyle}>
                        <CalendarDays
                          size={15}
                          className="mt-0.5 shrink-0 text-[#963D54] sm:h-[17px] sm:w-[17px]"
                        />
                        <div className="min-w-0">
                          <p className={labelStyle}>Required By</p>
                          <p className={valueStyle}>
                            {formatDateTime(bloodRequest.requiredBy)}
                          </p>
                        </div>
                      </div>

                      {bloodRequest.ward?.trim() && (
                        <div className={detailStyle}>
                          <Building2
                            size={15}
                            className="mt-0.5 shrink-0 text-[#963D54] sm:h-[17px] sm:w-[17px]"
                          />
                          <div className="min-w-0">
                            <p className={labelStyle}>Ward / Department</p>
                            <p className={valueStyle}>{bloodRequest.ward}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hospital Notes */}
                    {bloodRequest.hospitalNotes?.trim() && (
                      <div className="flex min-w-0 items-start gap-2.5 rounded-lg border border-[#E8DDD4] bg-[#FFF9F7] p-2.5 sm:gap-3 sm:rounded-xl sm:p-4">
                        <FileText
                          size={15}
                          className="mt-0.5 shrink-0 text-[#963D54] sm:h-[17px] sm:w-[17px]"
                        />
                        <div className="min-w-0">
                          <p className={labelStyle}>Additional Notes</p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#51463F] sm:text-sm sm:leading-6">
                            {bloodRequest.hospitalNotes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Compatibility */}
                    {donorBloodGroup && (
                      <div className="flex min-w-0 items-start gap-2 text-[11px] leading-5 text-[#655A51] sm:gap-2.5 sm:text-sm sm:leading-6">
                        <Info
                          size={14}
                          className="mt-0.5 shrink-0 text-[#963D54] sm:mt-1 sm:h-4 sm:w-4"
                        />
                        <p className="min-w-0 break-words">
                          Your{" "}
                          <span className="font-semibold text-[#782B40]">
                            {donorBloodGroup}
                          </span>{" "}
                          blood group is compatible with{" "}
                          <span className="font-semibold text-[#782B40]">
                            {bloodRequest.bloodGroup}
                          </span>{" "}
                          recipients for red blood cell donation.
                        </p>
                      </div>
                    )}

                    {/* Deadlines */}
                    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                      <div className="min-w-0 rounded-lg border border-[#E8C9C9] bg-[#FBEEEE] p-2.5 sm:rounded-xl sm:p-3.5">
                        <div className="flex items-center gap-1.5 text-[#963D54] sm:gap-2">
                          <Clock size={14} className="shrink-0 sm:h-4 sm:w-4" />
                          <p className="text-[10px] font-semibold sm:text-xs">
                            Your Response Deadline
                          </p>
                        </div>

                        <p className="mt-1.5 break-words text-xs font-semibold text-[#842B43] sm:mt-2 sm:text-sm">
                          {formatDateTime(match.responseDeadlineAt)}
                        </p>

                        {isPending && (
                          <p className="mt-1 text-[10px] text-[#963D54] sm:text-xs">
                            {responseTimeLeft?.label ||
                              "Response deadline has passed"}
                          </p>
                        )}
                      </div>

                      <div className="min-w-0 rounded-lg border border-[#E8DDD4] bg-[#F8F5EF] p-2.5 sm:rounded-xl sm:p-3.5">
                        <div className="flex items-center gap-1.5 text-[#963D54] sm:gap-2">
                          <CalendarDays
                            size={14}
                            className="shrink-0 sm:h-4 sm:w-4"
                          />
                          <p className="text-[10px] font-semibold text-[#81756A] sm:text-xs">
                            Hospital Request Deadline
                          </p>
                        </div>

                        <p className="mt-1.5 break-words text-xs font-semibold text-[#302923] sm:mt-2 sm:text-sm">
                          {formatDateTime(bloodRequest.requiredBy)}
                        </p>
                      </div>
                    </div>

                    {/* Response Actions */}
                    {isPending && active && (
                      <div className="border-t border-[#E8DDD4] pt-3 sm:pt-5">
                        {declineTarget === match._id ? (
                          <div className="min-w-0 space-y-2.5 sm:space-y-3">
                            <label
                              htmlFor={`decline-reason-${match._id}`}
                              className="block text-xs font-semibold text-[#302923] sm:text-sm"
                            >
                              Reason for declining{" "}
                              <span className="font-normal text-[#81756A]">
                                (Optional)
                              </span>
                            </label>

                            <textarea
                              id={`decline-reason-${match._id}`}
                              value={declineReason}
                              onChange={(event) =>
                                setDeclineReason(event.target.value)
                              }
                              maxLength={500}
                              rows={3}
                              placeholder="Briefly explain why you cannot accept this request..."
                              className="w-full min-w-0 resize-none rounded-lg border border-[#E8DDD4] bg-white px-3 py-2.5 text-xs leading-5 text-[#302923] outline-none transition placeholder:text-[10px] placeholder:text-[#927E70] focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC] sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm sm:placeholder:text-xs"
                            />

                            <p className="text-right text-[10px] text-[#81756A] sm:text-xs">
                              {declineReason.length}/500
                            </p>

                            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  handleResponse(
                                    match._id,
                                    "declined",
                                    declineReason,
                                  )
                                }
                                className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#782B40] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#602032] disabled:opacity-50 sm:min-h-10 sm:w-auto sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
                              >
                                {isProcessing ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <XCircle size={14} />
                                )}
                                Confirm Decline
                              </button>

                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => {
                                  setDeclineTarget(null);
                                  setDeclineReason("");
                                }}
                                className="min-h-9 w-full rounded-lg border border-[#E8DDD4] px-3 py-2 text-xs font-semibold text-[#782B40] transition hover:bg-[#F8F1ED] disabled:opacity-50 sm:min-h-10 sm:w-auto sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
                              >
                                Go Back
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                handleResponse(match._id, "accepted")
                              }
                              className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#782B40] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#602032] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:w-auto sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
                            >
                              {isProcessing ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={14} />
                              )}
                              {isProcessing
                                ? "Please wait..."
                                : "Accept Request"}
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setDeclineTarget(match._id);
                                setDeclineReason("");
                              }}
                              className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#E8DDD4] px-3 py-2 text-xs font-semibold text-[#782B40] transition hover:bg-[#F8F1ED] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:w-auto sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
                            >
                              <XCircle size={14} />
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Existing Response Information */}
                    {status === "declined" && match.declineReason && (
                      <div className="break-words rounded-lg bg-[#F8F5EF] p-2.5 text-xs leading-5 text-[#655A51] sm:rounded-xl sm:p-4 sm:text-sm sm:leading-6">
                        <span className="font-semibold">
                          Your decline reason:
                        </span>{" "}
                        {match.declineReason}
                      </div>
                    )}

                    {status === "completed" && (
                      <div className="flex items-start gap-2 border-t border-[#E8DDD4] pt-3 text-xs font-medium leading-5 text-[#782B40] sm:pt-4 sm:text-sm sm:leading-6">
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0 sm:h-[17px] sm:w-[17px]"
                        />
                        <span>
                          Donation completed successfully. Thank you for helping
                          save a life!
                        </span>
                      </div>
                    )}

                    {status === "accepted" && (
                      <div className="flex items-start gap-2 border-t border-[#E8DDD4] pt-3 text-xs leading-5 text-[#782B40] sm:pt-4 sm:text-sm sm:leading-6">
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0 sm:h-[17px] sm:w-[17px]"
                        />
                        <span>
                          You accepted this request. The hospital can now
                          contact you.
                        </span>
                      </div>
                    )}

                    {status === "no_response" && (
                      <div className="flex items-start gap-2 border-t border-[#E8DDD4] pt-3 text-xs leading-5 text-[#A33D45] sm:pt-4 sm:text-sm sm:leading-6">
                        <AlertCircle
                          size={15}
                          className="mt-0.5 shrink-0 sm:h-[17px] sm:w-[17px]"
                        />
                        <span>
                          You did not respond before the response deadline.
                        </span>
                      </div>
                    )}

                    {(status === "expired" || (isPending && !active)) && (
                      <div className="flex items-start gap-2 border-t border-[#E8DDD4] pt-3 text-xs leading-5 text-[#98602F] sm:pt-4 sm:text-sm sm:leading-6">
                        <AlertCircle
                          size={15}
                          className="mt-0.5 shrink-0 sm:h-[17px] sm:w-[17px]"
                        />
                        <span>This request is no longer active.</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex min-w-0 flex-col items-center justify-between gap-2.5 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-2.5 sm:flex-row sm:gap-4 sm:rounded-xl sm:p-4">
              <p className="text-[10px] text-[#81756A] sm:text-xs">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1 sm:w-auto sm:gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex min-h-8 items-center justify-center gap-0.5 rounded-md border border-[#E8DDD4] bg-white px-2 py-1.5 text-[10px] font-medium text-[#782B40] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:gap-1 sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition sm:h-9 sm:min-w-9 sm:rounded-lg sm:px-2.5 sm:text-sm ${
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
                  className="inline-flex min-h-8 items-center justify-center gap-0.5 rounded-md border border-[#E8DDD4] bg-white px-2 py-1.5 text-[10px] font-medium text-[#782B40] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:gap-1 sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
