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
    setLoading(true);
    setError("");

    try {
      // Get the complete ranked list of eligible donors.
      const rankedResponse = await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches`,
      });

      const rankedDonors = rankedResponse.data?.donors || [];

      // Get notification and response records for this request.
      const response = await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches/responses`,
      });

      const matchResponses = response.data?.responses || [];

      // Index existing responses by donor ID.
      const responsesByDonorId = new Map();

      matchResponses.forEach((match) => {
        const donorId = String(match.donorId || match.donor?._id || "");

        if (donorId) {
          responsesByDonorId.set(donorId, match);
        }
      });

      // Merge response information into the ranked donor list.
      const rankedWithResponses = rankedDonors.map((donor, index) => {
        const donorId = String(donor.donorId || donor._id);
        const match = responsesByDonorId.get(donorId);

        return {
          ...donor,
          donorId,
          matchId: match?.matchId || match?._id || null,
          donorName: match?.donorName || donor.name || "Donor",
          status: match?.status || "not_notified",
          phone: match?.phone || null,
          totalDonations: match?.totalDonations ?? donor.totalDonations ?? 0,
          rank: index + 1,
          matchScore: donor.matchScore ?? 0,
        };
      });

      // Preserve existing match records even if a donor is no longer
      // present in the current eligible/ranked list.
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
        return "bg-[#E5EFE8] text-[#456B50]";
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
    <div className="border-t border-[#EFE6DF] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggleDonors}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#642235]"
        >
          <Users size={17} />
          Find Matching Donors
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {open && (
          <button
            type="button"
            onClick={fetchDonors}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8DDD4] px-3 py-2 text-sm font-medium text-[#782B40] hover:bg-[#F8F5EF] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        )}
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#F8F5EF] p-5 text-sm text-[#81756A]">
              <RefreshCw size={17} className="animate-spin" />
              Finding and ranking compatible donors...
            </div>
          ) : donors.length === 0 && !error ? (
            <div className="rounded-xl border border-dashed border-[#E8DDD4] bg-[#F8F5EF] px-4 py-8 text-center">
              <Users size={25} className="mx-auto text-[#A45B6D]" />
              <p className="mt-3 text-sm font-semibold text-[#302923]">
                No Matching Donors Found
              </p>
              <p className="mt-1 text-xs text-[#81756A]">
                No currently eligible and available donors match this request.
              </p>
            </div>
          ) : !loading && donors.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#302923]">
                    Ranked Compatible Donors
                  </h3>
                  <p className="mt-1 text-xs text-[#81756A]">
                    Ordered by matching score, eligibility and donation history.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#F2E2DC] px-3 py-1 text-xs font-semibold text-[#782B40]">
                  {donors.length} Found
                </span>
              </div>

              <div className="space-y-3">
                {donors.map((donor) => (
                  <article
                    key={donor.donorId || donor.matchId}
                    className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {donor.rank && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#F2E2DC] px-2.5 py-1.5 text-xs font-bold text-[#782B40]">
                              <Trophy size={13} />
                              Rank #{donor.rank}
                            </span>
                          )}

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                              donor.status,
                            )}`}
                          >
                            {getStatusLabel(donor.status)}
                          </span>
                        </div>

                        <h4 className="mt-3 font-semibold text-[#302923]">
                          {donor.donorName || donor.name || "Donor"}
                        </h4>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#81756A]">
                          <span className="inline-flex items-center gap-1.5">
                            <Droplet size={15} className="text-[#963D54]" />
                            {donor.bloodGroup}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={15} className="text-[#963D54]" />
                            {donor.city || "Not specified"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#81756A]">
                          <span className="inline-flex items-center gap-1.5">
                            <Award size={14} className="text-[#A45B6D]" />
                            Previous donations: {donor.totalDonations ?? 0}
                          </span>

                          {donor.matchScore !== null &&
                            donor.matchScore !== undefined && (
                              <span>Match score: {donor.matchScore}</span>
                            )}
                        </div>

                        {donor.phone && (
                          <a
                            href={`tel:${donor.phone}`}
                            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#963D54] hover:text-[#782B40]"
                          >
                            <Phone size={15} />
                            {donor.phone}
                          </a>
                        )}
                      </div>

                      {donor.status === "accepted" && donor.matchId && (
                        <button
                          type="button"
                          onClick={() => handleConfirmDonation(donor.matchId)}
                          disabled={confirmingMatchId !== null}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#642235] disabled:opacity-50"
                        >
                          {confirmingMatchId === donor.matchId ? (
                            <RefreshCw size={15} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}

                          {confirmingMatchId === donor.matchId
                            ? "Confirming..."
                            : "Confirm Donation"}
                        </button>
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
