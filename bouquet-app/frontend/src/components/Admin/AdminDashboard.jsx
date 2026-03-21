import { useEffect, useMemo, useState } from "react";
import { DollarSign, Package, Users, WalletCards } from "lucide-react";

const API_BASE = "http://localhost:8080";

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
        const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
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

    return trend.map((item, index) => {
      const x =
        trend.length <= 1
          ? chartLeft + chartWidth / 2
          : chartLeft + (index * chartWidth) / (trend.length - 1);
      const y =
        chartBottom - (Number(item.revenue || 0) / maxRevenue) * chartHeight;

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

  return (
    <section>
      <header className="mb-7">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">
          Dashboard Overview
        </h2>
        <p className="mt-2 text-lg text-slate-500">
          {loading
            ? "Loading real-time data..."
            : "Welcome to your admin dashboard"}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-base font-medium">{item.title}</span>
                <Icon size={18} />
              </div>
              <div className="mt-7">
                <p className="text-4xl font-semibold tracking-tight text-slate-900">
                  {item.value}
                </p>
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  {loading ? "Loading..." : item.meta}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            Sales Trend
          </h3>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[500px]">
              <svg viewBox="0 0 460 210" className="h-[280px] w-full">
                {[20, 60, 100, 140, 180].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="440"
                    y2={y}
                    className="text-slate-200"
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {[88, 176, 264, 352, 440].map((x) => (
                  <line
                    key={x}
                    x1={x}
                    y1="20"
                    x2={x}
                    y2="180"
                    className="text-slate-200"
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                <polyline
                  fill="none"
                  className="text-pink-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  points={linePath}
                />

                {chartPoints.map((point) => (
                  <circle
                    key={point.label}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="white"
                    className="text-pink-500"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                ))}

                {chartPoints.map((point) => (
                  <text
                    key={`label-${point.label}`}
                    x={point.x}
                    y="198"
                    textAnchor="middle"
                    className="text-slate-500"
                    fill="currentColor"
                    fontSize="14"
                  >
                    {point.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2 text-lg font-medium text-pink-500">
            <span aria-hidden="true">◦</span>
            Sales (RON)
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            Sales by Category
          </h3>

          <div className="mt-8 flex h-[280px] items-end justify-around gap-6 border-b border-slate-200 px-4 pb-4">
            {categoryData.map((item) => {
              const height = Math.max(
                (Number(item.revenue || 0) / maxCategoryValue) * 220,
                28,
              );

              return (
                <div
                  key={item.label}
                  className="flex w-full flex-1 flex-col items-center gap-3"
                >
                  <div
                    className="w-full max-w-24 rounded-t-md bg-pink-500"
                    style={{ height }}
                  />
                  <p className="text-lg text-slate-600">{item.label}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-lg font-medium text-pink-500">
            <span aria-hidden="true">■</span>
            Revenue (RON)
          </div>
        </article>
      </div>
    </section>
  );
}
