import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Heart,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteMyAccount,
  updateProfile,
  loadMe,
} from "../../stores/actions/auth-actions";
import "./Settings.css";

export default function Settings() {
  const DELETE_DIALOG_ANIMATION_MS = 220;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    dispatch(loadMe({ silent: true }));
  }, [dispatch]);

  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [details, setDetails] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingZipCode, setBillingZipCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleteDialogClosing, setIsDeleteDialogClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPhone(String(user?.phone || ""));
    setStreet(String(user?.address?.street || ""));
    setCity(String(user?.address?.city || ""));
    setState(String(user?.address?.state || ""));
    setZipCode(String(user?.address?.zipCode || ""));
    setDetails(String(user?.address?.details || ""));
    setBillingStreet(String(user?.billingStreet || ""));
    setBillingCity(String(user?.billingCity || ""));
    setBillingState(String(user?.billingState || ""));
    setBillingZipCode(String(user?.billingZipCode || ""));
  }, [
    user?.phone,
    user?.address?.street,
    user?.address?.city,
    user?.address?.state,
    user?.address?.zipCode,
    user?.address?.details,
    user?.billingStreet,
    user?.billingCity,
    user?.billingState,
    user?.billingZipCode,
  ]);

  const hasChanges = useMemo(() => {
    const userPhone = String(user?.phone || "").trim();
    const userStreet = String(user?.address?.street || "").trim();
    const userCity = String(user?.address?.city || "").trim();
    const userState = String(user?.address?.state || "").trim();
    const userZipCode = String(user?.address?.zipCode || "").trim();
    const userDetails = String(user?.address?.details || "").trim();
    const userBillingStreet = String(user?.billingStreet || "").trim();
    const userBillingCity = String(user?.billingCity || "").trim();
    const userBillingState = String(user?.billingState || "").trim();
    const userBillingZipCode = String(user?.billingZipCode || "").trim();

    return (
      phone.trim() !== userPhone ||
      street.trim() !== userStreet ||
      city.trim() !== userCity ||
      state.trim() !== userState ||
      zipCode.trim() !== userZipCode ||
      details.trim() !== userDetails ||
      billingStreet.trim() !== userBillingStreet ||
      billingCity.trim() !== userBillingCity ||
      billingState.trim() !== userBillingState ||
      billingZipCode.trim() !== userBillingZipCode
    );
  }, [
    billingCity,
    billingState,
    billingStreet,
    billingZipCode,
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
    user?.billingCity,
    user?.billingState,
    user?.billingStreet,
    user?.billingZipCode,
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
      updateProfile(
        phone,
        {
          street,
          city,
          state,
          zipCode,
          details,
        },
        {
          street: billingStreet,
          city: billingCity,
          state: billingState,
          zipCode: billingZipCode,
        },
      ),
    );
    setSaving(false);

    if (result?.ok) {
      setMessage("Profile updated successfully.");
      return;
    }

    setError(result?.error || "Could not save profile settings.");
  }

  function openDeleteDialog() {
    setIsDeleteDialogClosing(false);
    setShowDeleteDialog(true);
  }

  function closeDeleteDialog(force = false) {
    if (deleting && !force) {
      return;
    }

    setIsDeleteDialogClosing(true);
  }

  useEffect(() => {
    if (!isDeleteDialogClosing) {
      return;
    }

    const timer = setTimeout(() => {
      setShowDeleteDialog(false);
      setIsDeleteDialogClosing(false);
    }, DELETE_DIALOG_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [DELETE_DIALOG_ANIMATION_MS, isDeleteDialogClosing]);

  async function onConfirmDeleteAccount() {
    setDeleting(true);
    setError("");
    setMessage("");

    const result = await dispatch(deleteMyAccount());
    setDeleting(false);

    if (result?.ok) {
      navigate("/auth", { replace: true });
      return;
    }

    closeDeleteDialog(true);
    setError(result?.error || "Could not delete account.");
  }

  return (
    <div className="settings-page">
      <section className="settings-wrap">
        <div className="settings-head">
          <h1>Settings</h1>
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

          <div className="settings-divider" />

          <div className="settings-grid settings-grid-1">
            <p className="settings-subtitle">Billing Address (optional)</p>

            <div className="settings-grid settings-grid-2 address-grid">
              <label className="settings-field">
                <span>Street</span>
                <div className="settings-input-wrap">
                  <MapPin size={16} />
                  <input
                    type="text"
                    value={billingStreet}
                    onChange={(e) => setBillingStreet(e.target.value)}
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
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
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
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
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
                    value={billingZipCode}
                    onChange={(e) => setBillingZipCode(e.target.value)}
                    placeholder="Postal code"
                  />
                </div>
              </label>
            </div>
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
            <Link
              to="/orders"
              className="activity-card"
              aria-label="Open orders"
            >
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

        <div className="settings-card settings-danger-zone">
          <h2>Danger Zone</h2>
          <p className="settings-subtitle">
            Irreversible actions that affect your account
          </p>

          <div className="danger-box">
            <div className="danger-copy">
              <div className="danger-title">
                <AlertTriangle size={18} />
                <span>Delete Account</span>
              </div>
              <p>
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>

            <button
              type="button"
              className="danger-delete-btn"
              onClick={openDeleteDialog}
            >
              <Trash2 size={15} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </section>

      {showDeleteDialog && (
        <div
          className={`settings-delete-modal-backdrop${
            isDeleteDialogClosing ? " closing" : ""
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              closeDeleteDialog();
            }
          }}
        >
          <div
            className={`settings-delete-modal${
              isDeleteDialogClosing ? " closing" : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <button
              type="button"
              className="settings-modal-close"
              aria-label="Close dialog"
              onClick={() => closeDeleteDialog()}
              disabled={deleting}
            >
              <X size={18} />
            </button>

            <div className="settings-modal-title" id="delete-account-title">
              <AlertTriangle size={20} />
              <span>Delete Account</span>
            </div>

            <p className="settings-modal-desc">
              Are you absolutely sure you want to delete your account? This
              action is permanent and cannot be undone.
            </p>

            <p className="settings-modal-list-title">
              This will permanently delete:
            </p>
            <ul className="settings-modal-list">
              <li>Your profile and personal information</li>
              <li>All your orders and order history</li>
              <li>Your saved bouquets and wishlist</li>
              <li>Any active promo codes or discounts</li>
            </ul>

            <div className="settings-modal-actions">
              <button
                type="button"
                className="settings-modal-cancel"
                onClick={() => closeDeleteDialog()}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="settings-modal-confirm"
                onClick={onConfirmDeleteAccount}
                disabled={deleting}
              >
                <Trash2 size={15} />
                <span>
                  {deleting ? "Deleting..." : "Yes, Delete My Account"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
