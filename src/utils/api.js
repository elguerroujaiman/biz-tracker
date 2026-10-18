const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const authFetch = async (url, options = {}) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  // If unauthorized and we're not already on an auth route, clear tokens and redirect
  if (response.status === 401 && !url.startsWith("/auth/")) {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    sessionStorage.removeItem("userDetails");
    if (!window.location.pathname.includes("/signin") && !window.location.pathname.includes("/signup")) {
      window.location.href = "/signin";
    }
  }

  return response;
};

export { API_BASE };
