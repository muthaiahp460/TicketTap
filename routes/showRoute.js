const express=require("express")
const {addShow,getShowById,getShowByTheaterId, getSeatsByShowId}=require("../controllers/showController");
const { protect,isAdmin} = require("../middleware/authMiddleware");
const router=express.Router();

router.post("/",protect,isAdmin,addShow)
router.get("/:id",getShowById)
router.get("/",getShowByTheaterId)
router.get("/:id/seats",getSeatsByShowId)

module.exports=router