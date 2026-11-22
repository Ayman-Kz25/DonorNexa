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

const cardStyle = "rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]";
const detailStyle = "flex items-start gap-3 rounded-xl bg-[#F8F5EF] p-3.5";
const labelStyle = "text-xs font-medium text-[#927E70]";
const valueStyle = "mt-1 text-sm font-semibold text-[#302923]";

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

  // Pagination
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
        return <CheckCircle2 size={13} />;
      case "declined":
        return <XCircle size={13} />;
      case "pending":
        return <Clock size={13} />;
      case "expired":
      case "no_response":
        return <AlertCircle size={13} />;
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
    <section className="space-y-5">
      {/* Donor Summary */}
      <div
        className={`${cardStyle} flex flex-wrap items-center justify-between gap-4 p-4`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
            <Droplet size={20} />
          </div>

          <div>
            <p className={labelStyle}>Your blood group</p>
            <p className={valueStyle}>{donorBloodGroup || "Not available"}</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div>
            <p className="text-xl font-semibold tabular-nums text-[#302923]">
              {matches.length}
            </p>
            <p className={labelStyle}>Total matches</p>
          </div>

          <div className="h-9 w-px bg-[#E8DDD4]" />

          <div>
            <p className="text-xl font-semibold tabular-nums text-[#782B40]">
              {pendingCount}
            </p>
            <p className={labelStyle}>Awaiting response</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchMatches}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-4 py-2.5 text-sm font-semibold text-[#782B40] transition hover:bg-[#F8F1ED] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] px-4 py-3"
        >
          <div className="flex items-center gap-2 text-sm text-[#963D54]">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>

          <button
            type="button"
            onClick={fetchMatches}
            disabled={loading}
            className="text-sm font-semibold text-[#782B40] underline underline-offset-2 disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4" role="status">
          <div className="flex items-center gap-3 py-3 text-sm font-medium text-[#782B40]">
            <Loader2 size={18} className="animate-spin" />
            Loading matched requests...
          </div>

          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-xl bg-[#F5EFE8]"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && matches.length === 0 && (
        <div className={`${cardStyle} border-dashed px-5 py-14 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
            <Droplet size={25} />
          </div>

          <h3 className="mt-4 font-serif text-xl font-semibold text-[#302923]">
            No Matching Requests
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#81756A]">
            There are currently no blood requests matching your donor profile.
            New eligible requests will appear here.
          </p>

          <button
            type="button"
            onClick={fetchMatches}
            className="mt-5 text-sm font-semibold text-[#782B40] hover:text-[#602032]"
          >
            Check again
          </button>
        </div>
      )}

      {/* Matched Requests */}
      {!loading && !error && matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#302923]">
                Matched Requests
              </h2>
              <p className="mt-1 text-xs text-[#81756A]">
                Showing {startItem}–{endItem} of {matches.length} matches
              </p>
            </div>

            <span className="self-start rounded-lg bg-[#F2E2DC] px-3 py-1.5 text-xs font-semibold text-[#963D54]">
              {matches.length} {matches.length === 1 ? "Match" : "Matches"}
            </span>
          </div>

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
                className={`${cardStyle} overflow-hidden border-l-4 ${getUrgencyAccent(
                  bloodRequest.urgency,
                )}`}
              >
                <div className="space-y-5 p-4 sm:p-5">
                  {/* Request Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] font-semibold text-[#782B40]">
                        {bloodRequest.bloodGroup}
                      </div>

                      <div>
                        <h3 className="font-semibold text-[#302923]">
                          {bloodRequest.bloodGroup} blood needed
                        </h3>
                        <p className="mt-1 text-sm text-[#81756A]">
                          {bloodRequest.unitsRequired} unit(s) required
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize ${getUrgencyStyle(
                          bloodRequest.urgency,
                        )}`}
                      >
                        {bloodRequest.urgency || "Normal"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                          status,
                        )}`}
                      >
                        {getStatusIcon(status)}
                        {status?.replace("_", " ") || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Request Information */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={detailStyle}>
                      <MapPin
                        size={17}
                        className="mt-0.5 shrink-0 text-[#963D54]"
                      />
                      <div>
                        <p className={labelStyle}>Request City</p>
                        <p className={valueStyle}>
                          {bloodRequest.city || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className={detailStyle}>
                      <CalendarDays
                        size={17}
                        className="mt-0.5 shrink-0 text-[#963D54]"
                      />
                      <div>
                        <p className={labelStyle}>Required By</p>
                        <p className={valueStyle}>
                          {formatDateTime(bloodRequest.requiredBy)}
                        </p>
                      </div>
                    </div>

                    {bloodRequest.ward?.trim() && (
                      <div className={detailStyle}>
                        <Building2
                          size={17}
                          className="mt-0.5 shrink-0 text-[#963D54]"
                        />
                        <div>
                          <p className={labelStyle}>Ward / Department</p>
                          <p className={valueStyle}>{bloodRequest.ward}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hospital Notes */}
                  {bloodRequest.hospitalNotes?.trim() && (
                    <div className="flex items-start gap-3 rounded-xl border border-[#E8DDD4] bg-[#FFF9F7] p-4">
                      <FileText
                        size={17}
                        className="mt-0.5 shrink-0 text-[#963D54]"
                      />
                      <div>
                        <p className={labelStyle}>Additional Notes</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#51463F]">
                          {bloodRequest.hospitalNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Compatibility */}
                  {donorBloodGroup && (
                    <div className="flex items-start gap-2.5 text-sm leading-6 text-[#655A51]">
                      <Info
                        size={16}
                        className="mt-1 shrink-0 text-[#963D54]"
                      />
                      <p>
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] p-3.5">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <Clock size={16} />
                        <p className="text-xs font-semibold">
                          Your Response Deadline
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-[#842B43]">
                        {formatDateTime(match.responseDeadlineAt)}
                      </p>

                      {isPending && (
                        <p className="mt-1 text-xs text-[#963D54]">
                          {responseTimeLeft?.label ||
                            "Response deadline has passed"}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-3.5">
                      <div className="flex items-center gap-2 text-[#963D54]">
                        <CalendarDays size={16} />
                        <p className="text-xs font-semibold text-[#81756A]">
                          Hospital Request Deadline
                        </p>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-[#302923]">
                        {formatDateTime(bloodRequest.requiredBy)}
                      </p>
                    </div>
                  </div>

                  {/* Response Actions */}
                  {isPending && active && (
                    <div className="border-t border-[#E8DDD4] pt-5">
                      {declineTarget === match._id ? (
                        <div className="space-y-3">
                          <label
                            htmlFor={`decline-reason-${match._id}`}
                            className="block text-sm font-semibold text-[#302923]"
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
                            className="w-full resize-none rounded-xl border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#302923] outline-none transition focus:border-[#963D54] focus:ring-2 focus:ring-[#F2E2DC]"
                          />

                          <p className="text-right text-xs text-[#81756A]">
                            {declineReason.length}/500
                          </p>

                          <div className="flex flex-wrap gap-3">
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
                              className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#602032] disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <XCircle size={16} />
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
                              className="rounded-xl border border-[#E8DDD4] px-5 py-2.5 text-sm font-semibold text-[#782B40] transition hover:bg-[#F8F1ED] disabled:opacity-50"
                            >
                              Go Back
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleResponse(match._id, "accepted")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#782B40] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#602032] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            {isProcessing ? "Please wait..." : "Accept Request"}
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setDeclineTarget(match._id);
                              setDeclineReason("");
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] px-5 py-2.5 text-sm font-semibold text-[#782B40] transition hover:bg-[#F8F1ED] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing Response Information */}
                  {status === "declined" && match.declineReason && (
                    <div className="rounded-xl bg-[#F8F5EF] p-4 text-sm leading-6 text-[#655A51]">
                      <span className="font-semibold">
                        Your decline reason:
                      </span>{" "}
                      {match.declineReason}
                    </div>
                  )}

                  {status === "completed" && (
                    <div className="flex items-center gap-2 border-t border-[#E8DDD4] pt-4 text-sm font-medium text-[#782B40]">
                      <CheckCircle2 size={17} />
                      Donation completed successfully. Thank you for helping
                      save a life!
                    </div>
                  )}

                  {status === "accepted" && (
                    <div className="flex items-center gap-2 border-t border-[#E8DDD4] pt-4 text-sm text-[#782B40]">
                      <CheckCircle2 size={17} />
                      You accepted this request. The hospital can now contact
                      you.
                    </div>
                  )}

                  {status === "no_response" && (
                    <div className="flex items-center gap-2 border-t border-[#E8DDD4] pt-4 text-sm text-[#A33D45]">
                      <AlertCircle size={17} />
                      You did not respond before the response deadline.
                    </div>
                  )}

                  {(status === "expired" || (isPending && !active)) && (
                    <div className="flex items-center gap-2 border-t border-[#E8DDD4] pt-4 text-sm text-[#98602F]">
                      <AlertCircle size={17} />
                      This request is no longer active.
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4 sm:flex-row">
              <p className="text-xs text-[#81756A]">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E8DDD4] bg-white px-3 py-2 text-sm font-medium text-[#782B40] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
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
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
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
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E8DDD4] bg-white px-3 py-2 text-sm font-medium text-[#782B40] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
