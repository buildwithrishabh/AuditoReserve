import { api } from "./client";
import type { Booking, BookingStatus } from "../types";

export type BookingInput = {
  auditoriumId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

export async function createBooking(input: BookingInput) {
  const { data } = await api.post<{ booking: Booking; message: string }>(
    "/bookings/createBooking",
    input,
  );
  return data;
}

export async function getUserBookings() {
  const { data } = await api.get<{ success: boolean; count: number; bookings: Booking[] }>(
    "/bookings/my-bookings",
  );
  return data.bookings;
}

export async function cancelBooking(id: string) {
  const { data } = await api.put<{ booking: Booking; message: string }>(`/bookings/cancel/${id}`);
  return data;
}

export async function getAllBookings() {
  const { data } = await api.get<{ success: boolean; count: number; bookings: Booking[] }>(
    "/bookings/all",
  );
  return data.bookings;
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const { data } = await api.put<{ booking: Booking; message: string }>(`/bookings/status/${id}`, {
    status,
  });
  return data;
}
