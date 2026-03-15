const express=require("express")
const {addScreen,getScreen,getScreenById}=require("../controllers/screenController")
const router=express.Router();

router.post("/",addScreen)
router.get("/",getScreen) //by theater id
router.get("/:id",getScreenById)
module.exports=router