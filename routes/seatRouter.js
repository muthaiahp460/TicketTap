const express=require("express")
const {addSeat, getSeats,deleteSeats}=require("../controllers/seatController")
const router=express.Router();

router.post("/",addSeat)
router.get("/",getSeats)
router.delete("/",deleteSeats)

module.exports=router