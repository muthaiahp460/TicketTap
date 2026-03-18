const {asyncHandler}=require("../errorHandler/asyncHandler")
const {pool}=require("../config/dbConnection")
const { AppError } = require("../errorHandler/appError")

const addScreen=asyncHandler(async(req,res)=>{
    const {theaterId,seats,screenNo}=req.body;
    
    const [exisitngScreen]=await pool.query("select * from screens where theaterId=? and screenNo=?",[theaterId,screenNo])
    if(exisitngScreen.length>0)
        throw new AppError(400,`screen ${screenNo} already exist`)
    const [result]=await pool.query("insert into screens(theaterId,totalSeats,screenNo) values (?,?,?)",[theaterId,seats,screenNo])
    if(result.affectedRows===0)
        throw new AppError(500,"cannot able to add screen")
    return res.status(201).json({message:"screen created successfully"})
})

const getScreen=asyncHandler(async(req,res)=>{ //update it with jwt payload later 
    const theaterId=req.query.theaterId
    if(!theaterId)
        throw new AppError(400,"Theater ID is required")
    const [screens]=await pool.query("select id,screenNo from screens where theaterId=?",[theaterId])
    return res.status(200).json({message:"success",data:screens})
})

const getScreenById=asyncHandler(async(req,res)=>{
    const screenId=req.params.id
    const [screens]=await pool.query("select  screens.id,screens.screenNo,movies.name,movies.language from screens inner join movies inner join shows on shows.screenId=screens.id and shows.movieId=movies.id where screens.id=?",[screenId])
    if(screens.length==0)
        throw new AppError(404,"no movies scheduled in this screen")  
    return res.status(200).json({message:"success",data:screens[0]})
})

module.exports={addScreen,getScreen,getScreenById}