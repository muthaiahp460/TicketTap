const {asyncHandler}=require("../errorHandler/asyncHandler")
const {pool}=require("../config/dbConnection");
const { AppError } = require("../errorHandler/appError");

const addShow=asyncHandler(async(req,res)=>{ //later get the screenId with the help of theaterId stored in the jwt
    const {movieId,screenId,startTime,endTime,showDate}=req.body;
    
    const [existingShow]=await pool.query("select * from shows where screenId=? and showDate=? and ?<=endTime",[screenId,showDate,startTime])
    if(existingShow.length>0)
        throw new AppError(409,"a show is already scheduled in that time")
    const [result]=await pool.query("insert into shows (movieId,screenId,startTime,endTime,showDate) values(?,?,?,?,?)",[movieId,screenId,startTime,endTime,showDate])
    if(result.affectedRows===0)
        throw new AppError(500,"cannot able to add show")
    return res.status(201).json({message:"show added successfully"})
})

const getShowById=asyncHandler(async(req,res)=>{
    const showId=req.params.id
    const [shows]=await pool.query("select * from shows where id=?",showId)
    return res.status(200).json({message:"success",data:shows})
})

const getShowByTheaterId=asyncHandler(async(req,res)=>{
    const theaterId=req.query.theaterId
    const [shows]=await pool.query("select * from shows inner join screens on shows.screenId=screens.id where screens.theaterId=?",[theaterId])
    return res.status(200).json({message:"success",data:shows})
})

module.exports={addShow,getShowById,getShowByTheaterId}