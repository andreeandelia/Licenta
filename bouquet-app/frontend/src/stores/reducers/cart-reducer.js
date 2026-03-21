const initialState = {
    items: [],
    count: 0,
    total: 0,
    loading: false,
    error: null,
};

export default function cartReducer(state = initialState, action) {
    switch (action.type) {
        case "CART_LOADING":
            return { ...state, loading: true, error: null };

        case "CART_SUCCESS":
            return {
                ...state,
                loading: false,
                error: null,
                items: action.payload?.items || [],
                count: Number(action.payload?.count || 0),
                total: Number(action.payload?.total || 0),
            };

        case "CART_ERROR":
            return {
                ...state,
                loading: false,
                error: action.payload || "Cart error",
            };

        default:
            return state;
    }
}
