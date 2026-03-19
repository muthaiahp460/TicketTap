const express=require('express')
const router=express.Router()
const {bookTickets, payment}=require("../controllers/bookingController")
const {protect}=require("../middleware/authMiddleware")

router.post("/",protect,bookTickets)
router.post("/payment",payment)

module.exports=router