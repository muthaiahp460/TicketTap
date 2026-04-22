const express=require('express')
const router=express.Router()
const {bookTickets, payment, orders, ordersbyId, verifyPayment, createOrder}=require("../controllers/bookingController")
const {protect}=require("../middleware/authMiddleware")

router.post("/",protect,bookTickets)
router.post("/payment",protect,payment)
router.get("/orders",protect,orders)
router.get("/order",protect,ordersbyId)
router.post("/create-order", protect, createOrder)
router.post("/verify-payment", protect, verifyPayment)
module.exports=router