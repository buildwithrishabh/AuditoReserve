import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getAllBookings, updateBookingStatus } from "../../api/bookings";
import { downloadBookingReceiptPdf } from "../../api/payments";
import { useToast } from "../../hooks/useToast";
import { BookingRow } from "../../components/bookings/BookingRow";
import { StatusTabs } from "../../components/bookings/StatusTabs";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState, EmptyState } from "../../components/common/ErrorState";
import { Pagination } from "../../components/common/Pagination";
import { staggerContainerFast, listItem } from "../../lib/animations";

export function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [downloadingBookingId, setDownloadingBookingId] = useState(null);

  const handleDownloadReceipt = async (bookingId) => {
    try {
      setDownloadingBookingId(bookingId);
      await downloadBookingReceiptPdf(bookingId);
      showToast("Receipt downloaded successfully.", "success");
    } catch (error) {
      showToast(error?.message || "Failed to download receipt.", "error");
    } finally {
      setDownloadingBookingId(null);
    }
  };
  
  // Custom dialog control
  const [pendingAction, setPendingAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-bookings", page, status],
    queryFn: () =>
      getAllBookings({
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

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) =>
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

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleAdminActionClick = (bookingId, nextStatus, bookingTitle) => {
    setPendingAction({ bookingId, nextStatus });
    
    if (nextStatus === "approved") {
      setConfirmTitle("Approve Booking Request?");
      setConfirmMessage(
        `This will approve "${bookingTitle}" and email the student a payment link. The student must pay within 12 hours.`,
      );
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

      <StatusTabs value={status} onChange={handleStatusChange} includeAll />

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
        <>
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
                    onDownloadReceipt={
                      booking.status === "confirmed"
                        ? () => handleDownloadReceipt(booking._id)
                        : undefined
                    }
                    isDownloadingReceipt={downloadingBookingId === booking._id}
                    isSubmittingAction={statusMutation.isPending}
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
