import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2 } from "lucide-react";
import {
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartQuantity,
} from "../../stores/actions/cart-actions";
import "./Cart.css";

function itemLines(bouquetDetails, type) {
  if (type === "WRAPPING") {
    if (!bouquetDetails?.wrapping) return [];
    return [
      {
        id: `wrapping-${bouquetDetails.wrapping.id}`,
        name: bouquetDetails.wrapping.name,
        qty: 1,
      },
    ];
  }

  if (type === "FLOWER") return bouquetDetails?.flowers || [];
  if (type === "ACCESSORY") return bouquetDetails?.accessories || [];
  return [];
}

function itemCount(bouquetDetails) {
  const flowerCount = (bouquetDetails?.flowers || []).reduce(
    (sum, entry) => sum + Number(entry.qty || 0),
    0,
  );
  const accessoryCount = (bouquetDetails?.accessories || []).reduce(
    (sum, entry) => sum + Number(entry.qty || 0),
    0,
  );
  const wrappingCount = bouquetDetails?.wrapping ? 1 : 0;

  return flowerCount + accessoryCount + wrappingCount;
}

function isGreetingCardName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .includes("greeting card");
}

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, count, loading, error } = useSelector(
    (state) => state.cart,
  );
  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const subtotal = useMemo(() => Number(total || 0), [total]);
  const tax = useMemo(() => subtotal * 0.1, [subtotal]);
  const grandTotal = useMemo(() => subtotal + tax, [subtotal, tax]);

  return (
    <section className="cart-wrap">
      <div className="cart-head">
        <div>
          <h1>Shopping Cart</h1>
        </div>

        {items.length > 0 && (
          <button
            className="cart-clear"
            type="button"
            onClick={() => dispatch(clearCart())}
          >
            <Trash2 size={15} />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {loading && <div className="cart-state">Loading cart...</div>}
      {error && !loading && <div className="cart-state error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="cart-empty">
          <div className="cart-empty-icon" aria-hidden="true">
            <ShoppingCart size={28} />
          </div>
          <h2>Your cart is empty.</h2>
          <p>
            Start building a bouquet and add it to your cart when you're ready.
          </p>
          <Link to="/builder" className="cart-empty-cta">
            Go to Builder
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="cart-layout">
          <div className="cart-left">
            {items.map((item, index) => {
              const details = item.bouquetDetails || {};
              const bouquetQty = Number(item.quantity || 1);
              const lineTotal = Number(item.unitPrice || 0) * bouquetQty;

              return (
                <article key={item.id} className="cart-card">
                  <div className="cart-card-head">
                    <div>
                      <h3>Custom Bouquet #{index + 1}</h3>
                      <p>
                        {itemCount(details)} items · Added{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      className="cart-remove"
                      type="button"
                      aria-label="Remove bouquet from cart"
                      onClick={() => dispatch(removeCartItem(item.id))}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="cart-sections">
                    <div className="cart-section">
                      <div className="cart-section-title">Flowers</div>
                      <div className="cart-lines">
                        {itemLines(details, "FLOWER").length > 0 ? (
                          itemLines(details, "FLOWER").map((line) => (
                            <div
                              key={`${item.id}-f-${line.id}`}
                              className="cart-line"
                            >
                              <span>{line.name}</span>
                              <b>x{Number(line.qty || 1)}</b>
                            </div>
                          ))
                        ) : (
                          <div className="cart-line empty">
                            No flowers selected
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="cart-section">
                      <div className="cart-section-title">Wrapping</div>
                      <div className="cart-lines">
                        {itemLines(details, "WRAPPING").length > 0 ? (
                          itemLines(details, "WRAPPING").map((line) => (
                            <div
                              key={`${item.id}-w-${line.id}`}
                              className="cart-line"
                            >
                              <span>{line.name}</span>
                              <b>x1</b>
                            </div>
                          ))
                        ) : (
                          <div className="cart-line empty">
                            No wrapping selected
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="cart-section">
                      <div className="cart-section-title">Accessories</div>
                      <div className="cart-lines">
                        {itemLines(details, "ACCESSORY").length > 0 ? (
                          itemLines(details, "ACCESSORY").map((line) => (
                            <div
                              key={`${item.id}-a-${line.id}`}
                              className="cart-line"
                            >
                              <span>{line.name}</span>
                              <b>x{Number(line.qty || 1)}</b>
                            </div>
                          ))
                        ) : (
                          <div className="cart-line empty">
                            No accessories selected
                          </div>
                        )}
                      </div>
                    </div>

                    {details.greetingCardMessage &&
                      itemLines(details, "ACCESSORY").some((line) =>
                        isGreetingCardName(line.name),
                      ) && (
                        <div className="cart-section">
                          <div className="cart-section-title">
                            Greeting Card Message
                          </div>
                          <div className="cart-lines">
                            <div className="cart-line cart-message-line">
                              <span>{details.greetingCardMessage}</span>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="cart-card-foot">
                    <div className="cart-qty-row">
                      <span>Bouquet quantity</span>
                      <div className="cart-qty-actions">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateCartQuantity(item.id, bouquetQty - 1),
                            )
                          }
                        >
                          −
                        </button>
                        <b>{bouquetQty}</b>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              updateCartQuantity(item.id, bouquetQty + 1),
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cart-bouquet-total">
                      <span>Bouquet Total:</span>
                      <strong>RON {lineTotal.toFixed(2)}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart-summary">
            <div className="cart-summary-card">
              <h2>Order Summary</h2>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <b>RON {subtotal.toFixed(2)}</b>
              </div>

              <div className="cart-summary-row">
                <span>Tax (10%)</span>
                <b>RON {tax.toFixed(2)}</b>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-row total">
                <span>Total</span>
                <strong>RON {grandTotal.toFixed(2)}</strong>
              </div>

              <button
                className="cart-checkout"
                type="button"
                onClick={() => navigate("/checkout")}
              >
                Checkout
              </button>

              <div className="cart-note">
                Free delivery on orders over RON 50
              </div>

              <ul className="cart-benefits">
                <li>Fresh flowers guaranteed</li>
                <li>Same-day delivery available</li>
                <li>Secure payment options</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
