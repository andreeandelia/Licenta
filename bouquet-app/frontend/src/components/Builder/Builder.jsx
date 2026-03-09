import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { fetchProducts } from "../../stores/actions/product-actions";
import { addWishlistItem } from "../../stores/actions/wishlist-actions";
import {
  addToBouquet,
  changeQty,
  clearBouquet,
} from "../../stores/actions/bouquet-actions";
import "./Builder.css";

const STEPS = [
  { id: 1, label: "Select Flowers", type: "FLOWER" },
  { id: 2, label: "Choose Wrapping", type: "WRAPPING" },
  { id: 3, label: "Add Accessories", type: "ACCESSORY" },
  { id: 4, label: "Summary", type: null },
];

const COLORS = [
  "PINK",
  "RED",
  "WHITE",
  "YELLOW",
  "PURPLE",
  "BROWN",
  "CLEAR",
  "GOLD",
  "SILVER",
];

const ASSET_FILES = import.meta.glob(
  "../../assets/**/*.{png,jpg,jpeg,webp,avif,svg}",
  { eager: true, import: "default" },
);

const ASSET_INDEX = Object.entries(ASSET_FILES).reduce((acc, [key, url]) => {
  const lowerKey = key.toLowerCase();
  const splitToken = "/assets/";
  const tokenIndex = lowerKey.indexOf(splitToken);
  if (tokenIndex === -1) return acc;

  const relativePath = lowerKey.slice(tokenIndex + splitToken.length);
  const fileName = relativePath.split("/").pop();

  acc[relativePath] = url;
  if (fileName && !acc[fileName]) acc[fileName] = url;

  return acc;
}, {});

function resolveImageSrc(imageUrl) {
  if (!imageUrl) return "";

  const normalized = String(imageUrl)
    .trim()
    .replace(/^\/+/, "")
    .replace(/^assets\//i, "")
    .toLowerCase();

  return (
    ASSET_INDEX[normalized] || ASSET_INDEX[normalized.split("/").pop()] || ""
  );
}

export default function BuilderPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, error, page, totalPages } = useSelector(
    (s) => s.products,
  );
  const bouquet = useSelector((s) => s.bouquet);
  const user = useSelector((s) => s.auth?.user);
  const wishlistSaving = useSelector((s) => s.wishlist?.saving);

  const [step, setStep] = useState(1);
  const [wishlistMsg, setWishlistMsg] = useState("");

  // filters
  const [selectedColors, setSelectedColors] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20);
  const [inStock, setInStock] = useState(false);

  const current = STEPS.find((x) => x.id === step);

  // load products when step/filters/page change
  useEffect(() => {
    if (!current?.type) return;

    dispatch(
      fetchProducts({
        type: current.type,
        colors: selectedColors,
        minPrice,
        maxPrice,
        inStock,
        page: page || 1,
        limit: 6,
      }),
    );
  }, [dispatch, current?.type, selectedColors, minPrice, maxPrice, inStock]);

  // when step changes, reset to page 1 by refetch with page=1
  useEffect(() => {
    if (!current?.type) return;
    dispatch(
      fetchProducts({
        type: current.type,
        colors: selectedColors,
        minPrice,
        maxPrice,
        inStock,
        page: 1,
        limit: 6,
      }),
    );
  }, [step]);

  const total = useMemo(() => {
    const flowersTotal = bouquet.flowers.reduce(
      (s, x) => s + x.price * x.qty,
      0,
    );
    const accTotal = bouquet.accessories.reduce(
      (s, x) => s + x.price * x.qty,
      0,
    );
    const wrapTotal = bouquet.wrapping ? bouquet.wrapping.price : 0;
    return flowersTotal + accTotal + wrapTotal;
  }, [bouquet]);

  const summaryItems = useMemo(() => {
    const flowers = bouquet.flowers.map((item) => ({
      id: `flower-${item.id}`,
      name: item.name,
      type: "FLOWER",
      qty: item.qty,
      unitPrice: Number(item.price),
      subtotal: Number(item.price) * item.qty,
    }));

    const wrapping = bouquet.wrapping
      ? [
          {
            id: `wrapping-${bouquet.wrapping.id}`,
            name: bouquet.wrapping.name,
            type: "WRAPPING",
            qty: 1,
            unitPrice: Number(bouquet.wrapping.price),
            subtotal: Number(bouquet.wrapping.price),
          },
        ]
      : [];

    const accessories = bouquet.accessories.map((item) => ({
      id: `accessory-${item.id}`,
      name: item.name,
      type: "ACCESSORY",
      qty: item.qty,
      unitPrice: Number(item.price),
      subtotal: Number(item.price) * item.qty,
    }));

    return [...flowers, ...wrapping, ...accessories];
  }, [bouquet]);

  function toggleColor(c) {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function onAdd(product) {
    dispatch(addToBouquet(product, current.type));
  }

  function goPrev() {
    setStep((s) => Math.max(1, s - 1));
  }

  function goNext() {
    setStep((s) => Math.min(4, s + 1));
  }

  async function onSaveWishlist() {
    const hasAnyItems =
      bouquet.flowers.length > 0 ||
      bouquet.accessories.length > 0 ||
      Boolean(bouquet.wrapping);

    if (!hasAnyItems) {
      setWishlistMsg("Add products before saving to wishlist.");
      return;
    }

    const result = await dispatch(addWishlistItem(bouquet));
    if (result?.ok) {
      setWishlistMsg("Saved to wishlist.");
      navigate("/wishlist");
      return;
    }

    setWishlistMsg(result?.error || "Could not save wishlist item.");
  }

  return (
    <div className="builder">
      <div className="builder-head">
        <h1 className="builder-title">Build Your Bouquet</h1>
        <p className="builder-subtitle">
          Create your perfect custom bouquet step by step
        </p>

        <div className="stepper">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="step">
              <div
                className={`step-dot ${step === s.id ? "active" : step > s.id ? "done" : ""}`}
              >
                {s.id}
              </div>
              <div className="step-label">{s.label}</div>
              {idx < STEPS.length - 1 && (
                <div className={`step-line ${step > s.id ? "active" : ""}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={`builder-layout ${step === 4 ? "summary-mode" : ""}`}>
        {/* LEFT */}
        <div className="panel">
          <div className="panel-title">{current?.label}</div>

          {current?.type && (
            <div className="panel-content">
              <aside className="filters">
                <div className="filters-title">Color</div>
                <div className="filters-colors">
                  {COLORS.map((c) => (
                    <label key={c} className="color-row">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(c)}
                        onChange={() => toggleColor(c)}
                      />
                      <span className={`dot dot-${c.toLowerCase()}`} />
                      <span className="color-name">
                        {c[0] + c.slice(1).toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="filters-title" style={{ marginTop: 14 }}>
                  Price Range: RON {minPrice} - RON {maxPrice}
                </div>

                {/* range (min/max) */}
                <div
                  className="range"
                  style={{
                    "--min": `${(minPrice / 20) * 100}%`,
                    "--max": `${(maxPrice / 20) * 100}%`,
                  }}
                >
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={minPrice}
                    onChange={(e) =>
                      setMinPrice(Math.min(Number(e.target.value), maxPrice))
                    }
                  />
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={maxPrice}
                    onChange={(e) =>
                      setMaxPrice(Math.max(Number(e.target.value), minPrice))
                    }
                  />
                </div>

                <label className="stock-row">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                  />
                  <span>In Stock Only</span>
                </label>
              </aside>

              <div className="products">
                {loading && <div className="state">Loading...</div>}
                {error && !loading && (
                  <div className="state error">{error}</div>
                )}

                {!loading && !error && (
                  <div className="grid">
                    {items.map((p) => (
                      <div key={p.id} className="card">
                        <img
                          className="card-img"
                          src={resolveImageSrc(p.imageUrl)}
                          alt={p.name}
                        />
                        <div className="card-body">
                          <div className="card-name">{p.name}</div>
                          <div className="card-row">
                            <div className="card-price">
                              RON {Number(p.price).toFixed(2)}
                            </div>
                            <div className="card-stock">{p.stock} in stock</div>
                          </div>

                          <button
                            className="add-btn"
                            type="button"
                            disabled={p.stock <= 0}
                            onClick={() => onAdd(p)}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pager">
                  <button
                    className="pager-btn ghost"
                    onClick={goPrev}
                    disabled={step === 1}
                  >
                    ‹ Previous
                  </button>

                  <div className="pager-mid">
                    {current?.type ? `Page ${page} / ${totalPages}` : null}
                  </div>

                  <button
                    className="pager-btn"
                    onClick={goNext}
                    disabled={step === 4}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="summary">
              {summaryItems.length ? (
                <>
                  <div className="summary-list">
                    {summaryItems.map((item) => (
                      <div key={item.id} className="summary-row">
                        <div>
                          <div className="summary-name">{item.name}</div>
                          <div className="summary-type">
                            {item.type} RON {item.unitPrice.toFixed(2)} x{" "}
                            {item.qty}
                          </div>
                        </div>

                        <div className="summary-subtotal">
                          RON {item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="summary-total">
                    <span>Total</span>
                    <b>RON {total.toFixed(2)}</b>
                  </div>
                </>
              ) : (
                <div className="summary-empty">No items added yet</div>
              )}

              <div className="summary-actions">
                <button
                  className="pager-btn ghost"
                  type="button"
                  onClick={goPrev}
                >
                  ‹ Previous
                </button>
                <Link to="/cart" className="pager-btn summary-add-btn">
                  Add to Cart
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        {step !== 4 && (
          <div className="side">
            <div className="side-card">
              <div className="side-title">Current Bouquet</div>

              {!bouquet.flowers.length &&
              !bouquet.wrapping &&
              !bouquet.accessories.length ? (
                <div className="side-empty">No items added yet</div>
              ) : (
                <div className="side-list">
                  {bouquet.flowers.map((x) => (
                    <Row
                      key={x.id}
                      item={x}
                      label="FLOWER"
                      onMinus={() => dispatch(changeQty(x.id, "FLOWER", -1))}
                      onPlus={() => dispatch(changeQty(x.id, "FLOWER", +1))}
                    />
                  ))}

                  {bouquet.wrapping && (
                    <div className="row">
                      <div className="row-left">
                        <div className="row-name">{bouquet.wrapping.name}</div>
                        <div className="row-sub">WRAPPING</div>
                      </div>
                      <div className="row-right">
                        <div className="row-price">
                          RON {Number(bouquet.wrapping.price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {bouquet.accessories.map((x) => (
                    <Row
                      key={x.id}
                      item={x}
                      label="ACCESSORY"
                      onMinus={() => dispatch(changeQty(x.id, "ACCESSORY", -1))}
                      onPlus={() => dispatch(changeQty(x.id, "ACCESSORY", +1))}
                    />
                  ))}

                  <div className="side-total">
                    <span>Total</span>
                    <b>RON {total.toFixed(2)}</b>
                  </div>

                  {user && (
                    <button
                      className="wishlist-btn"
                      type="button"
                      onClick={onSaveWishlist}
                      disabled={wishlistSaving}
                    >
                      <Heart size={16} />
                      <span>
                        {wishlistSaving ? "Saving..." : "Save to Wishlist"}
                      </span>
                    </button>
                  )}

                  {user && wishlistMsg && (
                    <div className="wishlist-msg">{wishlistMsg}</div>
                  )}

                  <button
                    className="clear-btn"
                    type="button"
                    onClick={() => dispatch(clearBouquet())}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="side-card ai">
              <div className="side-title">✨ AI Assistant</div>
              <div className="side-empty">Later</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ item, label, onMinus, onPlus }) {
  return (
    <div className="row">
      <div className="row-left">
        <div className="row-name">{item.name}</div>
        <div className="row-sub">{label}</div>
      </div>

      <div className="row-right">
        <div className="qty">
          <button className="qty-btn" type="button" onClick={onMinus}>
            -
          </button>
          <span className="qty-val">{item.qty}</span>
          <button className="qty-btn" type="button" onClick={onPlus}>
            +
          </button>
        </div>
        <div className="row-price">
          RON {(item.price * item.qty).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
