const express=require("express")
const {addScreen,getScreen,getScreenById}=require("../controllers/screenController");
const { validateCreateScreen } = require("../validator/validate");
const { validateMiddleware } = require("../middleware/validateMiddleware");
const router=express.Router();

router.post("/",validateCreateScreen,validateMiddleware,addScreen)
router.get("/",getScreen) //by theater id
router.get("/:id",getScreenById)
module.exports=router