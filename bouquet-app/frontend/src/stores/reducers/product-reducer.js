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
            {
                const nextPage = Math.max(1, Number(action.payload.page) || 1);
                const nextLimit = Math.max(1, Number(action.payload.pageSize ?? action.payload.limit) || 6);
                const nextTotalPages = Math.max(1, Number(action.payload.totalPages) || 1);

                return {
                    ...state,
                    loading: false,
                    error: null,
                    items: action.payload.items,
                    page: nextPage,
                    limit: nextLimit,
                    total: action.payload.total,
                    totalPages: nextTotalPages,
                };
            }

        case "PRODUCTS_ERROR":
            return { ...state, loading: false, error: action.payload || "Error" };

        default:
            return state;
    }
}