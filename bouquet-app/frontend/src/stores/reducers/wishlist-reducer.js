const initialState = {
    items: [],
    loading: false,
    saving: false,
    error: null,
};

export default function wishlistReducer(state = initialState, action) {
    switch (action.type) {
        case "WISHLIST_LOADING":
            return { ...state, loading: true, error: null };

        case "WISHLIST_SAVING":
            return { ...state, saving: true, error: null };

        case "WISHLIST_SUCCESS":
            return {
                ...state,
                loading: false,
                saving: false,
                error: null,
                items: action.payload || [],
            };

        case "WISHLIST_ADD_SUCCESS":
            return {
                ...state,
                saving: false,
                error: null,
                items: [action.payload, ...state.items],
            };

        case "WISHLIST_REMOVE_SUCCESS":
            return {
                ...state,
                error: null,
                items: state.items.filter((item) => item.id !== action.payload),
            };

        case "WISHLIST_TITLE_UPDATED":
            return {
                ...state,
                saving: false,
                error: null,
                items: state.items.map((item) =>
                    item.id === action.payload.id
                        ? { ...item, title: action.payload.title }
                        : item,
                ),
            };

        case "WISHLIST_CLEAR_SUCCESS":
            return {
                ...state,
                error: null,
                items: [],
            };

        case "WISHLIST_ERROR":
            return {
                ...state,
                loading: false,
                saving: false,
                error: action.payload || "Wishlist error",
            };

        default:
            return state;
    }
}
