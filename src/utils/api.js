const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000/api"
    : "https://your-production-domain.com/api";

export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
};