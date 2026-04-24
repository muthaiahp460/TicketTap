require("dotenv").config();
const nodemailer = require("nodemailer");

//  Define transporter here
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

//  Email function
const sendEmail = async (to, booking) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "🎬 Movie Reminder",
    html:`<div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
    <div style="max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 10px;">
      
      <h2 style="color: #e50914;">🎬 Movie Reminder</h2>

      <p>Hi there,</p>

      <p>Your movie is starting soon. Here are your booking details:</p>

      <hr/>

      <p><strong>🎥 Movie:</strong> ${booking.movieName || "Your Movie"}</p>
      <p><strong>📅 Date:</strong> ${booking.showDate || "Today"}</p>
      <p><strong>⏰ Time:</strong> ${booking.showTime || booking.showDateTime}</p>
      <p><strong>📍 Theatre:</strong> ${booking.theatre || "Screen 1"}</p>
      <p><strong>💺 Seats:</strong> ${booking.seats || "A1, A2"}</p>

      <hr/>

      <p style="color: #555;">
        Please arrive at least <strong>15 minutes early</strong> to avoid missing the show.
      </p>

      <p>Enjoy your movie! 🍿</p>

      <br/>

      <small style="color: gray;">
        This is an automated reminder from your Movie Booking App.
      </small>

    </div>
  </div>
`
  });
};

//  Export correctly
module.exports = sendEmail;