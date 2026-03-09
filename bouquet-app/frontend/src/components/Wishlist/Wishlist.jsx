import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Pencil, ShoppingCart, Trash2 } from "lucide-react";
import {
  clearWishlist,
  fetchWishlist,
  removeWishlistItem,
  updateWishlistTitle,
} from "../../stores/actions/wishlist-actions";
import "./Wishlist.css";

function countItems(bouquet) {
  const flowerCount = Array.isArray(bouquet?.flowers)
    ? bouquet.flowers.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
    : 0;
  const accessoryCount = Array.isArray(bouquet?.accessories)
    ? bouquet.accessories.reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0,
      )
    : 0;
  const wrappingCount = bouquet?.wrapping ? 1 : 0;
  return flowerCount + accessoryCount + wrappingCount;
}

function lineSubtotal(item) {
  const qty = Number(item?.qty || 1);
  const price = Number(item?.price || 0);
  return (qty * price).toFixed(2);
}

function bouquetTitle(bouquet) {
  if (Array.isArray(bouquet?.flowers) && bouquet.flowers.length > 0) {
    return bouquet.flowers[0].name;
  }
  if (bouquet?.wrapping?.name) return bouquet.wrapping.name;
  if (Array.isArray(bouquet?.accessories) && bouquet.accessories.length > 0) {
    return bouquet.accessories[0].name;
  }
  return "Custom Bouquet";
}

export default function Wishlist() {
  const dispatch = useDispatch();
  const { items, loading, error, saving } = useSelector(
    (state) => state.wishlist,
  );
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  function startEdit(entry) {
    setEditingId(entry.id);
    setDraftTitle(String(entry.title || bouquetTitle(entry.bouquet) || ""));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftTitle("");
  }

  async function saveTitle(id) {
    const nextTitle = draftTitle.trim();
    if (nextTitle.length < 2) return;

    const result = await dispatch(updateWishlistTitle(id, nextTitle));
    if (result?.ok) cancelEdit();
  }

  return (
    <section className="wishlist-wrap">
      <div className="wishlist-head">
        <h1>My Wishlist</h1>
        {items.length > 0 && (
          <button
            className="wishlist-clear"
            type="button"
            onClick={() => dispatch(clearWishlist())}
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {loading && <div className="wishlist-state">Loading wishlist...</div>}
      {error && !loading && <div className="wishlist-state error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="wishlist-state">No saved bouquets yet.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="wishlist-list">
          {items.map((entry) => (
            <article key={entry.id} className="wishlist-card">
              <div className="wishlist-card-top">
                {editingId === entry.id ? (
                  <div className="wishlist-title-edit">
                    <input
                      className="wishlist-title-input"
                      type="text"
                      maxLength={80}
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                    />
                    <div className="wishlist-title-actions">
                      <button
                        className="wishlist-title-btn"
                        type="button"
                        disabled={saving || draftTitle.trim().length < 2}
                        onClick={() => saveTitle(entry.id)}
                      >
                        Save
                      </button>
                      <button
                        className="wishlist-title-btn ghost"
                        type="button"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="wishlist-title-row">
                    <h3>{entry.title || bouquetTitle(entry.bouquet)}</h3>
                    <button
                      className="wishlist-edit-title"
                      type="button"
                      aria-label="Edit bouquet title"
                      onClick={() => startEdit(entry)}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}

                <div className="wishlist-card-meta">
                  <p>{countItems(entry.bouquet)} items</p>
                  <div className="wishlist-total">
                    RON {Number(entry.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="wishlist-actions">
                <Link to="/builder" className="wishlist-open-builder">
                  <span>Open in Builder</span>
                </Link>

                <div className="wishlist-cart-row">
                  <button className="wishlist-add-cart" type="button">
                    <ShoppingCart size={16} />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    className="wishlist-delete-icon"
                    type="button"
                    aria-label="Remove wishlist bouquet"
                    onClick={() => dispatch(removeWishlistItem(entry.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="wishlist-divider" />

              <div className="wishlist-items-label">Items:</div>

              <div className="wishlist-lines">
                {Array.isArray(entry.bouquet?.flowers) &&
                  entry.bouquet.flowers.map((item) => (
                    <div
                      key={`f-${entry.id}-${item.id}`}
                      className="wishlist-line"
                    >
                      <span>{`${item.name} x ${Number(item.qty || 1)}`}</span>
                      <span>RON {lineSubtotal(item)}</span>
                    </div>
                  ))}

                {entry.bouquet?.wrapping && (
                  <div className="wishlist-line">
                    <span>{`${entry.bouquet.wrapping.name} x 1`}</span>
                    <span>
                      RON {lineSubtotal({ ...entry.bouquet.wrapping, qty: 1 })}
                    </span>
                  </div>
                )}

                {Array.isArray(entry.bouquet?.accessories) &&
                  entry.bouquet.accessories.map((item) => (
                    <div
                      key={`a-${entry.id}-${item.id}`}
                      className="wishlist-line"
                    >
                      <span>{`${item.name} x ${Number(item.qty || 1)}`}</span>
                      <span>RON {lineSubtotal(item)}</span>
                    </div>
                  ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
