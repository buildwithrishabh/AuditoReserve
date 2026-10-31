const {
  deleteImageFromCloudinary,
  deleteMultipleImagesFromCloudinary,
  uploadPdfStreamToCloudinary,
} = require("../../../src/utils/cloudinaryHelper");
const cloudinary = require("../../../src/config/cloudinary");

describe("Unit: Cloudinary Helper", () => {
  it("should extract public_id correctly and invoke cloudinary.uploader.destroy", async () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1234567890/auditoriums/hall_a.jpg";
    await deleteImageFromCloudinary(url);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("auditoriums/hall_a");
  });

  it("should handle invalid URLs without calling destroy", async () => {
    cloudinary.uploader.destroy.mockClear();
    await deleteImageFromCloudinary("https://external-storage.com/image.jpg");

    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it("should delete multiple images in parallel using deleteMultipleImagesFromCloudinary", async () => {
    cloudinary.uploader.destroy.mockClear();
    const urls = [
      "https://res.cloudinary.com/demo/image/upload/v1/auditoriums/pic1.jpg",
      "https://res.cloudinary.com/demo/image/upload/v2/auditoriums/pic2.png",
    ];

    await deleteMultipleImagesFromCloudinary(urls);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(2);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("auditoriums/pic1");
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("auditoriums/pic2");
  });

  it("should stream upload PDF and append .pdf to publicId if missing", async () => {
    const generateStreamFn = jest.fn((uploadStream) => {
      uploadStream.write(Buffer.from("%PDF-1.4 test"));
      uploadStream.end();
    });

    const secureUrl = await uploadPdfStreamToCloudinary({
      publicId: "receipt_12345",
      generateStreamFn,
    });

    expect(generateStreamFn).toHaveBeenCalledTimes(1);
    expect(secureUrl).toContain("receipt_12345.pdf");
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: "auditorium_receipts",
        resource_type: "raw",
        public_id: "receipt_12345.pdf",
      }),
      expect.any(Function)
    );
  });
});

