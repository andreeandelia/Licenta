const initialState = {
    items: [],
    loading: false,
    error: null,
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
};

export default function productReducer(state = initialState, action) {
    switch (action.type) {
        case "PRODUCTS_LOADING":
            return { ...state, loading: true, error: null };

        case "PRODUCTS_SUCCESS":
            return {
                ...state,
                loading: false,
                error: null,
                items: action.payload.items,
                page: action.payload.page,
                limit: action.payload.limit,
                total: action.payload.total,
                totalPages: action.payload.totalPages,
            };

        case "PRODUCTS_ERROR":
            return { ...state, loading: false, error: action.payload || "Error" };

        default:
            return state;
    }
}