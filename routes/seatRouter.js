const express=require("express")
const {addSeat, getSeats,deleteSeats, setSeatPrices}=require("../controllers/seatController")
const {validateCreateSeat}=require("../validator/validate")
const {validateMiddleware}=require("../Middleware/validateMiddleware")
const {protect, isAdmin}=require("../middleware/authMiddleware")
const router=express.Router();

router.post("/",protect,isAdmin,validateCreateSeat,validateMiddleware,addSeat)
router.get("/",getSeats)
router.delete("/",protect,isAdmin,deleteSeats)
router.post("/price",protect,isAdmin,setSeatPrices)

module.exports=router