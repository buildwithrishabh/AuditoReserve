const Auditorium = require("../models/auditorium");

// ========================================
// CREATE AUDITORIUM
// ========================================
exports.createAuditorium = async (req, res, next) => {
  try {
    const { name, capacity, amenities, basePrice, description } = req.body;

    // Get uploaded image URLs from Cloudinary
    const imageUrls = req.files.map((file) => file.path);

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
    const auditoriums = await Auditorium.find().sort({
      createdAt: -1,
    });

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
    const auditorium = await Auditorium.findById(req.params.id);

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

    // Keep old images if no new image uploaded
    let imageUrls = auditorium.images;

    // If new images uploaded
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((file) => file.path);
    }

    auditorium.name = name ?? auditorium.name;
    auditorium.capacity = capacity ?? auditorium.capacity;
    auditorium.amenities = amenitiesArray ?? auditorium.amenities;
    auditorium.basePrice = basePrice ?? auditorium.basePrice;
    auditorium.description = description ?? auditorium.description;
    auditorium.images = imageUrls;

    await auditorium.save();

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

    await auditorium.deleteOne();

    res.status(200).json({
      success: true,
      message: "Auditorium deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
