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
    date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO");
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

  const hasNoData = useMemo(
    () => !loading && !error && items.length === 0,
    [loading, error, items.length],
  );

  const filteredItems = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return items.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        order.id.toLowerCase().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const hasNoFilteredData = useMemo(
    () => !loading && !error && filteredItems.length === 0,
    [loading, error, filteredItems.length],
  );

  async function openOrderDetail(order) {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setModalLoading(true);
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
      scheduledFor: null,
      scheduledSlot: "",
      promoCode: "",
      promoDiscountPercent: 0,
      createdAt: order.createdAt,
      lines: [],
    });
    setUpdateError("");

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
    setIsModalOpen(false);
    setSelectedOrder(null);
    setSelectedOrderDetail(null);
    setUpdateError("");
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
    <section>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900">
            Orders Management
          </h2>
          <p className="mt-2 text-lg text-slate-500">
            Track and manage customer orders
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
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

        <div className="overflow-x-auto">
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
                    <td className="border-b border-slate-200 px-3 py-3 text-sm font-mono text-slate-600">
                      {order.id.substring(0, 8)}...
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
                        {ORDER_STATUSES.find((s) => s.value === order.status)
                          ?.label || order.status}
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
      </div>

      {isModalOpen && selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#ff3b92] via-[#f97316] to-[#8b5cf6]" />

            <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Order details
                  </p>
                  <h3 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900">
                    {selectedOrderDetail.id}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Placed on {formatDateTime(selectedOrderDetail.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:cursor-pointer hover:bg-slate-100"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(selectedOrderDetail.status)}`}
                >
                  {ORDER_STATUSES.find(
                    (s) => s.value === selectedOrderDetail.status,
                  )?.label || selectedOrderDetail.status}
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

            <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-3.5">
              {updateError && (
                <p className="mb-4 text-sm text-red-600">{updateError}</p>
              )}

              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Update Order Status
                  </span>
                  <div className="flex items-center gap-2">
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

              <div className="grid gap-3.5 lg:grid-cols-2 lg:items-stretch">
                <div className="h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
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
                        <span className="text-right font-medium text-slate-900">
                          {selectedOrderDetail.customerEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
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
                      <span className="max-w-[70%] text-right font-medium leading-5 text-slate-900">
                        {selectedOrderDetail.deliveryStreet},{" "}
                        {selectedOrderDetail.deliveryCity},{" "}
                        {selectedOrderDetail.deliveryState}{" "}
                        {selectedOrderDetail.deliveryZipCode}
                      </span>
                    </div>
                    {selectedOrderDetail.deliveryDetails && (
                      <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Details:</span>
                        <span className="max-w-[70%] text-right font-medium text-slate-900">
                          {selectedOrderDetail.deliveryDetails}
                        </span>
                      </div>
                    )}
                    {selectedOrderDetail.scheduledFor && (
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                          <CalendarRange size={14} />
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

              <div className="mt-1.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Package size={18} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">
                    Order Bouquets ({selectedOrderDetail.lines.length})
                  </h4>
                </div>
                <div className="space-y-1.25">
                  {selectedOrderDetail.lines.map((line, index) => (
                    <div
                      key={line.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-2"
                    >
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Bouquet #{index + 1}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatPrice(line.totalPrice)}
                        </p>
                      </div>
                      {line.bouquet?.items && line.bouquet.items.length > 0 && (
                        <div className="space-y-1 border-t border-slate-200 pt-1">
                          {line.bouquet.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-0.5 text-sm"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {item.product?.imageUrl && (
                                  <img
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-slate-800">
                                    {item.product?.name || "Product"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Qty {item.quantity} ·{" "}
                                    {item.product?.type || "Item"}
                                  </p>
                                </div>
                              </div>
                              <p className="shrink-0 font-medium text-slate-700">
                                {formatPrice(item.priceSnapshot)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-3.5 shadow-sm">
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
                    <div className="flex items-center justify-between text-sm">
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

            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={updating}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:cursor-pointer hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
