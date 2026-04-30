import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CreditCard,
  Eye,
  Package,
  Phone,
  Truck,
  X,
} from "lucide-react";
import { apiUrl } from "../../config/global";
import "./AdminOrders.css";
import "./AdminConfirmDialog.css";

const ORDER_STATUSES = [
  { value: "CREATED", label: "Created" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PREPARATION", label: "In Preparation" },
  { value: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
  { value: "IN_DELIVERY", label: "In Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const DELIVERY_OPTIONS = {
  STANDARD: "Standard",
  SAME_DAY: "Same Day",
  EXPRESS: "Express",
};

const PAYMENT_METHODS = {
  COD: "Cash on Delivery",
  ONLINE: "Online Payment",
};

function formatPrice(value) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  return (
    date.toLocaleDateString("ro-RO") +
    " " +
    date.toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "-";

  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO");
}

function getStatusLabel(status) {
  return ORDER_STATUSES.find((s) => s.value === status)?.label || status;
}

function getStatusBadgeColor(status) {
  switch (status) {
    case "CREATED":
      return "bg-slate-100 text-slate-700";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "IN_PREPARATION":
      return "bg-yellow-100 text-yellow-700";
    case "READY_FOR_DELIVERY":
      return "bg-purple-100 text-purple-700";
    case "IN_DELIVERY":
      return "bg-indigo-100 text-indigo-700";
    case "DELIVERED":
      return "bg-green-100 text-green-700";
    case "FAILED":
      return "bg-red-100 text-red-700";
    case "CANCELLED":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const DETAIL_MODAL_ANIMATION_MS = 220;
  const [isDetailModalClosing, setIsDetailModalClosing] = useState(false);

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/admin/orders"), {
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Could not load orders");
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "Could not load orders");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredItems = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return items.filter((order) => {
      const orderId = String(order.id || "").toLowerCase();
      const customerName = String(order.customerName || "").toLowerCase();

      const matchesSearch =
        !searchTerm ||
        orderId.includes(searchTerm) ||
        customerName.includes(searchTerm);

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const hasNoFilteredData = useMemo(
    () => !loading && !error && filteredItems.length === 0,
    [loading, error, filteredItems.length],
  );

  useEffect(() => {
    if (!isDetailModalClosing) return;

    const timer = setTimeout(() => {
      setIsModalOpen(false);
      setIsDetailModalClosing(false);
      setSelectedOrder(null);
      setSelectedOrderDetail(null);
      setUpdateError("");
    }, DETAIL_MODAL_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [isDetailModalClosing]);

  async function openOrderDetail(order) {
    setIsDetailModalClosing(false);
    setSelectedOrder(order);
    setIsModalOpen(true);
    setModalLoading(true);
    setUpdateError("");

    setSelectedOrderDetail({
      id: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      finalPrice: order.finalPrice,
      totalPrice: order.finalPrice,
      totalDiscount: 0,
      deliveryTax: 0,
      deliveryOption: order.deliveryOption,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: "",
      deliveryStreet: "",
      deliveryCity: "",
      deliveryState: "",
      deliveryZipCode: "",
      deliveryDetails: "",
      billingStreet: "",
      billingCity: "",
      billingState: "",
      billingZipCode: "",
      scheduledFor: null,
      scheduledSlot: "",
      promoCode: "",
      promoDiscountPercent: 0,
      createdAt: order.createdAt,
      lines: [],
    });

    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${order.id}`), {
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Could not load order details");
      }

      setSelectedOrderDetail(data?.item || null);
    } catch (err) {
      setUpdateError(err.message || "Could not load order details");
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    if (updating) return;

    setIsDetailModalClosing(true);
  }

  async function updateOrderStatus(newStatus) {
    if (!selectedOrder) return;

    setUpdating(true);
    setUpdateError("");

    try {
      const res = await fetch(
        apiUrl(`/api/admin/orders/${selectedOrder.id}/status`),
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Could not update order status");
      }

      setSelectedOrderDetail(data?.item || null);
      await loadOrders();
    } catch (err) {
      setUpdateError(err.message || "Could not update order status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="min-w-0">
      <header className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            Orders Management
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Track and manage customer orders
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order ID or customer..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            >
              <option value="ALL">All Status</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Desktop table */}
        <div className="admin-orders-table overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 first:rounded-l-xl">
                  Order ID
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Customer
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Date
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Bouquets
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Total
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Payment
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Delivery
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-right text-sm font-semibold text-slate-700 last:rounded-r-xl">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="border-b border-slate-200 px-3 py-6 text-center text-sm text-slate-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              )}

              {hasNoFilteredData && (
                <tr>
                  <td
                    colSpan={9}
                    className="border-b border-slate-200 px-3 py-6 text-center text-sm text-slate-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredItems.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80">
                    <td className="border-b border-slate-200 px-3 py-3 font-mono text-sm text-slate-600">
                      {String(order.id).substring(0, 8)}...
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">
                      <div className="font-medium text-slate-800">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.customerPhone}
                      </div>
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-600">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-center text-sm text-slate-700">
                      {order.bouquetCount}
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm font-medium text-slate-700">
                      {formatPrice(order.finalPrice)}
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {PAYMENT_METHODS[order.paymentMethod] ||
                          order.paymentMethod}
                      </span>
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {DELIVERY_OPTIONS[order.deliveryOption] ||
                          order.deliveryOption}
                      </span>
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeColor(
                          order.status,
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(order)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:cursor-pointer hover:bg-slate-100"
                          aria-label={`View order ${order.id}`}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / small tablet cards */}
        <div className="admin-orders-cards">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Loading orders...
            </div>
          )}

          {hasNoFilteredData && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No orders found.
            </div>
          )}

          {!loading &&
            filteredItems.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-slate-500">
                      #{String(order.id).substring(0, 8)}...
                    </div>

                    <h3 className="mt-1 truncate text-base font-semibold text-slate-900">
                      {order.customerName}
                    </h3>

                    <div className="mt-1 text-xs text-slate-500">
                      {order.customerPhone}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openOrderDetail(order)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                    aria-label={`View order ${order.id}`}
                  >
                    <Eye size={17} />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeColor(
                      order.status,
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>

                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {PAYMENT_METHODS[order.paymentMethod] ||
                      order.paymentMethod}
                  </span>

                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {DELIVERY_OPTIONS[order.deliveryOption] ||
                      order.deliveryOption}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-slate-500">Date</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-slate-500">Bouquets</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {order.bouquetCount}
                    </div>
                  </div>

                  <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-slate-500">Total</div>
                    <div className="mt-1 font-semibold text-pink-600">
                      {formatPrice(order.finalPrice)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>

      {isModalOpen && selectedOrderDetail && (
        <div
          className={`admin-page-modal-backdrop fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/30 p-0 sm:items-center sm:p-4 
          ${isDetailModalClosing ? "closing" : ""}`}
        >
          <div
            className={`admin-page-modal h-full max-h-[calc(100dvh-4rem)] w-full max-w-2xl overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:h-auto sm:max-h-[94dvh] sm:rounded-3xl
          ${isDetailModalClosing ? "closing" : ""}`}
          >
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                    Order {selectedOrderDetail.id}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Placed on {formatDateTime(selectedOrderDetail.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-white p-2 text-slate-500 transition hover:cursor-pointer hover:bg-slate-100"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(
                    selectedOrderDetail.status,
                  )}`}
                >
                  {getStatusLabel(selectedOrderDetail.status)}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Package size={14} />
                  {selectedOrderDetail.lines.length} bouquets
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <CreditCard size={14} />
                  {PAYMENT_METHODS[selectedOrderDetail.paymentMethod] ||
                    selectedOrderDetail.paymentMethod}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Truck size={14} />
                  {DELIVERY_OPTIONS[selectedOrderDetail.deliveryOption] ||
                    selectedOrderDetail.deliveryOption}
                </span>
              </div>
            </div>

            <div className="max-h-[calc(100dvh-4rem-170px)] overflow-y-auto p-4 sm:max-h-[calc(94dvh-170px)] sm:p-6">
              {modalLoading && (
                <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Loading order details...
                </p>
              )}

              {updateError && (
                <p className="mb-4 text-sm text-red-600">{updateError}</p>
              )}

              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Update Order Status
                  </span>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <select
                        value={selectedOrderDetail.status}
                        onChange={(e) => updateOrderStatus(e.target.value)}
                        disabled={updating}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {updating && (
                      <span className="text-xs text-slate-500">
                        Updating...
                      </span>
                    )}
                  </div>
                </label>
              </div>

              <div className="grid gap-3.5 lg:grid-cols-2!">
                <div className="h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-[#ff3b92]">
                      <Phone size={18} />
                    </div>

                    <h4 className="text-sm font-semibold text-slate-700">
                      Customer Information
                    </h4>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-500">Full Name:</span>
                      <span className="text-right font-medium text-slate-900">
                        {selectedOrderDetail.customerName}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-500">Phone:</span>
                      <span className="text-right font-medium text-slate-900">
                        {selectedOrderDetail.customerPhone}
                      </span>
                    </div>

                    {selectedOrderDetail.customerEmail && (
                      <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Email:</span>
                        <span className="break-all text-right font-medium text-slate-900">
                          {selectedOrderDetail.customerEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Truck size={18} />
                    </div>

                    <h4 className="text-sm font-semibold text-slate-700">
                      Delivery Information
                    </h4>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-500">Delivery Method:</span>
                      <span className="text-right font-medium text-slate-900">
                        {DELIVERY_OPTIONS[selectedOrderDetail.deliveryOption] ||
                          selectedOrderDetail.deliveryOption}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-500">Delivery Address:</span>
                      <span className="max-w-[70%] wrap-break-words text-right font-medium leading-5 text-slate-900">
                        {selectedOrderDetail.deliveryStreet},{" "}
                        {selectedOrderDetail.deliveryCity},{" "}
                        {selectedOrderDetail.deliveryState}{" "}
                        {selectedOrderDetail.deliveryZipCode}
                      </span>
                    </div>

                    {selectedOrderDetail.deliveryDetails && (
                      <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Details:</span>
                        <span className="max-w-[70%] wrap-break-words text-right font-medium text-slate-900">
                          {selectedOrderDetail.deliveryDetails}
                        </span>
                      </div>
                    )}

                    {(selectedOrderDetail.billingStreet ||
                      selectedOrderDetail.billingCity ||
                      selectedOrderDetail.billingState ||
                      selectedOrderDetail.billingZipCode) && (
                      <div className="flex items-start justify-between gap-4 rounded-xl bg-blue-50 px-3 py-2">
                        <span className="text-slate-500">Billing Address:</span>
                        <span className="max-w-[70%] wrap-break-words text-right font-medium leading-5 text-slate-900">
                          {selectedOrderDetail.billingStreet},{" "}
                          {selectedOrderDetail.billingCity},{" "}
                          {selectedOrderDetail.billingState}{" "}
                          {selectedOrderDetail.billingZipCode}
                        </span>
                      </div>
                    )}

                    {selectedOrderDetail.scheduledFor && (
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarRange size={15} />
                          Scheduled Delivery
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {formatDate(selectedOrderDetail.scheduledFor)} at{" "}
                          {selectedOrderDetail.scheduledSlot}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Package size={18} />
                  </div>

                  <h4 className="text-sm font-semibold text-slate-700">
                    Order Bouquets ({selectedOrderDetail.lines.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {selectedOrderDetail.lines.map((line, index) => (
                    <div
                      key={line.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-slate-800">
                          Custom Bouquet #{index + 1}
                        </div>

                        <div className="text-sm font-semibold text-slate-800">
                          {formatPrice(line.totalPrice)}
                        </div>
                      </div>

                      {line.bouquet?.items && line.bouquet.items.length > 0 && (
                        <div className="space-y-1 border-t border-slate-200 pt-2">
                          {line.bouquet.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                {item.product?.imageUrl && (
                                  <img
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                  />
                                )}

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium leading-tight text-slate-800">
                                    {item.product?.name || "Product"}
                                  </div>

                                  <div className="mt-1 text-xs leading-tight text-slate-500">
                                    {item.product?.type || "Item"} x{" "}
                                    {item.quantity}
                                  </div>

                                  {String(item.product?.name || "")
                                    .toLowerCase()
                                    .includes("greeting card") &&
                                    line.bouquet?.greetingCardMessage && (
                                      <div className="mt-1 text-xs leading-tight text-slate-500">
                                        MESSAGE:{" "}
                                        {line.bouquet.greetingCardMessage}
                                      </div>
                                    )}
                                </div>
                              </div>

                              <div className="shrink-0 text-sm font-medium text-slate-700">
                                {formatPrice(item.priceSnapshot)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-3.5">
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <CreditCard size={18} />
                  </div>

                  <h4 className="text-sm font-semibold text-slate-700">
                    Payment Summary
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">
                      {formatPrice(selectedOrderDetail.totalPrice)}
                    </span>
                  </div>

                  {selectedOrderDetail.promoDiscountPercent > 0 && (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-600">
                        Discount ({selectedOrderDetail.promoCode} -{" "}
                        {selectedOrderDetail.promoDiscountPercent}%)
                      </span>
                      <span className="font-medium text-emerald-600">
                        -{formatPrice(selectedOrderDetail.totalDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Delivery Tax</span>
                    <span className="font-medium text-slate-900">
                      {formatPrice(selectedOrderDetail.deliveryTax)}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between text-base">
                      <span className="font-semibold text-slate-900">
                        Total
                      </span>
                      <span className="text-lg font-semibold text-[#ff3b92]">
                        {formatPrice(selectedOrderDetail.finalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
