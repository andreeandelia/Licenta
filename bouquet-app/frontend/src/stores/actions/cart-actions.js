import { apiUrl } from "../../config/global";

export const fetchCart = () => async (dispatch) => {
    dispatch({ type: "CART_LOADING" });

    try {
        const res = await fetch(apiUrl("/api/cart"), {
            credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load cart");

        dispatch({
            type: "CART_SUCCESS",
            payload: {
                items: data.items || [],
                count: Number(data.count || 0),
                total: Number(data.total || 0),
            },
        });
    } catch (err) {
        dispatch({ type: "CART_ERROR", payload: err.message || "Cart error" });
    }
};

export const addBouquetToCart = ({ bouquetId, bouquet, quantity = 1 }) => async (dispatch) => {
    try {
        const body = {
            quantity: Math.max(1, Number(quantity) || 1),
        };

        if (bouquetId) body.bouquetId = bouquetId;
        if (!bouquetId && bouquet) body.bouquet = bouquet;

        const res = await fetch(apiUrl("/api/cart/add"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to add bouquet to cart");

        await dispatch(fetchCart());
        return { ok: true, item: data.item };
    } catch (err) {
        dispatch({ type: "CART_ERROR", payload: err.message || "Cart error" });
        return { ok: false, error: err.message || "Cart error" };
    }
};

export const updateCartQuantity = (id, quantity) => async (dispatch) => {
    try {
        const res = await fetch(apiUrl(`/api/cart/${id}/quantity`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ quantity }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to update cart item");

        await dispatch(fetchCart());
        return { ok: true };
    } catch (err) {
        dispatch({ type: "CART_ERROR", payload: err.message || "Cart error" });
        return { ok: false, error: err.message || "Cart error" };
    }
};

export const removeCartItem = (id) => async (dispatch) => {
    try {
        const res = await fetch(apiUrl(`/api/cart/${id}`), {
            method: "DELETE",
            credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to remove cart item");

        await dispatch(fetchCart());
        return { ok: true };
    } catch (err) {
        dispatch({ type: "CART_ERROR", payload: err.message || "Cart error" });
        return { ok: false, error: err.message || "Cart error" };
    }
};

export const clearCart = () => async (dispatch, getState) => {
    const currentItems = getState()?.cart?.items || [];

    try {
        await Promise.all(
            currentItems.map((item) =>
                fetch(apiUrl(`/api/cart/${item.id}`), {
                    method: "DELETE",
                    credentials: "include",
                }),
            ),
        );

        await dispatch(fetchCart());
        return { ok: true };
    } catch (err) {
        dispatch({ type: "CART_ERROR", payload: err.message || "Cart error" });
        return { ok: false, error: err.message || "Cart error" };
    }
};
