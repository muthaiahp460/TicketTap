const { pool } = require("../config/dbConnection");

const verifyTicket = async (req, res) => {
  const { bookingId } = req.body;
  
  const bookingIdInt = parseInt(bookingId, 10);
  if(isNaN(bookingIdInt) || bookingIdInt < 1)
    return res.status(400).json({ message: "Invalid Booking ID ❌" });

  const [booking] = await pool.query(
    "SELECT * FROM bookings WHERE id=?",
    [bookingIdInt]
  );

  if (!booking.length) {
    return res.status(404).json({ message: "Invalid Ticket ❌" });
  }

  if (booking[0].isUsed) {
    return res.status(400).json({ message: "Already Used ⚠️" });
  }

  await pool.query(
    "UPDATE bookings SET isUsed=1 WHERE id=?",
    [bookingIdInt]
  );

  res.json({ message: "Entry Allowed ✅" });
};

module.exports = verifyTicket