const express=require("express")
const {addSeat, getSeats,deleteSeats, setSeatPrices}=require("../controllers/seatController")
const router=express.Router();

router.post("/",addSeat)
router.get("/",getSeats)
router.delete("/",deleteSeats)
router.post("/price",setSeatPrices)

module.exports=router