const API_BASE = "http://localhost:8080";

export const loadMe = () => async (dispatch) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: 'include'
        });

        if (!res.ok) {
            dispatch({ type: 'AUTH_LOGOUT' });
            return null;
        }

        const data = await res.json();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
        return data.user;
    }
    catch (err) {
        dispatch({ type: 'AUTH_ERROR', payload: err.message });
        return null;
    }
}

export const login = (email, password) => async (dispatch) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));
        if (!res.ok) {
            dispatch({ type: 'AUTH_ERROR', payload: data?.error || "Login failed" });
            throw new Error(data?.error || "Login failed");
        }

        // cookie setat => luam userul din /me
        return dispatch(loadMe());
    }
    catch (err) {
        dispatch({ type: 'AUTH_ERROR', payload: err.message });
        return null;
    }
}

export const register = (name, email, password) => async (dispatch) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));
        if (!res.ok) {
            dispatch({ type: 'AUTH_ERROR', payload: data?.error || "Registration failed" });
            throw new Error(data?.error || "Registration failed");
        }

        return dispatch(loadMe());
    }
    catch (err) {
        dispatch({ type: 'AUTH_ERROR', payload: err.message });
        return null;
    }
}

export const logout = () => async (dispatch) => {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    }
    finally {
        dispatch({ type: 'AUTH_LOGOUT' });
    }
}

export const updateProfile = (phone, address) => async (dispatch) => {
    try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ phone, address }),
        });

        let data = null;
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            data = await res.json().catch(() => null);
        } else {
            const text = await res.text().catch(() => '');
            data = text ? { error: text } : null;
        }

        if (!res.ok) {
            const message = data?.error || `Could not update profile (HTTP ${res.status})`;
            dispatch({ type: 'AUTH_ERROR', payload: message });
            return { ok: false, error: message };
        }

        // If backend returns no JSON body, refresh user from /me.
        if (!data?.user) {
            const freshUser = await dispatch(loadMe());
            return { ok: Boolean(freshUser), user: freshUser };
        }

        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
        return { ok: true, user: data.user };
    }
    catch (err) {
        dispatch({ type: 'AUTH_ERROR', payload: err.message });
        return { ok: false, error: err.message || 'Could not update profile' };
    }
}