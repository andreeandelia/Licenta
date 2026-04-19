import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { apiUrl } from "../../config/global";

const todayAsInputValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const initialFormState = {
  code: "",
  discountPercent: "",
  startDate: todayAsInputValue(),
  endDate: "",
  isActive: true,
};

function formatDateDisplay(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US");
}

function formatDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatPromoStatus(status) {
  return status === "Active"
    ? "bg-pink-100 text-[#ff3b92]"
    : "bg-slate-100 text-slate-600";
}

function toFormValues(promo) {
  if (!promo) {
    return {
      ...initialFormState,
      startDate: todayAsInputValue(),
      endDate: "",
    };
  }

  return {
    code: promo.code || "",
    discountPercent: String(promo.discountPercent ?? ""),
    startDate: formatDateInput(promo.startDate),
    endDate: formatDateInput(promo.endDate),
    isActive: Boolean(promo.isActive),
  };
}

export default function AdminPromoCodes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  async function loadPromos() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/admin/promo-codes"), {
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Could not load promo codes");
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setItems([]);
      setError(err.message || "Could not load promo codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromos();
  }, []);

  const hasNoData = useMemo(
    () => !loading && !error && items.length === 0,
    [loading, error, items.length],
  );

  function openCreateModal() {
    setEditingPromo(null);
    setFormValues(toFormValues(null));
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(promo) {
    setEditingPromo(promo);
    setFormValues(toFormValues(promo));
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setEditingPromo(null);
    setFormValues(toFormValues(null));
    setFormError("");
  }

  function onInputChange(event) {
    const { name, value, type, checked } = event.target;

    setFormValues((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "code"
            ? value.toUpperCase()
            : value,
    }));
  }

  async function savePromo(nextValues) {
    const isEditing = Boolean(editingPromo?.id);

    const url = isEditing
      ? apiUrl(`/api/admin/promo-codes/${editingPromo.id}`)
      : apiUrl("/api/admin/promo-codes");

    const body = {
      code: nextValues.code.trim().toUpperCase(),
      discountPercent: Number(nextValues.discountPercent),
      startDate: nextValues.startDate,
      endDate: nextValues.endDate,
      isActive: Boolean(nextValues.isActive),
    };

    const res = await fetch(url, {
      method: isEditing ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Could not save promo code");
    }

    return data?.item || null;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      await savePromo(formValues);
      closeModal();
      await loadPromos();
    } catch (err) {
      setFormError(err.message || "Could not save promo code");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(promo) {
    const shouldDelete = window.confirm(
      `Delete promo code "${promo.code}"? This action cannot be undone.`,
    );

    if (!shouldDelete) return;

    setActionLoadingId(promo.id);
    setError("");

    try {
      const res = await fetch(apiUrl(`/api/admin/promo-codes/${promo.id}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not delete promo code");
      }

      await loadPromos();
    } catch (err) {
      setError(err.message || "Could not delete promo code");
    } finally {
      setActionLoadingId("");
    }
  }

  return (
    <section>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900">
            Promo Codes
          </h2>
          <p className="mt-2 text-lg text-slate-500">
            Manage discount codes and promotions
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#ff3b92] to-[#8b5cf6] px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:cursor-pointer hover:brightness-105"
        >
          <Plus size={16} />
          Create Promo Code
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white">
        {error && <p className="px-5 pt-5 text-sm text-red-600">{error}</p>}

        <div className="overflow-x-auto p-5">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 first:rounded-l-xl">
                  Code
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Discount
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Start Date
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  End Date
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
                    colSpan={6}
                    className="border-b border-slate-200 px-3 py-6 text-center text-sm text-slate-500"
                  >
                    Loading promo codes...
                  </td>
                </tr>
              )}

              {hasNoData && (
                <tr>
                  <td
                    colSpan={6}
                    className="border-b border-slate-200 px-3 py-6 text-center text-sm text-slate-500"
                  >
                    No promo codes found.
                  </td>
                </tr>
              )}

              {!loading &&
                items.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50/80">
                    <td className="border-b border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800">
                      {promo.code}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">
                      {Number(promo.discountPercent || 0).toFixed(0)}%
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-600">
                      {formatDateDisplay(promo.startDate)}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-600">
                      {formatDateDisplay(promo.endDate)}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${formatPromoStatus(
                          promo.status,
                        )}`}
                      >
                        {promo.status}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(promo)}
                          disabled={actionLoadingId === promo.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:cursor-pointer hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Edit ${promo.code}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(promo)}
                          disabled={actionLoadingId === promo.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:cursor-pointer hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${promo.code}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {editingPromo ? "Edit Promo Code" : "Create Promo Code"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {editingPromo
                    ? "Update code details and availability."
                    : "Add a new promotional code with date limits."}
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

            <form onSubmit={onSubmit} className="space-y-4 p-6">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">
                  Code *
                </span>
                <input
                  name="code"
                  value={formValues.code}
                  onChange={onInputChange}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm uppercase text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">
                  Discount (%) *
                </span>
                <input
                  type="number"
                  name="discountPercent"
                  value={formValues.discountPercent}
                  onChange={onInputChange}
                  min="1"
                  max="99"
                  step="1"
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">
                    Start Date *
                  </span>
                  <input
                    type="date"
                    name="startDate"
                    value={formValues.startDate}
                    onChange={onInputChange}
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">
                    End Date *
                  </span>
                  <input
                    type="date"
                    name="endDate"
                    value={formValues.endDate}
                    onChange={onInputChange}
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formValues.isActive}
                  onChange={onInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-[#ff3b92] focus:ring-[#ff3b92]"
                />
                Active
              </label>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:cursor-pointer hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-linear-to-r from-[#ff3b92] to-[#8b5cf6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:cursor-pointer hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingPromo ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
