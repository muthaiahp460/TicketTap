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
        const booking=await connection.query("insert into bookings (userId,showId,totalAmount,status) values (?,?,?,?)",[req.user.id,showId,total,"pending"])
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

const payment=asyncHandler(async(req,res,next)=>{
    const {bookingId}=req.body
    const connection=await pool.getConnection()
    try{
        await connection.beginTransaction()
        const currTime=getCurrTime();
        const [show]=await connection.query("select showId from bookings where id=?",[bookingId])
        const showId=show[0].showId
        const [bookedSeats]=await pool.query("select showSeats.seatId from bookingSeat inner join showSeats on bookingSeat.seatId=showSeats.seatId and bookingSeat.showId=showSeats.showId where bookingSeat.bookingId=?",bookingId)
        
        const seatsBooked=[]
        for(seat of bookedSeats)
            seatsBooked.push(seat.seatId)

        const seatId=bookedSeats[0].seatId
        const [lockedSeats]=await pool.query(`select id from showSeats where seatId=? and status=? and expiresAt<? and showId=?`,[seatId,"pending",currTime,showId])

        if(lockedSeats.length==0)
            throw new AppError(410,"Seat released payment will be refunded within 2-3 working days")

        await pool.query(`update showSeats set status=? where seatId in (${seatsBooked})`,["booked"])
        await pool.query("update bookings set status=? where id=?",["completed",bookingId])
        await connection.commit()

        return res.status(200).json({message:"booking sucessful"})
    }
    catch(err){
        await connection.rollback()
        next(err)
    }
    finally{
        await connection.release()
    }

})

module.exports={bookTickets,payment}