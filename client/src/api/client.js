import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // HTTP-only auth cookies
  timeout: 45000, // Render free tier may need time to wake up
  headers: { 'X-Requested-With': 'XMLHttpRequest' }, // required by the server for cookie-authenticated writes
});

let refreshing = null; // single-flight: many 401s trigger only one refresh

api.interceptors.response.use(
  (res) => res.data, // { success, message, data }
  async (err) => {
    const original = err.config;
    const status = err.response?.status;
    const isAuthCall = original?.url?.startsWith('/auth/');

    // Access token expired → refresh once, then replay the request.
    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        refreshing ||= api.post('/auth/refresh').finally(() => { refreshing = null; });
        await refreshing;
        return api(original);
      } catch {
        window.dispatchEvent(new Event('auth:expired'));
      }
    }

    const message = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(
      Object.assign(new Error(message), { status, details: err.response?.data?.details })
    );
  }
);
