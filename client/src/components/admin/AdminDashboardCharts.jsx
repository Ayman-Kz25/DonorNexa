import { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  ClipboardCheck,
  Droplet,
  Package,
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="max-w-[220px] rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-2.5 py-2 shadow-lg shadow-[#302923]/10 sm:min-w-[150px] sm:px-3 sm:py-2.5">
      <p className="mb-1.5 break-words text-[10px] font-semibold text-[#81756A] sm:mb-2 sm:text-xs">
        {label}
      </p>

      {payload.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 py-1 sm:gap-5"
        >
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate text-[10px] text-[#81756A] sm:text-xs">
              {item.name}
            </span>
          </div>

          <span className="shrink-0 text-xs font-semibold tabular-nums text-[#302923] sm:text-sm">
            {item.value}
            {item.dataKey === "rate" ? "%" : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

const ChartMetric = ({ label, value, icon: Icon }) => (
  <div className="flex min-w-0 items-center gap-2">
    <div className="shrink-0 rounded-md bg-[#F8E8E9] p-1.5 text-[#963D54] sm:rounded-lg sm:p-2">
      <Icon size={14} strokeWidth={1.8} className="sm:size-4" />
    </div>

    <div className="min-w-0">
      <p className="text-[9px] leading-3.5 text-[#A0968D] sm:text-[11px]">
        {label}
      </p>
      <p className="break-all text-xs font-semibold tabular-nums text-[#302923] sm:text-sm">
        {value}
      </p>
    </div>
  </div>
);

const ChartHeader = ({ number, title, description, tag }) => (
  <div className="mb-3 flex min-w-0 items-start justify-between gap-2 sm:mb-5 sm:gap-3">
    <div className="flex min-w-0 items-start gap-2 sm:gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#F8E8E9] text-[10px] font-semibold text-[#963D54] sm:size-8 sm:rounded-lg sm:text-xs">
        {number}
      </span>

      <div className="min-w-0">
        <h3 className="break-words text-xs font-semibold leading-5 text-[#302923] sm:text-sm md:text-base">
          {title}
        </h3>
        <p className="mt-0.5 break-words text-[10px] leading-4 text-[#A0968D] sm:mt-1 sm:text-xs sm:leading-5">
          {description}
        </p>
      </div>
    </div>

    {tag && (
      <span className="hidden shrink-0 rounded-full bg-[#F5EEE9] px-2 py-1 text-[9px] font-medium text-[#87654D] min-[400px]:inline-flex sm:px-3 sm:text-[10px]">
        {tag}
      </span>
    )}
  </div>
);

const AdminDashboardCharts = ({ analytics, loading, error, onRetry }) => {
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
    fontSize: 10,
    fontWeight: 500,
  };

  const chartGridColor = "#F0E8E2";

  const chartMargin = {
    top: 10,
    right: 5,
    left: -25,
    bottom: 0,
  };

  const emptyChartClass =
    "flex h-[190px] items-center justify-center rounded-lg bg-[#FBF7F3] px-3 text-center text-[11px] text-[#A0968D] sm:h-[235px] sm:text-xs lg:h-[250px]";

  return (
    <section className="w-full min-w-0">
      {/* SECTION HEADER */}
      <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3
              size={18}
              className="shrink-0 text-[#963D54] sm:size-[21px]"
            />
            <h2 className="font-serif text-base font-semibold text-[#302923] min-[400px]:text-lg sm:text-xl">
              Blood Donation Analytics
            </h2>
          </div>

          <p className="mt-1 max-w-2xl text-[10px] leading-4 text-[#A0968D] sm:text-xs md:text-sm">
            Insights into request activity, blood availability, and fulfilment
          </p>
        </div>

        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-[#F8E8E9] px-2.5 py-1 text-[10px] font-medium text-[#963D54] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
          <span className="size-1.5 rounded-full bg-[#963D54]" />
          Last 8 weeks
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700 sm:mb-5 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
          <AlertCircle size={16} className="shrink-0 sm:size-[18px]" />
          <span className="min-w-0 flex-1 break-words">{error}</span>

          <button
            onClick={onRetry}
            className="shrink-0 text-xs font-semibold underline sm:text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && !analytics ? (
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[600px]:grid-cols-2 sm:gap-4 xl:grid-cols-2">
          <div className="h-[270px] animate-pulse rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] sm:h-[330px]" />
          <div className="h-[270px] animate-pulse rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] sm:h-[330px]" />
          <div className="h-[260px] animate-pulse rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] sm:h-[320px] min-[600px]:col-span-2" />
        </div>
      ) : analytics ? (
        <div className="min-w-0 space-y-3 sm:space-y-5">
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[600px]:grid-cols-2 sm:gap-4 xl:gap-5">
            {/* 01 - REQUESTS PER WEEK */}
            <div className="min-w-0 overflow-hidden rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-3 min-[400px]:p-3.5 sm:rounded-xl sm:p-5 lg:p-6">
              <ChartHeader
                number="01"
                title="Requests per Week"
                description="Weekly blood request activity and fulfilled requests"
                tag="Area chart"
              />

              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 sm:mb-5 sm:gap-x-7 sm:gap-y-3">
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
                <div className="h-[190px] w-full min-w-0 sm:h-[235px] lg:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={requestsPerWeek} margin={chartMargin}>
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
                        tickMargin={7}
                        interval="preserveStartEnd"
                      />

                      <YAxis
                        width={32}
                        allowDecimals={false}
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                          stroke: "#D8B7BC",
                          strokeDasharray: "4 4",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="totalRequests"
                        name="Total requests"
                        stroke="#963D54"
                        strokeWidth={2.5}
                        fill="url(#requestGradient)"
                        activeDot={{
                          r: 5,
                          fill: "#963D54",
                          stroke: "#FFFDF9",
                          strokeWidth: 2,
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
                          r: 4,
                          fill: "#C49A58",
                          stroke: "#FFFDF9",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={emptyChartClass}>
                  No weekly request data available yet.
                </div>
              )}
            </div>

            {/* 02 - BLOOD GROUP DEMAND VS SUPPLY */}
            <div className="min-w-0 overflow-hidden rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-3 min-[400px]:p-3.5 sm:rounded-xl sm:p-5 lg:p-6">
              <ChartHeader
                number="02"
                title="Blood Group Demand vs. Supply"
                description="Outstanding requested units compared with available inventory"
                tag="Grouped bar"
              />

              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 sm:mb-5 sm:gap-x-7 sm:gap-y-3">
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
                <div className="h-[190px] w-full min-w-0 sm:h-[235px] lg:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bloodGroupComparison}
                      barGap={4}
                      margin={chartMargin}
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
                        tickMargin={7}
                        interval="preserveStartEnd"
                      />

                      <YAxis
                        width={32}
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
                        iconSize={7}
                        wrapperStyle={{
                          fontSize: "10px",
                          color: "#81756A",
                          paddingTop: "10px",
                        }}
                      />

                      <Bar
                        dataKey="demand"
                        name="Demand"
                        fill="#963D54"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={20}
                      />

                      <Bar
                        dataKey="supply"
                        name="Available supply"
                        fill="#C49A58"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={emptyChartClass}>
                  No blood group data available yet.
                </div>
              )}

              <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-[#F0E8E2] pt-3 sm:pt-4">
                <span className="min-w-0 text-[10px] leading-4 text-[#A0968D] sm:text-xs">
                  Highest outstanding demand
                </span>

                <span className="shrink-0 rounded-md bg-[#F8E8E9] px-2 py-1 text-[10px] font-semibold text-[#963D54] sm:rounded-lg sm:px-3 sm:text-xs">
                  {chartSummary.highestDemandGroup}
                </span>
              </div>
            </div>
          </div>

          {/* 03 - FULFILMENT RATE */}
          <div className="min-w-0 overflow-hidden rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] p-3 min-[400px]:p-3.5 sm:rounded-xl sm:p-5 lg:p-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <ChartHeader
                  number="03"
                  title="Weekly Fulfilment Rate"
                  description="Percentage of requests created each week that are currently fulfilled"
                  tag="Line chart"
                />
              </div>

              <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-[#F8E8E9] px-3 py-2.5 sm:w-auto sm:min-w-[145px] sm:shrink-0 sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium text-[#A16A78] sm:text-[11px]">
                  Average weekly rate
                </p>

                <p className="font-serif text-xl font-semibold tabular-nums text-[#87364D] sm:text-2xl">
                  {chartSummary.averageFulfilmentRate}%
                </p>
              </div>
            </div>

            {hasChartData(fulfilmentRate) ? (
              <div className="mt-2 h-[210px] w-full min-w-0 sm:mt-3 sm:h-[260px] lg:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={fulfilmentRate}
                    margin={{
                      top: 12,
                      right: 8,
                      left: -15,
                      bottom: 0,
                    }}
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
                      tickMargin={7}
                      interval="preserveStartEnd"
                    />

                    <YAxis
                      width={38}
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={chartAxisStyle}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{
                        stroke: "#D8B7BC",
                        strokeDasharray: "4 4",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Fulfilment rate"
                      stroke="#963D54"
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        fill: "#FFFDF9",
                        stroke: "#963D54",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#963D54",
                        stroke: "#F2E2DC",
                        strokeWidth: 3,
                      }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-2 flex h-[210px] items-center justify-center rounded-lg bg-[#FBF7F3] px-3 text-center text-[11px] text-[#A0968D] sm:h-[260px] sm:text-xs lg:h-[280px]">
                No fulfilment data available yet.
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0E8E2] pt-3 sm:mt-3 sm:pt-4">
              <div className="flex items-center gap-2 text-[10px] text-[#81756A] sm:text-xs">
                <span className="size-2 shrink-0 rounded-full bg-[#963D54]" />
                Weekly fulfilment percentage
              </div>

              <span className="text-[10px] text-[#A0968D] sm:text-xs">
                Scale: 0–100%
              </span>
            </div>
          </div>
        </div>
      ) : !error ? (
        <div className="rounded-lg border border-[#E8DDD4] bg-[#FFFDF9] px-4 py-9 text-center text-xs text-[#81756A] sm:rounded-xl sm:px-5 sm:py-12 sm:text-sm">
          Analytics data is not available.
        </div>
      ) : null}
    </section>
  );
};

export default AdminDashboardCharts;
