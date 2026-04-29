import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  TicketPercent,
  X,
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

function AdminSidebarContent({
  onNavigate,
  onLogout,
  showCloseButton = false,
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 md:px-6 md:py-6">
        <h1 className="text-[24px] font-semibold tracking-tight md:text-[28px]">
          Admin Dashboard
        </h1>

        {showCloseButton && (
          <button
            type="button"
            onClick={onNavigate}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700"
            aria-label="Close admin menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
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
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:cursor-pointer hover:bg-slate-50"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    setMobileMenuOpen(false);
    await dispatch(logout());
    navigate("/auth", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:h-screen md:overflow-hidden">
      <div className="flex min-h-screen flex-col md:h-full md:min-h-0 md:flex-row">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-fuchsia-50 px-4 shadow-sm md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-800"
            aria-label="Open admin menu"
          >
            <Menu size={20} />
          </button>

          <div className="text-sm font-semibold text-slate-900">
            Admin Dashboard
          </div>

          <div className="h-10 w-10" aria-hidden="true" />
        </header>

        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-fuchsia-50/40 md:flex">
          <AdminSidebarContent onLogout={handleLogout} />
        </aside>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              aria-label="Close admin menu"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside className="relative z-10 flex h-full w-[min(84vw,20rem)] flex-col border-r border-slate-200 bg-fuchsia-50 shadow-2xl">
              <AdminSidebarContent
                showCloseButton
                onNavigate={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
              />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 md:overflow-y-auto md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
