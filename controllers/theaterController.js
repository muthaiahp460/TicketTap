const {asyncHandler}=require("../errorHandler/asyncHandler")
const {pool}=require("../config/dbConnection")
const { AppError } = require("../errorHandler/appError");
const { validationResult } = require("express-validator");

const addTheater=asyncHandler(async(req,res)=>{
    const {name,location}=req.body;
    
    const [existing]=await pool.query("select name from theaters where name=? and location=?",[name,location]);
    if(existing.length>0)
        throw new AppError(409,`Theater with name ${name} already exist`)
    const [result]=await pool.query("insert into theaters (name,location) values(?,?)",[name,location])
    if(result.affectedRows==0)
        throw new AppError(500,`cannot able to add theater ${name}`)
    return res.status(201).json({message:"success",id:result.insertId})
})

const search=asyncHandler(async(req,res)=>{
    const [theaters]=await pool.query("select * from theaters")
    return res.status(200).json({message:"success",data:theaters})
})

const searchByLocation=asyncHandler(async(req,res)=>{
    const location=req.params.location;
    const [theaters]=await pool.query("select * from theaters where location like ?",[`${location}%`])
    return res.status(200).json({message:"success",data:theaters})
})

const searchByName=asyncHandler(async(req,res)=>{
    const name=req.params.name;
    if(!(typeof(name)==String))
        throw new AppError(400,"Name should be a string")
    const [theaters]=await pool.query("select * from theaters where name=?",[name])
    return res.status(200).json({message:"success",data:theaters})
})


module.exports={addTheater,search,searchByLocation,searchByName}