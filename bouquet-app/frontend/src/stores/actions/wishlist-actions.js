import { apiUrl } from "../../config/global";

export const fetchWishlist = () => async (dispatch) => {
    dispatch({ type: "WISHLIST_LOADING" });

    try {
        const res = await fetch(apiUrl("/api/wishlist"), {
            credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load wishlist");

        dispatch({ type: "WISHLIST_SUCCESS", payload: data.items || [] });
    } catch (err) {
        dispatch({ type: "WISHLIST_ERROR", payload: err.message || "Wishlist error" });
    }
};

export const addWishlistItem = (bouquet) => async (dispatch) => {
    dispatch({ type: "WISHLIST_SAVING" });

    try {
        const res = await fetch(apiUrl("/api/wishlist"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ bouquet }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to save wishlist item");

        dispatch({ type: "WISHLIST_ADD_SUCCESS", payload: data.item });
        return { ok: true, item: data.item };
    } catch (err) {
        dispatch({ type: "WISHLIST_ERROR", payload: err.message || "Wishlist error" });
        return { ok: false, error: err.message || "Wishlist error" };
    }
};

export const removeWishlistItem = (id) => async (dispatch) => {
    try {
        const res = await fetch(apiUrl(`/api/wishlist/${id}`), {
            method: "DELETE",
            credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to remove wishlist item");

        dispatch({ type: "WISHLIST_REMOVE_SUCCESS", payload: id });
    } catch (err) {
        dispatch({ type: "WISHLIST_ERROR", payload: err.message || "Wishlist error" });
    }
};

export const clearWishlist = () => async (dispatch) => {
    try {
        const res = await fetch(apiUrl("/api/wishlist"), {
            method: "DELETE",
            credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to clear wishlist");

        dispatch({ type: "WISHLIST_CLEAR_SUCCESS" });
    } catch (err) {
        dispatch({ type: "WISHLIST_ERROR", payload: err.message || "Wishlist error" });
    }
};

export const updateWishlistTitle = (id, title) => async (dispatch) => {
    dispatch({ type: "WISHLIST_SAVING" });

    try {
        const res = await fetch(apiUrl(`/api/wishlist/${id}/title`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to update title");

        dispatch({ type: "WISHLIST_TITLE_UPDATED", payload: { id, title: data.title } });
        return { ok: true };
    } catch (err) {
        dispatch({ type: "WISHLIST_ERROR", payload: err.message || "Wishlist error" });
        return { ok: false, error: err.message || "Wishlist error" };
    }
};
