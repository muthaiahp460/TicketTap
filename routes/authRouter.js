const {register, login}=require("../controllers/authController")
const express=require("express")
const {validateRegister}=require("../validator/validate")
const {validateMiddleware}=require("../middleware/validateMiddleware")
const router=express.Router()


router.post("/register",validateRegister,validateMiddleware,register)
router.post("/login",login)

module.exports=router
