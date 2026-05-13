import axios from "axios";
import type { ApiError } from "@/types/api";

const TOKEN_KEY = "jhonycar_token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("jhonycar_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (error.response?.status === 403) {
      return data?.message ?? "Acesso negado. Voce nao tem permissao para executar esta acao.";
    }
    return data?.message ?? error.message;
  }
  return "Erro inesperado.";
}

export { TOKEN_KEY };
