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
      // First generate/synchronize matching donors.
      await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches`,
      });

      // Then retrieve donor information and their response statuses.
      const response = await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches/responses`,
      });

      setDonors(response.data.responses || []);
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

      const response = await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches/responses`,
      });

      setDonors(response.data.responses || []);

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
        return "bg-[#F8EBDD] text-[#94633C]";
      default:
        return "bg-[#F8F1DF] text-[#92702F]";
    }
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
              Finding compatible donors...
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
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#302923]">
                    Compatible Donors
                  </h3>
                  <p className="mt-1 text-xs text-[#81756A]">
                    Donors matching the requested blood group and eligibility
                    criteria.
                  </p>
                </div>

                <span className="rounded-full bg-[#F2E2DC] px-3 py-1 text-xs font-semibold text-[#782B40]">
                  {donors.length} Found
                </span>
              </div>

              {donors.map((donor) => (
                <article
                  key={donor.matchId}
                  className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-4"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-[#302923]">
                        {donor.donorName}
                      </h4>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#81756A]">
                        <span className="inline-flex items-center gap-1.5">
                          <Droplet size={15} className="text-[#963D54]" />
                          {donor.bloodGroup}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={15} className="text-[#963D54]" />
                          {donor.city}
                        </span>
                      </div>

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#81756A]">
                        <Award size={14} className="text-[#A45B6D]" />
                        Previous donations: {donor.totalDonations ?? 0}
                      </p>

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

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                          donor.status,
                        )}`}
                      >
                        {donor.status}
                      </span>

                      {donor.status === "accepted" && (
                        <button
                          type="button"
                          onClick={() => handleConfirmDonation(donor.matchId)}
                          disabled={confirmingMatchId !== null}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#782B40] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#642235] disabled:opacity-50"
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
                  </div>
                </article>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
