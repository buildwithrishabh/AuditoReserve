import { api } from "./client";
import type { User } from "../types";

type UserResponse = {
  message?: string;
  success?: boolean;
  accessToken?: string;
  user: User;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
};

export async function login(input: LoginInput) {
  const { data } = await api.post<UserResponse>("/auth/login", input);
  return data;
}

export async function register(input: RegisterInput) {
  const { data } = await api.post<UserResponse>("/auth/register", input);
  return data;
}

export async function getMe() {
  const { data } = await api.get<UserResponse>("/auth/me");
  return data;
}

export async function logout() {
  const { data } = await api.post<{ message: string }>("/auth/logout");
  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.get<{ message: string }>("/auth/verify-email", {
    params: { token },
  });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>("/auth/forget-password", { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<{ message: string }>(`/auth/reset-password/${token}`, {
    password,
  });
  return data;
}

export async function resendVerification(email: string) {
  const { data } = await api.post<{ message: string }>("/auth/resend-verification", { email });
  return data;
}
