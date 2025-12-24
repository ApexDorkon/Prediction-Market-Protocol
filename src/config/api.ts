import axios from "axios";

/**
 * @dev The API_BASE_URL should be configured in your .env file.
 * This client handles automated Bearer Token injection from localStorage.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Set to true if using cookies/session-based auth
});

// Request Interceptor for Auth Injection
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logic for handling expired sessions (e.g., clear localStorage)
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
    }
    return Promise.reject(error);
  }
);

export default api;