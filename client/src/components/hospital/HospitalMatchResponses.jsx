import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Phone,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Droplet,
  MapPin,
  Award,
  Trophy,
} from "lucide-react";

export default function HospitalMatchResponses({
  requestId,
  onDonationConfirmed,
}) {
  const { request } = useApi();

  const [open, setOpen] = useState(false);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmingMatchId, setConfirmingMatchId] = useState(null);

  const fetchDonors = async () => {
    if (!requestId || !/^[0-9a-fA-F]{24}$/.test(String(requestId))) {
      setError(`Invalid blood request ID: ${requestId}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const rankedResponse = await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches`,
      });

      const rankedDonors = rankedResponse.data?.donors || [];

      const response = await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches/responses`,
      });

      const matchResponses = response.data?.responses || [];

      const responsesByDonorId = new Map();

      matchResponses.forEach((match) => {
        const donorId = String(match.donorId || match.donor?._id || "");

        if (donorId) {
          responsesByDonorId.set(donorId, match);
        }
      });

      const rankedWithResponses = rankedDonors.map((donor, index) => {
        const donorId = String(donor.donorId || donor._id);
        const match = responsesByDonorId.get(donorId);

        return {
          ...donor,
          donorId,
          matchId: match?.matchId || match?._id || null,
          donorName: match?.donorName || donor.name || "Donor",
          status: match?.status || "not_notified",
          declineReason: match?.declineReason || "",
          phone: match?.phone || null,
          totalDonations: match?.totalDonations ?? donor.totalDonations ?? 0,
          rank: index + 1,
          matchScore: donor.matchScore ?? 0,
        };
      });

      const rankedIds = new Set(
        rankedWithResponses.map((donor) => donor.donorId),
      );

      const previousMatchesNotInRanking = matchResponses
        .filter((match) => {
          const donorId = String(match.donorId || match.donor?._id || "");
          return donorId && !rankedIds.has(donorId);
        })
        .map((match) => ({
          ...match,
          donorId: String(match.donorId || match.donor?._id || ""),
          matchId: match.matchId || match._id,
          donorName: match.donorName || "Donor",
          rank: null,
          matchScore: null,
        }));

      setDonors([...rankedWithResponses, ...previousMatchesNotInRanking]);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load matching donors.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDonors = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    await fetchDonors();
  };

  const handleConfirmDonation = async (matchId) => {
    const confirmed = window.confirm(
      "Have you verified that this donor has completed the donation?",
    );

    if (!confirmed) return;

    setError("");
    setConfirmingMatchId(matchId);

    try {
      await request({
        method: "PATCH",
        url: `/api/blood-requests/matches/${matchId}/confirm-donation`,
      });

      await fetchDonors();
      await onDonationConfirmed?.();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to confirm donation.");
    } finally {
      setConfirmingMatchId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-[#F2E2DC] text-[#782B40]";
      case "completed":
        return "bg-[#F2E2DC] text-[#782B40]";
      case "declined":
        return "bg-[#F1EDE7] text-[#81756A]";
      case "expired":
      case "no_response":
        return "bg-[#F8EBDD] text-[#94633C]";
      case "not_notified":
        return "bg-[#F1EDE7] text-[#81756A]";
      default:
        return "bg-[#F8F1DF] text-[#92702F]";
    }
  };

  const getStatusLabel = (status) => {
    if (status === "not_notified") return "Not notified";

    return (status || "Unknown").replaceAll("_", " ");
  };

  return (
    <div className="w-full min-w-0 border-t border-[#EFE6DF] pt-3 sm:pt-4">
      {/* Toggle and Refresh */}
      <div className="flex min-w-0 flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:justify-between">
        <button
          type="button"
          onClick={toggleDonors}
          aria-expanded={open}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#782B40] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#642235] min-[400px]:w-auto sm:px-4 sm:text-sm"
        >
          <Users size={16} />
          Find Matching Donors
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {open && (
          <button
            type="button"
            onClick={fetchDonors}
            disabled={loading}
            className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] bg-white px-3 py-2 text-xs font-medium text-[#782B40] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-50 min-[400px]:w-auto sm:text-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        )}
      </div>

      {/* Donor Responses */}
      {open && (
        <div className="mt-4 min-w-0 space-y-3 sm:mt-5 sm:space-y-4">
          {/* Error */}
          {error && (
            <div className="flex min-w-0 items-start gap-2 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] p-3 text-xs leading-5 text-[#963D54] sm:p-4 sm:text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div
              className="flex min-h-24 items-center gap-2 rounded-xl bg-[#F8F5EF] p-4 text-xs leading-5 text-[#81756A] sm:min-h-28 sm:p-5 sm:text-sm"
              role="status"
            >
              <RefreshCw
                size={16}
                className="shrink-0 animate-spin text-[#963D54]"
              />
              Finding and ranking compatible donors...
            </div>
          ) : donors.length === 0 && !error ? (
            /* Empty State */
            <div className="rounded-xl border border-dashed border-[#E8DDD4] bg-[#F8F5EF] px-4 py-7 text-center sm:py-8">
              <Users size={23} className="mx-auto text-[#A45B6D]" />

              <p className="mt-3 text-xs font-semibold text-[#302923] sm:text-sm">
                No Matching Donors Found
              </p>

              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-5 text-[#81756A] sm:text-xs">
                No currently eligible and available donors match this request.
              </p>
            </div>
          ) : !loading && donors.length > 0 ? (
            <>
              {/* Results Heading */}
              <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <div className="min-w-0">
                  <h3 className="font-serif text-base font-semibold text-[#302923] sm:text-lg">
                    Ranked Compatible Donors
                  </h3>

                  <p className="mt-1 text-[11px] leading-5 text-[#81756A] sm:text-xs">
                    Ordered by matching score, eligibility and donation history.
                  </p>
                </div>

                <span className="self-start shrink-0 rounded-full bg-[#F2E2DC] px-3 py-1 text-[10px] font-semibold text-[#782B40] sm:text-xs">
                  {donors.length} Found
                </span>
              </div>

              {/* Donor Cards */}
              <div className="min-w-0 space-y-3">
                {donors.map((donor) => (
                  <article
                    key={donor.donorId || donor.matchId}
                    className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 sm:p-4"
                  >
                    <div className="flex min-w-0 flex-col justify-between gap-3 lg:flex-row lg:items-center lg:gap-4">
                      {/* Donor Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                          {donor.rank && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#F2E2DC] px-2 py-1.5 text-[10px] font-bold text-[#782B40] sm:px-2.5 sm:text-xs">
                              <Trophy size={12} />
                              Rank #{donor.rank}
                            </span>
                          )}

                          <span
                            className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold capitalize sm:text-xs ${getStatusStyle(
                              donor.status,
                            )}`}
                          >
                            {getStatusLabel(donor.status)}
                          </span>
                        </div>

                        <h4 className="mt-2.5 break-words text-sm font-semibold text-[#302923] sm:mt-3 sm:text-base">
                          {donor.donorName || donor.name || "Donor"}
                        </h4>

                        {/* Blood Group and City */}
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#81756A] sm:gap-x-4 sm:text-sm">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Droplet
                              size={14}
                              className="shrink-0 text-[#963D54]"
                            />
                            <span>{donor.bloodGroup}</span>
                          </span>

                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <MapPin
                              size={14}
                              className="shrink-0 text-[#963D54]"
                            />
                            <span className="break-words">
                              {donor.city || "Not specified"}
                            </span>
                          </span>
                        </div>

                        {/* Donation History and Score */}
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[#81756A] sm:gap-x-4 sm:text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <Award
                              size={13}
                              className="shrink-0 text-[#A45B6D]"
                            />
                            Previous donations: {donor.totalDonations ?? 0}
                          </span>

                          {donor.matchScore !== null &&
                            donor.matchScore !== undefined && (
                              <span className="break-words">
                                Match score: {donor.matchScore}
                              </span>
                            )}
                        </div>

                        {/* Phone */}
                        {donor.phone && (
                          <a
                            href={`tel:${donor.phone}`}
                            className="mt-2.5 inline-flex min-h-8 max-w-full items-center gap-2 break-all text-xs font-medium text-[#963D54] transition hover:text-[#782B40] sm:text-sm"
                          >
                            <Phone size={14} className="shrink-0" />
                            {donor.phone}
                          </a>
                        )}

                        {/* Decline Reason */}
                        {donor.status === "declined" && (
                          <div className="mt-3 min-w-0 rounded-xl border border-[#E8DDD4] bg-[#F8F5EF] p-3 sm:mt-4 sm:p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#782B40] sm:text-xs">
                              Donor's Decline Reason
                            </p>

                            <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-[#655A51] sm:mt-2 sm:text-sm sm:leading-6">
                              {donor.declineReason?.trim() ||
                                "No reason provided."}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Confirm Donation */}
                      {donor.status === "accepted" && donor.matchId && (
                        <div className="w-full shrink-0 lg:w-auto lg:self-center">
                          <button
                            type="button"
                            onClick={() => handleConfirmDonation(donor.matchId)}
                            disabled={confirmingMatchId !== null}
                            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#642235] disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto sm:text-sm"
                          >
                            {confirmingMatchId === donor.matchId ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}

                            {confirmingMatchId === donor.matchId
                              ? "Confirming..."
                              : "Confirm Donation"}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
