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
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
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

  const requestsPerWeek = analytics?.requestsPerWeek || [];
  const bloodGroupComparison = analytics?.bloodGroupComparison || [];
  const fulfilmentRate = analytics?.fulfilmentRate || [];

  const chartTooltipStyle = {
    backgroundColor: "#FFFDF9",
    border: "1px solid #E8DDD4",
    borderRadius: "10px",
    color: "#302923",
    fontSize: "12px",
  };

  const renderChartEmpty = (data) => {
    if (data.length > 0) return false;

    return true;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
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
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-2.5 text-sm font-medium text-[#782B40] transition hover:bg-[#F2E2DC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#782B40] px-7 py-8 text-white sm:px-9">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
            DonorNexa Administration
          </p>
          <h2 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">
            Platform at a Glance
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Manage platform operations, monitor hospital verification, and keep
            track of blood donation requests from one place.
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

      {/* Overview Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

      {/* Statistics */}
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
                  className="group rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#D8B7BC] hover:shadow-md hover:shadow-[#782B40]/5"
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

      {/* Operational Overview */}
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
            {/* Hospital Verification */}
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

            {/* Blood Requests */}
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

      {/* CEP Analytics Charts */}
      <section>
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 size={21} className="text-[#963D54]" />
            <h2 className="font-serif text-xl font-semibold text-[#302923]">
              Blood Donation Analytics
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#A0968D]">
            Weekly request activity, blood group demand, and fulfilment trends
          </p>
        </div>

        {analyticsError && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Requests Per Week */}
            <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 sm:p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-[#302923]">
                  Requests per Week
                </h3>
                <p className="mt-1 text-xs text-[#A0968D]">
                  Blood requests created during the last eight weeks
                </p>
              </div>

              {renderChartEmpty(requestsPerWeek) ? (
                <div className="flex h-64 items-center justify-center text-sm text-[#A0968D]">
                  No weekly request data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={270}>
                  <BarChart
                    data={requestsPerWeek}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#EFE7E0"
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "#81756A", fontSize: 11 }}
                      axisLine={{ stroke: "#E8DDD4" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#81756A", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar
                      dataKey="totalRequests"
                      name="Requests"
                      fill="#963D54"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Blood Group Demand vs Supply */}
            <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 sm:p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-[#302923]">
                  Blood Group Demand vs. Supply
                </h3>
                <p className="mt-1 text-xs text-[#A0968D]">
                  Outstanding requested units compared with available inventory
                </p>
              </div>

              {renderChartEmpty(bloodGroupComparison) ? (
                <div className="flex h-64 items-center justify-center text-sm text-[#A0968D]">
                  No blood group data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={270}>
                  <BarChart
                    data={bloodGroupComparison}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#EFE7E0"
                    />
                    <XAxis
                      dataKey="bloodGroup"
                      tick={{ fill: "#81756A", fontSize: 11 }}
                      axisLine={{ stroke: "#E8DDD4" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#81756A", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend
                      wrapperStyle={{
                        fontSize: "12px",
                        paddingTop: "10px",
                      }}
                    />
                    <Bar
                      dataKey="demand"
                      name="Demand"
                      fill="#963D54"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="supply"
                      name="Available Supply"
                      fill="#C49A58"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Weekly Fulfilment Rate */}
            <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] p-5 sm:p-6 lg:col-span-2">
              <div className="mb-6">
                <h3 className="font-semibold text-[#302923]">
                  Weekly Fulfilment Rate
                </h3>
                <p className="mt-1 text-xs text-[#A0968D]">
                  Percentage of requests created each week that are currently
                  fulfilled
                </p>
              </div>

              {renderChartEmpty(fulfilmentRate) ? (
                <div className="flex h-64 items-center justify-center text-sm text-[#A0968D]">
                  No fulfilment data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={fulfilmentRate}
                    margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#EFE7E0"
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "#81756A", fontSize: 11 }}
                      axisLine={{ stroke: "#E8DDD4" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: "#81756A", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value) => [`${value}%`, "Fulfilment Rate"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Fulfilment Rate"
                      stroke="#963D54"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#963D54",
                        stroke: "#FFFDF9",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        ) : !analyticsError ? (
          <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-5 py-12 text-center text-sm text-[#81756A]">
            Analytics data is not available.
          </div>
        ) : null}
      </section>

      {/* Footer note */}
      <div className="flex items-center gap-2 border-t border-[#E8DDD4] pt-5 text-xs text-[#A0968D]">
        <Activity size={15} />
        Dashboard figures are based on the latest available platform data.
      </div>
    </div>
  );
};

export default AdminDashboard;
