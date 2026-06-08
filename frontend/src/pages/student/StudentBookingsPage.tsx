import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getUserBookings, cancelBooking } from "../../api/bookings";
import { createPaymentOrder, verifyPayment } from "../../api/payments";
import { loadRazorpayScript } from "../../lib/razorpay";
import { useToast } from "../../hooks/useToast";
import { BookingRow } from "../../components/bookings/BookingRow";
import { StatusTabs } from "../../components/bookings/StatusTabs";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState, EmptyState } from "../../components/common/ErrorState";
import type { BookingStatus } from "../../types";
import { staggerContainerFast, listItem } from "../../lib/animations";

export function StudentBookingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: getUserBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: (response) => {
      showToast(response.message || "Booking request successfully cancelled.", "success");
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Failed to cancel booking.", "error");
    },
  });

  const handlePayNow = async (bookingId: string) => {
    const loaded = await loadRazorpayScript();

    if (!loaded || !window.Razorpay) {
      showToast("Could not load Razorpay checkout.", "error");
      return;
    }

    try {
      const paymentData = await createPaymentOrder(bookingId);

      const options = {
        key: paymentData.key,
        amount: paymentData.order.amount,
        currency: paymentData.order.currency,
        name: "AuditoReserve",
        description: "Auditorium booking payment",
        order_id: paymentData.order.id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const result = await verifyPayment({
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            showToast(result.message || "Payment successful.", "success");
            void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
          } catch (error) {
            showToast(error instanceof Error ? error.message : "Payment verification failed.", "error");
          }
        },
        theme: {
          color: "#7c73e6",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create payment order.", "error");
    }
  };

  const bookings = data.filter((b) => status === "all" || b.status === status);

  const handleCancelClick = (id: string) => {
    setCancellingBookingId(id);
  };

  const handleConfirmCancel = () => {
    if (cancellingBookingId) {
      cancelMutation.mutate(cancellingBookingId);
      setCancellingBookingId(null);
    }
  };

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Student workspace</p>
        <h1>My bookings</h1>
        <p>Track auditorium requests and confirmed reservations.</p>
      </div>

      <StatusTabs value={status} onChange={setStatus} includeAll />

      {isLoading && (
        <FullPageState
          title="Loading Bookings"
          message="Fetching your booked facility reservations..."
        />
      )}
      
      {isError && (
        <ErrorState
          title="Could not load bookings"
          onRetry={() => void refetch()}
        />
      )}
      
      {!isLoading && !isError && bookings.length === 0 && (
        <EmptyState
          title="No bookings found"
          message="Your matching booking requests will appear here."
        />
      )}
      
      {!isLoading && !isError && bookings.length > 0 && (
        <motion.div
          className="booking-list"
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
        >
          {bookings.map((booking) => {
            const isPaymentExpired =
              booking.paymentDeadline && new Date(booking.paymentDeadline) < new Date();
            return (
              <motion.div key={booking._id} variants={listItem}>
                <BookingRow
                  booking={booking}
                  onPay={
                    booking.status === "approved" && !isPaymentExpired
                      ? () => void handlePayNow(booking._id)
                      : undefined
                  }
                  onCancel={
                    booking.status === "pending"
                      ? () => handleCancelClick(booking._id)
                      : undefined
                  }
                  isSubmittingAction={cancelMutation.isPending}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <ConfirmDialog
        isOpen={Boolean(cancellingBookingId)}
        title="Cancel Booking Request?"
        message="Are you sure you want to cancel this booking request? This action cannot be undone."
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancellingBookingId(null)}
      />
    </section>
  );
}
export default StudentBookingsPage;
