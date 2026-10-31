import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Building2,
  Coins,
  Sparkles,
  Image as ImageIcon,
  ArrowLeft,
  Save,
  Info,
} from "lucide-react";
import { getSingleAuditorium, createAuditorium, updateAuditorium } from "../../api/auditoriums";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../api/client";
import { TextField, FormError } from "../../components/common/FormControls";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { staggerContainerFast } from "../../lib/animations";

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
  description: z
    .string()
    .min(12, "Description must be at least 12 characters")
    .max(500, "Description cannot exceed 500 characters"),
  images: z.any().optional(),
});

export function AuditoriumFormPage({ mode }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);

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
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
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

  const rawAmenities = useWatch({ control, name: "amenities" }) || "";
  const parsedAmenities = rawAmenities
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const { ref, onChange, ...imagesField } = field("images");

  const handleImageChange = (e) => {
    void onChange(e);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    const files = e.target.files;
    if (files && files.length > 0) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setImagePreviews(urls);
    } else {
      setImagePreviews([]);
    }
  };

  async function onSubmit(values) {
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
      className="admin-form-page"
    >
      <div className="section-heading">
        <div className="page-header" style={{ margin: 0 }}>
          <span className="eyebrow">Venue Setup</span>
          <h1 style={{ margin: "4px 0 0" }}>{mode === "create" ? "Create auditorium" : "Edit auditorium"}</h1>
          <p style={{ margin: "4px 0 0" }}>Configure campus auditorium specs, capacity limits, and media assets.</p>
        </div>
        <Link to="/admin/auditoriums" className="button ghost sm">
          <ArrowLeft size={16} /> Back to venues
        </Link>
      </div>

      <form
        className="admin-form-container"
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      >
        {/* Card 1: Basic Information */}
        <div className="card admin-form-card">
          <div className="card-section-head">
            <Building2 size={18} className="head-icon" />
            <div>
              <h3>Basic Identification</h3>
              <p>Official venue title and operational description.</p>
            </div>
          </div>

          <TextField
            label="Venue Name"
            type="text"
            error={errors.name?.message}
            {...field("name")}
            placeholder="e.g. Tagore Memorial Hall or Science Auditorium B"
          />

          <label className={`field ${errors.description ? "has-error" : ""}`}>
            <span>Facility Description</span>
            <textarea
              rows={4}
              {...field("description")}
              placeholder="Describe seating configuration, stage dimensions, acoustic qualities, and authorized department usage..."
            />
            {errors.description?.message && (
              <small>{errors.description.message}</small>
            )}
          </label>
        </div>

        {/* Card 2: Capacity & Pricing */}
        <div className="card admin-form-card">
          <div className="card-section-head">
            <Coins size={18} className="head-icon" />
            <div>
              <h3>Capacity & Pricing Rules</h3>
              <p>Seat threshold and hourly billing tariff.</p>
            </div>
          </div>

          <div className="form-row">
            <TextField
              label="Audience Seating Capacity"
              type="number"
              error={errors.capacity?.message}
              {...field("capacity")}
              placeholder="e.g. 450"
            />
            <TextField
              label="Base Hourly Rate (₹ / hr)"
              type="number"
              error={errors.basePrice?.message}
              {...field("basePrice")}
              placeholder="e.g. 3500"
            />
          </div>
        </div>

        {/* Card 3: Amenities & AV Specs */}
        <div className="card admin-form-card">
          <div className="card-section-head">
            <Sparkles size={18} className="head-icon" />
            <div>
              <h3>Facility Amenities</h3>
              <p>List equipped AV systems, lighting, and stage features.</p>
            </div>
          </div>

          <TextField
            label="Amenities (comma-separated)"
            placeholder="e.g. HD Projector, Stage Lighting, Dolby Sound, Podium Mic, Central AC, Wi-Fi"
            error={errors.amenities?.message}
            {...field("amenities")}
          />

          {parsedAmenities.length > 0 && (
            <div className="amenities-live-preview">
              <span className="preview-label">Live Chips Preview:</span>
              <div className="amenities-chips-wrap">
                {parsedAmenities.map((amenity) => (
                  <span key={amenity} className="amenity-chip">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Multi-Photo Uploads */}
        <div className="card admin-form-card">
          <div className="card-section-head">
            <ImageIcon size={18} className="head-icon" />
            <div>
              <h3>Auditorium Photography</h3>
              <p>High-resolution imagery of the stage, seating hall, and exterior.</p>
            </div>
          </div>

          <div className="file-dropzone-box">
            <input
              id="auditorium-images-input"
              type="file"
              accept="image/*"
              multiple
              ref={ref}
              onChange={handleImageChange}
              {...imagesField}
              style={{ display: "none" }}
            />
            <label htmlFor="auditorium-images-input" className="dropzone-label">
              <ImageIcon size={32} className="dropzone-icon" />
              <strong>Click to upload venue images</strong>
              <span>Select up to 5 image files (PNG, JPG, WebP)</span>
            </label>
          </div>

          {mode === "edit" && auditorium?.images?.length > 0 && imagePreviews.length === 0 && (
            <div className="existing-images-note">
              <Info size={14} />
              <span>{auditorium.images.length} existing image(s) attached. Leaving the file picker empty will preserve existing images.</span>
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div className="image-previews-container">
              <span className="preview-header-label">Selected New Images ({imagePreviews.length}):</span>
              <div className="image-previews-grid">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="preview-thumbnail-card">
                    <img src={url} alt={`Upload preview ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <FormError message={serverError} />

        {/* Sticky Actions Bar */}
        <div className="form-action-bar">
          <Link to="/admin/auditoriums" className="button ghost">
            Cancel
          </Link>
          <button
            className="button primary"
            disabled={isSubmitting}
            type="submit"
          >
            <Save size={16} />
            {isSubmitting ? "Saving venue..." : mode === "create" ? "Create auditorium" : "Save changes"}
          </button>
        </div>
      </form>
    </motion.section>
  );
}

export default AuditoriumFormPage;
