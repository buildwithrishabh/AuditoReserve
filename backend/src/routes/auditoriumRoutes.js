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

const {
  protect,
  authorizeRole,
  isverified,
} = require("../middlewares/authMiddleware");
const { slidingWindowLimiter } = require("../middlewares/rateLimiter");
const validate = require("../middlewares/validateMiddleware");
const {
  auditoriumIdParamSchema,
  createAuditoriumSchema,
  updateAuditoriumSchema,
} = require("../validators/auditoriumValidators");

// Limiters for auditorium routes
const viewAuditoriumLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 60,
  prefix: "rl:auditorium:view",
});

const uploadAuditoriumLimiter = slidingWindowLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: "rl:auditorium:mutate",
});

// ==============================
// PUBLIC ROUTES
// ==============================

// Get all auditoriums
router.get("/viewAllAuditoriums", viewAuditoriumLimiter, getAllAuditoriums);

// Get single auditorium
router.get(
  "/viewAuditorium/:id",
  viewAuditoriumLimiter,
  validate(auditoriumIdParamSchema),
  getSingleAuditorium
);

// ==============================
// ADMIN ROUTES
// ==============================

// Create auditorium
router.post(
  "/createAuditorium",
  protect,
  authorizeRole("admin"),
  isverified,
  uploadAuditoriumLimiter,
  upload.array("images", 5),
  validate(createAuditoriumSchema),
  createAuditorium,
);

// Update auditorium
router.put(
  "/updateAuditorium/:id",
  protect,
  authorizeRole("admin"),
  isverified,
  uploadAuditoriumLimiter,
  upload.array("images", 5),
  validate(updateAuditoriumSchema),
  updateAuditorium,
);

// Delete auditorium
router.delete(
  "/deleteAuditorium/:id",
  protect,
  authorizeRole("admin"),
  isverified,
  validate(auditoriumIdParamSchema),
  deleteAuditorium,
);

module.exports = router;
