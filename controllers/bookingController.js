const {pool}=require("../config/dbConnection")
const {AppError}=require("../errorHandler/appError") 
const {asyncHandler}=require("../errorHandler/asyncHandler")

const getCurrTime=()=>{
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
}


const bookTickets=asyncHandler(async(req,res,next)=>{
    const {showId,seatIds}=req.body
    if(!showId || !seatIds)
        throw new AppError(400,"Fields cannot be empty")
    if(!Array.isArray(seatIds))
        throw new AppError(400,"Invalid input format")
    const connection=await pool.getConnection()
    try{
        await connection.beginTransaction()
        const currTime=getCurrTime();
        const [available]=await connection.query(`select seatId from showSeats where seatId in (${seatIds}) and (status=? or (status=? and expiresAt<?)) and showId=?`,["available","pending",currTime,showId])
        console.log(available)
        if(available.length!=seatIds.length)
            throw new AppError(404,"some selected seats are not available")
        
        const updatedRows=await connection.query(`update showSeats set status=?,expiresAt=DATE_ADD(?,INTERVAL 5 MINUTE) where seatId in (${seatIds})`,["pending",currTime])
        if(updatedRows.affectedRows!=seatIds.affectedRows)
            throw new AppError(500,"Something went wromg")
        const [totalPrice]=await connection.query(
            `select sum(showPrice.price) as price from  showSeats inner join  seats on showSeats.seatId=seats.id 
             inner join showPrice on showSeats.showId=showPrice.showId and seats.type=showPrice.seatType
             where showSeats.id in (${seatIds})`)
        const total=totalPrice[0].price;
        console.log(req.user)
        const booking=await connection.query("insert into bookings (userId,showId,totalAmount) values (?,?,?)",[req.user.id,showId,total])
        console.log(booking)
        const data=[]
        for(seat of seatIds){
            data.push([booking[0].insertId,seat,showId])
        }
        await connection.query(`insert into bookingSeat (bookingId,seatId,showId) values ?`,[data])
        await connection.commit()
        return res.status(201).json({message:"Movie booked successfully"})
    }
    catch(err){
        await connection.rollback()
        next(err)
    }
    finally{
        await connection.release()
    }
})

module.exports={bookTickets}