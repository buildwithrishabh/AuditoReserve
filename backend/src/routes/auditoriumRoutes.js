const express = require("express");

const router = express.Router();

const {
  createAuditorium,
  getAllAuditoriums,
  getSingleAuditorium,
  updateAuditorium,
  deleteAuditorium,
} = require("../controllers/auditoriumController");

const upload = require("../middlewares/uploadMiddleware");

// Example auth middleware
const {
  protect,
  authorizeRole,
  isverified,
} = require("../middlewares/authMiddleware");

// ==============================
// PUBLIC ROUTES
// ==============================

// Get all auditoriums
router.get("/viewAllAuditoriums", getAllAuditoriums);

// Get single auditorium
router.get("/viewAuditorium/:id", getSingleAuditorium);

// ==============================
// ADMIN ROUTES
// ==============================

// Create auditorium
router.post(
  "/createAuditorium",
  protect,
  authorizeRole("admin"),
  isverified,
  upload.array("images", 5),
  createAuditorium,
);

// Update auditorium
router.put(
  "/updateAuditorium/:id",
  protect,
  authorizeRole("admin"),
  isverified,
  upload.array("images", 5),
  updateAuditorium,
);

// Delete auditorium
router.delete(
  "/deleteAuditorium/:id",
  protect,
  authorizeRole("admin"),
  isverified,
  deleteAuditorium,
);

module.exports = router;
