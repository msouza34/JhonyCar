import { api } from "./api";
import type { AuthResponse, LoginPayload } from "@/types/api";

export async function login(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}
