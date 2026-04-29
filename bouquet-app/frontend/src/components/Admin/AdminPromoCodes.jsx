import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiUrl } from "../../config/global";
import "./AdminConfirmDialog.css";
import "./AdminPromoCodes.css";

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

  const FORM_MODAL_ANIMATION_MS = 220;
  const [isFormModalClosing, setIsFormModalClosing] = useState(false);

  const DELETE_DIALOG_ANIMATION_MS = 220;

  const [promoToDelete, setPromoToDelete] = useState(null);
  const [isDeleteDialogClosing, setIsDeleteDialogClosing] = useState(false);
  const [deletingPromo, setDeletingPromo] = useState(false);

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

  useEffect(() => {
    if (!isDeleteDialogClosing) return;

    const timer = setTimeout(() => {
      setPromoToDelete(null);
      setIsDeleteDialogClosing(false);
    }, DELETE_DIALOG_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [isDeleteDialogClosing]);

  const hasNoData = useMemo(
    () => !loading && !error && items.length === 0,
    [loading, error, items.length],
  );

  useEffect(() => {
    if (!isFormModalClosing) return;

    const timer = setTimeout(() => {
      setIsModalOpen(false);
      setIsFormModalClosing(false);
      setEditingPromo(null);
      setFormValues(toFormValues(null));
      setFormError("");
    }, FORM_MODAL_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [isFormModalClosing]);

  function openCreateModal() {
    setIsFormModalClosing(false);
    setEditingPromo(null);
    setFormValues(toFormValues(null));
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(promo) {
    setIsFormModalClosing(false);
    setEditingPromo(promo);
    setFormValues(toFormValues(promo));
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsFormModalClosing(true);
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

  function openDeleteDialog(promo) {
    setPromoToDelete(promo);
    setIsDeleteDialogClosing(false);
    setError("");
  }

  function closeDeleteDialog(force = false) {
    if (deletingPromo && !force) return;
    setIsDeleteDialogClosing(true);
  }

  async function onConfirmDeletePromo() {
    if (!promoToDelete?.id) return;

    setDeletingPromo(true);
    setActionLoadingId(promoToDelete.id);
    setError("");

    try {
      const res = await fetch(
        apiUrl(`/api/admin/promo-codes/${promoToDelete.id}`),
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not delete promo code");
      }

      await loadPromos();
      closeDeleteDialog(true);
    } catch (err) {
      closeDeleteDialog(true);
      setError(err.message || "Could not delete promo code");
    } finally {
      setDeletingPromo(false);
      setActionLoadingId("");
    }
  }

  return (
    <section className="min-w-0">
      <header className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            Promo Codes
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage discount codes and promotions
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ff3b92] via-[#c44bc4] to-[#8b5cf6] px-6 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:cursor-pointer hover:bg-linear-to-r hover:from-[#e50079] hover:via-[#c237be] hover:to-[#9b16f7] sm:w-auto"
        >
          <Plus size={16} />
          Create Promo Code
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Desktop table */}
        <div className="admin-promos-table overflow-x-auto">
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
                          onClick={() => openDeleteDialog(promo)}
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

        {/* Mobile / small tablet cards */}
        <div className="admin-promos-cards">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Loading promo codes...
            </div>
          )}

          {hasNoData && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No promo codes found.
            </div>
          )}

          {!loading &&
            items.map((promo) => (
              <article
                key={promo.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                      {promo.code}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${formatPromoStatus(
                          promo.status,
                        )}`}
                      >
                        {promo.status}
                      </span>

                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {Number(promo.discountPercent || 0).toFixed(0)}% OFF
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(promo)}
                      disabled={actionLoadingId === promo.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Edit ${promo.code}`}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openDeleteDialog(promo)}
                      disabled={actionLoadingId === promo.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${promo.code}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-slate-500">Start Date</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {formatDateDisplay(promo.startDate)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-slate-500">End Date</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {formatDateDisplay(promo.endDate)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>

      {isModalOpen && (
        <div
          className={`admin-page-modal-backdrop fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/30 p-0 sm:items-center sm:p-4 ${
            isFormModalClosing ? "closing" : ""
          }`}
        >
          <div
            className={`admin-page-modal h-full max-h-[calc(100dvh-4rem)] w-full max-w-xl overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl ${
              isFormModalClosing ? "closing" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
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
                className="rounded-xl bg-white p-2 text-slate-500 transition hover:cursor-pointer hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={onSubmit}
              className="max-h-[calc(92dvh-88px)] space-y-4 overflow-y-auto p-4 sm:p-6"
            >
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:cursor-pointer hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-linear-to-r from-[#ff3b92] via-[#c44bc4] to-[#8b5cf6] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:cursor-pointer hover:bg-linear-to-r hover:from-[#e50079] hover:via-[#c237be] hover:to-[#9b16f7] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? "Saving..." : editingPromo ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {promoToDelete && (
        <div
          className={`admin-delete-modal-backdrop${
            isDeleteDialogClosing ? " closing" : ""
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingPromo) {
              closeDeleteDialog();
            }
          }}
        >
          <div
            className={`admin-delete-modal${
              isDeleteDialogClosing ? " closing" : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-promo-title"
          >
            <button
              type="button"
              className="admin-modal-close"
              aria-label="Close dialog"
              onClick={() => closeDeleteDialog()}
              disabled={deletingPromo}
            >
              <X size={18} />
            </button>

            <div className="admin-modal-title" id="delete-promo-title">
              <AlertTriangle size={20} />
              <span>Delete Promo Code</span>
            </div>

            <p className="admin-modal-desc">
              Are you sure you want to delete promo code{" "}
              <strong>{promoToDelete.code}</strong>? This action is permanent
              and cannot be undone.
            </p>

            <p className="admin-modal-list-title">
              This will permanently delete:
            </p>

            <ul className="admin-modal-list">
              <li>The promo code from your admin panel</li>
              <li>Its discount percentage and date range</li>
              <li>Its availability at checkout</li>
            </ul>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-cancel"
                onClick={() => closeDeleteDialog()}
                disabled={deletingPromo}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-confirm"
                onClick={onConfirmDeletePromo}
                disabled={deletingPromo}
              >
                <Trash2 size={15} />
                <span>
                  {deletingPromo ? "Deleting..." : "Yes, Delete Promo Code"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
