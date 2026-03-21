const {pool}=require("../config/dbConnection")
const {AppError}=require("../errorHandler/appError") 
const {asyncHandler}=require("../errorHandler/asyncHandler")

const theaterRevenue=asyncHandler(async(req,res)=>{
    const theaterId=req.params.id
    const [owner]=await pool.query("select userId from theaters where id=?",[theaterId])
    if(owner[0].userId!==req.user.id)
        throw new AppError(401,"Entry restricted")
    const startTime=req.query.start,endTime=req.query.end
    if(startTime==null || endTime==null){
        const [result]=await pool.query("select sum(totalAmount) as revenue from bookings where theaterId=?",[theaterId])
        return res.status(200).json({message:"success",revenue:result[0].revenue})
    }
    else{
        const [result]=await pool.query(
            `select sum(totalAmount) as revenue from bookings 
            where theaterId=? and bookingDate between ? and ?`,[theaterId,startTime,endTime]
        )
        return res.status(200).json({message:"success",revenue:result[0].revenue})
    }
})

const TheatermovieRevenue=asyncHandler(async(req,res)=>{
    const theaterId=req.params.id
    const movieId=req.query.movieId
    const [owner]=await pool.query("select userId from theaters where id=?",[theaterId])
    if(owner[0].userId!==req.user.id)
        throw new AppError(401,"Entry restricted")
    const [result]=await pool.query(
        `select coalesce(sum(totalAmount),0) as revenue from bookings 
         inner join shows on bookings.showId=shows.id
         where bookings.theaterId=? and shows.movieId=?`,[theaterId,movieId])

    return res.status(200).json({message:"success",data:result})
})

module.exports={theaterRevenue,TheatermovieRevenue}