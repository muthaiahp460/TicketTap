const {asyncHandler}=require("../errorHandler/asyncHandler")
const {pool}=require("../config/dbConnection")
const { AppError } = require("../errorHandler/appError")

const addScreen=asyncHandler(async(req,res)=>{
    const {theaterId,screenNo,rows,cols}=req.body;
    console.log("dsfsdfsdfsd")
    console.log(theaterId)
    const [exisitingScreen]=await pool.query("select * from screens where theaterId=? and screenNo=?",[theaterId,screenNo])
    if(exisitingScreen.length>0)
        throw new AppError(400,`screen ${screenNo} already exist`)
    const [result]=await pool.query("insert into screens(theaterId,screenNo,rows,cols) values (?,?,?,?)",[theaterId,screenNo,rows,cols])
    if(result.affectedRows===0)
        throw new AppError(500,"cannot able to add screen")
    return res.status(201).json({message:"screen created successfully",screenId:result.insertId})
})

const getScreen=asyncHandler(async(req,res)=>{ 
    console.log("muthu")
    const theaterId=req.query.theaterId
    console.log(req.query.theaterId)
    const [owner]=await pool.query("select userId from theaters where id=?",[theaterId])
    if(owner[0].userId!=req.user.id)
        throw new AppError(401,"Acess restricted")
    if(!theaterId)
        throw new AppError(400,"Theater ID is required")
    const [screens]=await pool.query("select id,screenNo,rows,cols from screens where theaterId=?",[theaterId])
    return res.status(200).json({message:"success",data:screens})
})

const getScreenById=asyncHandler(async(req,res)=>{
    const screenId=req.params.id
    const [screens]=await pool.query("select  screens.id,screens.screenNo,movies.name,movies.language from screens inner join movies inner join shows on shows.screenId=screens.id and shows.movieId=movies.id where screens.id=?",[screenId])
    if(screens.length==0)
        throw new AppError(404,"no movies scheduled in this screen")  
    return res.status(200).json({message:"success",data:screens[0]})
})


const getScreenId=asyncHandler(async(req,res)=>{
    const screenId=req.params.screenId
    const [screens]=await pool.query("select id from screens where screenId=?",[screenId])
    return res.status(200).json({message:"success",data:screens[0]})
})

module.exports={addScreen,getScreen,getScreenById,getScreenId}