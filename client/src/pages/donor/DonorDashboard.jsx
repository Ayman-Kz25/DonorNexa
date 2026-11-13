import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import {
  Heart,
  Droplet,
  ClipboardList,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  MapPin,
  CalendarDays,
  Loader2,
  AlertCircle,
  Award,
  Medal,
  HeartPulse,
} from "lucide-react";

function DonorDashboard() {
  const { request } = useApi();

  const [matches, setMatches] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [matchesResponse, donationsResponse] = await Promise.all([
        request({
          method: "GET",
          url: "/api/donors/my-matches",
        }),
        request({
          method: "GET",
          url: "/api/donors/donation-history",
        }),
      ]);

      setMatches(matchesResponse.data.matches || []);
      setTotalDonations(donationsResponse.data.totalDonations || 0);
    } catch (err) {
      console.error("Donor dashboard error:", err);
      setError("Unable to load your dashboard information.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const pendingRequests = matches.filter(
    (match) => match.status === "pending",
  ).length;

  const acceptedRequests = matches.filter(
    (match) => match.status === "accepted",
  ).length;

  const recentMatches = matches.slice(0, 3);

  const donationBadges = [
    {
      title: "First Donation",
      description: "Completed your first blood donation.",
      milestone: 1,
      icon: Award,
    },
    {
      title: "Committed Donor",
      description: "Completed five blood donations.",
      milestone: 5,
      icon: Medal,
    },
    {
      title: "Life Saver",
      description: "Completed ten blood donations.",
      milestone: 10,
      icon: HeartPulse,
    },
  ];

  const summaryCards = [
    {
      title: "Total Donations",
      value: totalDonations,
      description: "Completed donations",
      icon: Heart,
    },
    {
      title: "Matched Requests",
      value: matches.length,
      description: "Requests matched with you",
      icon: ClipboardList,
    },
    {
      title: "Pending Responses",
      value: pendingRequests,
      description: "Awaiting your response",
      icon: Clock,
    },
    {
      title: "Accepted Requests",
      value: acceptedRequests,
      description: "Requests you accepted",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#782B40] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8C8C8]">
            Donor Portal
          </p>

          <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
            Welcome to Your Dashboard
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#F2DFDD]">
            Keep track of your donations, review matched blood requests, and
            manage your donor activity in one place.
          </p>

          <Link
            to="/donor/requests"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FFFDF9] px-5 py-3 text-sm font-semibold text-[#782B40] transition hover:bg-[#F2E2DC]"
          >
            View Blood Requests
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-6 h-44 w-44 rounded-full border border-white/10" />
        <Heart className="pointer-events-none absolute bottom-7 right-10 hidden h-24 w-24 text-white/10 sm:block" />
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] px-4 py-3 text-sm text-[#963D54]"
        >
          <AlertCircle size={19} />
          {error}
          <button
            onClick={fetchDashboardData}
            className="ml-auto font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A45B6D]">
              Overview
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#302923]">
              Your Activity
            </h2>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:opacity-50"
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="rounded-2xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2E2DC] text-[#782B40]">
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-5 text-sm font-medium text-[#81756A]">
                  {card.title}
                </p>

                <div className="mt-1 text-3xl font-semibold tabular-nums text-[#302923]">
                  {loading ? (
                    <Loader2
                      size={23}
                      className="animate-spin text-[#963D54]"
                    />
                  ) : (
                    card.value
                  )}
                </div>

                <p className="mt-2 text-xs text-[#A09286]">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Donation Badges */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A45B6D]">
            Achievements
          </p>

          <h2 className="mt-1 font-serif text-2xl font-semibold text-[#302923]">
            Your Donation Badges
          </h2>

          <p className="mt-1 text-sm text-[#81756A]">
            Every donation makes a difference. Keep reaching new milestones.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {donationBadges.map((badge) => {
            const unlocked = totalDonations >= badge.milestone;

            return (
              <article
                key={badge.milestone}
                className={`rounded-2xl border p-5 transition ${
                  unlocked
                    ? "border-[#D7B9B5] bg-[#FFFDF9]"
                    : "border-[#E8DDD4] bg-[#F8F5EF]"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${
                    unlocked
                      ? "bg-[#F2E2DC] text-[#782B40]"
                      : "bg-[#EDE9E4] text-[#A09286]"
                  }`}
                >
                  <badge.icon size={23} strokeWidth={1.8} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[#302923]">
                    {badge.title}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      unlocked
                        ? "bg-[#F2E2DC] text-[#782B40]"
                        : "bg-[#EDE9E4] text-[#81756A]"
                    }`}
                  >
                    {unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#81756A]">
                  {badge.description}
                </p>

                <p className="mt-3 text-xs font-semibold text-[#A45B6D]">
                  {badge.milestone} donation{badge.milestone > 1 ? "s" : ""}{" "}
                  required
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Recent Matched Requests */}
      <section className="rounded-3xl border border-[#E8DDD4] bg-[#FFFDF9] p-6 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#E8DDD4] pb-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A45B6D]">
              Recent Activity
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold text-[#302923]">
              Recent Matched Requests
            </h2>
            <p className="mt-1 text-sm text-[#81756A]">
              A quick look at your latest matched requests.
            </p>
          </div>

          <Link
            to="/donor/requests"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#782B40] transition hover:text-[#A45B6D]"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#963D54]" size={26} />
          </div>
        ) : recentMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DDCEC3] bg-[#F8F5EF] px-5 py-10 text-center">
            <Droplet size={28} className="mx-auto text-[#A45B6D]" />
            <h3 className="mt-3 font-semibold text-[#302923]">
              No Matched Requests
            </h3>
            <p className="mt-1 text-sm text-[#81756A]">
              Your matched blood requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMatches.map((match) => {
              const bloodRequest = match.bloodRequest;

              if (!bloodRequest) return null;

              return (
                <article
                  key={match._id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E8DDD4] p-4 transition hover:border-[#D7B9B5] sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F2E2DC] font-serif font-bold text-[#782B40]">
                      {bloodRequest.bloodGroup}
                    </div>

                    <div>
                      <h3 className="font-semibold text-[#302923]">
                        {bloodRequest.bloodGroup} Blood Required
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#81756A]">
                        <span>{bloodRequest.unitsRequired} unit(s)</span>

                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {bloodRequest.city}
                        </span>

                        <span className="flex items-center gap-1">
                          <CalendarDays size={13} />
                          {new Date(
                            bloodRequest.requiredBy,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                      match.status === "accepted" ||
                      match.status === "completed"
                        ? "bg-[#F2E2DC] text-[#782B40]"
                        : match.status === "pending"
                          ? "bg-[#F8F1DF] text-[#92702F]"
                          : match.status === "expired"
                            ? "bg-[#F8EDE2] text-[#98602F]"
                            : "bg-[#F1EFEC] text-[#756C65]"
                    }`}
                  >
                    {match.status}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default DonorDashboard;
