import { api } from "./client";

export async function login(input) {
  const { data } = await api.post("/auth/login", input);
  return data;
}

export async function register(input) {
  const { data } = await api.post("/auth/register", input);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function logout() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function verifyEmail(token) {
  const { data } = await api.get("/auth/verify-email", {
    params: { token },
  });
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forget-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post(`/auth/reset-password/${token}`, {
    password,
  });
  return data;
}

export async function resendVerification(email) {
  const { data } = await api.post("/auth/resend-verification", { email });
  return data;
}
