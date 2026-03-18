const express=require('express')
const router=express.Router()
const {addTheater,search,searchByLocation,searchByName}=require("../controllers/theaterController")
const {validateMiddleware}=require("../middleware/validateMiddleware")
const {validateCreateTheater}=require("../validator/validate")

router.post("/",validateCreateTheater,validateMiddleware,addTheater)
router.get("/",search)
router.get("/location/:location",searchByLocation)
router.get("/name/:name",searchByName)

module.exports=router