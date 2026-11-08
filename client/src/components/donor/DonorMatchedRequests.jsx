import { useCallback, useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import {
  RefreshCw,
  Droplet,
  MapPin,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HeartHandshake,
  Loader2,
} from "lucide-react";

export default function DonorMatchedRequests() {
  const { request } = useApi();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await request({
        method: "GET",
        url: "/api/donors/my-matches",
      });

      setMatches(response.data.matches || []);
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

  const handleResponse = async (matchId, status) => {
    try {
      setProcessingId(matchId);
      setError("");

      await request({
        method: "PATCH",
        url: `/api/donors/matches/${matchId}/respond`,
        data: { status },
      });

      setMatches((prev) =>
        prev.map((match) =>
          match._id === matchId ? { ...match, status } : match,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to submit your response.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Display-only helpers
  const statusStyle = (status) => {
    switch (status) {
      case "accepted":
        return "bg-[#FCE7ED] text-[#96334F] ring-rose-200";
      case "completed":
        return "bg-rose-100 text-rose-800 ring-rose-200";
      case "declined":
        return "bg-gray-100 text-gray-600 ring-gray-200";
      case "expired":
        return "bg-orange-50 text-orange-700 ring-orange-200";
      case "pending":
        return "bg-amber-50 text-amber-700 ring-amber-200";
      default:
        return "bg-gray-100 text-gray-600 ring-gray-200";
    }
  };

  const urgencyAccent = (urgency) => {
    switch (urgency) {
      case "critical":
        return "from-[#BE4565] to-[#96334F]";
      case "urgent":
        return "from-orange-400 to-orange-500";
      default:
        return "from-rose-200 to-rose-300";
    }
  };

  const urgencyBadge = (urgency) => {
    switch (urgency) {
      case "critical":
        return "bg-rose-100 text-rose-800 ring-rose-200";
      case "urgent":
        return "bg-orange-100 text-orange-700 ring-orange-200";
      default:
        return "bg-gray-100 text-gray-700 ring-gray-200";
    }
  };

  const getTimeLeft = (requiredBy) => {
    const diff = new Date(requiredBy).getTime() - Date.now();

    if (Number.isNaN(diff) || diff < 0) return null;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return { label: `Due in ${Math.max(minutes, 1)} min`, soon: true };
    }
    if (hours < 24) return { label: `Due in ${hours} h`, soon: true };

    return {
      label: `Due in ${days} ${days === 1 ? "day" : "days"}`,
      soon: false,
    };
  };

  const statusIcon = (status) => {
    if (status === "accepted" || status === "completed") {
      return <CheckCircle2 size={13} />;
    }

    if (status === "declined") return <XCircle size={13} />;
    if (status === "pending") return <Clock size={13} />;
    if (status === "expired") return <AlertCircle size={13} />;

    return null;
  };

  if (loading) {
    return (
      <section
        className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-100/50 sm:p-8"
        role="status"
        aria-label="Loading matched requests"
      >
        <div className="mb-6 flex items-center gap-3 text-[#96334F]">
          <Loader2 size={20} className="animate-spin text-[#BE4565]" />
          <p className="font-medium">Loading matched requests...</p>
        </div>

        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl border border-rose-100 bg-rose-50/60"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-100/50 sm:p-8">
      <div className="mb-7 flex items-start justify-between gap-4 border-b border-rose-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-[#BE4565] shadow-inner shadow-white/70 ring-1 ring-white/70">
            <HeartHandshake size={23} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#29232A]">
                Matched Blood Requests
              </h2>

              {matches.length > 0 && (
                <span className="rounded-full bg-[#FCE7ED] px-2.5 py-0.5 text-xs font-bold text-[#96334F] ring-1 ring-rose-200">
                  {matches.length}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Blood requests matched with your donor profile.
            </p>
          </div>
        </div>

        <button
          onClick={fetchMatches}
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-[#96334F] shadow-sm transition duration-200 hover:border-[#BE4565] hover:bg-[#FCE7ED]"
          title="Refresh requests"
          aria-label="Refresh requests"
        >
          <RefreshCw
            size={18}
            className="transition-transform duration-500 group-hover:rotate-180"
          />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertCircle size={20} className="shrink-0" />
          {error}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-rose-100 bg-gradient-to-b from-[#FFF8FA] to-[#FFF3F6] px-5 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FCE7ED] ring-8 ring-white">
            <Droplet size={30} className="text-[#BE4565]" />
          </div>
          <h3 className="mt-5 font-bold text-[#29232A]">No Matches Yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            No matched blood requests found currently.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const bloodRequest = match.bloodRequest;

            if (!bloodRequest) return null;

            const active =
              bloodRequest.status === "open" &&
              new Date(bloodRequest.requiredBy) > new Date();

            const timeLeft = active
              ? getTimeLeft(bloodRequest.requiredBy)
              : null;

            return (
              <div
                key={match._id}
                className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 pl-6 transition duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/70"
              >
                {/* Urgency accent bar */}
                <div
                  className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${urgencyAccent(bloodRequest.urgency)}`}
                />

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCE7ED] to-rose-200/70 text-xl font-bold text-[#96334F] ring-1 ring-white/70 transition duration-300 group-hover:from-[#BE4565] group-hover:to-[#96334F] group-hover:text-white">
                      {bloodRequest.bloodGroup}
                    </div>

                    <div>
                      <h3 className="font-bold text-[#29232A]">
                        {bloodRequest.bloodGroup} Blood Required
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{bloodRequest.unitsRequired} unit(s)</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${urgencyBadge(bloodRequest.urgency)}`}
                        >
                          {bloodRequest.urgency}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${statusStyle(match.status)}`}
                  >
                    {statusIcon(match.status)}
                    {match.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                  <p className="flex items-center gap-3 rounded-xl bg-[#FFF8FA] px-3.5 py-2.5">
                    <MapPin size={16} className="shrink-0 text-[#BE4565]" />
                    {bloodRequest.city}
                  </p>

                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-[#FFF8FA] px-3.5 py-2.5">
                    <span className="flex items-center gap-3">
                      <CalendarDays
                        size={16}
                        className="shrink-0 text-[#BE4565]"
                      />
                      Required by:{" "}
                      {new Date(bloodRequest.requiredBy).toLocaleDateString()}
                    </span>

                    {timeLeft && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                          timeLeft.soon
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-[#FCE7ED] text-[#96334F] ring-rose-200"
                        }`}
                      >
                        {timeLeft.label}
                      </span>
                    )}
                  </p>
                </div>

                {match.status === "pending" && active && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-rose-100 pt-5">
                    <button
                      disabled={processingId === match._id}
                      onClick={() => handleResponse(match._id, "accepted")}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#BE4565] to-[#A83A58] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-400/30 transition duration-200 hover:-translate-y-0.5 hover:from-[#A83A58] hover:to-[#96334F] hover:shadow-rose-400/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {processingId === match._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {processingId === match._id ? "Please wait..." : "Accept"}
                    </button>

                    <button
                      disabled={processingId === match._id}
                      onClick={() => handleResponse(match._id, "declined")}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-6 py-2.5 text-sm font-semibold text-[#96334F] shadow-sm transition duration-200 hover:border-[#BE4565] hover:bg-[#FCE7ED] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Decline
                    </button>
                  </div>
                )}

                {match.status === "completed" && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-[#FFF8FA] px-4 py-3 text-sm font-medium text-[#96334F]">
                    <HeartHandshake size={18} />
                    Donation completed successfully. Thank you for helping save
                    a life!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
