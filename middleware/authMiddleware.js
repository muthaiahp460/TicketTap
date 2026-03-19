const { AppError } = require("../errorHandler/appError");
const jwt=require("jsonwebtoken");
const { asyncHandler } = require("../errorHandler/asyncHandler");
const protect=asyncHandler(async (req, res, next) => {
    const token=req.cookies.token
    if(!token)
        throw new AppError(401,"unauthorized user")
    const data=jwt.verify(token,process.env.JWT_SECRET_KEY)
    req.user=data
    next();
})

const isAdmin=asyncHandler(async(req,res,next)=>{
    if(req.user.role!=="admin")
        throw new AppError(401,"Acess restricted,Admin only")
    next()
})

module.exports={protect,isAdmin}