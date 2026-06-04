const cloudinary = require("../config/cloudinary");

// Extract public_id from Cloudinary URL
const getPublicId = (url) => {
  const path = url.split("/upload/")[1];
  if (!path) return null;

  return path
    .replace(/^v\d+\//, "") // remove version (v123456/)
    .replace(/\.[^/.]+$/, ""); // remove file extension
};

// Delete one image
const deleteImageFromCloudinary = async (imageUrl) => {
  const publicId = getPublicId(imageUrl);

  if (!publicId) return;

  return cloudinary.uploader.destroy(publicId);
};

// Delete multiple images
const deleteMultipleImagesFromCloudinary = async (imageUrls = []) => {
  await Promise.allSettled(
    imageUrls.map((url) => deleteImageFromCloudinary(url))
  );
};

module.exports = {
  deleteImageFromCloudinary,
  deleteMultipleImagesFromCloudinary,
};
