import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getUserBookings, cancelBooking } from "../../api/bookings";
import { createPaymentOrder, verifyPayment } from "../../api/payments";
import { loadRazorpayScript } from "../../lib/razorpay";
import { useToast } from "../../hooks/useToast";
import { BookingRow } from "../../components/bookings/BookingRow";
import { BookingReceiptModal } from "../../components/bookings/BookingReceiptModal";
import { StatusTabs } from "../../components/bookings/StatusTabs";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState, EmptyState } from "../../components/common/ErrorState";
import { RefreshButton } from "../../components/common/RefreshButton";
import { Pagination } from "../../components/common/Pagination";
import { staggerContainerFast, listItem } from "../../lib/animations";

export function StudentBookingsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [selectedReceiptBookingId, setSelectedReceiptBookingId] = useState(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["my-bookings", page, status],
    queryFn: () =>
      getUserBookings({
        page,
        limit: 10,
        status: status === "all" ? undefined : status,
      }),
  });

  const bookings = data?.bookings || (Array.isArray(data) ? data : []);
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: bookings.length,
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

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

  const handlePayNow = useCallback(
    async (bookingId) => {
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
          handler: async (response) => {
            try {
              const result = await verifyPayment({
                bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              showToast(result.message || "Payment successful.", "success");
              void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
              // Automatically display official payment receipt preview upon verified payment
              setSelectedReceiptBookingId(bookingId);
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
    },
    [queryClient, showToast],
  );

  // Handle URL query parameters for ?receipt=<id> and ?pay=<id> (from email links)
  useEffect(() => {
    const receiptParam = searchParams.get("receipt");
    const payParam = searchParams.get("pay");

    if (receiptParam) {
      setSelectedReceiptBookingId(receiptParam);
      searchParams.delete("receipt");
      setSearchParams(searchParams, { replace: true });
    }

    if (payParam) {
      void handlePayNow(payParam);
      searchParams.delete("pay");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, handlePayNow]);

  const handleCancelClick = (id) => {
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
      <div className="dashboard-header-row">
        <div className="page-header">
          <p className="eyebrow">Student workspace</p>
          <h1>My bookings</h1>
          <p>Track auditorium requests and confirmed reservations.</p>
        </div>
        <div className="dashboard-header-actions">
          <RefreshButton label="Refresh" queryKey={["my-bookings"]} title="Refresh my bookings" />
        </div>
      </div>

      <StatusTabs value={status} onChange={handleStatusChange} includeAll />

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
        <>
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
                    onReceipt={
                      booking.status === "confirmed"
                        ? () => setSelectedReceiptBookingId(booking._id)
                        : undefined
                    }
                    isSubmittingAction={cancelMutation.isPending}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            limit={pagination.limit}
            onPageChange={(newPage) => setPage(newPage)}
            isLoading={isFetching}
          />
        </>
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

      <BookingReceiptModal
        isOpen={Boolean(selectedReceiptBookingId)}
        bookingId={selectedReceiptBookingId}
        onClose={() => setSelectedReceiptBookingId(null)}
      />
    </section>
  );
}
export default StudentBookingsPage;
