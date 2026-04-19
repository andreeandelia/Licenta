const rawApiBase = import.meta.env.VITE_API_BASE || "";

export const API_BASE = rawApiBase.replace(/\/$/, "");

export function apiUrl(path) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}

export function mediaUrl(path) {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}
