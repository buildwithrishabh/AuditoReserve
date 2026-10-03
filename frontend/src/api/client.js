import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

let currentAccessToken = null;

export function setApiAccessToken(token) {
  currentAccessToken = token || null;
}

api.interceptors.request.use((config) => {
  if (currentAccessToken && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

let refreshPromise = null;

const skipRefreshFor = ["/auth/refresh", "/auth/login", "/auth/register", "/auth/logout"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !skipRefreshFor.some((path) => requestUrl.includes(path))
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise =
          refreshPromise ||
          api.post("/auth/refresh", undefined, {
            _skipAuthRefresh: true,
          });

        const refreshResponse = await refreshPromise;
        refreshPromise = null;

        if (refreshResponse.data?.accessToken) {
          setApiAccessToken(refreshResponse.data.accessToken);
        }

        // Notify useAuth to update local state/context with new token and user
        window.dispatchEvent(
          new CustomEvent("auth:refreshed", {
            detail: {
              user: refreshResponse.data.user,
              accessToken: refreshResponse.data.accessToken,
            },
          })
        );

        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        setApiAccessToken(null);
        window.dispatchEvent(new Event("auth:expired"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export function getErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
