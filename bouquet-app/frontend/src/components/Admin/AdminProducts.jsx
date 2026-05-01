import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiUrl, mediaUrl } from "../../config/global";
import "./AdminConfirmDialog.css";
import "./AdminProducts.css";

const initialFormState = {
  name: "",
  type: "FLOWER",
  price: "",
  stock: "",
  color: "",
  description: "",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const productTypes = [
  { value: "FLOWER", label: "Flower" },
  { value: "WRAPPING", label: "Wrapping" },
  { value: "ACCESSORY", label: "Accessory" },
];

const colorOptions = [
  { value: "", label: "No color" },
  { value: "PINK", label: "Pink" },
  { value: "RED", label: "Red" },
  { value: "WHITE", label: "White" },
  { value: "YELLOW", label: "Yellow" },
  { value: "PURPLE", label: "Purple" },
  { value: "BROWN", label: "Brown" },
  { value: "CLEAR", label: "Clear" },
  { value: "GOLD", label: "Gold" },
  { value: "SILVER", label: "Silver" },
];

function formatType(type) {
  if (type === "FLOWER") return "Flower";
  if (type === "WRAPPING") return "Wrapping";
  if (type === "ACCESSORY") return "Accessory";
  return type;
}

function formatPrice(value) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function toFormValues(product) {
  if (!product) return initialFormState;

  return {
    name: product.name || "",
    type: product.type || "FLOWER",
    price: String(product.price ?? ""),
    stock: String(product.stock ?? ""),
    color: product.color || "",
    description: product.description || "",
  };
}

function resolveProductImage(imageUrl) {
  if (!imageUrl) return "";

  const raw = String(imageUrl).trim();

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return mediaUrl(raw);
}

function revokePreview(url) {
  if (String(url || "").startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formValues, setFormValues] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageCleared, setImageCleared] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef(null);

  const FORM_MODAL_ANIMATION_MS = 220;
  const [isFormModalClosing, setIsFormModalClosing] = useState(false);

  const DELETE_DIALOG_ANIMATION_MS = 220;

  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleteDialogClosing, setIsDeleteDialogClosing] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);

  async function loadProducts(searchTerm = "", type = "ALL") {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      if (type !== "ALL") {
        params.set("type", type);
      }

      const query = params.toString();
      const url = query
        ? apiUrl(`/api/admin/products?${query}`)
        : apiUrl("/api/admin/products");

      const res = await fetch(url, {
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Could not load products");
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "Could not load products");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(search, typeFilter);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  useEffect(() => {
    return () => {
      revokePreview(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!isDeleteDialogClosing) return;

    const timer = setTimeout(() => {
      setProductToDelete(null);
      setIsDeleteDialogClosing(false);
    }, DELETE_DIALOG_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [isDeleteDialogClosing]);

  const modalTitle = editingProduct ? "Edit Product" : "Add New Product";
  const submitLabel = editingProduct ? "Save Changes" : "Add Product";

  const selectedImageName = useMemo(() => {
    if (imageCleared) return "No file selected";
    if (imageFile?.name) return imageFile.name;
    if (!imagePreview) return "No file selected";

    const source = editingProduct?.imageUrl || imagePreview;
    const cleanSource = String(source).split("?")[0];
    const parts = cleanSource.split("/");

    return parts[parts.length - 1] || "Selected image";
  }, [imageCleared, imageFile, imagePreview, editingProduct]);

  const filteredItems = useMemo(() => {
    if (typeFilter === "ALL") return items;
    return items.filter((item) => item.type === typeFilter);
  }, [items, typeFilter]);

  const hasNoData = useMemo(
    () => !loading && !error && filteredItems.length === 0,
    [loading, error, filteredItems.length],
  );

  useEffect(() => {
    if (!isFormModalClosing) return;

    const timer = setTimeout(() => {
      revokePreview(imagePreview);
      setIsModalOpen(false);
      setIsFormModalClosing(false);
      setEditingProduct(null);
      setFormValues(initialFormState);
      setImageFile(null);
      setImagePreview("");
      setImageCleared(false);
      setFormError("");
    }, FORM_MODAL_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [isFormModalClosing, imagePreview]);

  function openCreateModal() {
    revokePreview(imagePreview);
    setIsFormModalClosing(false);
    setEditingProduct(null);
    setFormValues(initialFormState);
    setImageFile(null);
    setImagePreview("");
    setImageCleared(false);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    revokePreview(imagePreview);
    setIsFormModalClosing(false);
    setEditingProduct(product);
    setFormValues(toFormValues(product));
    setImageFile(null);
    setImagePreview(resolveProductImage(product.imageUrl));
    setImageCleared(false);
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsFormModalClosing(true);
  }

  function onInputChange(event) {
    const { name, value } = event.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function onImageChange(event) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setImageFile(null);

      if (editingProduct?.imageUrl) {
        setImagePreview(resolveProductImage(editingProduct.imageUrl));
        setImageCleared(false);
      } else {
        revokePreview(imagePreview);
        setImagePreview("");
        setImageCleared(true);
      }

      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("Only JPG, PNG, and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFormError("Image size must be up to 5MB.");
      event.target.value = "";
      return;
    }

    revokePreview(imagePreview);
    setFormError("");
    setImageCleared(false);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function openImagePicker() {
    imageInputRef.current?.click();
  }

  function clearImageSelection() {
    setFormError("");
    setImageFile(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    revokePreview(imagePreview);
    setImagePreview("");
    setImageCleared(true);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const isEditing = Boolean(editingProduct?.id);

      if (!isEditing && !imageFile) {
        throw new Error("Product image is required.");
      }

      if (isEditing && imageCleared && !imageFile) {
        throw new Error("Please upload a replacement image before saving.");
      }

      const url = isEditing
        ? apiUrl(`/api/admin/products/${editingProduct.id}`)
        : apiUrl("/api/admin/products");

      const formData = new FormData();
      formData.append("name", formValues.name.trim());
      formData.append("type", formValues.type);
      formData.append("price", String(Number(formValues.price)));
      formData.append("stock", String(Number(formValues.stock)));
      formData.append("description", formValues.description.trim());
      formData.append("color", formValues.color || "");

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Could not save product");
      }

      closeModal();
      await loadProducts(search, typeFilter);
    } catch (err) {
      setFormError(err.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(product) {
    setProductToDelete(product);
    setIsDeleteDialogClosing(false);
    setError("");
  }

  function closeDeleteDialog(force = false) {
    if (deletingProduct && !force) return;
    setIsDeleteDialogClosing(true);
  }

  async function onConfirmDeleteProduct() {
    if (!productToDelete?.id) return;

    setDeletingProduct(true);
    setError("");

    try {
      const res = await fetch(
        apiUrl(`/api/admin/products/${productToDelete.id}`),
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not delete product");
      }

      await loadProducts(search, typeFilter);
      closeDeleteDialog(true);
    } catch (err) {
      closeDeleteDialog(true);
      setError(err.message || "Could not delete product");
    } finally {
      setDeletingProduct(false);
    }
  }

  return (
    <section className="min-w-0">
      <header className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            Products Management
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage your flower catalog, wrapping, and accessories
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ff3b92] via-[#c44bc4] to-[#8b5cf6] px-6 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:cursor-pointer hover:bg-linear-to-r hover:from-[#e50079] hover:via-[#c237be] hover:to-[#9b16f7] sm:w-auto"
        >
          <Plus size={16} />
          Add Product
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              aria-label="Filter products by type"
            >
              <option value="ALL">All types</option>
              {productTypes.map((option) => (
                <option key={`filter-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Desktop / tablet table */}
        <div className="admin-products-table overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 first:rounded-l-xl">
                  Image
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Name
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Type
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Price
                </th>
                <th className="border-y border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  Stock
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
                    Loading products...
                  </td>
                </tr>
              )}

              {hasNoData && (
                <tr>
                  <td
                    colSpan={6}
                    className="border-b border-slate-200 px-3 py-6 text-center text-sm text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredItems.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80">
                    <td className="border-b border-slate-200 px-3 py-3">
                      <img
                        src={resolveProductImage(product.imageUrl)}
                        alt={product.name}
                        className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                      />
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm font-medium text-slate-800">
                      {product.name}
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {formatType(product.type)}
                      </span>
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">
                      {formatPrice(product.price)}
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3 text-sm text-slate-700">
                      {product.stock}
                    </td>

                    <td className="border-b border-slate-200 px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:cursor-pointer hover:bg-slate-100"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteDialog(product)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:cursor-pointer hover:bg-rose-50"
                          aria-label={`Delete ${product.name}`}
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

        {/* Mobile cards */}
        <div className="admin-products-cards">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Loading products...
            </div>
          )}

          {hasNoData && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No products found.
            </div>
          )}

          {!loading &&
            filteredItems.map((product) => (
              <article
                key={product.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <img
                    src={resolveProductImage(product.imageUrl)}
                    alt={product.name}
                    className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {product.name}
                        </h3>

                        <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {formatType(product.type)}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteDialog(product)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-slate-500">Price</div>
                        <div className="mt-1 font-semibold text-pink-600">
                          {formatPrice(product.price)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-slate-500">Stock</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {product.stock}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>

      {isModalOpen && (
        <div
          className={`admin-page-modal-backdrop fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/30 p-0 sm:items-center sm:p-4
        ${isFormModalClosing ? "closing" : ""}`}
        >
          <div
            className={`h-full max-h-[calc(100dvh-4rem)] w-full max-w-3xl overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl
          ${isFormModalClosing ? "closing" : ""}`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                  {modalTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {editingProduct
                    ? "Update product details and inventory."
                    : "Add a new product with image, stock, and pricing."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-white p-2 text-slate-500 transition hover:cursor-pointer hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={onSubmit}
              className="max-h-[calc(92dvh-92px)] space-y-4 overflow-y-auto p-4 sm:p-6"
            >
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="min-w-0 flex-1 space-y-4">
                  <label className="block space-y-1.5">
                    <span className="text-base font-semibold text-slate-700">
                      Product Name *
                    </span>
                    <input
                      name="name"
                      value={formValues.name}
                      onChange={onInputChange}
                      required
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-base font-semibold text-slate-700">
                        Type *
                      </span>
                      <select
                        name="type"
                        value={formValues.type}
                        onChange={onInputChange}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                      >
                        {productTypes.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-1.5">
                      <span className="text-base font-semibold text-slate-700">
                        Color
                      </span>
                      <select
                        name="color"
                        value={formValues.color}
                        onChange={onInputChange}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                      >
                        {colorOptions.map((option) => (
                          <option
                            key={option.value || "none"}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-base font-semibold text-slate-700">
                        Stock *
                      </span>
                      <input
                        type="number"
                        name="stock"
                        value={formValues.stock}
                        onChange={onInputChange}
                        min="0"
                        step="1"
                        required
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <span className="text-base font-semibold text-slate-700">
                        Price *
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formValues.price}
                        onChange={onInputChange}
                        min="0"
                        step="0.01"
                        required
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-base font-semibold text-slate-700">
                      Description
                    </span>
                    <textarea
                      name="description"
                      value={formValues.description}
                      onChange={onInputChange}
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                    />
                  </label>

                  {formError && (
                    <p className="text-sm text-red-600">{formError}</p>
                  )}
                </div>

                <div className="w-full shrink-0 lg:w-65">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-base font-semibold text-slate-700">
                      Product Image {editingProduct ? "" : "*"}
                    </p>

                    <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="h-48 w-full object-cover sm:h-56"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-slate-500 sm:h-56">
                          No image selected
                        </div>
                      )}
                    </div>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={onImageChange}
                      className="hidden"
                    />

                    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                        {selectedImageName}
                      </span>

                      <button
                        type="button"
                        onClick={openImagePicker}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:cursor-pointer hover:bg-slate-200"
                        aria-label="Choose image"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={clearImageSelection}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:cursor-pointer hover:bg-slate-200"
                        aria-label="Clear selected image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Allowed: JPG, PNG, WEBP. Max size: 5MB.
                    </p>
                  </div>
                </div>
              </div>

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
                  {saving ? "Saving..." : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {productToDelete && (
        <div
          className={`admin-delete-modal-backdrop${
            isDeleteDialogClosing ? " closing" : ""
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingProduct) {
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
            aria-labelledby="delete-product-title"
          >
            <button
              type="button"
              className="admin-modal-close"
              aria-label="Close dialog"
              onClick={() => closeDeleteDialog()}
              disabled={deletingProduct}
            >
              <X size={18} />
            </button>

            <div className="admin-modal-title" id="delete-product-title">
              <AlertTriangle size={20} />
              <span>Delete Product</span>
            </div>

            <p className="admin-modal-desc">
              Are you sure you want to delete{" "}
              <strong>{productToDelete.name}</strong>? This action is permanent
              and cannot be undone.
            </p>

            <p className="admin-modal-list-title">
              This will permanently delete:
            </p>

            <ul className="admin-modal-list">
              <li>The product from your catalog</li>
              <li>Its stock, price, color, and description</li>
              <li>Its uploaded product image</li>
            </ul>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-cancel"
                onClick={() => closeDeleteDialog()}
                disabled={deletingProduct}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-confirm"
                onClick={onConfirmDeleteProduct}
                disabled={deletingProduct}
              >
                <Trash2 size={15} />
                <span>
                  {deletingProduct ? "Deleting..." : "Yes, Delete Product"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
