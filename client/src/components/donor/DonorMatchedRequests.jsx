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
  Loader2,
  Info,
  ArrowRight,
} from "lucide-react";

export default function DonorMatchedRequests() {
  const { request } = useApi();

  const [matches, setMatches] = useState([]);
  const [donorBloodGroup, setDonorBloodGroup] = useState("");
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
      setDonorBloodGroup(response.data.donorBloodGroup || "");
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

  const statusStyle = (status) => {
    switch (status) {
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

  const statusIcon = (status) => {
    if (status === "accepted" || status === "completed") {
      return <CheckCircle2 size={13} />;
    }

    if (status === "declined") return <XCircle size={13} />;

    if (status === "pending") return <Clock size={13} />;

    if (status === "expired" || status === "no_response") {
      return <AlertCircle size={13} />;
    }

    return null;
  };

  const urgencyStyle = (urgency) => {
    switch (urgency) {
      case "critical":
        return "bg-[#F3DDE1] text-[#842B43]";
      case "urgent":
        return "bg-[#F8EDE2] text-[#98602F]";
      default:
        return "bg-[#F1EFEC] text-[#756C65]";
    }
  };

  const urgencyAccent = (urgency) => {
    switch (urgency) {
      case "critical":
        return "border-l-[#842B43]";
      case "urgent":
        return "border-l-[#B47A45]";
      default:
        return "border-l-[#CDA5A5]";
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

    if (hours < 24) {
      return { label: `Due in ${hours} h`, soon: true };
    }

    return {
      label: `Due in ${days} ${days === 1 ? "day" : "days"}`,
      soon: false,
    };
  };

  const pendingCount = matches.filter(
    (match) => match.status === "pending",
  ).length;

  if (loading) {
    return (
      <section className="space-y-5" role="status">
        <div className="flex items-center gap-3 text-[#782B40]">
          <Loader2 size={19} className="animate-spin" />
          <p className="text-sm font-medium">Loading available requests...</p>
        </div>

        {[1, 2].map((item) => (
          <div
            key={item}
            className="h-44 animate-pulse rounded-2xl bg-[#F5EFE8]"
          />
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A45B6D]">
            Donor Portal
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-[#302923] sm:text-3xl">
            Available Blood Requests
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#81756A]">
            Requests matched with your blood group and donor eligibility. Review
            the details and respond when you can help.
          </p>
        </div>

        <button
          onClick={fetchMatches}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:border-[#A45B6D] hover:bg-[#F8F1ED]"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Donor information and count */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#E8DDD4] py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2E2DC] text-[#782B40]">
            <Droplet size={19} />
          </div>

          <div>
            <p className="text-xs text-[#81756A]">
              Your registered blood group
            </p>
            <p className="text-sm font-semibold text-[#302923]">
              {donorBloodGroup || "Not available"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="font-semibold text-[#302923]">
              {matches.length}
            </span>{" "}
            <span className="text-[#81756A]">Total matches</span>
          </div>

          <div className="h-5 w-px bg-[#E8DDD4]" />

          <div>
            <span className="font-semibold text-[#782B40]">{pendingCount}</span>{" "}
            <span className="text-[#81756A]">Awaiting response</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] px-4 py-3 text-sm text-[#963D54]"
        >
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDCEC3] bg-[#FFFDF9] px-5 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F2E2DC] text-[#782B40]">
            <Droplet size={25} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-[#302923]">
            No Matching Requests
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#81756A]">
            There are currently no blood requests matching your donor profile.
            New eligible requests will appear here.
          </p>

          <button
            onClick={fetchMatches}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#782B40] hover:text-[#602032]"
          >
            Check again <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const bloodRequest = match.bloodRequest;

            if (!bloodRequest) return null;

            const active =
              bloodRequest.status === "open" &&
              new Date(bloodRequest.requiredBy) > new Date() &&
              new Date(bloodRequest.expiresAt) > new Date();

            const timeLeft = active
              ? getTimeLeft(bloodRequest.requiredBy)
              : null;

            return (
              <article
                key={match._id}
                className={`overflow-hidden rounded-2xl border border-l-4 border-[#E8DDD4] bg-[#FFFDF9] ${urgencyAccent(
                  bloodRequest.urgency,
                )} transition hover:border-[#D7B9B5]`}
              >
                <div className="p-5 sm:p-6">
                  {/* Card heading */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2E2DC] font-semibold text-[#782B40]">
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

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${urgencyStyle(
                          bloodRequest.urgency,
                        )}`}
                      >
                        {bloodRequest.urgency}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(
                          match.status,
                        )}`}
                      >
                        {statusIcon(match.status)}
                        {match.status}
                      </span>
                    </div>
                  </div>

                  {/* Request details */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl bg-[#F8F5EF] px-3.5 py-3">
                      <MapPin size={17} className="shrink-0 text-[#963D54]" />
                      <div>
                        <p className="text-xs text-[#927E70]">Request city</p>
                        <p className="mt-0.5 text-sm font-medium text-[#302923]">
                          {bloodRequest.city || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-[#F8F5EF] px-3.5 py-3">
                      <CalendarDays
                        size={17}
                        className="shrink-0 text-[#963D54]"
                      />
                      <div>
                        <p className="text-xs text-[#927E70]">Required by</p>
                        <p className="mt-0.5 text-sm font-medium text-[#302923]">
                          {new Date(
                            bloodRequest.requiredBy,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility */}
                  {donorBloodGroup && (
                    <div className="mt-4 flex items-start gap-2.5 text-sm leading-6 text-[#655A51]">
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

                  {/* Deadline */}
                  {timeLeft && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#81756A]">
                      <Clock size={14} />
                      <span
                        className={
                          timeLeft.soon ? "text-[#98602F]" : "text-[#782B40]"
                        }
                      >
                        {timeLeft.label}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {match.status === "pending" && active && (
                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#E8DDD4] pt-5">
                      <button
                        disabled={processingId === match._id}
                        onClick={() => handleResponse(match._id, "accepted")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#782B40] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#602032] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId === match._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        {processingId === match._id
                          ? "Please wait..."
                          : "Accept Request"}
                      </button>

                      <button
                        disabled={processingId === match._id}
                        onClick={() => handleResponse(match._id, "declined")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DCCBC3] px-5 py-2.5 text-sm font-semibold text-[#782B40] transition hover:bg-[#F8F1ED] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Decline
                      </button>
                    </div>
                  )}

                  {match.status === "completed" && (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#E8DDD4] pt-4 text-sm font-medium text-[#782B40]">
                      <CheckCircle2 size={17} />
                      Donation completed successfully. Thank you for helping
                      save a life!
                    </div>
                  )}

                  {match.status === "accepted" && (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#E8DDD4] pt-4 text-sm text-[#782B40]">
                      <CheckCircle2 size={17} />
                      You accepted this request. The hospital can now contact
                      you.
                    </div>
                  )}

                  {match.status === "no_response" && (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#E8DDD4] pt-4 text-sm text-[#A33D45]">
                      <AlertCircle size={17} />
                      You did not respond before the response deadline.
                    </div>
                  )}

                  {(match.status === "expired" ||
                    (match.status === "pending" && !active)) && (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#E8DDD4] pt-4 text-sm text-[#98602F]">
                      <AlertCircle size={17} />
                      This request is no longer active.
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
