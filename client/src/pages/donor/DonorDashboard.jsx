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
import { formatDate } from "../../utils/dateTime";

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

      const results = await Promise.allSettled([
        request({
          method: "GET",
          url: "/api/donors/my-matches",
        }),
        request({
          method: "GET",
          url: "/api/donors/donation-history",
        }),
      ]);

      const [matchesResult, donationsResult] = results;

      if (matchesResult.status === "fulfilled") {
        const fetchedMatches = matchesResult.value.data.matches;
        setMatches(Array.isArray(fetchedMatches) ? fetchedMatches : []);
      }

      if (donationsResult.status === "fulfilled") {
        const donations = donationsResult.value.data.totalDonations;
        setTotalDonations(Number(donations) || 0);
      }

      if (
        matchesResult.status === "rejected" ||
        donationsResult.status === "rejected"
      ) {
        setError(
          "Some dashboard information could not be loaded. Please retry.",
        );
      }
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
    (match) => match.status === "pending" || match.status === "notified",
  ).length;

  const acceptedRequests = matches.filter(
    (match) => match.status === "accepted",
  ).length;

  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3);

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

  const getStatusStyle = (status) => {
    if (["accepted", "completed", "donated"].includes(status)) {
      return "bg-[#F2E2DC] text-[#782B40]";
    }

    if (["pending", "notified"].includes(status)) {
      return "bg-[#F8F1DF] text-[#92702F]";
    }

    if (["expired", "no_response"].includes(status)) {
      return "bg-[#F8EDE2] text-[#98602F]";
    }

    return "bg-[#F1EFEC] text-[#756C65]";
  };

  return (
    <div className="min-w-0 w-full space-y-5 sm:space-y-7 lg:space-y-8">
      {/* Welcome Section */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl bg-[#782B40] px-4 py-6 text-white sm:rounded-3xl sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#E8C8C8] sm:text-xs sm:tracking-[0.2em]">
            Donor Portal
          </p>

          <h1 className="mt-2 font-serif text-xl font-semibold leading-tight min-[380px]:text-2xl sm:mt-3 sm:text-3xl lg:text-4xl">
            Welcome to Your Dashboard
          </h1>

          <p className="mt-2 max-w-xl text-[11px] leading-5 text-[#F2DFDD] min-[380px]:text-xs sm:mt-3 sm:text-sm sm:leading-7">
            Keep track of your donations, review matched blood requests, and
            manage your donor activity in one place.
          </p>

          <Link
            to="/donor/requests"
            className="mt-4 inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-[#FFFDF9] px-4 py-2.5 text-[11px] font-semibold text-[#782B40] transition hover:bg-[#F2E2DC] min-[380px]:text-xs sm:mt-6 sm:px-5 sm:py-3 sm:text-sm"
          >
            View Blood Requests
            <ArrowRight size={15} className="shrink-0 sm:h-4 sm:w-4" />
          </Link>
        </div>

        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/10 sm:h-64 sm:w-64" />
        <div className="pointer-events-none absolute -right-8 -top-6 h-36 w-36 rounded-full border border-white/10 sm:h-44 sm:w-44" />

        <Heart className="pointer-events-none absolute bottom-6 right-8 hidden h-20 w-20 text-white/10 lg:block" />
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#E8C9C9] bg-[#FBEEEE] px-3 py-3 text-[11px] leading-5 text-[#963D54] min-[380px]:text-xs sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:text-sm"
        >
          <div className="flex min-w-0 items-start gap-2">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0 sm:h-[19px] sm:w-[19px]"
            />
            <p className="min-w-0 break-words">{error}</p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="w-fit shrink-0 font-semibold underline disabled:opacity-50 sm:ml-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <section className="min-w-0">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-3 sm:mb-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A45B6D] sm:text-xs sm:tracking-[0.16em]">
              Overview
            </p>

            <h2 className="mt-1 font-serif text-lg font-semibold text-[#302923] min-[380px]:text-xl sm:text-2xl">
              Your Activity
            </h2>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8DDD4] bg-[#FFFDF9] text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-2.5 min-[520px]:gap-3 sm:gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3 shadow-sm min-[380px]:p-3.5 sm:rounded-2xl sm:p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2E2DC] text-[#782B40] sm:h-11 sm:w-11 sm:rounded-xl">
                  <Icon size={18} className="sm:h-[21px] sm:w-[21px]" />
                </div>

                <p className="mt-3 break-words text-[10px] font-medium leading-4 text-[#81756A] min-[380px]:text-[11px] sm:mt-5 sm:text-sm sm:leading-normal">
                  {card.title}
                </p>

                <div className="mt-1 flex min-h-7 items-center text-xl font-semibold tabular-nums text-[#302923] min-[380px]:text-2xl sm:min-h-9 sm:text-3xl">
                  {loading ? (
                    <Loader2
                      size={20}
                      className="animate-spin text-[#963D54] sm:h-[23px] sm:w-[23px]"
                    />
                  ) : (
                    card.value
                  )}
                </div>

                <p className="mt-1.5 break-words text-[9px] leading-4 text-[#A09286] min-[380px]:text-[10px] sm:mt-2 sm:text-xs sm:leading-normal">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Donation Badges */}
      <section className="min-w-0">
        <div className="mb-3 sm:mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A45B6D] sm:text-xs sm:tracking-[0.16em]">
            Achievements
          </p>

          <h2 className="mt-1 font-serif text-lg font-semibold text-[#302923] min-[380px]:text-xl sm:text-2xl">
            Your Donation Badges
          </h2>

          <p className="mt-1 text-[11px] leading-5 text-[#81756A] min-[380px]:text-xs sm:text-sm">
            Every donation makes a difference. Keep reaching new milestones.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[520px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {donationBadges.map((badge) => {
            const unlocked = totalDonations >= badge.milestone;
            const BadgeIcon = badge.icon;

            return (
              <article
                key={badge.milestone}
                className={`min-w-0 rounded-xl border p-3.5 transition sm:rounded-2xl sm:p-5 ${
                  unlocked
                    ? "border-[#D7B9B5] bg-[#FFFDF9]"
                    : "border-[#E8DDD4] bg-[#F8F5EF]"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl ${
                    unlocked
                      ? "bg-[#F2E2DC] text-[#782B40]"
                      : "bg-[#EDE9E4] text-[#A09286]"
                  }`}
                >
                  <BadgeIcon
                    size={21}
                    strokeWidth={1.8}
                    className="sm:h-[23px] sm:w-[23px]"
                  />
                </div>

                <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2 sm:mt-4">
                  <h3 className="min-w-0 text-xs font-semibold text-[#302923] min-[380px]:text-sm sm:text-base">
                    {badge.title}
                  </h3>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold sm:px-2.5 sm:text-[11px] ${
                      unlocked
                        ? "bg-[#F2E2DC] text-[#782B40]"
                        : "bg-[#EDE9E4] text-[#81756A]"
                    }`}
                  >
                    {unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-5 text-[#81756A] sm:text-xs">
                  {badge.description}
                </p>

                <p className="mt-2 text-[10px] font-semibold text-[#A45B6D] sm:mt-3 sm:text-xs">
                  {badge.milestone} donation
                  {badge.milestone > 1 ? "s" : ""} required
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Recent Matched Requests */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 shadow-sm min-[380px]:p-4 sm:rounded-3xl sm:p-6 lg:p-7">
        <div className="mb-4 flex min-w-0 flex-col gap-2.5 border-b border-[#E8DDD4] pb-3.5 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between sm:mb-6 sm:pb-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A45B6D] sm:text-xs sm:tracking-[0.16em]">
              Recent Activity
            </p>

            <h2 className="mt-1 font-serif text-base font-semibold text-[#302923] min-[380px]:text-lg sm:text-xl">
              Recent Matched Requests
            </h2>

            <p className="mt-1 text-[10px] leading-5 text-[#81756A] min-[380px]:text-xs sm:text-sm">
              A quick look at your latest matched requests.
            </p>
          </div>

          <Link
            to="/donor/requests"
            className="inline-flex w-fit shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[#782B40] transition hover:text-[#A45B6D] min-[380px]:text-xs sm:gap-2 sm:text-sm"
          >
            View All
            <ArrowRight size={14} className="sm:h-4 sm:w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8 sm:py-10">
            <Loader2 className="animate-spin text-[#963D54]" size={24} />
          </div>
        ) : recentMatches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#DDCEC3] bg-[#F8F5EF] px-3 py-7 text-center sm:rounded-2xl sm:px-5 sm:py-10">
            <Droplet
              size={25}
              className="mx-auto text-[#A45B6D] sm:h-7 sm:w-7"
            />

            <h3 className="mt-3 text-xs font-semibold text-[#302923] sm:text-base">
              No Matched Requests
            </h3>

            <p className="mt-1 text-[10px] leading-5 text-[#81756A] sm:text-sm">
              Your matched blood requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {recentMatches.map((match) => {
              const bloodRequest = match.bloodRequest;

              if (!bloodRequest) return null;

              return (
                <article
                  key={match._id}
                  className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-[#E8DDD4] p-3 transition hover:border-[#D7B9B5] min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between sm:gap-4 sm:rounded-2xl sm:p-4"
                >
                  <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F2E2DC] font-serif text-xs font-bold text-[#782B40] sm:h-12 sm:w-12 sm:rounded-xl sm:text-sm">
                      {bloodRequest.bloodGroup}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-xs font-semibold text-[#302923] sm:text-base">
                        {bloodRequest.bloodGroup} Blood Required
                      </h3>

                      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[10px] text-[#81756A] sm:mt-2 sm:gap-x-3 sm:text-xs">
                        <span>{bloodRequest.unitsRequired} unit(s)</span>

                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin
                            size={12}
                            className="shrink-0 sm:h-[13px] sm:w-[13px]"
                          />
                          <span className="break-words">
                            {bloodRequest.city}
                          </span>
                        </span>

                        <span className="flex items-center gap-1">
                          <CalendarDays
                            size={12}
                            className="shrink-0 sm:h-[13px] sm:w-[13px]"
                          />
                          {formatDate(bloodRequest.requiredBy)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`w-fit max-w-full shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize sm:px-3 sm:py-1.5 sm:text-xs ${getStatusStyle(
                      match.status,
                    )}`}
                  >
                    {match.status.replace("_", " ")}
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
