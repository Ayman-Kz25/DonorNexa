import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Heart,
  Building2,
  Clock,
  ShieldCheck,
  Activity,
  CheckCircle,
  Ban,
  RefreshCw,
  AlertCircle,
  Droplet,
  TrendingUp,
  Hospital,
  ClipboardCheck,
} from "lucide-react";

import { useApi } from "../../hooks/useApi";
import AdminDashboardCharts from "../../components/admin/AdminDashboardCharts";

const AdminDashboard = () => {
  const { request } = useApi();

  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    setAnalyticsError("");

    const [overviewResult, analyticsResult] = await Promise.allSettled([
      request({
        method: "GET",
        url: "/api/admin/overview",
      }),
      request({
        method: "GET",
        url: "/api/admin/analytics",
      }),
    ]);

    if (overviewResult.status === "fulfilled") {
      setOverview(overviewResult.value.data.overview);
    } else {
      setError(
        overviewResult.reason.response?.data?.message ||
          "Unable to load dashboard overview.",
      );
    }

    if (analyticsResult.status === "fulfilled") {
      setAnalytics(analyticsResult.value.data.analytics);
    } else {
      setAnalyticsError(
        analyticsResult.reason.response?.data?.message ||
          "Unable to load dashboard analytics.",
      );
    }

    setLoading(false);
  }, [request]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = [
    {
      label: "Total Users",
      value: overview?.totalUsers,
      icon: Users,
      description: "Registered platform users",
      accent: "bg-[#F2E2DC] text-[#87364D]",
    },
    {
      label: "Total Donors",
      value: overview?.totalDonors,
      icon: Heart,
      description: "Registered blood donors",
      accent: "bg-[#F8E8E9] text-[#963D54]",
    },
    {
      label: "Total Hospitals",
      value: overview?.totalHospitals,
      icon: Building2,
      description: "Registered hospitals",
      accent: "bg-[#F1E9E2] text-[#87654D]",
    },
    {
      label: "Pending Hospitals",
      value: overview?.pendingHospitals,
      icon: Clock,
      description: "Awaiting verification",
      accent: "bg-[#F8EDDA] text-[#A27635]",
    },
    {
      label: "Verified Hospitals",
      value: overview?.verifiedHospitals,
      icon: ShieldCheck,
      description: "Successfully verified",
      accent: "bg-[#E9EEE8] text-[#58745B]",
    },
    {
      label: "Active Requests",
      value: overview?.activeRequests,
      icon: Activity,
      description: "Currently open requests",
      accent: "bg-[#F8E8E9] text-[#963D54]",
    },
    {
      label: "Fulfilled Requests",
      value: overview?.fulfilledRequests,
      icon: CheckCircle,
      description: "Successfully fulfilled",
      accent: "bg-[#E9EEE8] text-[#58745B]",
    },
    {
      label: "Blocked Users",
      value: overview?.blockedUsers,
      icon: Ban,
      description: "Currently inactive accounts",
      accent: "bg-[#F5E9E5] text-[#A15C4F]",
    },
  ];

  const getPercentage = (value, total) => {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  };

  const hospitalPercentage = getPercentage(
    overview?.verifiedHospitals || 0,
    overview?.totalHospitals || 0,
  );

  const requestTotal =
    (overview?.activeRequests || 0) + (overview?.fulfilledRequests || 0);

  const fulfilledPercentage = getPercentage(
    overview?.fulfilledRequests || 0,
    requestTotal,
  );

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 lg:space-y-8">
      {/* HEADER */}
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#963D54] sm:text-[10px] sm:tracking-[0.18em] md:text-xs">
            Administration
          </p>

          <h1 className="break-words font-serif text-xl font-semibold leading-tight text-[#302923] min-[400px]:text-2xl sm:text-3xl lg:text-4xl">
            Dashboard Overview
          </h1>

          <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-[#81756A] sm:text-xs md:text-sm">
            Monitor users, hospitals, donors, and blood request activity.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-xs font-medium text-[#782B40] transition hover:border-[#D8B7BC] hover:bg-[#F8F0ED] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start sm:text-sm md:self-center"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* WELCOME BANNER */}
      <div className="relative min-w-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#782B40] via-[#87364D] to-[#963D54] px-4 py-5 text-white min-[400px]:px-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
        <div className="relative z-10 max-w-xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/65 sm:text-[10px] sm:tracking-[0.2em] md:text-xs">
            DonorNexa Administration
          </p>

          <h2 className="mt-2 font-serif text-lg font-semibold leading-tight min-[400px]:text-xl sm:mt-2.5 sm:text-2xl lg:text-3xl">
            Platform at a Glance
          </h2>

          <p className="mt-2 text-[11px] leading-5 text-white/75 sm:mt-2.5 sm:text-xs sm:leading-6 md:text-sm">
            Manage platform operations, monitor hospital verification, and track
            blood donation requests from one place.
          </p>
        </div>

        <div className="absolute -right-8 -top-16 hidden size-64 rounded-full border border-white/10 sm:block" />
        <div className="absolute -right-2 -top-10 hidden size-48 rounded-full border border-white/10 sm:block" />

        <Droplet
          size={105}
          strokeWidth={0.8}
          className="absolute bottom-5 right-12 hidden text-white/15 sm:block"
        />
      </div>

      {/* OVERVIEW ERROR */}
      {error && (
        <div className="flex min-w-0 flex-wrap items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-[11px] text-red-700 sm:gap-3 sm:px-4 sm:text-sm">
          <AlertCircle size={17} className="shrink-0" />
          <span className="min-w-0 flex-1 break-words">{error}</span>

          <button
            onClick={fetchDashboardData}
            className="shrink-0 text-xs font-semibold underline sm:text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* PLATFORM STATISTICS */}
      <section className="min-w-0">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2 sm:mb-5">
          <div className="min-w-0">
            <h2 className="font-serif text-base font-semibold text-[#302923] min-[400px]:text-lg sm:text-xl">
              Platform Statistics
            </h2>

            <p className="mt-1 text-[10px] leading-4 text-[#A0968D] sm:text-xs md:text-sm">
              Current registration and activity figures
            </p>
          </div>

          <TrendingUp
            size={18}
            className="shrink-0 text-[#963D54] sm:size-[21px]"
          />
        </div>

        {loading && !overview ? (
          <div className="grid min-w-0 grid-cols-2 gap-2 min-[480px]:gap-3 lg:gap-4 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-[112px] animate-pulse rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] min-[400px]:h-[120px] sm:h-[132px] lg:h-[145px]"
              />
            ))}
          </div>
        ) : overview ? (
          <div className="grid min-w-0 grid-cols-2 gap-2 min-[480px]:gap-3 lg:gap-4 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="group flex min-w-0 flex-col rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-2.5 transition duration-200 hover:border-[#D8B7BC] hover:shadow-md hover:shadow-[#782B40]/5 min-[400px]:p-3 sm:rounded-xl sm:p-4 lg:p-4 xl:hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div
                      className={`shrink-0 rounded-md p-1.5 min-[400px]:p-2 sm:rounded-lg sm:p-2.5 ${stat.accent}`}
                    >
                      <Icon
                        size={15}
                        strokeWidth={1.8}
                        className="min-[400px]:size-4 sm:size-[18px]"
                      />
                    </div>

                    <span className="truncate text-[8px] font-medium text-[#B0A49A] min-[400px]:text-[9px] sm:text-[10px]">
                      DonorNexa
                    </span>
                  </div>

                  <p className="mt-2.5 break-words text-[10px] font-medium leading-tight text-[#81756A] min-[400px]:text-[11px] sm:mt-3 sm:text-xs lg:text-[13px]">
                    {stat.label}
                  </p>

                  <p className="mt-1 break-all font-serif text-xl font-semibold leading-tight tabular-nums text-[#302923] min-[400px]:text-2xl sm:text-[26px] lg:text-3xl">
                    {stat.value ?? 0}
                  </p>

                  <p className="mt-1 text-[9px] leading-3.5 text-[#A0968D] min-[400px]:text-[10px] sm:mt-1.5 sm:text-[11px] sm:leading-4">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>
        ) : !error ? (
          <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-9 text-center text-[11px] text-[#81756A] sm:py-12 sm:text-sm">
            No overview data available.
          </div>
        ) : null}
      </section>

      {/* OPERATIONAL OVERVIEW */}
      {overview && (
        <section className="min-w-0">
          <div className="mb-3 sm:mb-5">
            <h2 className="font-serif text-base font-semibold text-[#302923] min-[400px]:text-lg sm:text-xl">
              Operational Overview
            </h2>

            <p className="mt-1 text-[10px] leading-4 text-[#A0968D] sm:text-xs md:text-sm">
              Hospital verification and blood request progress
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 min-[600px]:grid-cols-2 sm:gap-5">
            {/* HOSPITAL VERIFICATION */}
            <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 min-[400px]:p-4 sm:p-6">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="shrink-0 rounded-lg bg-[#F2E2DC] p-2.5 text-[#87364D] sm:rounded-xl sm:p-3">
                  <Hospital size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="break-words text-xs font-semibold text-[#302923] sm:text-sm md:text-base">
                    Hospital Verification
                  </h3>

                  <p className="mt-0.5 text-[10px] leading-4 text-[#A0968D] sm:text-[11px] md:text-xs">
                    Verification status distribution
                  </p>
                </div>
              </div>

              <div className="mt-5 flex min-w-0 items-end justify-between gap-2 sm:mt-7 sm:gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-2xl font-semibold text-[#302923] sm:text-3xl">
                    {hospitalPercentage}%
                  </p>

                  <p className="mt-1 text-[10px] text-[#81756A] sm:text-xs">
                    Verified hospitals
                  </p>
                </div>

                <p className="shrink-0 text-right text-[10px] text-[#81756A] sm:text-xs md:text-sm">
                  {overview.verifiedHospitals || 0} of{" "}
                  {overview.totalHospitals || 0}
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F0E8E2] sm:h-2.5">
                <div
                  className="h-full rounded-full bg-[#963D54] transition-all duration-500"
                  style={{ width: `${hospitalPercentage}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EFE7E0] pt-3 sm:mt-5 sm:pt-4">
                <div className="flex items-center gap-2 text-[11px] text-[#81756A] sm:text-xs md:text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-[#963D54]" />
                  Verified
                </div>

                <span className="text-xs font-semibold tabular-nums text-[#302923] sm:text-sm">
                  {overview.verifiedHospitals || 0}
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-[#81756A] sm:text-xs md:text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-[#C49A58]" />
                  Pending
                </div>

                <span className="text-xs font-semibold tabular-nums text-[#302923] sm:text-sm">
                  {overview.pendingHospitals || 0}
                </span>
              </div>
            </div>

            {/* BLOOD REQUEST STATUS */}
            <div className="min-w-0 rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-3.5 min-[400px]:p-4 sm:p-6">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="shrink-0 rounded-lg bg-[#F8E8E9] p-2.5 text-[#963D54] sm:rounded-xl sm:p-3">
                  <ClipboardCheck size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="break-words text-xs font-semibold text-[#302923] sm:text-sm md:text-base">
                    Blood Request Status
                  </h3>

                  <p className="mt-0.5 text-[10px] leading-4 text-[#A0968D] sm:text-[11px] md:text-xs">
                    Active and fulfilled requests
                  </p>
                </div>
              </div>

              <div className="mt-5 flex min-w-0 items-end justify-between gap-2 sm:mt-7 sm:gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-2xl font-semibold text-[#302923] sm:text-3xl">
                    {fulfilledPercentage}%
                  </p>

                  <p className="mt-1 text-[10px] text-[#81756A] sm:text-xs">
                    Fulfilled requests
                  </p>
                </div>

                <p className="shrink-0 text-right text-[10px] text-[#81756A] sm:text-xs md:text-sm">
                  {overview.fulfilledRequests || 0} of {requestTotal}
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F0E8E2] sm:h-2.5">
                <div
                  className="h-full rounded-full bg-[#963D54] transition-all duration-500"
                  style={{ width: `${fulfilledPercentage}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EFE7E0] pt-3 sm:mt-5 sm:pt-4">
                <div className="flex items-center gap-2 text-[11px] text-[#81756A] sm:text-xs md:text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-[#C49A58]" />
                  Active
                </div>

                <span className="text-xs font-semibold tabular-nums text-[#302923] sm:text-sm">
                  {overview.activeRequests || 0}
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-[#81756A] sm:text-xs md:text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-[#963D54]" />
                  Fulfilled
                </div>

                <span className="text-xs font-semibold tabular-nums text-[#302923] sm:text-sm">
                  {overview.fulfilledRequests || 0}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BLOOD DONATION ANALYTICS */}
      <div className="w-full min-w-0">
        <AdminDashboardCharts
          analytics={analytics}
          loading={loading}
          error={analyticsError}
          onRetry={fetchDashboardData}
        />
      </div>

      {/* FOOTER */}
      <div className="flex min-w-0 items-start gap-2 border-t border-[#E8DDD4] pt-4 text-[10px] leading-5 text-[#A0968D] sm:items-center sm:pt-5 sm:text-xs">
        <Activity size={14} className="mt-0.5 shrink-0 sm:mt-0" />
        <span className="min-w-0">
          Dashboard figures are based on the latest available platform data.
        </span>
      </div>
    </div>
  );
};

export default AdminDashboard;
