const {pool}=require("../config/dbConnection")
const { asyncHandler } = require("../errorHandler/asyncHandler")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const {AppError}=require("../errorHandler/appError")
require('dotenv').config()

const register=asyncHandler(async(req,res)=>{
    const {name,email,phoneNo,password,role}=req.body
    if(!(role==="user" || role=="admin"))
        throw new AppError(400,"Invalid user role")
    const [existingUser]=await pool.query("select email from users where email=?",[email])
    if(existingUser.length>0)
        throw new AppError(409,`User with the email ${email} already registered`)
    const hashedPassword=await bcrypt.hash(password,10)
    const [result]=await pool.query("insert into users (name,email,password,phoneNo,role) values (?,?,?,?,?)",[name,email,hashedPassword,phoneNo,role])
    const token=jwt.sign({"id":result.insertId,"role":role},process.env.JWT_SECRET_KEY,{expiresIn:'1d'})
    res.cookie("token",token,{
            httponly:true,
            samesite:'strict'
        }
    )
    return res.status(201).json({message:"User created successfully"})
})

const registerAdmin=asyncHandler(async(req,res)=>{
    const {name,email,phoneNo,password}=req.body

    const [existingUser]=await pool.query("select * from AdminRequest where email=?",[email])
    const user=existingUser[0]
    const requestCount=(existingUser.length>0)?user.requestCount:0
    if(requestCount>=3)
        throw new AppError(429,`Request limit exceeded cant request again`)

    if(user>0 && user.status=="accepted")
        throw new AppError(400,`YOu are already an admin`)

    if(user>0 && user.status=="pending")
        throw new AppError(400,`You have a pending admin request`)

    const hashedPassword=await bcrypt.hash(password,10)
    if(requestCount==0){
        const [result]=await pool.query("insert into AdminRequest (name,email,password,phoneNo,status,requestCount) values (?,?,?,?,?,?)",[name,email,hashedPassword,phoneNo,"pending",requestCount+1])
    }
    else{
        const [result]=await pool.query("update AdminRequest set name=?,password=?,phoneNo=?,status=?,requestCount=? where email=?",[name,hashedPassword,phoneNo,"pending",requestCount+1,email])
    }

    return res.status(201).json({message:"Admin request sent,validation takes 2-3 working days"})
})

const login=asyncHandler(async(req,res)=>{
    const {email,password}=req.body
    if(!email || !password)
        throw new AppError("Email and password should not be empty")
    const [existingUser]=await pool.query("select id,role,password from users where email=?",[email])
    if(existingUser.length==0)
        throw new AppError(404,`user with email ${email} doesnt exist`)
    const user=existingUser[0]

    const result=await bcrypt.compare(password,user.password)
    if(!result)
        throw new AppError(400,"Invalid password")
    const token=jwt.sign({"id":user.id,"role":user.role},process.env.JWT_SECRET_KEY,{expiresIn:'1d'})
    res.cookie("token",token,{
            httponly:true,
            samesite:'strict'
        }
    )
    return res.status(200).json({message:"Login successful"})
})

module.exports={register,registerAdmin,login}