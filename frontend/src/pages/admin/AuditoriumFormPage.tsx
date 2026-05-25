import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { getSingleAuditorium, createAuditorium, updateAuditorium } from "../../api/auditoriums";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../api/client";
import { TextField, FormError } from "../../components/common/FormControls";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { staggerContainerFast, cardItem, slideUp, fadeIn } from "../../lib/animations";

const auditoriumSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  capacity: z
    .string()
    .min(1, "Capacity is required")
    .refine((v) => Number(v) > 0, "Capacity must be a positive number"),
  amenities: z.string().min(2, "Add at least one amenity (e.g. Stage, Projector)"),
  basePrice: z
    .string()
    .min(1, "Price is required")
    .refine((v) => Number(v) >= 0, "Price cannot be negative"),
  description: z.string().min(12, "Description must be at least 12 characters"),
  images: z.any().optional(),
});

type AuditoriumFormValues = z.infer<typeof auditoriumSchema>;

export function AuditoriumFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    data: auditorium,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["auditorium", id],
    queryFn: () => getSingleAuditorium(id),
    enabled: mode === "edit" && Boolean(id),
  });

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AuditoriumFormValues>({
    resolver: zodResolver(auditoriumSchema),
    values: auditorium
      ? {
          name: auditorium.name,
          capacity: String(auditorium.capacity),
          amenities: auditorium.amenities.join(", "),
          basePrice: String(auditorium.basePrice),
          description: auditorium.description,
          images: undefined,
        }
      : undefined,
  });

  // Clean up object URLs to prevent leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const { ref, onChange, ...imagesField } = field("images");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Forward event to react-hook-form
    void onChange(e);
    
    // Revoke old previews
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    
    const files = e.target.files;
    if (files && files.length > 0) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setImagePreviews(urls);
    } else {
      setImagePreviews([]);
    }
  };

  async function onSubmit(values: AuditoriumFormValues) {
    setServerError("");
    const input = {
      name: values.name,
      capacity: Number(values.capacity),
      amenities: values.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      basePrice: Number(values.basePrice),
      description: values.description,
      images: values.images,
    };

    try {
      if (mode === "create") {
        await createAuditorium(input);
        showToast("Auditorium venue successfully created!", "success");
        reset();
      } else {
        await updateAuditorium(id, input);
        showToast("Auditorium details updated successfully!", "success");
      }
      
      await queryClient.invalidateQueries({ queryKey: ["auditoriums"] });
      navigate("/admin/auditoriums");
    } catch (error) {
      const msg = getErrorMessage(error);
      setServerError(msg);
      showToast(msg, "error");
    }
  }

  if (mode === "edit" && isLoading) {
    return (
      <FullPageState
        title="Loading Form Specifications"
        message="Fetching auditorium properties details..."
      />
    );
  }

  if (mode === "edit" && isError) {
    return (
      <ErrorState
        title="Could not load auditorium details"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <motion.section
      variants={staggerContainerFast}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="page-header" variants={slideUp}>
        <p className="eyebrow">Venue setup</p>
        <h1>{mode === "create" ? "Create auditorium" : "Edit auditorium"}</h1>
        <p>Define venue specifications, capacity parameters and upload image attachments.</p>
      </motion.div>

      <motion.form
        className="panel form admin-form"
        variants={staggerContainerFast}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      >
        <motion.div variants={cardItem}>
          <TextField
            label="Venue Name"
            type="text"
            error={errors.name?.message}
            {...field("name")}
            placeholder="Main Audi or Conference Room A"
          />
        </motion.div>

        <motion.div variants={cardItem} className="form-row">
          <TextField
            label="Seating Capacity"
            type="number"
            error={errors.capacity?.message}
            {...field("capacity")}
            placeholder="e.g. 250"
          />
          <TextField
            label="Base Price per Hour (₹)"
            type="number"
            error={errors.basePrice?.message}
            {...field("basePrice")}
            placeholder="e.g. 1500"
          />
        </motion.div>

        <motion.div variants={cardItem}>
          <TextField
            label="Amenities (comma-separated)"
            placeholder="Projector, Stage, Sound system, AC, Wi-Fi"
            error={errors.amenities?.message}
            {...field("amenities")}
          />
        </motion.div>

        <motion.div variants={cardItem}>
          <label className={`field ${errors.description ? "has-error" : ""}`}>
            <span>Description</span>
            <textarea
              rows={5}
              {...field("description")}
              placeholder="Detailed features, location notes or operational limits of this facility..."
            />
            {errors.description?.message && (
              <small style={{ color: "var(--danger)", fontWeight: "600", marginTop: "4px" }}>
                {errors.description.message}
              </small>
            )}
          </label>
        </motion.div>

        <motion.div variants={cardItem}>
          <label className="field">
            <span>Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={ref}
              onChange={handleImageChange}
              {...imagesField}
            />
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Upload up to 5 images. On edit, leave blank to retain existing images.
            </p>
          </label>
        </motion.div>

        {imagePreviews.length > 0 && (
          <motion.div variants={fadeIn} style={{ marginTop: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "8px" }}>
              Upload Previews ({imagePreviews.length} files selected):
            </span>
            <motion.div
              className="image-previews"
              variants={staggerContainerFast}
              initial="hidden"
              animate="visible"
            >
              {imagePreviews.map((url, i) => (
                <motion.div
                  key={i}
                  className="preview-thumbnail"
                  variants={cardItem}
                  whileHover={{ scale: 1.05 }}
                >
                  <img src={url} alt={`Upload preview ${i + 1}`} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        <motion.div variants={cardItem}>
          <FormError message={serverError} />
        </motion.div>

        <motion.button
          className="button primary"
          disabled={isSubmitting}
          type="submit"
          variants={cardItem}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{ marginTop: "12px", width: "fit-content", minWidth: "160px" }}
        >
          {isSubmitting ? "Saving venue..." : "Save auditorium"}
        </motion.button>
      </motion.form>
    </motion.section>
  );
}
export default AuditoriumFormPage;
