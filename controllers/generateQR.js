const QRCode = require("qrcode");

const generateQRCode = async (bookingId) => {
  try {
    return await QRCode.toDataURL(bookingId.toString());
  } catch (err) {
    throw new Error("QR generation failed");
  }
};

module.exports = generateQRCode;