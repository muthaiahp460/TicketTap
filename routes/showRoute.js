const express=require("express")
const {addShow,getShowById,getShowByTheaterId}=require("../controllers/showController")
const router=express.Router();

router.post("/",addShow)
router.get("/:id",getShowById)
router.get("/",getShowByTheaterId)


module.exports=router