const express=require('express')
const router=express.Router()
const {protect,isAdmin}=require("../middleware/authMiddleware")
const {TheatermovieRevenue, getTheaterAnalytics}=require("../controllers/analysisController")
const { route } = require('./bookingRouter')

router.get("/theater",protect,isAdmin,getTheaterAnalytics)
router.get("/theater/:id/movie",protect,isAdmin,TheatermovieRevenue)

module.exports=router