import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { fetchProducts } from "../../stores/actions/product-actions";
import { addWishlistItem } from "../../stores/actions/wishlist-actions";
import { addBouquetToCart } from "../../stores/actions/cart-actions";
import {
  addToBouquet,
  changeQty,
  clearBouquet,
  setGreetingCardMessage,
} from "../../stores/actions/bouquet-actions";
import { apiUrl, mediaUrl } from "../../config/global";
import "./Builder.css";

const CHAT_STORAGE_PREFIX = "bouquet.chat.v1";
const MAX_CHAT_MESSAGES = 40;
const DEFAULT_ASSISTANT_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I am your florist assistant. Tell me the occasion, preferred colors, and budget, and I will suggest the best flowers.",
};

function getChatStorageKey(userId) {
  return userId
    ? `${CHAT_STORAGE_PREFIX}.user.${userId}`
    : `${CHAT_STORAGE_PREFIX}.guest`;
}

function sanitizeChatMessages(value) {
  if (!Array.isArray(value)) return null;

  const normalized = value
    .map((entry) => {
      const role = entry?.role === "user" ? "user" : "assistant";
      const content = String(entry?.content || "").trim();
      if (!content) return null;
      return { role, content };
    })
    .filter(Boolean)
    .slice(-MAX_CHAT_MESSAGES);

  return normalized.length ? normalized : null;
}

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

  const raw = String(imageUrl).trim();
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/uploads/")) {
    return mediaUrl(raw);
  }

  const normalized = raw
    .trim()
    .replace(/^\/+/, "")
    .replace(/^assets\//i, "")
    .toLowerCase();

  return (
    ASSET_INDEX[normalized] || ASSET_INDEX[normalized.split("/").pop()] || ""
  );
}

function isGreetingCardName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .includes("greeting card");
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
  const [cartMsg, setCartMsg] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [chatMessages, setChatMessages] = useState([DEFAULT_ASSISTANT_MESSAGE]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  // filters
  const [selectedColors, setSelectedColors] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20);
  const [inStock, setInStock] = useState(false);
  const [productPage, setProductPage] = useState(1);

  const current = STEPS.find((x) => x.id === step);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.max(1, productPage);
  const chatStorageKey = getChatStorageKey(user?.id);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(chatStorageKey);
      if (!raw) {
        setChatMessages([DEFAULT_ASSISTANT_MESSAGE]);
        return;
      }

      const parsed = JSON.parse(raw);
      const restored = sanitizeChatMessages(parsed?.messages);
      setChatMessages(restored || [DEFAULT_ASSISTANT_MESSAGE]);
    } catch {
      setChatMessages([DEFAULT_ASSISTANT_MESSAGE]);
    }

    setChatError("");
    setChatInput("");
  }, [chatStorageKey]);

  useEffect(() => {
    try {
      const payload = {
        version: 1,
        updatedAt: Date.now(),
        messages: chatMessages.slice(-MAX_CHAT_MESSAGES),
      };
      localStorage.setItem(chatStorageKey, JSON.stringify(payload));
    } catch {
      // localStorage may be unavailable in private mode or full quota.
    }
  }, [chatStorageKey, chatMessages]);

  useEffect(() => {
    if (!current?.type) return;

    dispatch(
      fetchProducts({
        type: current.type,
        colors: selectedColors,
        minPrice,
        maxPrice,
        inStock,
        page: productPage,
        limit: 6,
      }),
    );
  }, [
    dispatch,
    current?.type,
    selectedColors,
    minPrice,
    maxPrice,
    inStock,
    productPage,
  ]);

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
      imageUrl: item.imageUrl || "",
      isGreetingCard: false,
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
            imageUrl: bouquet.wrapping.imageUrl || "",
            isGreetingCard: false,
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
      imageUrl: item.imageUrl || "",
      isGreetingCard: isGreetingCardName(item.name),
    }));

    return [...flowers, ...wrapping, ...accessories];
  }, [bouquet]);

  const hasGreetingCard = bouquet.accessories.some((item) =>
    isGreetingCardName(item.name),
  );

  useEffect(() => {
    if (hasGreetingCard) return;
    if (!bouquet.greetingCardMessage) return;

    dispatch(setGreetingCardMessage(""));
  }, [dispatch, hasGreetingCard, bouquet.greetingCardMessage]);

  function toggleColor(c) {
    setProductPage(1);

    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function onAdd(product) {
    dispatch(addToBouquet(product, current.type));
  }

  function onGreetingCardMessageChange(event) {
    dispatch(setGreetingCardMessage(event.target.value));
  }

  function goToStep(nextStep) {
    setStep(nextStep);
    setProductPage(1);
    setCartMsg("");
    setWishlistMsg("");
  }

  function goPrev() {
    goToStep(Math.max(1, step - 1));
  }

  function goNext() {
    goToStep(Math.min(4, step + 1));
  }

  function goPrevProductPage() {
    setProductPage((currentPage) => Math.max(1, currentPage - 1));
  }

  function goNextProductPage() {
    setProductPage((currentPage) => Math.min(safeTotalPages, currentPage + 1));
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
      dispatch(clearBouquet());
      navigate("/wishlist");
      return;
    }

    setWishlistMsg(result?.error || "Could not save wishlist item.");
  }

  async function onAddToCart() {
    const hasAnyItems =
      bouquet.flowers.length > 0 ||
      bouquet.accessories.length > 0 ||
      Boolean(bouquet.wrapping);

    if (!hasAnyItems) {
      setCartMsg("Add products before adding to cart.");
      return;
    }

    setAddingToCart(true);
    setCartMsg("");

    const result = await dispatch(addBouquetToCart({ bouquet }));
    setAddingToCart(false);

    if (result?.ok) {
      dispatch(clearBouquet());
      navigate("/cart");
      return;
    }

    setCartMsg(result?.error || "Could not add bouquet to cart.");
  }

  async function onSendChatMessage() {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    const nextMessages = [
      ...chatMessages,
      { role: "user", content: message },
    ].slice(-MAX_CHAT_MESSAGES);
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    setChatError("");

    try {
      const history = nextMessages
        .slice(0, -1)
        .map((entry) => ({ role: entry.role, content: entry.content }));

      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          history,
          context: {
            currentStep: current?.label || "",
            currentProductType: current?.type || "",
            bouquet: {
              flowers: bouquet.flowers.map((item) => ({
                name: item.name,
                qty: item.qty,
                price: Number(item.price),
              })),
              wrapping: bouquet.wrapping
                ? {
                    name: bouquet.wrapping.name,
                    price: Number(bouquet.wrapping.price),
                  }
                : null,
              accessories: bouquet.accessories.map((item) => ({
                name: item.name,
                qty: item.qty,
                price: Number(item.price),
              })),
              greetingCardMessage: bouquet.greetingCardMessage || "",
              total: Number(total.toFixed(2)),
            },
            filters: {
              selectedColors,
              minPrice,
              maxPrice,
              inStock,
            },
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Could not contact florist assistant.");
      }

      const reply = String(data?.reply || "").trim();

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            reply ||
            "I could not generate a response right now. Please try again in a moment.",
        },
      ]);
    } catch (err) {
      setChatError(err?.message || "Could not contact florist assistant.");
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I am having trouble reaching the inventory service. Please try again shortly.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function onChatInputKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendChatMessage();
    }
  }

  return (
    <div className="builder">
      <div className="builder-head">
        <h1 className="builder-title">Build Your Bouquet</h1>
        <p className="builder-subtitle">
          Create your perfect custom bouquet step by step
        </p>

        <div className={`stepper stepper-${step}`}>
          {STEPS.map((s, idx) => (
            <div key={s.id} className="step">
              <div
                className={`step-dot ${
                  step === s.id ? "active" : step > s.id ? "done" : ""
                }`}
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
                    onChange={(e) => {
                      setProductPage(1);
                      setMinPrice(Math.min(Number(e.target.value), maxPrice));
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={maxPrice}
                    onChange={(e) => {
                      setProductPage(1);
                      setMaxPrice(Math.max(Number(e.target.value), minPrice));
                    }}
                  />
                </div>

                <label className="stock-row">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => {
                      setProductPage(1);
                      setInStock(e.target.checked);
                    }}
                  />
                  <span>In Stock Only</span>
                </label>
              </aside>

              <div className="products">
                {loading && <div className="state empty">Loading...</div>}
                {error && !loading && (
                  <div className="state error">{error}</div>
                )}

                {!loading &&
                  !error &&
                  (items.length === 0 ? (
                    <div className="state empty">
                      No products found for current filters.
                    </div>
                  ) : (
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
                              <div className="card-stock">
                                {p.stock} in stock
                              </div>
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
                  ))}

                <div className="pager">
                  <button
                    className="pager-arrow-btn"
                    type="button"
                    onClick={goPrevProductPage}
                    disabled={safePage <= 1 || loading}
                  >
                    ‹
                  </button>

                  <div className="pager-mid">
                    Page {safePage} / {safeTotalPages}
                  </div>

                  <button
                    className="pager-arrow-btn"
                    type="button"
                    onClick={goNextProductPage}
                    disabled={safePage >= safeTotalPages || loading}
                  >
                    ›
                  </button>
                </div>

                <div className="step-actions">
                  <button
                    className="pager-btn ghost"
                    type="button"
                    onClick={goPrev}
                    disabled={step === 1}
                  >
                    ‹ Previous step
                  </button>

                  <button
                    className="pager-btn"
                    type="button"
                    onClick={goNext}
                    disabled={step === 4}
                  >
                    Next step ›
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
                        <div className="summary-left">
                          {resolveImageSrc(item.imageUrl) ? (
                            <img
                              className="summary-thumb"
                              src={resolveImageSrc(item.imageUrl)}
                              alt={item.name}
                            />
                          ) : (
                            <div
                              className="summary-thumb summary-thumb-placeholder"
                              aria-hidden="true"
                            />
                          )}
                          <div className="summary-text">
                            <div className="summary-name">{item.name}</div>
                            <div className="summary-type">
                              {item.type} RON {item.unitPrice.toFixed(2)} x{" "}
                              {item.qty}
                            </div>
                            {item.isGreetingCard &&
                              bouquet.greetingCardMessage && (
                                <div className="summary-message">
                                  MESSAGE: {bouquet.greetingCardMessage}
                                </div>
                              )}
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
                <button
                  className="pager-btn summary-add-btn"
                  type="button"
                  onClick={onAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </button>
              </div>

              {cartMsg && <div className="builder-error-msg">{cartMsg}</div>}
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

                  {hasGreetingCard && (
                    <div className="greeting-card-message-box">
                      <div className="greeting-card-message-title">
                        Greeting Card Message
                      </div>
                      <textarea
                        className="greeting-card-message-input"
                        value={bouquet.greetingCardMessage || ""}
                        onChange={onGreetingCardMessageChange}
                        maxLength={200}
                        rows={3}
                        placeholder="Write your message here..."
                      />
                      <div className="greeting-card-message-hint">
                        This message will be printed on the greeting card.
                      </div>
                    </div>
                  )}

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
              <div className="side-title">✨ Florist Assistant</div>
              <div className="ai-chat-list">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`ai-msg ${msg.role === "assistant" ? "assistant" : "user"}`}
                  >
                    {msg.content}
                  </div>
                ))}

                {chatLoading && (
                  <div className="ai-msg assistant">
                    Florist is checking options...
                  </div>
                )}
              </div>

              <div className="ai-chat-input-wrap">
                <textarea
                  className="ai-chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={onChatInputKeyDown}
                  placeholder="Ask about flowers, colors, or stock..."
                  rows={2}
                  disabled={chatLoading}
                />
                <button
                  className="ai-chat-send"
                  type="button"
                  onClick={onSendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                >
                  {chatLoading ? "Sending..." : "Send"}
                </button>
              </div>

              {chatError && (
                <div className="builder-error-msg">{chatError}</div>
              )}
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
