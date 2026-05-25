import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { getAllAuditoriums, deleteAuditorium } from "../../api/auditoriums";
import { useToast } from "../../hooks/useToast";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import type { Auditorium } from "../../types";
import { staggerContainerFast, listItem } from "../../lib/animations";

export function AdminAuditoriumsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [deletingAud, setDeletingAud] = useState<Auditorium | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["auditoriums"],
    queryFn: getAllAuditoriums,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuditorium,
    onSuccess: (response) => {
      showToast(response.message || "Auditorium successfully removed.", "success");
      void queryClient.invalidateQueries({ queryKey: ["auditoriums"] });
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Failed to delete auditorium.", "error");
    },
  });

  const handleDeleteClick = (aud: Auditorium) => {
    setDeletingAud(aud);
  };

  const handleConfirmDelete = () => {
    if (deletingAud) {
      deleteMutation.mutate(deletingAud._id);
      setDeletingAud(null);
    }
  };

  return (
    <section>
      <div className="section-heading">
        <div className="page-header" style={{ margin: "0" }}>
          <p className="eyebrow">Venue inventory</p>
          <h1 style={{ margin: "0" }}>Auditoriums</h1>
          <p style={{ margin: "4px 0 0" }}>Create, edit, and remove campus auditorium listings.</p>
        </div>
        <Link className="button primary" to="/admin/auditoriums/new">
          <Plus size={18} /> Create auditorium
        </Link>
      </div>

      {isLoading && (
        <FullPageState
          title="Loading Auditoriums"
          message="Fetching venue inventory specifications..."
        />
      )}
      
      {isError && (
        <ErrorState
          title="Could not load auditoriums"
          onRetry={() => void refetch()}
        />
      )}
      
      {!isLoading && !isError && (
        <motion.div
          className="table-card"
          style={{ marginTop: "24px" }}
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
        >
          <table>
            <thead>
              <tr>
                <th>Auditorium</th>
                <th>Capacity</th>
                <th>Price</th>
                <th>Amenities</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((auditorium) => (
                <motion.tr key={auditorium._id} variants={listItem}>
                  <td data-label="Auditorium">
                    <div className="table-title">
                      {auditorium.images?.[0] ? (
                        <img src={auditorium.images[0]} alt="" />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "36px",
                            background: "var(--primary-light)",
                            borderRadius: "6px",
                            display: "grid",
                            placeItems: "center",
                            color: "var(--primary)",
                            fontSize: "12px",
                            fontWeight: "800",
                          }}
                        >
                          {auditorium.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{auditorium.name}</span>
                    </div>
                  </td>
                  <td data-label="Capacity">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
                      <Users size={14} style={{ color: "var(--text-muted)" }} />
                      {auditorium.capacity} seats
                    </span>
                  </td>
                  <td data-label="Price">
                    <span style={{ fontWeight: "700", color: "var(--primary)" }}>
                      ₹{auditorium.basePrice}/hr
                    </span>
                  </td>
                  <td data-label="Amenities">
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {auditorium.amenities.slice(0, 2).map((amenity) => (
                        <span
                          key={amenity}
                          style={{
                            fontSize: "11px",
                            background: "var(--surface-muted)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            border: "1px solid var(--border)",
                            fontWeight: "600",
                          }}
                        >
                          {amenity}
                        </span>
                      ))}
                      {auditorium.amenities.length > 2 && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", alignSelf: "center" }}>
                          +{auditorium.amenities.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      <Link
                        className="icon-button"
                        to={`/admin/auditoriums/${auditorium._id}/edit`}
                        aria-label="Edit venue"
                        title="Edit venue details"
                      >
                        <Edit size={17} />
                      </Link>
                      <button
                        className="icon-button danger-icon"
                        type="button"
                        onClick={() => handleDeleteClick(auditorium)}
                        aria-label="Delete venue"
                        title="Delete venue listing"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <p>No auditoriums listed yet. Click "Create auditorium" to add one.</p>
            </div>
          )}
        </motion.div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingAud)}
        title="Remove Auditorium Listing?"
        message={`Are you sure you want to permanently delete "${deletingAud?.name}"? This will remove all image mappings and cancel ongoing slot request audits.`}
        confirmText="Permanently Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingAud(null)}
      />
    </section>
  );
}
export default AdminAuditoriumsPage;
