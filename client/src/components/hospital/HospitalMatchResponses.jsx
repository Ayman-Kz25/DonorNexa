import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Phone,
  CheckCircle2,
} from "lucide-react";

export default function HospitalMatchResponses({ requestId }) {
  const { request } = useApi();

  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmingMatchId, setConfirmingMatchId] = useState(null);

  const fetchResponses = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    setLoading(true);
    setError("");

    try {
      const response = await request({
        method: "GET",
        url: `/api/blood-requests/${requestId}/matches/responses`,
      });

      setResponses(response.data.responses || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load donor responses.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDonation = async (matchId) => {
    const confirmed = window.confirm(
      "Have you verified that this donor has completed the donation?",
    );

    if (!confirmed) return;

    setError("");
    setConfirmingMatchId(matchId);

    try {
      const response = await request({
        method: "PATCH",
        url: `/api/blood-requests/matches/${matchId}/confirm-donation`,
      });

      setResponses((prev) =>
        prev.map((donor) =>
          donor.matchId === matchId
            ? {
                ...donor,
                status: "completed",
                totalDonations:
                  response.data.donor.totalDonations ?? donor.totalDonations,
              }
            : donor,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to confirm donation.");
    } finally {
      setConfirmingMatchId(null);
    }
  };

  return (
    <div className="mt-4 border-t border-rose-100 pt-4">
      <button
        onClick={fetchResponses}
        className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
      >
        <Users size={17} />
        View Donor Responses
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading donor responses...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : responses.length === 0 ? (
            <p className="rounded-lg bg-rose-50 p-4 text-sm text-gray-600">
              No donors have been matched with this request yet.
            </p>
          ) : (
            responses.map((donor) => (
              <div
                key={donor.matchId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-100 p-4"
              >
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {donor.donorName}
                  </h4>

                  <p className="mt-1 text-sm text-gray-500">
                    {donor.bloodGroup} · {donor.city}
                  </p>

                  <p className="text-xs text-gray-500">
                    Previous donations: {donor.totalDonations}
                  </p>

                  {donor.phone && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-rose-700">
                      <Phone size={15} />
                      {donor.phone}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      donor.status === "accepted" ||
                      donor.status === "completed"
                        ? "bg-rose-100 text-rose-800"
                        : donor.status === "declined"
                          ? "bg-gray-100 text-gray-600"
                          : donor.status === "expired"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {donor.status}
                  </span>

                  {donor.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => handleConfirmDonation(donor.matchId)}
                      disabled={confirmingMatchId === donor.matchId}
                      className="inline-flex items-center gap-2 rounded-full bg-[#FCE7ED] px-4 py-2 text-sm font-semibold text-[#96334F] transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} />
                      {confirmingMatchId === donor.matchId
                        ? "Confirming..."
                        : "Confirm Donation"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
