import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, MapPin, Package, Phone, Save, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../stores/actions/auth-actions";
import "./Settings.css";

export default function Settings() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);

  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPhone(String(user?.phone || ""));
    setStreet(String(user?.address?.street || ""));
    setCity(String(user?.address?.city || ""));
    setState(String(user?.address?.state || ""));
    setZipCode(String(user?.address?.zipCode || ""));
    setDetails(String(user?.address?.details || ""));
  }, [
    user?.phone,
    user?.address?.street,
    user?.address?.city,
    user?.address?.state,
    user?.address?.zipCode,
    user?.address?.details,
  ]);

  const hasChanges = useMemo(() => {
    const userPhone = String(user?.phone || "").trim();
    const userStreet = String(user?.address?.street || "").trim();
    const userCity = String(user?.address?.city || "").trim();
    const userState = String(user?.address?.state || "").trim();
    const userZipCode = String(user?.address?.zipCode || "").trim();
    const userDetails = String(user?.address?.details || "").trim();

    return (
      phone.trim() !== userPhone ||
      street.trim() !== userStreet ||
      city.trim() !== userCity ||
      state.trim() !== userState ||
      zipCode.trim() !== userZipCode ||
      details.trim() !== userDetails
    );
  }, [
    city,
    details,
    phone,
    state,
    street,
    user?.address?.city,
    user?.address?.details,
    user?.address?.state,
    user?.address?.street,
    user?.address?.zipCode,
    user?.phone,
    zipCode,
  ]);

  async function onSave(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!hasChanges) {
      setMessage("No changes to save.");
      return;
    }

    setSaving(true);
    const result = await dispatch(
      updateProfile(phone, {
        street,
        city,
        state,
        zipCode,
        details,
      }),
    );
    setSaving(false);

    if (result?.ok) {
      setMessage("Profile updated successfully.");
      return;
    }

    setError(result?.error || "Could not save profile settings.");
  }

  return (
    <section className="settings-wrap">
      <div className="settings-head">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <form className="settings-card" onSubmit={onSave}>
        <h2>Profile Information</h2>
        <p className="settings-subtitle">
          Update your personal details and contact information
        </p>

        <div className="settings-grid settings-grid-2">
          <label className="settings-field">
            <span>Name</span>
            <div className="settings-input-wrap readonly">
              <User size={16} />
              <input type="text" value={user?.name || ""} readOnly />
            </div>
          </label>

          <label className="settings-field">
            <span>Email</span>
            <div className="settings-input-wrap readonly">
              <Mail size={16} />
              <input type="email" value={user?.email || ""} readOnly />
            </div>
          </label>
        </div>

        <div className="settings-divider" />

        <div className="settings-grid settings-grid-1">
          <label className="settings-field">
            <span>Phone Number</span>
            <div className="settings-input-wrap">
              <Phone size={16} />
              <input
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Add your phone number"
              />
            </div>
          </label>

          <div className="settings-grid settings-grid-2 address-grid">
            <label className="settings-field">
              <span>Street</span>
              <div className="settings-input-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street"
                />
              </div>
            </label>

            <label className="settings-field">
              <span>City</span>
              <div className="settings-input-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
            </label>

            <label className="settings-field">
              <span>County</span>
              <div className="settings-input-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="County"
                />
              </div>
            </label>

            <label className="settings-field">
              <span>Postal Code</span>
              <div className="settings-input-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Postal code"
                />
              </div>
            </label>
          </div>

          <label className="settings-field">
            <span>Address Details (optional)</span>
            <div className="settings-textarea-wrap">
              <MapPin size={16} />
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Apartment, floor, intercom, notes"
              />
            </div>
          </label>
        </div>

        <div className="settings-actions">
          <button
            className="settings-save"
            type="submit"
            disabled={saving || !hasChanges}
          >
            <Save size={16} />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>

        {message && <div className="settings-msg ok">{message}</div>}
        {error && <div className="settings-msg err">{error}</div>}
      </form>

      <div className="settings-card settings-activity">
        <h2>Account Activity</h2>
        <p className="settings-subtitle">
          Your order history and saved bouquets
        </p>

        <div className="settings-activity-grid">
          <Link to="/orders" className="activity-card" aria-label="Open orders">
            <div className="activity-icon">
              <Package size={18} />
            </div>
            <div>
              <div className="activity-count">
                {Number(user?.stats?.orders || 0)}
              </div>
              <div className="activity-label">Total Orders</div>
            </div>
          </Link>

          <Link
            to="/wishlist"
            className="activity-card"
            aria-label="Open wishlist"
          >
            <div className="activity-icon">
              <Heart size={18} />
            </div>
            <div>
              <div className="activity-count">
                {Number(user?.stats?.wishlist || 0)}
              </div>
              <div className="activity-label">Favorite Bouquets</div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
