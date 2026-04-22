const Razorpay = require("razorpay")
require("dotenv").config()
console.log("KEY_ID:", process.env.KEY_ID)   // 🔥 ADD THIS
console.log("KEY_SECRET:", process.env.KEY_SECRET)

const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
})

module.exports = razorpay