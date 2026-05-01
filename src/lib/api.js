import { auth } from "./firebase";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const isNgrokUrl =
  typeof BASE_URL === "string" &&
  (BASE_URL.includes("ngrok-free.dev") || BASE_URL.includes("ngrok.io"));

async function getToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("getToken called but no user is logged in");
    return null;
  }
  return user.getIdToken(forceRefresh);
}

export async function apiRequest(path, options = {}) {
  const makeRequest = async (forceRefresh = false) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    try {
      const token = await user.getIdToken(forceRefresh);
      const res = await fetch(`${BASE_URL}/api/v1${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(isNgrokUrl ? { "ngrok-skip-browser-warning": "true" } : {}),
          ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      // Handle 401 Unauthorized — likely an expired token
      if (res.status === 401 && !forceRefresh) {
        console.log("Token expired, retrying with force refresh...");
        return makeRequest(true);
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Object.assign(new Error(err.message || "API error"), {
          status: res.status,
          data: err,
        });
      }

      return res.json();
    } catch (error) {
      if (error.status === 401 && !forceRefresh) {
        return makeRequest(true);
      }
      throw error;
    }
  };

  return makeRequest(false);
}

export const api = {
  get: (path) => apiRequest(path, { method: "GET" }),
  post: (path, body) => apiRequest(path, { method: "POST", body }),
  put: (path, body) => apiRequest(path, { method: "PUT", body }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};
