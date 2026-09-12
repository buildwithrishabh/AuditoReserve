import { api } from "./client";

export async function createBooking(input) {
  const { data } = await api.post(
    "/bookings/createBooking",
    input,
  );
  return data;
}

export async function getUserBookings() {
  const { data } = await api.get(
    "/bookings/my-bookings",
  );
  return data.bookings;
}

export async function cancelBooking(id) {
  const { data } = await api.put(`/bookings/cancel/${id}`);
  return data;
}

export async function getAllBookings() {
  const { data } = await api.get(
    "/bookings/all",
  );
  return data.bookings;
}

export async function updateBookingStatus(id, status) {
  const { data } = await api.put(`/bookings/status/${id}`, {
    status,
  });
  return data;
}

export async function getCalendarBookings(auditoriumId, month) {
  const { data } = await api.get(
    "/bookings/calendar",
    {
      params: { auditoriumId, month },
    }
  );
  return data.bookings;
}
