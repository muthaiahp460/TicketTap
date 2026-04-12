const express=require("express")
const {addShow,getShowById,getShowByTheaterId, getSeatsByShowId, calculatePrice, getShowByScreenId}=require("../controllers/showController");
const { protect,isAdmin} = require("../middleware/authMiddleware");
const { route } = require("./seatRouter");
const router=express.Router();

router.post("/",protect,isAdmin,addShow)
router.get("/:id",getShowById)
router.get("/",getShowByTheaterId)
router.get("/:id/seats",getSeatsByShowId)
router.post("/:id/seats/price",calculatePrice)
router.post("/shows/:screenId",getShowByScreenId)

module.exports=router