const {pool}=require("../config/dbConnection")
const { asyncHandler } = require("../errorHandler/asyncHandler")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const {AppError}=require("../errorHandler/appError")
require('dotenv').config()

const supabase=require("../utils/supabase.js");

const googleLogin = async(req,res)=>{

try{

const { token } = req.body;

if(!token)
    return res.status(400).json({message:"Token missing"}); 
const {data:{ user },error}=await supabase.auth.getUser(token);

if(error || !user)
    return res.status(401).json({message:"Invalid user"});

// CHECK USER EXISTS
const [existingUser] =await pool.query("SELECT * FROM users WHERE email=?",[user.email]);

let currentUser;
// IF NEW USER → INSERT
if(existingUser.length===0){
await pool.query(`INSERT INTO users(name,email,google_id,avatar,role) VALUES(?,?,?,?,?)`,[user.user_metadata.full_name,user.email,user.id,user.user_metadata.avatar_url,"user"]);

// FETCH INSERTED USER
const [newUser]=await pool.query(
"SELECT * FROM users WHERE email=?",
[user.email]
);

currentUser=newUser[0];
}
else{
currentUser=existingUser[0];

}

// CREATE JWT
const jwtToken =jwt.sign({"id":currentUser.id,"role":"user"},
process.env.JWT_SECRET_KEY,
{
 expiresIn:"7d"
}
);


// STORE COOKIE
res.cookie(
"token",
jwtToken,
{
 httpOnly:true,
 secure:true,
 sameSite:"None"
}
);
return res.json({success:true,user:currentUser});
}
catch(err){
console.log(err);
return res.status(500).json({message:"Server error"});
}
}
const registerUser=asyncHandler(async(req,res)=>{
    console.log("user")
    const {name,email,phoneNo,password}=req.body
    const role="user"
    const [existingUser]=await pool.query("select email from users where email=?",[email])
    if(existingUser.length>0)
        throw new AppError(409,`User with the email ${email} already registered`)
    const hashedPassword=await bcrypt.hash(password,10)
    const [result]=await pool.query("insert into users (name,email,password,phoneNo,role) values (?,?,?,?,?)",[name,email,hashedPassword,phoneNo,role])
    const token=jwt.sign({"id":result.insertId,"role":role},process.env.JWT_SECRET_KEY,{expiresIn:'1d'})
    res.cookie("token",token,{
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
    )
    return res.status(201).json({message:"User created successfully"})
})

const registerAdmin=asyncHandler(async(req,res)=>{
    const {name,email,phoneNo,password,adminSecret}=req.body
    if(adminSecret!==process.env.ADMIN_SECRET)
        throw new AppError(400,"Invlid admin secret key")
    const role="admin"
    const [existingUser]=await pool.query("select email from users where email=?",[email])
    if(existingUser.length>0)
        throw new AppError(409,`User with the email ${email} already registered`)
    const hashedPassword=await bcrypt.hash(password,10)
    const [result]=await pool.query("insert into users (name,email,password,phoneNo,role) values (?,?,?,?,?)",[name,email,hashedPassword,phoneNo,role])
    const token=jwt.sign({"id":result.insertId,"role":role},process.env.JWT_SECRET_KEY,{expiresIn:'1d'})
    res.cookie("token",token,{
            httpOnly:true,
            sameSite:'None',
            secure:true,
            maxAge:24*60*60*1000
        }
    )
    return res.status(201).json({message:"Admin created successfully"})
})

// const registerAdmin=asyncHandler(async(req,res)=>{
//     const {name,email,phoneNo,password}=req.body

//     const [existingUser]=await pool.query("select * from AdminRequest where email=?",[email])
//     const user=existingUser[0]
//     const requestCount=(existingUser.length>0)?user.requestCount:0
//     if(requestCount>=3)
//         throw new AppError(429,`Request limit exceeded cant request again`)

//     if(user>0 && user.status=="accepted")
//         throw new AppError(400,`YOu are already an admin`)

//     if(user>0 && user.status=="pending")
//         throw new AppError(400,`You have a pending admin request`)

//     const hashedPassword=await bcrypt.hash(password,10)
//     if(requestCount==0){
//         const [result]=await pool.query("insert into AdminRequest (name,email,password,phoneNo,status,requestCount) values (?,?,?,?,?,?)",[name,email,hashedPassword,phoneNo,"pending",requestCount+1])
//     }
//     else{
//         const [result]=await pool.query("update AdminRequest set name=?,password=?,phoneNo=?,status=?,requestCount=? where email=?",[name,hashedPassword,phoneNo,"pending",requestCount+1,email])
//     }

//     return res.status(201).json({message:"Admin request sent,validation takes 2-3 working days"})
// })

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
            httpOnly:true,
            sameSite:'None',
            secure:true
        }
    )
    return res.status(200).json({message:"Login successful"})
})


const verifytoken=(req,res)=>{
    try{
        console.log(req.cookies)
        const token=req.cookies.token
        if(!token)
            return res.json({ user: null });
        const data=jwt.verify(token,process.env.JWT_SECRET_KEY)
        console.log(data)
        return res.json({ user: data });
    }
    catch(err){
        console.log(err)
        throw new AppError(401,"unauthorized user")
    }
}

const logout=(req,res)=>{
    res.clearCookie("token",{
        httpOnly:true,
        secure:true,
        sameSite:"None"
    });

    res.status(200).json({success:true})
}

module.exports={googleLogin,registerAdmin,registerUser,login,verifytoken,logout}