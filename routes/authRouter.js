const {register, login}=require("../controllers/authController")
const express=require("express")
const {validateRegister}=require("../validator/validate")
const ratelimit=require("express-rate-limit")
const {validateMiddleware}=require("../middleware/validateMiddleware")
const router=express.Router()
const limitter=ratelimit(
    {
        windowMs:1*60*1000,
        limit:2
    }
)
router.use(limitter)
router.post("/register",validateRegister,validateMiddleware,register)
router.post("/login",login)

module.exports=router
