import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getAllBookings, updateBookingStatus } from "../../api/bookings";
import { useToast } from "../../hooks/useToast";
import { BookingRow } from "../../components/bookings/BookingRow";
import { StatusTabs } from "../../components/bookings/StatusTabs";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState, EmptyState } from "../../components/common/ErrorState";
import type { BookingStatus } from "../../types";
import { staggerContainerFast, listItem } from "../../lib/animations";

type ActionPayload = {
  bookingId: string;
  nextStatus: BookingStatus;
};

export function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [status, setStatus] = useState<BookingStatus | "all">("pending");
  
  // Custom dialog control
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: getAllBookings,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: BookingStatus }) =>
      updateBookingStatus(id, nextStatus),
    onSuccess: (response) => {
      showToast(response.message || "Booking request status successfully updated.", "success");
      void queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Failed to update booking status.", "error");
    },
  });

  const bookings = data.filter((b) => status === "all" || b.status === status);

  const handleAdminActionClick = (bookingId: string, nextStatus: BookingStatus, bookingTitle: string) => {
    setPendingAction({ bookingId, nextStatus });
    
    if (nextStatus === "confirmed") {
      setConfirmTitle("Approve Booking Request?");
      setConfirmMessage(`Are you sure you want to approve the booking request for "${bookingTitle}"?`);
    } else {
      setConfirmTitle("Cancel / Reject Booking?");
      setConfirmMessage(`Are you sure you want to cancel or reject the booking request for "${bookingTitle}"?`);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      statusMutation.mutate({
        id: pendingAction.bookingId,
        nextStatus: pendingAction.nextStatus,
      });
      setPendingAction(null);
    }
  };

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Booking queue</p>
        <h1>Booking requests</h1>
        <p>Review student requests and approve or cancel booked facility slots.</p>
      </div>

      <StatusTabs value={status} onChange={setStatus} includeAll />

      {isLoading && (
        <FullPageState
          title="Loading Queue"
          message="Fetching reservation requests catalog..."
        />
      )}
      
      {isError && (
        <ErrorState
          title="Could not load bookings queue"
          onRetry={() => void refetch()}
        />
      )}
      
      {!isLoading && !isError && (
        <motion.div
          className="booking-list"
          style={{ marginTop: "24px" }}
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
        >
          {bookings.map((booking) => {
            const auditorium =
              typeof booking.auditorium === "string" ? undefined : booking.auditorium;
            const bookingTitle = auditorium?.name || "Auditorium Facility";
            
            return (
              <motion.div key={booking._id} variants={listItem}>
                <BookingRow
                  booking={booking}
                  adminActions={
                    booking.status === "pending"
                      ? (nextStatus) => handleAdminActionClick(booking._id, nextStatus, bookingTitle)
                      : undefined
                  }
                  isSubmittingAction={statusMutation.isPending}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <EmptyState
          title="No booking requests found"
          message="Try changing the status tab filters."
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirm Status Update"
        cancelText="Dismiss"
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />
    </section>
  );
}
export default AdminBookingsPage;
