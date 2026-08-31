import { api } from "./client";
import type { Booking } from "../types";

export type PaymentOrderResponse = {
  success: boolean;
  key: string;
  order: {
    id: string;
    amount: number;
    currency: string;
  };
  booking: Booking;
};

export type VerifyPaymentInput = {
  bookingId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  idempotencyKey?: string;
};

/**
 * Generate a cryptographically random UUID or fallback timestamp key for Idempotency
 */
export function generateIdempotencyKey(prefix = "idem"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function createPaymentOrder(bookingId: string, idempotencyKey?: string) {
  const key = idempotencyKey || generateIdempotencyKey(`order_${bookingId}`);
  const { data } = await api.post<PaymentOrderResponse>(
    `/payments/create-order/${bookingId}`,
    {},
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );
  return data;
}

export async function verifyPayment(input: VerifyPaymentInput) {
  const { idempotencyKey, ...payload } = input;
  // Use provided key or uniquely tie to the razorpay payment id
  const key = idempotencyKey || `verify_${payload.razorpay_payment_id}`;

  const { data } = await api.post<{ booking: Booking; message: string }>(
    "/payments/verify",
    payload,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );
  return data;
}
