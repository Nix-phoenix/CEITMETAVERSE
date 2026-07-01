// ── API Configuration ─────────────────────────────────────────────────────────
// Central place to manage the backend base URL and all endpoints.
// Resolution order for base URL:
// 1. window.__API_BASE__ (explicit runtime override)
// 2. <meta name="api-base" content="..."> on the page (optional)
// 3. current origin when page is served over http(s)
// 4. localhost fallback when opened from file:// during local dev

function resolveBaseURL() {
    if (typeof window !== 'undefined' && window.__API_BASE__) {
        return String(window.__API_BASE__).replace(/\/+$/, '');
    }

    try {
        const meta = document.querySelector('meta[name="api-base"]');
        if (meta && meta.content) return meta.content.replace(/\/+$/, '');
    } catch (e) {}

    if (location.protocol === 'http:' || location.protocol === 'https:') {
        return location.origin.replace(/\/+$/, '');
    }

    return 'http://localhost:5000';
}

const API_CONFIG = {
    baseURL: resolveBaseURL(),
};

// ── Endpoints ─────────────────────────────────────────────────────────────────
const API_ENDPOINTS = {
    // Auth
    register:    `${API_CONFIG.baseURL}/register`,
    login:       `${API_CONFIG.baseURL}/login`,
    googleAuth:  `${API_CONFIG.baseURL}/auth/google`,

    // Games
    addGame:              `${API_CONFIG.baseURL}/addGame`,
    gamesList:            `${API_CONFIG.baseURL}/games`,
    gameById:  (id) =>   `${API_CONFIG.baseURL}/games/${id}`,
    playGame:  (id) =>   `${API_CONFIG.baseURL}/play/${id}`,

    // User / Profile
    userProfile: (id) => `${API_CONFIG.baseURL}/profile/${id}`,
    userPicture: (id) => `${API_CONFIG.baseURL}/profile/${id}/picture`,
    userPassword:(id) => `${API_CONFIG.baseURL}/profile/${id}/password`,
};

// ── Helper: unified fetch wrapper ─────────────────────────────────────────────
// Usage:
//   const data = await apiCall(API_ENDPOINTS.login, { method: 'POST', body: {...} });
//
// Options (all optional):
//   method  – HTTP verb, default 'GET'
//   body    – plain object → will be JSON-stringified
//   token   – JWT string  → added as Authorization: Bearer <token>
//   isForm  – set true to send body as FormData instead of JSON

async function apiCall(url, options = {}) {
    const { method = 'GET', body, token, isForm = false } = options;

    const headers = {};

    // Add auth header when a token is supplied
    const storedToken = token
        || sessionStorage.getItem('authToken')
        || localStorage.getItem('authToken');
    if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
    }

    const fetchOptions = { method, headers };

    if (body !== undefined) {
        if (isForm) {
            // FormData: let the browser set Content-Type (including boundary)
            fetchOptions.body = body;
        } else {
            headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(body);
        }
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw Object.assign(
            new Error(data.error || `Request failed: ${response.status}`),
            { status: response.status, data }
        );
    }

    return data;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
// Call after any successful login/register/Google-auth response.
// rememberMe=true persists to localStorage so the session survives browser restart.
function saveAuthSession(data, rememberMe = false) {
    const store = rememberMe ? localStorage : sessionStorage;
    store.setItem('authToken', data.token);
    store.setItem('userId',    data.userId);
    store.setItem('username',  data.username  || '');
    store.setItem('fullName',  data.fullName  || data.username || '');
    store.setItem('email',     data.email     || '');
}

function clearAuthSession() {
    ['authToken', 'userId', 'username', 'fullName', 'email'].forEach(k => {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
    });
}

function getAuthToken() {
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || null;
}
