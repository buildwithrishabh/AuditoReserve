const Auditorium = require("../models/auditorium");
const Booking = require("../models/booking");
const { getOrSetCache, delPattern, del } = require("../utils/cache");
const {
  deleteMultipleImagesFromCloudinary,
} = require("../utils/cloudinaryHelper");

// ========================================
// CREATE AUDITORIUM
// ========================================
exports.createAuditorium = async (req, res, next) => {
  try {
    const { name, capacity, amenities, basePrice, description } = req.body;

    // Get uploaded image URLs from Cloudinary
    const imageUrls = req.files?.map((file) => file.path) || [];

    // Convert amenities string into array
    const amenitiesArray =
      typeof amenities === "string"
        ? amenities.split(",").map((item) => item.trim())
        : amenities;

    const auditorium = await Auditorium.create({
      name,
      capacity,
      amenities: amenitiesArray,
      images: imageUrls,
      basePrice,
      description,
    });

    await del("auditoriums:all");

    res.status(201).json({
      success: true,
      message: "Auditorium created successfully",
      auditorium,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET ALL AUDITORIUMS
// ========================================
exports.getAllAuditoriums = async (req, res, next) => {
  try {
    const auditoriums = await getOrSetCache(
      "auditoriums:all",
      async () => {
        return await Auditorium.find().sort({
          createdAt: -1,
        });
      },
      300,
    );

    res.status(200).json({
      success: true,
      total: auditoriums.length,
      auditoriums,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET SINGLE AUDITORIUM
// ========================================
exports.getSingleAuditorium = async (req, res, next) => {
  try {
    const auditorium = await getOrSetCache(
      `auditorium:${req.params.id}`,
      async () => {
        return await Auditorium.findById(req.params.id);
      },
      300,
    );

    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: "Auditorium not found",
      });
    }

    res.status(200).json({
      success: true,
      auditorium,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// UPDATE AUDITORIUM
// ========================================
exports.updateAuditorium = async (req, res, next) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id);

    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: "Auditorium not found",
      });
    }

    const { name, capacity, amenities, basePrice, description } = req.body;

    // Convert amenities into array
    const amenitiesArray =
      typeof amenities === "string"
        ? amenities.split(",").map((item) => item.trim())
        : amenities;

    // Keep old images if no new image uploaded, but clean them up from Cloudinary if replacing
    let imageUrls = auditorium.images;

    // If new images uploaded
    if (req.files && req.files.length > 0) {
      if (auditorium.images && auditorium.images.length > 0) {
        await deleteMultipleImagesFromCloudinary(auditorium.images);
      }
      imageUrls = req.files.map((file) => file.path);
    }

    auditorium.name = name ?? auditorium.name;
    auditorium.capacity = capacity ?? auditorium.capacity;
    auditorium.amenities = amenitiesArray ?? auditorium.amenities;
    auditorium.basePrice = basePrice ?? auditorium.basePrice;
    auditorium.description = description ?? auditorium.description;
    auditorium.images = imageUrls;

    await auditorium.save();
    await del("auditoriums:all");
    await del(`auditorium:${req.params.id}`);

    res.status(200).json({
      success: true,
      message: "Auditorium updated successfully",
      auditorium,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// DELETE AUDITORIUM
// ========================================
exports.deleteAuditorium = async (req, res, next) => {
  try {
    const auditorium = await Auditorium.findById(req.params.id);

    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: "Auditorium not found",
      });
    }

    // Check if there are active (pending, approved, or confirmed) bookings
    const activeBookingsCount = await Booking.countDocuments({
      auditorium: req.params.id,
      status: { $in: ["pending", "approved", "confirmed"] },
    });

    if (activeBookingsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete auditorium. There are ${activeBookingsCount} active booking(s) associated with it. Please cancel or resolve them first.`,
      });
    }

    // Delete associated images from Cloudinary before database deletion
    if (auditorium.images && auditorium.images.length > 0) {
      await deleteMultipleImagesFromCloudinary(auditorium.images);
    }

    await auditorium.deleteOne();

    await del("auditoriums:all");
    await del(`auditorium:${req.params.id}`);

    res.status(200).json({
      success: true,
      message: "Auditorium deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
