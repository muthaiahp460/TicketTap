const {asyncHandler}=require("../errorHandler/asyncHandler")
const {pool}=require("../config/dbConnection");
const { AppError } = require("../errorHandler/appError");

const addShow=asyncHandler(async(req,res,next)=>{ //later get the screenId with the help of theaterId stored in the jwt
    const connection=await pool.getConnection()
    try{
    await connection.beginTransaction()
    const {movieId,screenId,startTime,endTime,showDate}=req.body;
    
    const [existingShow]=await connection.query("select * from shows where screenId=? and showDate=? and ?<=endTime",[screenId,showDate,startTime])
    if(existingShow.length>0)
        throw new AppError(409,"a show is already scheduled in that time")
    const [existingSeat]=await connection.query("select id from seats where screenId=?",[screenId])
    if(existingSeat.length==0)
        throw new AppError(404,"cannot schedule a show no seating arrangement found for the screen")
    const [result]=await connection.query("insert into shows (movieId,screenId,startTime,endTime,showDate) values(?,?,?,?,?)",[movieId,screenId,startTime,endTime,showDate])
    const [seats]=await connection.query("select id from seats where screenId=?",[screenId])
    const data=[]
    const showId=result.insertId
    for(let seat of seats){
        data.push([seat.id,showId,"available"])
    }

    await connection.query("insert into showSeats (seatId,showId,status) values ?",[data])

    if(result.affectedRows===0)
        throw new AppError(500,"cannot able to add show")
    await connection.commit()
    return res.status(201).json({message:"show added successfully"})
    }
    catch(err){
        await connection.rollback();
        next(err)
    }
    finally{
        await connection.release()
    }

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

const getSeatsByShowId=asyncHandler(async(req,res,next)=>{ //see ticket price for a show
    const showId=req.params.id
    const [availableSeats]=await pool.query(
        `select showSeats.id,seats.rowNo,seats.seatNO,concat(seats.rowNo,seats.seatNO) as seatLabel,seats.type,showPrice.price,showSeats.status from 
         showSeats inner join  seats on showSeats.seatId=seats.id 
         inner join showPrice on showSeats.showId=showPrice.showId and seats.type=showPrice.seatType
         where showSeats.showId=? and showSeats.status=?`,[showId,"available"])

    return res.status(200).json({message:"success",data:availableSeats})
})


module.exports={addShow,getShowById,getShowByTheaterId,getSeatsByShowId}