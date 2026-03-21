const express=require('express')
const router=express.Router()
const {protect,isAdmin}=require("../middleware/authMiddleware")
const {theaterRevenue, TheatermovieRevenue}=require("../controllers/analysisController")
const { route } = require('./bookingRouter')

router.get("/theater/:id",protect,isAdmin,theaterRevenue)
router.get("/theater/:id/movie",protect,isAdmin,TheatermovieRevenue)

module.exports=router