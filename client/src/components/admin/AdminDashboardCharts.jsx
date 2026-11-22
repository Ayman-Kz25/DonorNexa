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
    fontSize: 11,
    fontWeight: 500,
  };

  const chartGridColor = "#F0E8E2";

  return (
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

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button onClick={onRetry} className="ml-auto font-semibold underline">
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
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {/* 01 - REQUESTS PER WEEK */}

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

            {/* 02 - BLOOD GROUP DEMAND VS SUPPLY */}

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

          {/* 03 - FULFILMENT RATE */}

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
      ) : !error ? (
        <div className="rounded-xl border border-[#E8DDD4] bg-[#FFFDF9] px-5 py-12 text-center text-sm text-[#81756A]">
          Analytics data is not available.
        </div>
      ) : null}
    </section>
  );
};

export default AdminDashboardCharts;
