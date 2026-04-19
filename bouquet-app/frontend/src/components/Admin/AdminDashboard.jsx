import { useEffect, useMemo, useState } from "react";
import { DollarSign, Package, Users, WalletCards } from "lucide-react";
import { apiUrl } from "../../config/global";

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
    <section className="w-full min-w-0">
      <header className="mb-6">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">
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
      <div className="flex flex-wrap gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          const isAvgCard = item.title === "Avg Order Value";

          return (
            <article
              key={item.title}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-4"
              style={{
                flex: "1 1 220px",
                minWidth: "220px",
              }}
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
      <div className="mt-5 flex flex-wrap gap-5">
        <article
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6"
          style={{
            flex: "1.6 1 620px",
            minWidth: "620px",
          }}
        >
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            Sales Trend
          </h3>

          <div className="mt-6">
            <svg viewBox="0 0 460 210" className="h-70 w-full">
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

          <div className="mt-2 flex items-center justify-center gap-2 text-base font-medium text-pink-500">
            <span aria-hidden="true">◦</span>
            Sales (RON)
          </div>
        </article>

        <article
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6"
          style={{
            flex: "1 1 380px",
            minWidth: "380px",
          }}
        >
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            Sales by Category
          </h3>

          <div className="mt-8 flex h-70 items-end justify-around gap-4 border-b border-slate-200 px-2 pb-4">
            {categoryData.map((item) => {
              const height = Math.max(
                (Number(item.revenue || 0) / maxCategoryValue) * 220,
                28,
              );

              return (
                <div
                  key={item.label}
                  className="flex min-w-0 flex-1 flex-col items-center gap-3"
                >
                  <div
                    className="w-full max-w-20 rounded-t-md bg-pink-500"
                    style={{ height }}
                  />
                  <p className="text-center text-sm text-slate-600">
                    {item.label}
                  </p>
                </div>
              );
            })}
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
