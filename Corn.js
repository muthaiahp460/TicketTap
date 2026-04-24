const cron = require("node-cron");
const { pool } = require("./config/dbConnection");
const sendEmail = require("./sendEmail");

cron.schedule("* * * * *", async () => {
  console.log("⏰ Checking reminders...");

  try {
      //await pool.query(`UPDATE shows 
  //SET showDate = CURDATE(),
    //  startTime = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 10 MINUTE), '%H:%i:%s')
  //WHERE id = 49`)
    const [bookings] = await pool.query(`
      SELECT 
        b.id AS bookingId,
        movies.name AS movieName,
        u.email,
        t.name AS theatre,
        TIMESTAMP(b.bookingDate, s.startTime) AS showDateTime,
        GROUP_CONCAT(CONCAT(se.rowNo, se.seatNo) 
          ORDER BY se.rowNo, se.seatNo 
          SEPARATOR ', ') AS seats
      FROM bookings b
      JOIN users u ON b.userId = u.id
      JOIN shows s ON b.showId = s.id
      JOIN movies ON movies.id = s.movieId
      JOIN theaters t ON t.id = b.theaterId
      JOIN bookingSeat bs ON bs.bookingId = b.id
      JOIN seats se ON se.id = bs.seatId
      WHERE 
          s.showTiming
          BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 MINUTE)
        AND b.status = 'completed'
        AND b.reminder_sent = false
      GROUP BY 
        b.id, movies.name, u.email, t.name, showDateTime
    `);

    console.log("📦 Bookings found:", bookings.length);

    const [a]=await pool.query(`SELECT 
  s.showDate,
  s.startTime,
  NOW(),
  TIMESTAMP(s.showDate, s.startTime) AS fullTime
FROM shows s`)
//console.log(a)

    for (let booking of bookings) {
      console.log("📩 Processing booking:", booking.bookingId);

      // ✅ Prevent duplicate emails
      await pool.query(
        `UPDATE bookings SET reminder_sent = true WHERE id = ?`,
        [booking.bookingId]
      );

      // ✅ Send email
      await sendEmail(booking.email, booking);

      console.log("✅ Email sent to:", booking.email);
    }

  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});