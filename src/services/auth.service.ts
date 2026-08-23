import { apiPost, apiGet, apiPut } from "@/lib/api/client";
import type { AuthUser } from "@/types";

export interface LoginPayload {
  token: string;
  user: AuthUser;
}

const DEVICE_NAME = "Web POS";

export const authService = {
  login: (email: string, password: string) =>
    apiPost<LoginPayload>("/auth/login", { email, password, device_name: DEVICE_NAME }),

  logout: () => apiPost<null>("/auth/logout"),

  me: () => apiGet<{ user: AuthUser }>("/user"),

  forgotPassword: (email: string) => apiPost<null>("/auth/forgot-password", { email }),

  resetPassword: (payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => apiPost<null>("/auth/reset-password", payload),

  updatePassword: (payload: { current_password: string; password: string; password_confirmation: string }) =>
    apiPut<null>("/user/password", payload),

  updateProfile: (payload: { name: string; email: string }) =>
    apiPut<{ id: number; name: string; email: string }>("/user/profile", payload),
};
