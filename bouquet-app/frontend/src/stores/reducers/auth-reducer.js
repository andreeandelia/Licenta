const initialState = {
    user: null,
    loading: true, // la pornire facem /me
    error: null
}

export default function authReducer(state = initialState, action) {
    switch (action.type) {
        case 'AUTH_LOADING':
            return { ...state, loading: true, error: null };

        case 'AUTH_SUCCESS':
            return { ...state, user: action.payload, loading: false, error: null };

        case 'AUTH_LOGOUT':
            return { ...state, user: null, loading: false, error: null };

        case 'AUTH_ERROR':
            return { ...state, loading: false, error: action.payload || 'Auth error' };

        default:
            return state;
    }
}