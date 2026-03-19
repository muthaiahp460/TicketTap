const express=require("express")
const {addScreen,getScreen,getScreenById}=require("../controllers/screenController");
const { validateCreateScreen } = require("../validator/validate");
const { validateMiddleware } = require("../middleware/validateMiddleware");
const {protect, isAdmin}=require("../middleware/authMiddleware")
const router=express.Router();

router.post("/",protect,isAdmin,validateCreateScreen,validateMiddleware,addScreen)
router.get("/",protect,isAdmin,getScreen) //by theater id
router.get("/:id",protect,getScreenById)
module.exports=router