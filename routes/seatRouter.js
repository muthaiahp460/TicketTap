const express=require("express")
const {addSeat, getSeats,deleteSeats, setSeatPrices}=require("../controllers/seatController")
const {validateCreateSeat}=require("../validator/validate")
const {validateMiddleware}=require("../Middleware/validateMiddleware")
const router=express.Router();

router.post("/",validateCreateSeat,validateMiddleware,addSeat)
router.get("/",getSeats)
router.delete("/",deleteSeats)
router.post("/price",setSeatPrices)

module.exports=router