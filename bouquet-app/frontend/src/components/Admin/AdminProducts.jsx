import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { apiUrl, mediaUrl } from "../../config/global";

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
  return mediaUrl(imageUrl);
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

  function openCreateModal() {
    revokePreview(imagePreview);
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
    revokePreview(imagePreview);
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormValues(initialFormState);
    setImageFile(null);
    setImagePreview("");
    setImageCleared(false);
    setFormError("");
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

  async function onDelete(product) {
    const shouldDelete = window.confirm(
      `Delete product "${product.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/products/${product.id}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not delete product");
      }

      await loadProducts(search, typeFilter);
    } catch (err) {
      setError(err.message || "Could not delete product");
    }
  }

  return (
    <section>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900">
            Products Management
          </h2>
          <p className="mt-2 text-lg text-slate-500">
            Manage your flower catalog, wrapping, and accessories
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#ff3b92] to-[#8b5cf6] px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:cursor-pointer hover:brightness-105"
        >
          <Plus size={16} />
          Add Product
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
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

        <div className="overflow-x-auto">
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
                          onClick={() => onDelete(product)}
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-7 pt-6 pb-5">
              <div className="mb-6 flex items-start justify-between gap-4">
                <h3 className="text-4xl font-semibold tracking-tight text-slate-900">
                  {modalTitle}
                </h3>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1 text-slate-400 transition hover:cursor-pointer hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close form"
                >
                  <X size={24} />
                </button>
              </div>

              <form id="product-form" onSubmit={onSubmit} className="w-full">
                <div className="flex flex-col gap-6 lg:flex-row">
                  {/* LEFT */}
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

                    <div className="grid grid-cols-1 gap-4">
                      <label className="block space-y-1.5">
                        <span className="text-base font-semibold text-slate-700">
                          Type *
                        </span>
                        <select
                          name="type"
                          value={formValues.type}
                          onChange={onInputChange}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white appearance-none"
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
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white appearance-none"
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

                    <div className="grid grid-cols-1 gap-4">
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

                  {/* RIGHT */}
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
                            className="h-56 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-56 items-center justify-center px-4 text-center text-sm text-slate-500">
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
              </form>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-7 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-base font-medium text-slate-700 transition hover:cursor-pointer hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="product-form"
                disabled={saving}
                className="rounded-xl bg-linear-to-r from-[#ff3b92] to-[#8b5cf6] px-5 py-2.5 text-base font-semibold text-white shadow-sm transition hover:cursor-pointer hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : submitLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
