const express=require('express')
const router=express.Router()
const {bookTickets}=require("../controllers/bookingController")
const {protect}=require("../middleware/authMiddleware")

router.post("/",protect,bookTickets)

module.exports=router