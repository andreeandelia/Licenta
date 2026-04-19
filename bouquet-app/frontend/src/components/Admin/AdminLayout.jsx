import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  TicketPercent,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "../../stores/actions/auth-actions";

const menuItems = [
  {
    to: "/admin/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/products",
    label: "Products",
    icon: Box,
  },
  {
    to: "/admin/orders",
    label: "Orders",
    icon: PackageCheck,
  },
  {
    to: "/admin/promo-codes",
    label: "Promo Codes",
    icon: TicketPercent,
  },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleLogout() {
    await dispatch(logout());
    navigate("/auth", { replace: true });
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="flex h-full">
        <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-fuchsia-50/40">
          <div className="border-b border-slate-200 px-6 py-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">Manage your store</p>
          </div>

          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition",
                          isActive
                            ? "bg-linear-to-r from-[#ff3b92] to-[#8b5cf6] text-white shadow-sm"
                            : "text-slate-700 hover:bg-white/80",
                        ].join(" ")
                      }
                    >
                      <Icon size={18} strokeWidth={2} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="px-3 py-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:cursor-pointer"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
