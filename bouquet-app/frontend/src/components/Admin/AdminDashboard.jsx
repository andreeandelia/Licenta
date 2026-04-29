import { useEffect, useMemo, useState } from "react";
import { DollarSign, Package, Users, WalletCards } from "lucide-react";
import { apiUrl } from "../../config/global";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const defaultData = {
  summary: {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    changes: {
      revenuePct: 0,
      ordersPct: 0,
      customersPct: 0,
    },
  },
  salesTrend: [
    { label: "Jan", revenue: 0 },
    { label: "Feb", revenue: 0 },
    { label: "Mar", revenue: 0 },
    { label: "Apr", revenue: 0 },
    { label: "May", revenue: 0 },
    { label: "Jun", revenue: 0 },
    { label: "Jul", revenue: 0 },
    { label: "Aug", revenue: 0 },
    { label: "Sep", revenue: 0 },
    { label: "Oct", revenue: 0 },
    { label: "Nov", revenue: 0 },
    { label: "Dec", revenue: 0 },
  ],
  salesByCategory: [
    { label: "Flowers", revenue: 0 },
    { label: "Wrapping", revenue: 0 },
    { label: "Accessories", revenue: 0 },
  ],
};

function formatCurrency(value) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  const number = Number(value || 0);
  const sign = number >= 0 ? "+" : "";
  return `${sign}${number.toFixed(1)}% from last month`;
}

function SalesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0].value || 0);

  return (
    <div className="border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-slate-900">{label}</div>
      <div className="mt-3 text-sm text-pink-500">
        Sales (RON): {value.toLocaleString("ro-RO")}
      </div>
    </div>
  );
}

function CategoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0].value || 0);

  return (
    <div className="border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-slate-900">{label}</div>
      <div className="mt-3 text-sm text-pink-500">
        Revenue (RON): {value.toLocaleString("ro-RO")}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(apiUrl("/api/admin/dashboard"), {
          credentials: "include",
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Could not load dashboard stats");
        }

        if (!ignore) {
          setDashboardData({
            summary: data?.summary || defaultData.summary,
            salesTrend:
              Array.isArray(data?.salesTrend) && data.salesTrend.length > 0
                ? data.salesTrend
                : defaultData.salesTrend,
            salesByCategory:
              Array.isArray(data?.salesByCategory) &&
              data.salesByCategory.length > 0
                ? data.salesByCategory
                : defaultData.salesByCategory,
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Could not load dashboard stats");
          setDashboardData(defaultData);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: formatCurrency(dashboardData.summary.totalRevenue),
        meta: formatPercent(dashboardData.summary.changes?.revenuePct),
        icon: DollarSign,
      },
      {
        title: "Total Orders",
        value: String(dashboardData.summary.totalOrders || 0),
        meta: formatPercent(dashboardData.summary.changes?.ordersPct),
        icon: Package,
      },
      {
        title: "Customers",
        value: String(dashboardData.summary.totalCustomers || 0),
        meta: formatPercent(dashboardData.summary.changes?.customersPct),
        icon: Users,
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(dashboardData.summary.avgOrderValue),
        meta: `Based on ${dashboardData.summary.totalOrders || 0} orders`,
        icon: WalletCards,
      },
    ],
    [dashboardData],
  );

  const chartPoints = useMemo(() => {
    const trend = dashboardData.salesTrend;
    const chartLeft = 0;
    const chartRight = 440;
    const chartTop = 20;
    const chartBottom = 180;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    const maxRevenue = Math.max(
      1,
      ...trend.map((item) => Number(item.revenue || 0)),
    );
    const yAxisMax = maxRevenue * 1.25;

    return trend.map((item, index) => {
      const x =
        trend.length <= 1
          ? chartLeft + chartWidth / 2
          : chartLeft + (index * chartWidth) / (trend.length - 1);
      const y =
        chartBottom - (Number(item.revenue || 0) / yAxisMax) * chartHeight;

      return {
        x,
        y,
        label: item.label,
      };
    });
  }, [dashboardData.salesTrend]);

  const linePath = useMemo(
    () => chartPoints.map((point) => `${point.x},${point.y}`).join(" "),
    [chartPoints],
  );

  const categoryData = dashboardData.salesByCategory;
  const maxCategoryValue = Math.max(
    1,
    ...categoryData.map((item) => Number(item.revenue || 0)),
  );

  const categoryYAxisStep = 800;

  const categoryYAxisMax = Math.max(
    3200,
    Math.ceil(maxCategoryValue / categoryYAxisStep) * categoryYAxisStep,
  );

  const categoryYAxisTicks = Array.from(
    { length: categoryYAxisMax / categoryYAxisStep + 1 },
    (_, index) => index * categoryYAxisStep,
  );

  const maxTrendRevenue = Math.max(
    1,
    ...dashboardData.salesTrend.map((item) => Number(item.revenue || 0)),
  );

  const yAxisStep = 2000;
  const yAxisMax = Math.max(
    8000,
    Math.ceil(maxTrendRevenue / yAxisStep) * yAxisStep,
  );

  const yAxisTicks = Array.from(
    { length: yAxisMax / yAxisStep + 1 },
    (_, index) => index * yAxisStep,
  );

  return (
    <section className="w-full min-w-0">
      <header className="mb-6">
        <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">
          Dashboard Overview
        </h2>
        <p className="mt-2 text-base text-slate-500">
          {loading
            ? "Loading real-time data..."
            : "Welcome to your admin dashboard"}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </header>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          const isAvgCard = item.title === "Avg Order Value";

          return (
            <article
              key={item.title}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3 text-slate-500">
                <span className="text-sm font-medium text-slate-700">
                  {item.title}
                </span>

                <Icon size={16} className="shrink-0" />
              </div>

              <div className="mt-4">
                <p
                  className="truncate leading-none font-semibold tracking-tight text-slate-900"
                  style={{ fontSize: "25px" }}
                >
                  {item.value}
                </p>

                <p
                  className={`mt-3 text-xs font-medium ${
                    isAvgCard ? "text-slate-500" : "text-emerald-600"
                  }`}
                >
                  {loading ? "Loading..." : item.meta}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* CHARTS ROW */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">
            Sales Trend
          </h3>

          <div className="mt-5 h-64 w-full sm:mt-6 sm:h-70">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dashboardData.salesTrend}
                margin={{ top: 20, right: 28, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeDasharray="3 3"
                  vertical
                  horizontal
                />

                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 14 }}
                  axisLine={{ stroke: "#94a3b8" }}
                  tickLine={false}
                />

                <YAxis
                  domain={[0, yAxisMax]}
                  ticks={yAxisTicks}
                  width={52}
                  tick={{ fill: "#64748b", fontSize: 14 }}
                  axisLine={{ stroke: "#94a3b8" }}
                  tickLine={false}
                />

                <Tooltip
                  content={<SalesTooltip />}
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Sales (RON)"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "white",
                    stroke: "#ec4899",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 4,
                    fill: "white",
                    stroke: "#ec4899",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2 text-base font-medium text-pink-500">
            <span aria-hidden="true">◦</span>
            Sales (RON)
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">
            Sales by Category
          </h3>

          <div className="mt-5 h-64 w-full sm:mt-6 sm:h-70">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 20, right: 28, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeDasharray="3 3"
                  vertical
                  horizontal
                />

                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 14 }}
                  axisLine={{ stroke: "#94a3b8" }}
                  tickLine={false}
                />

                <YAxis
                  domain={[0, categoryYAxisMax]}
                  ticks={categoryYAxisTicks}
                  width={52}
                  tick={{ fill: "#64748b", fontSize: 14 }}
                  axisLine={{ stroke: "#94a3b8" }}
                  tickLine={false}
                />

                <Tooltip
                  content={<CategoryTooltip />}
                  cursor={{ fill: "rgba(236, 72, 153, 0.08)" }}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue (RON)"
                  fill="#ec4899"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={130}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-base font-medium text-pink-500">
            <span aria-hidden="true">■</span>
            Revenue (RON)
          </div>
        </article>
      </div>
    </section>
  );
}
