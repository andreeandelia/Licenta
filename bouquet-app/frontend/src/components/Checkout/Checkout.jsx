import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, Clock3, CreditCard, Tag, Truck } from "lucide-react";
import { fetchCart } from "../../stores/actions/cart-actions";
import { apiUrl } from "../../config/global";
import "./Checkout.css";

const DELIVERY_OPTIONS = [
  {
    id: "STANDARD",
    title: "Standard Delivery",
    subtitle: "National delivery · Free over RON 50",
    price: 19.99,
  },
  {
    id: "SAME_DAY",
    title: "Same-Day Delivery",
    subtitle: "Bucharest + Ilfov · Order by 14:00",
    price: 29.99,
  },
  {
    id: "EXPRESS",
    title: "Express Delivery",
    subtitle: "Bucharest only · 09:00-13:00 · Card only",
    price: 49.99,
  },
];

const STANDARD_FREE_DELIVERY_THRESHOLD = 50;
const EXPRESS_START_HOUR = 9;
const EXPRESS_END_HOUR = 13;

const PAYMENT_METHODS = [
  { id: "COD", title: "Cash on Delivery", subtitle: "Pay when you receive" },
  {
    id: "ONLINE",
    title: "Online Payment",
    subtitle: "Pay securely with card",
  },
];

function buildDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total, loading, error } = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth?.user);

  const [deliveryData, setDeliveryData] = useState({
    fullName: "",
    email: "",
    phone: "",
    state: "",
    city: "",
    street: "",
    postalCode: "",
    details: "",
  });
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [availablePromoCodes, setAvailablePromoCodes] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("STANDARD");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(buildDefaultDate());
  const [timeSlot, setTimeSlot] = useState("09:00 - 12:00");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const isBucharestArea = () => {
    const city = String(deliveryData.city || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const state = String(deliveryData.state || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return city.includes("bucuresti") && state.includes("bucuresti");
  };

  const isIlfovArea = () => {
    const state = String(deliveryData.state || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return state.includes("ilfov");
  };

  const validateCheckoutData = () => {
    const fullName = String(deliveryData.fullName || "").trim();
    const email = String(deliveryData.email || "").trim();
    const phone = String(deliveryData.phone || "").trim();
    const state = String(deliveryData.state || "").trim();
    const city = String(deliveryData.city || "").trim();
    const street = String(deliveryData.street || "").trim();
    const zipCode = String(deliveryData.postalCode || "").trim();

    if (fullName.length < 2) {
      return "Full name must be at least 2 characters long.";
    }
    if (!email || !email.includes("@")) {
      return "A valid email address is required.";
    }
    if (!phone || phone.length > 30) {
      return "Phone number is required and must have at most 30 characters.";
    }
    if (!state || !city || !street || !zipCode) {
      return "County, city, street and postal code are required.";
    }
    if (isScheduled && (!scheduleDate || !String(timeSlot || "").trim())) {
      return "Scheduled delivery requires both date and time slot.";
    }

    if (isScheduled && deliveryOption !== "STANDARD") {
      return "Scheduled delivery is available only for Standard delivery.";
    }

    if (
      deliveryOption === "SAME_DAY" &&
      !(isBucharestArea() || isIlfovArea())
    ) {
      return "Same-Day delivery is available only in Bucharest and Ilfov.";
    }

    if (deliveryOption === "EXPRESS") {
      if (!isBucharestArea()) {
        return "Express delivery is available only in Bucharest.";
      }

      if (paymentMethod !== "ONLINE") {
        return "Express delivery is available only with online card payment.";
      }

      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const isWeekday = day >= 1 && day <= 5;

      if (!isWeekday || hour < EXPRESS_START_HOUR || hour >= EXPRESS_END_HOUR) {
        return "Express delivery orders can be placed only Monday-Friday between 09:00 and 13:00.";
      }
    }

    return "";
  };

  useEffect(() => {
    if (deliveryOption !== "STANDARD" && isScheduled) {
      setIsScheduled(false);
    }
  }, [deliveryOption, isScheduled]);

  useEffect(() => {
    if (deliveryOption === "EXPRESS" && paymentMethod !== "ONLINE") {
      setPaymentMethod("ONLINE");
    }
  }, [deliveryOption, paymentMethod]);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    async function loadPromoCodes() {
      try {
        const res = await fetch(apiUrl("/api/promos"), {
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        if (isMounted) {
          setAvailablePromoCodes(Array.isArray(data?.codes) ? data.codes : []);
        }
      } catch {
        if (isMounted) {
          setAvailablePromoCodes([]);
        }
      }
    }

    loadPromoCodes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setDeliveryData({
        fullName: "",
        email: "",
        phone: "",
        state: "",
        city: "",
        street: "",
        postalCode: "",
        details: "",
      });
      return;
    }

    const rawDetails = String(user?.address?.details || "").trim();

    setDeliveryData({
      fullName: String(user?.name || ""),
      email: String(user?.email || ""),
      phone: String(user?.phone || ""),
      state: String(user?.address?.state || ""),
      city: String(user?.address?.city || ""),
      street: String(user?.address?.street || ""),
      postalCode: String(user?.address?.zipCode || ""),
      details: rawDetails,
    });
  }, [user]);

  const handleDeliveryChange = (field) => (event) => {
    setDeliveryData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const subtotal = useMemo(() => Number(total || 0), [total]);

  const selectedDelivery = useMemo(
    () => DELIVERY_OPTIONS.find((option) => option.id === deliveryOption),
    [deliveryOption],
  );

  const promoDiscount = useMemo(() => {
    if (!appliedPromo?.discountPercent) return 0;
    return subtotal * (Number(appliedPromo.discountPercent) / 100);
  }, [appliedPromo, subtotal]);

  const deliveryFee = useMemo(() => {
    if (!selectedDelivery) return 0;

    const subtotalAfterDiscount = Math.max(0, subtotal - promoDiscount);
    if (
      deliveryOption === "STANDARD" &&
      subtotalAfterDiscount >= STANDARD_FREE_DELIVERY_THRESHOLD
    ) {
      return 0;
    }

    return Number(selectedDelivery.price || 0);
  }, [deliveryOption, promoDiscount, selectedDelivery, subtotal]);

  const totalToPay = useMemo(() => {
    return subtotal - promoDiscount + deliveryFee;
  }, [deliveryFee, promoDiscount, subtotal]);

  const handlePromoApply = async () => {
    const normalized = promoCode.trim().toUpperCase();
    if (!normalized) {
      setPromoError("Enter a promo code first.");
      setPromoMessage("");
      return;
    }

    try {
      setPromoLoading(true);
      setPromoError("");
      setPromoMessage("");

      const res = await fetch(apiUrl("/api/promos/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: normalized }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAppliedPromo(null);
        setPromoError(data?.error || "Invalid promo code.");
        return;
      }

      setAppliedPromo(data.promo || null);
      setPromoCode(String(data?.promo?.code || normalized));
      setPromoMessage("Promo code applied successfully.");
    } catch {
      setPromoError("Could not validate promo code right now.");
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    const validationError = validateCheckoutData();
    if (validationError) {
      setCheckoutError(validationError);
      return;
    }

    try {
      setPlacingOrder(true);
      setCheckoutError("");

      const payload = {
        paymentMethod,
        delivery: {
          fullName: String(deliveryData.fullName || "").trim(),
          email: String(deliveryData.email || "").trim(),
          phone: String(deliveryData.phone || "").trim(),
          state: String(deliveryData.state || "").trim(),
          city: String(deliveryData.city || "").trim(),
          street: String(deliveryData.street || "").trim(),
          zipCode: String(deliveryData.postalCode || "").trim(),
          details: String(deliveryData.details || "").trim(),
        },
        deliveryOption,
        promoCode: appliedPromo?.code || "",
        schedule: {
          enabled: deliveryOption === "STANDARD" ? isScheduled : false,
          date: scheduleDate,
          timeSlot,
        },
      };

      if (paymentMethod === "ONLINE") {
        const onlineRes = await fetch(apiUrl("/api/orders/online/init"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const onlineData = await onlineRes.json().catch(() => ({}));
        if (!onlineRes.ok) {
          setCheckoutError(
            onlineData?.error || "Could not start online payment.",
          );
          return;
        }

        if (!onlineData?.checkoutUrl) {
          setCheckoutError("Could not initialize online payment session.");
          return;
        }

        window.location.href = onlineData.checkoutUrl;
        return;
      }

      const res = await fetch(apiUrl("/api/orders/cash-on-delivery"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...payload,
          paymentMethod: "COD",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckoutError(data?.error || "Could not place the order.");
        return;
      }

      await dispatch(fetchCart());
      navigate("/cod-success", { state: { order: data?.order || null } });
    } catch {
      setCheckoutError("Could not place the order right now.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="checkout-page">
    <section className="checkout-wrap">
      <header className="checkout-head">
        <h1>Checkout</h1>
        <p>Complete your order and get your beautiful bouquet delivered</p>
      </header>

      {loading && <div className="checkout-state">Loading cart...</div>}
      {error && !loading && <div className="checkout-state error">{error}</div>}

      {!loading && !error && (
        <div className="checkout-layout">
          <div className="checkout-left">
            <article className="checkout-card">
              <h2>Delivery Details</h2>

              {user && (
                <p className="checkout-prefill-note">
                  Delivery data is prefilled from your account settings.
                </p>
              )}

              <div className="checkout-grid two-cols">
                <label>
                  <span>Full Name *</span>
                  <input
                    type="text"
                    value={deliveryData.fullName}
                    onChange={handleDeliveryChange("fullName")}
                    placeholder="John Doe"
                  />
                </label>

                <label>
                  <span>Phone Number *</span>
                  <input
                    type="tel"
                    value={deliveryData.phone}
                    onChange={handleDeliveryChange("phone")}
                    placeholder="+40712345678"
                  />
                </label>

                <label>
                  <span>Email *</span>
                  <input
                    type="email"
                    value={deliveryData.email}
                    onChange={handleDeliveryChange("email")}
                    placeholder="email@example.com"
                  />
                </label>
              </div>

              <div className="checkout-divider" />
              <h3 className="checkout-subtitle">Address</h3>

              <div className="checkout-grid two-cols">
                <label>
                  <span>County *</span>
                  <input
                    type="text"
                    value={deliveryData.state}
                    onChange={handleDeliveryChange("state")}
                    placeholder="Ilfov"
                  />
                </label>

                <label>
                  <span>City *</span>
                  <input
                    type="text"
                    value={deliveryData.city}
                    onChange={handleDeliveryChange("city")}
                    placeholder="Bucharest"
                  />
                </label>

                <label>
                  <span>Street *</span>
                  <input
                    type="text"
                    value={deliveryData.street}
                    onChange={handleDeliveryChange("street")}
                    placeholder="Street, number"
                  />
                </label>

                <label>
                  <span>Postal Code *</span>
                  <input
                    type="text"
                    value={deliveryData.postalCode}
                    onChange={handleDeliveryChange("postalCode")}
                    placeholder="010101"
                  />
                </label>

                <label>
                  <span>Address Details</span>
                  <textarea
                    rows={2}
                    value={deliveryData.details}
                    onChange={handleDeliveryChange("details")}
                    placeholder="Apartment, floor, intercom, delivery notes"
                  />
                </label>
              </div>
            </article>

            <article className="checkout-card">
              <h2>
                <Tag size={18} />
                Promo Code
              </h2>

              <div className="promo-row">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPromoCode(value);
                    setPromoError("");
                    setPromoMessage("");

                    if (
                      appliedPromo?.code &&
                      value.trim().toUpperCase() !== appliedPromo.code
                    ) {
                      setAppliedPromo(null);
                    }
                  }}
                  placeholder="Enter promo code"
                />
                <button
                  type="button"
                  onClick={handlePromoApply}
                  disabled={!promoCode.trim() || promoLoading}
                >
                  {promoLoading ? "Checking..." : "Apply"}
                </button>
              </div>

              {promoError && <p className="promo-status error">{promoError}</p>}
              {promoMessage && (
                <p className="promo-status ok">{promoMessage}</p>
              )}

              <p className="promo-help">
                {availablePromoCodes.length > 0 ? (
                  <>
                    Available codes:{" "}
                    {availablePromoCodes.map((promo, index) => (
                      <span key={promo.code}>
                        <strong>{promo.code}</strong> ({promo.discountPercent}%
                        off)
                        {index < availablePromoCodes.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </>
                ) : (
                  <>No active promo codes at the moment.</>
                )}
              </p>
            </article>

            <article className="checkout-card">
              <h2>
                <Truck size={18} />
                Delivery Options
              </h2>

              <div className="checkout-options">
                {DELIVERY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    className={`checkout-option ${
                      deliveryOption === option.id ? "active" : ""
                    }`}
                    type="button"
                    onClick={() => setDeliveryOption(option.id)}
                  >
                    <div>
                      <strong>{option.title}</strong>
                      <span>{option.subtitle}</span>
                    </div>
                    <b>RON {option.price.toFixed(2)}</b>
                  </button>
                ))}
              </div>

              <label className="schedule-toggle">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  disabled={deliveryOption !== "STANDARD"}
                  onChange={(event) => setIsScheduled(event.target.checked)}
                />
                <span>
                  Schedule delivery for later (available only for Standard)
                </span>
              </label>

              {isScheduled && (
                <div className="checkout-grid two-cols schedule-fields">
                  <label>
                    <span>
                      <CalendarDays size={16} /> Day
                    </span>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(event) => setScheduleDate(event.target.value)}
                    />
                  </label>

                  <label>
                    <span>
                      <Clock3 size={16} /> Time Slot
                    </span>
                    <select
                      value={timeSlot}
                      onChange={(event) => setTimeSlot(event.target.value)}
                    >
                      <option>09:00 - 12:00</option>
                      <option>12:00 - 15:00</option>
                      <option>15:00 - 18:00</option>
                      <option>18:00 - 21:00</option>
                    </select>
                  </label>
                </div>
              )}
            </article>

            <article className="checkout-card">
              <h2>
                <CreditCard size={18} />
                Payment Method
              </h2>

              <div className="checkout-options">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    className={`checkout-option ${
                      paymentMethod === method.id ? "active" : ""
                    }`}
                    type="button"
                    disabled={
                      deliveryOption === "EXPRESS" && method.id === "COD"
                    }
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setCheckoutError("");
                    }}
                  >
                    <div>
                      <strong>{method.title}</strong>
                      <span>{method.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            </article>
          </div>

          <aside className="checkout-summary">
            <div className="checkout-summary-card">
              <h2>Order Summary</h2>

              <div className="checkout-lines">
                {items.map((item, index) => {
                  const quantity = Number(item.quantity || 1);
                  const lineTotal = Number(item.unitPrice || 0) * quantity;
                  return (
                    <div className="checkout-line" key={item.id}>
                      <div>
                        <strong>Custom Bouquet #{index + 1}</strong>
                        <span>
                          RON {Number(item.unitPrice || 0).toFixed(2)} ×{" "}
                          {quantity}
                        </span>
                      </div>
                      <b>RON {lineTotal.toFixed(2)}</b>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <b>RON {subtotal.toFixed(2)}</b>
              </div>

              {promoDiscount > 0 && (
                <div className="checkout-summary-row">
                  <span>
                    Discount ({appliedPromo?.code} -{" "}
                    {appliedPromo?.discountPercent}
                    %)
                  </span>
                  <b>- RON {promoDiscount.toFixed(2)}</b>
                </div>
              )}

              <div className="checkout-summary-row">
                <span>Delivery ({selectedDelivery?.title})</span>
                <b>
                  {deliveryFee === 0
                    ? "FREE"
                    : `RON ${Number(deliveryFee).toFixed(2)}`}
                </b>
              </div>

              <div className="cart-summary-divider" />

              <div className="checkout-summary-row total">
                <span>Total</span>
                <strong>RON {totalToPay.toFixed(2)}</strong>
              </div>

              {checkoutError && (
                <div className="checkout-submit-error">{checkoutError}</div>
              )}

              <button
                className="checkout-place-order"
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder || items.length === 0}
              >
                {placingOrder
                  ? "Placing Order..."
                  : `Place Order - RON ${totalToPay.toFixed(2)}`}
              </button>

              <p className="checkout-note">
                By placing this order, you agree to our terms and conditions.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
    </div>
  );
}
