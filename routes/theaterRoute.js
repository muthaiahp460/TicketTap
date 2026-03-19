const express=require('express')
const router=express.Router()
const {addTheater,search,searchByLocation,searchByName}=require("../controllers/theaterController")
const {validateMiddleware}=require("../middleware/validateMiddleware")
const {protect, isAdmin}=require("../middleware/authMiddleware")
const {validateCreateTheater}=require("../validator/validate")

router.post("/",protect,isAdmin,validateCreateTheater,validateMiddleware,addTheater)
router.get("/",search)
router.get("/location/:location",searchByLocation)
router.get("/name/:name",searchByName)

module.exports=router