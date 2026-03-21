const express=require("express")
const {getSeats,deleteSeats, setSeatPrices}=require("../controllers/seatController")
const {protect, isAdmin}=require("../middleware/authMiddleware")
const router=express.Router();

router.get("/",getSeats)
router.delete("/",protect,isAdmin,deleteSeats)
router.post("/price",protect,isAdmin,setSeatPrices)

module.exports=router