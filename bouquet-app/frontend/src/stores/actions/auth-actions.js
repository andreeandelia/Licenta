import { apiUrl } from "../../config/global";

const CHAT_STORAGE_PREFIX = 'bouquet.chat.v1';
const MAX_CHAT_MESSAGES = 40;

function getGuestChatKey() {
    return `${CHAT_STORAGE_PREFIX}.guest`;
}

function getUserChatKey(userId) {
    return `${CHAT_STORAGE_PREFIX}.user.${userId}`;
}

function normalizeChatMessages(value) {
    if (!Array.isArray(value)) return [];

    return value
        .map((entry) => {
            const role = entry?.role === 'user' ? 'user' : 'assistant';
            const content = String(entry?.content || '').trim();
            if (!content) return null;
            return { role, content };
        })
        .filter(Boolean)
        .slice(-MAX_CHAT_MESSAGES);
}

function migrateGuestChatToUser(userId) {
    if (!userId) return;

    try {
        const guestKey = getGuestChatKey();
        const userKey = getUserChatKey(userId);

        const guestRaw = localStorage.getItem(guestKey);
        if (!guestRaw) return;

        const guestParsed = JSON.parse(guestRaw);
        const guestMessages = normalizeChatMessages(guestParsed?.messages);

        if (!guestMessages.length) {
            localStorage.removeItem(guestKey);
            return;
        }

        const userRaw = localStorage.getItem(userKey);
        const userParsed = userRaw ? JSON.parse(userRaw) : null;
        const userMessages = normalizeChatMessages(userParsed?.messages);
        const mergedMessages = [...userMessages, ...guestMessages].slice(-MAX_CHAT_MESSAGES);

        localStorage.setItem(userKey, JSON.stringify({
            version: 1,
            updatedAt: Date.now(),
            messages: mergedMessages,
        }));

        localStorage.removeItem(guestKey);
    }
    catch {
        // localStorage may be unavailable in private mode or blocked by browser settings.
    }
}

function clearPersistedChatFromLocalStorage() {
    try {
        const keysToDelete = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CHAT_STORAGE_PREFIX)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => localStorage.removeItem(key));
    }
    catch {
        // localStorage may be unavailable in private mode or blocked by browser settings.
    }
}

export const loadMe = () => async (dispatch) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
        const res = await fetch(apiUrl("/api/auth/me"), {
            credentials: 'include'
        });

        if (!res.ok) {
            dispatch({ type: 'AUTH_LOGOUT' });
            return null;
        }

        const data = await res.json();
        if (data?.user?.id) {
            migrateGuestChatToUser(data.user.id);
        }
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
        const res = await fetch(apiUrl("/api/auth/login"), {
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
        const res = await fetch(apiUrl("/api/auth/register"), {
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
        await fetch(apiUrl("/api/auth/logout"), {
            method: 'POST',
            credentials: 'include'
        });
    }
    finally {
        clearPersistedChatFromLocalStorage();
        dispatch({ type: 'AUTH_LOGOUT' });
    }
}

export const updateProfile = (phone, address) => async (dispatch) => {
    try {
        const res = await fetch(apiUrl("/api/auth/profile"), {
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

export const deleteMyAccount = () => async (dispatch) => {
    try {
        const res = await fetch(apiUrl('/api/auth/account'), {
            method: 'DELETE',
            credentials: 'include',
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
            return {
                ok: false,
                error: data?.error || 'Could not delete account',
            };
        }

        clearPersistedChatFromLocalStorage();
        dispatch({ type: 'AUTH_LOGOUT' });
        return { ok: true };
    }
    catch (err) {
        return {
            ok: false,
            error: err.message || 'Could not delete account',
        };
    }
}