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
};

export async function createPaymentOrder(bookingId: string) {
  const { data } = await api.post<PaymentOrderResponse>(
    `/payments/create-order/${bookingId}`,
  );
  return data;
}

export async function verifyPayment(input: VerifyPaymentInput) {
  const { data } = await api.post<{ booking: Booking; message: string }>(
    "/payments/verify",
    input,
  );
  return data;
}
