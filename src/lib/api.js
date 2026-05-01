import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function getToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  // forceRefresh ensures token is never expired when it reaches backend
  return user.getIdToken(forceRefresh);
}

export async function apiRequest(path, options = {}) {
  const makeRequest = async (forceRefresh = false) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken(forceRefresh);
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 401 && !forceRefresh) {
      // Token might be stale — force refresh and retry once
      return makeRequest(true);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error(err.message || 'API error'), {
        status: res.status,
        data: err,
      });
    }
    return res.json();
  };

  return makeRequest(false);
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};
