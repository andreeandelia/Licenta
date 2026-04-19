import { apiUrl } from "../../config/global";

export const fetchProducts =
    ({ type, colors, minPrice, maxPrice, inStock, page = 1, limit = 6 }) =>
        async (dispatch) => {
            dispatch({ type: "PRODUCTS_LOADING" });

            const params = new URLSearchParams();
            if (type) params.set("type", type);
            if (colors?.length) params.set("colors", colors.join(","));
            if (minPrice != null) params.set("minPrice", String(minPrice));
            if (maxPrice != null) params.set("maxPrice", String(maxPrice));
            if (inStock) params.set("inStock", "1");
            params.set("page", String(page));
            params.set("limit", String(limit));

            try {
                const res = await fetch(apiUrl(`/api/products?${params.toString()}`));
                const data = await res.json().catch(() => ({}));

                if (!res.ok) throw new Error(data?.error || "Failed to load products");

                dispatch({ type: "PRODUCTS_SUCCESS", payload: data });
            } catch (e) {
                dispatch({ type: "PRODUCTS_ERROR", payload: e.message });
            }
        };