import type { DashboardResumo } from "@/types/dashboard";
import { api } from "./api";

export async function getDashboardResumo() {
  const { data } = await api.get<DashboardResumo>("/dashboard");
  return data;
}
