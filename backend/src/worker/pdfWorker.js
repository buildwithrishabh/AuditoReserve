const { Worker } = require("bullmq");
const queueconnection = require("../config/queueConnection");
const logger = require("../config/logger");
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const { buildReceiptPdf } = require("../utils/receiptGenerator");
const { uploadPdfStreamToCloudinary } = require("../utils/cloudinaryHelper");

const pdfWorker = new Worker(
  "pdf-generation-queue",
  async (job) => {
    const { bookingId, paymentId } = job.data;
    logger.info(
      `[PDF Worker] Generating & uploading receipt for booking: ${bookingId}`,
    );

    const booking = await Booking.findById(bookingId)
      .populate("user", "name email phone")
      .populate("auditorium");

    if (!booking) throw new Error(`Booking not found : ${bookingId}`);

    const payment = await Payment.findById(paymentId || booking.paymentId);

    if (!payment) throw new Error("Payment record not found");

    // Clean single helper call: pipe PDFKit directly to cloudinary
    const secureUrl = await uploadPdfStreamToCloudinary({
      publicId: `receipt_${payment.receipt}`,
      generateStreamFn: (uploadStream) => {
        buildReceiptPdf(
          {
            booking,
            payment,
            user: booking.user,
            auditorium: booking.auditorium,
          },
          uploadStream,
        );
      },
    });

    //   save cloudinary url in payment document
    payment.receiptPdfUrl = secureUrl;
    await payment.save();

    logger.info(`[PDF Worker] Receipt successfully uploaded: ${secureUrl}`);
    return { secureUrl };
  },
  {
    connection: queueconnection,
    concurrency: 2,
  },
);

pdfWorker.on("failed", (job, err) => {
  logger.error(
    `[PDF Worker] Failed generating receipt for booking ${job?.data?.bookingId}: ${err.message}`,
  );
});

module.exports = pdfWorker;
