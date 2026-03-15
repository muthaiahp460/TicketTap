const express=require('express')
const router=express.Router()
const {addTheater,search,searchByLocation,searchByName}=require("../controllers/theaterController")

router.post("/",addTheater)
router.get("/",search)
router.get("/location/:location",searchByLocation)
router.get("/name/:name",searchByName)

module.exports=router