const {register, login, registerUser, registerAdmin, verifytoken, logout}=require("../controllers/authController")
const express=require("express")
const {validateRegister}=require("../validator/validate")
const ratelimit=require("express-rate-limit")
const {validateMiddleware}=require("../middleware/validateMiddleware")
const router=express.Router()
const limitter=ratelimit(
    {
        windowMs:1*60*1000,
        limit:20
    }
)
router.use(limitter)
router.post("/register/user",validateRegister,validateMiddleware,registerUser)
router.post("/register/admin",validateRegister,validateMiddleware,registerAdmin)
router.post("/login",login)
router.get("/verify",verifytoken)
router.post("/logout",logout)

module.exports=router
