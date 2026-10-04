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
    imageUrls.map((url) => deleteImageFromCloudinary(url)),
  );
};

const uploadPdfStreamToCloudinary = ({
  generateStreamFn,
  folder = "auditorium_receipts",
  publicId,
}) => {
  return new Promise((resolve, reject) => {
    // Cloudinary raw assets require the file extension in public_id so downloads retain .pdf format
    const cleanPublicId = publicId?.endsWith(".pdf")
      ? publicId
      : `${publicId}.pdf`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        public_id: cleanPublicId,
        format: "pdf",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );

    uploadStream.on("error", (err) => reject(err));

    try {
      generateStreamFn(uploadStream);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  deleteImageFromCloudinary,
  deleteMultipleImagesFromCloudinary,
  uploadPdfStreamToCloudinary
};
