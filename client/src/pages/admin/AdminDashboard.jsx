import { useCallback, useEffect, useMemo, useState } from "react";
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
  BarChart3,
  ArrowUpRight,
  Package,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useApi } from "../../hooks/useApi";

// --------------------------------------------------
// CUSTOM CHART TOOLTIP
// --------------------------------------------------

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[150px] rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-3 shadow-xl shadow-[#302923]/10">
      <p className="mb-2 text-xs font-semibold text-[#81756A]">{label}</p>

      {payload.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-5 py-1"
        >
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-[#81756A]">{item.name}</span>
          </div>

          <span className="text-sm font-semibold tabular-nums text-[#302923]">
            {item.value}
            {item.dataKey === "rate" ? "%" : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

// --------------------------------------------------
// SMALL CHART SUMMARY
// --------------------------------------------------

const ChartMetric = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-2.5">
    <div className="rounded-lg bg-[#F8E8E9] p-2 text-[#963D54]">
      <Icon size={16} strokeWidth={1.8} />
    </div>
    <div>
      <p className="text-[11px] text-[#A0968D]">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-[#302923]">
        {value}
      </p>
    </div>
  </div>
);

// --------------------------------------------------
// CHART CARD HEADER
// --------------------------------------------------

const ChartHeader = ({ number, title, description, tag }) => (
  <div className="mb-5 flex items-start justify-between gap-3">
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F8E8E9] text-xs font-semibold text-[#963D54]">
        {number}
      </span>

      <div>
        <h3 className="font-semibold text-[#302923]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#A0968D]">{description}</p>
      </div>
    </div>

    {tag && (
      <span className="shrink-0 rounded-full bg-[#F5EEE9] px-3 py-1 text-[10px] font-medium text-[#87654D]">
        {tag}
      </span>
    )}
  </div>
);

// --------------------------------------------------
// ADMIN DASHBOARD
// --------------------------------------------------

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

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // ANALYTICS DATA
  // --------------------------------------------------

  const requestsPerWeek = analytics?.requestsPerWeek || [];
  const bloodGroupComparison = analytics?.bloodGroupComparison || [];
  const fulfilmentRate = analytics?.fulfilmentRate || [];

  const chartSummary = useMemo(() => {
    const totalWeeklyRequests = requestsPerWeek.reduce(
      (sum, item) => sum + (item.totalRequests || 0),
      0,
    );

    const totalDemand = bloodGroupComparison.reduce(
      (sum, item) => sum + (item.demand || 0),
      0,
    );

    const totalSupply = bloodGroupComparison.reduce(
      (sum, item) => sum + (item.supply || 0),
      0,
    );

    const highestDemandGroup = [...bloodGroupComparison].sort(
      (a, b) => (b.demand || 0) - (a.demand || 0),
    )[0];

    const averageFulfilmentRate =
      fulfilmentRate.length > 0
        ? fulfilmentRate.reduce((sum, item) => sum + (item.rate || 0), 0) /
          fulfilmentRate.length
        : 0;

    return {
      totalWeeklyRequests,
      totalDemand,
      totalSupply,
      highestDemandGroup:
        highestDemandGroup?.demand > 0 ? highestDemandGroup.bloodGroup : "N/A",
      averageFulfilmentRate: averageFulfilmentRate.toFixed(1),
    };
  }, [requestsPerWeek, bloodGroupComparison, fulfilmentRate]);

  const hasChartData = (data) => Array.isArray(data) && data.length > 0;

  const chartAxisStyle = {
    fill: "#A0968D",
    fontSize: 11,
    fontWeight: 500,
  };

  const chartGridColor = "#F0E8E2";

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="space-y-9">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#963D54]">
            Administration
          </p>

          <h1 className="font-serif text-3xl font-semibold text-[#302923]">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-sm text-[#81756A]">
            Monitor users, hospitals, donors, and blood request activity.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:border-[#D8B7BC] hover:bg-[#F8F0ED] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* WELCOME BANNER */}

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#782B40] via-[#87364D] to-[#963D54] px-7 py-8 text-white sm:px-9">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
            DonorNexa Administration
          </p>

          <h2 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">
            Platform at a Glance
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/75">
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
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            onClick={fetchDashboardData}
            className="ml-auto font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* PLATFORM STATISTICS */}

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Platform Statistics
            </h2>

            <p className="mt-1 text-sm text-[#A0968D]">
              Current registration and activity figures
            </p>
          </div>

          <TrendingUp size={21} className="text-[#963D54]" />
        </div>

        {loading && !overview ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]"
              />
            ))}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="group rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#D8B7BC] hover:shadow-lg hover:shadow-[#782B40]/5"
                >
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl p-3 ${stat.accent}`}>
                      <Icon size={21} strokeWidth={1.8} />
                    </div>

                    <span className="text-xs font-medium text-[#B0A49A]">
                      DonorNexa
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-medium text-[#81756A]">
                    {stat.label}
                  </p>

                  <p className="mt-1 font-serif text-3xl font-semibold tabular-nums text-[#302923]">
                    {stat.value ?? 0}
                  </p>

                  <p className="mt-2 text-xs text-[#A0968D]">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>
        ) : !error ? (
          <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-5 py-12 text-center text-sm text-[#81756A]">
            No overview data available.
          </div>
        ) : null}
      </section>

      {/* OPERATIONAL OVERVIEW */}

      {overview && (
        <section>
          <div className="mb-5">
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Operational Overview
            </h2>

            <p className="mt-1 text-sm text-[#A0968D]">
              Hospital verification and blood request progress
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* HOSPITAL VERIFICATION */}

            <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#F2E2DC] p-3 text-[#87364D]">
                  <Hospital size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-[#302923]">
                    Hospital Verification
                  </h3>

                  <p className="text-xs text-[#A0968D]">
                    Verification status distribution
                  </p>
                </div>
              </div>

              <div className="mt-7 flex items-end justify-between">
                <div>
                  <p className="font-serif text-3xl font-semibold text-[#302923]">
                    {hospitalPercentage}%
                  </p>

                  <p className="mt-1 text-xs text-[#81756A]">
                    Verified hospitals
                  </p>
                </div>

                <p className="text-sm text-[#81756A]">
                  {overview.verifiedHospitals || 0} of{" "}
                  {overview.totalHospitals || 0}
                </p>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#F0E8E2]">
                <div
                  className="h-full rounded-full bg-[#963D54] transition-all duration-500"
                  style={{ width: `${hospitalPercentage}%` }}
                />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#EFE7E0] pt-4">
                <div className="flex items-center gap-2 text-sm text-[#81756A]">
                  <span className="size-2 rounded-full bg-[#963D54]" />
                  Verified
                </div>

                <span className="font-semibold text-[#302923]">
                  {overview.verifiedHospitals || 0}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#81756A]">
                  <span className="size-2 rounded-full bg-[#C49A58]" />
                  Pending
                </div>

                <span className="font-semibold text-[#302923]">
                  {overview.pendingHospitals || 0}
                </span>
              </div>
            </div>

            {/* BLOOD REQUEST STATUS */}

            <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#F8E8E9] p-3 text-[#963D54]">
                  <ClipboardCheck size={22} />
                </div>

                <div>
                  <h3 className="font-semibold text-[#302923]">
                    Blood Request Status
                  </h3>

                  <p className="text-xs text-[#A0968D]">
                    Active and fulfilled requests
                  </p>
                </div>
              </div>

              <div className="mt-7 flex items-end justify-between">
                <div>
                  <p className="font-serif text-3xl font-semibold text-[#302923]">
                    {fulfilledPercentage}%
                  </p>

                  <p className="mt-1 text-xs text-[#81756A]">
                    Fulfilled requests
                  </p>
                </div>

                <p className="text-sm text-[#81756A]">
                  {overview.fulfilledRequests || 0} of {requestTotal}
                </p>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#F0E8E2]">
                <div
                  className="h-full rounded-full bg-[#963D54] transition-all duration-500"
                  style={{ width: `${fulfilledPercentage}%` }}
                />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#EFE7E0] pt-4">
                <div className="flex items-center gap-2 text-sm text-[#81756A]">
                  <span className="size-2 rounded-full bg-[#C49A58]" />
                  Active
                </div>

                <span className="font-semibold text-[#302923]">
                  {overview.activeRequests || 0}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#81756A]">
                  <span className="size-2 rounded-full bg-[#963D54]" />
                  Fulfilled
                </div>

                <span className="font-semibold text-[#302923]">
                  {overview.fulfilledRequests || 0}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BLOOD DONATION ANALYTICS */}

      <section>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={21} className="text-[#963D54]" />

              <h2 className="font-serif text-xl font-semibold text-[#302923]">
                Blood Donation Analytics
              </h2>
            </div>

            <p className="mt-1 text-sm text-[#A0968D]">
              Insights into request activity, blood availability, and fulfilment
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F8E8E9] px-3 py-1.5 text-xs font-medium text-[#963D54]">
            <span className="size-1.5 rounded-full bg-[#963D54]" />
            Last 8 weeks
          </span>
        </div>

        {analyticsError && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} />
            <span>{analyticsError}</span>

            <button
              onClick={fetchDashboardData}
              className="ml-auto font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !analytics ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]" />
            <div className="h-80 animate-pulse rounded-xl border border-[#E8DDD4] bg-[#FFFDF9]" />
            <div className="h-80 animate-pulse rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] lg:col-span-2" />
          </div>
        ) : analytics ? (
          <div className="space-y-5">
            {/* TOP CHARTS */}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* 01 - WEEKLY REQUESTS AREA CHART */}

              <div className="overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 sm:p-6">
                <ChartHeader
                  number="01"
                  title="Requests per Week"
                  description="Weekly blood request activity and fulfilled requests"
                  tag="Area chart"
                />

                <div className="mb-5 flex flex-wrap gap-x-7 gap-y-3">
                  <ChartMetric
                    label="Total requests"
                    value={chartSummary.totalWeeklyRequests}
                    icon={ClipboardCheck}
                  />

                  <ChartMetric
                    label="Weeks tracked"
                    value={requestsPerWeek.length}
                    icon={Activity}
                  />
                </div>

                {hasChartData(requestsPerWeek) ? (
                  <ResponsiveContainer width="100%" height={265}>
                    <AreaChart
                      data={requestsPerWeek}
                      margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="requestGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#963D54"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#963D54"
                            stopOpacity={0.015}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 5"
                        vertical={false}
                        stroke={chartGridColor}
                      />

                      <XAxis
                        dataKey="week"
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                        dy={9}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: "#D8B7BC", strokeDasharray: "4 4" }}
                      />

                      <Area
                        type="monotone"
                        dataKey="totalRequests"
                        name="Total requests"
                        stroke="#963D54"
                        strokeWidth={3}
                        fill="url(#requestGradient)"
                        activeDot={{
                          r: 6,
                          fill: "#963D54",
                          stroke: "#FFFDF9",
                          strokeWidth: 3,
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="fulfilledRequests"
                        name="Fulfilled requests"
                        stroke="#C49A58"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        fill="none"
                        activeDot={{
                          r: 5,
                          fill: "#C49A58",
                          stroke: "#FFFDF9",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[265px] items-center justify-center rounded-xl bg-[#FBF7F3] text-sm text-[#A0968D]">
                    No weekly request data available yet.
                  </div>
                )}
              </div>

              {/* 02 - BLOOD GROUP GROUPED BAR CHART */}

              <div className="overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 sm:p-6">
                <ChartHeader
                  number="02"
                  title="Blood Group Demand vs. Supply"
                  description="Outstanding requested units compared with available inventory"
                  tag="Grouped bar"
                />

                <div className="mb-5 flex flex-wrap gap-x-7 gap-y-3">
                  <ChartMetric
                    label="Outstanding demand"
                    value={chartSummary.totalDemand}
                    icon={Droplet}
                  />

                  <ChartMetric
                    label="Available supply"
                    value={chartSummary.totalSupply}
                    icon={Package}
                  />
                </div>

                {hasChartData(bloodGroupComparison) ? (
                  <ResponsiveContainer width="100%" height={265}>
                    <BarChart
                      data={bloodGroupComparison}
                      barGap={7}
                      margin={{ top: 12, right: 5, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 5"
                        vertical={false}
                        stroke={chartGridColor}
                      />

                      <XAxis
                        dataKey="bloodGroup"
                        tick={{
                          ...chartAxisStyle,
                          fontWeight: 600,
                        }}
                        axisLine={false}
                        tickLine={false}
                        dy={9}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "#F8F0ED" }}
                      />

                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{
                          fontSize: "11px",
                          color: "#81756A",
                          paddingTop: "18px",
                        }}
                      />

                      <Bar
                        dataKey="demand"
                        name="Demand"
                        fill="#963D54"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={24}
                      />

                      <Bar
                        dataKey="supply"
                        name="Available supply"
                        fill="#C49A58"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[265px] items-center justify-center rounded-xl bg-[#FBF7F3] text-sm text-[#A0968D]">
                    No blood group data available yet.
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between border-t border-[#F0E8E2] pt-4">
                  <span className="text-xs text-[#A0968D]">
                    Highest outstanding demand
                  </span>

                  <span className="rounded-lg bg-[#F8E8E9] px-3 py-1 text-xs font-semibold text-[#963D54]">
                    {chartSummary.highestDemandGroup}
                  </span>
                </div>
              </div>
            </div>

            {/* 03 - WEEKLY FULFILMENT LINE CHART */}

            <div className="overflow-hidden rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <ChartHeader
                  number="03"
                  title="Weekly Fulfilment Rate"
                  description="Percentage of requests created each week that are currently fulfilled"
                  tag="Line chart"
                />

                <div className="rounded-xl bg-[#F8E8E9] px-4 py-3 sm:min-w-[145px]">
                  <p className="text-[11px] font-medium text-[#A16A78]">
                    Average weekly rate
                  </p>

                  <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-[#87364D]">
                    {chartSummary.averageFulfilmentRate}%
                  </p>
                </div>
              </div>

              {hasChartData(fulfilmentRate) ? (
                <ResponsiveContainer width="100%" height={290}>
                  <LineChart
                    data={fulfilmentRate}
                    margin={{ top: 18, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 5"
                      vertical={false}
                      stroke={chartGridColor}
                    />

                    <XAxis
                      dataKey="week"
                      tick={chartAxisStyle}
                      axisLine={false}
                      tickLine={false}
                      dy={9}
                    />

                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={chartAxisStyle}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#D8B7BC", strokeDasharray: "4 4" }}
                    />

                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Fulfilment rate"
                      stroke="#963D54"
                      strokeWidth={3.5}
                      dot={{
                        r: 5,
                        fill: "#FFFDF9",
                        stroke: "#963D54",
                        strokeWidth: 2.5,
                      }}
                      activeDot={{
                        r: 8,
                        fill: "#963D54",
                        stroke: "#F2E2DC",
                        strokeWidth: 4,
                      }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[290px] items-center justify-center rounded-xl bg-[#FBF7F3] text-sm text-[#A0968D]">
                  No fulfilment data available yet.
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0E8E2] pt-4">
                <div className="flex items-center gap-2 text-xs text-[#81756A]">
                  <span className="size-2 rounded-full bg-[#963D54]" />
                  Weekly fulfilment percentage
                </div>

                <span className="text-xs text-[#A0968D]">Scale: 0–100%</span>
              </div>
            </div>
          </div>
        ) : !analyticsError ? (
          <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-5 py-12 text-center text-sm text-[#81756A]">
            Analytics data is not available.
          </div>
        ) : null}
      </section>

      {/* FOOTER */}

      <div className="flex items-center gap-2 border-t border-[#E8DDD4] pt-5 text-xs text-[#A0968D]">
        <Activity size={15} />
        Dashboard figures are based on the latest available platform data.
      </div>
    </div>
  );
};

export default AdminDashboard;
