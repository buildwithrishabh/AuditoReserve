import { api } from "./client";

/**
 * Generate a cryptographically random UUID or fallback timestamp key for Idempotency
 */
export function generateIdempotencyKey(prefix = "idem") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function createPaymentOrder(bookingId, idempotencyKey) {
  const key = idempotencyKey || generateIdempotencyKey(`order_${bookingId}`);
  const { data } = await api.post(
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

export async function verifyPayment(input) {
  const { idempotencyKey, ...payload } = input;
  // Use provided key or uniquely tie to the razorpay payment id
  const key = idempotencyKey || `verify_${payload.razorpay_payment_id}`;

  const { data } = await api.post(
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

export async function getBookingReceipt(bookingId) {
  const { data } = await api.get(`/payments/${bookingId}/receipt`);
  return data.receipt;
}

export async function downloadBookingReceiptPdf(bookingId, receiptNumber) {
  try {
    const response = await api.get(`/payments/${bookingId}/receipt/download`, {
      responseType: "blob",
    });

    let filename = receiptNumber ? `receipt_${receiptNumber}.pdf` : `receipt_${bookingId}.pdf`;
    const disposition = response.headers?.["content-disposition"];
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, "").trim();
      }
    }

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json?.message) {
          throw new Error(json.message);
        }
      } catch (parseErr) {
        if (parseErr.message && parseErr !== error) throw parseErr;
      }
    }
    throw error;
  }
}

