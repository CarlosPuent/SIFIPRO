import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

type UnauthorizedHandler = () => void;

const unauthorizedHandlers = new Set<UnauthorizedHandler>();

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      unauthorizedHandlers.forEach((handler) => {
        handler();
      });
    }

    return Promise.reject(error);
  },
);

export function setApiClientAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}

export function onApiUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandlers.add(handler);

  return () => {
    unauthorizedHandlers.delete(handler);
  };
}
