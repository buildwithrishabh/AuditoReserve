export type User = {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
};

export type Auditorium = {
  _id: string;
  name: string;
  capacity: number;
  amenities: string[];
  images: string[];
  basePrice: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  auditorium: string | Auditorium;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: BookingStatus;
  totalPrice: number;
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiErrorBody = {
  message?: string;
  error?: string;
  success?: boolean;
};
