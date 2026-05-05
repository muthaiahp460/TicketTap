const express=require('express')
const router=express.Router()
const rateLimit = require('express-rate-limit');
const {bookTickets, payment, orders, ordersbyId, verifyPayment, createOrder}=require("../controllers/bookingController")
const {protect}=require("../middleware/authMiddleware")
const verifyTicket = require('../controllers/verifyTicket')

// Rate limiter for payment endpoints (per authenticated user)
const paymentLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 10,
    keyGenerator: (req) => req.user.id.toString(),
    message: "Too many payment requests, try again later"
});

router.post("/",protect,bookTickets)
router.post("/payment",protect,paymentLimiter,payment)
router.get("/orders",protect,orders)
router.get("/order",protect,ordersbyId)
router.post("/create-order", protect, paymentLimiter, createOrder)
router.post("/verify-payment", protect, paymentLimiter, verifyPayment)
router.post("/verify", protect, verifyTicket);
module.exports=router