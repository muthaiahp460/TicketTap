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
        const [screen]=await pool.query("select screenId from shows where id=?",showId)
        if(!screen[0])
            throw new AppError(404,`show ${showId} not found`)
        const screenId=screen[0].screenId
        console.log(screenId)
        const [theater]=await pool.query("select theaterId from screens where id=?",[screenId])
        const theaterId=theater[0].theaterId
        console.log(theaterId)
        await connection.beginTransaction()
        const currTime=getCurrTime();
        
        const updatedRows=await connection.query(`update showSeats set status=?,expiresAt=DATE_ADD(?,INTERVAL 5 MINUTE) where showId=? and seatId in (?) and (status=? or (status=? and expiresAt<?))`,["pending",currTime,showId,seatIds,"available","pending",currTime])
        console.log(updatedRows[0].affectedRows)
        if(updatedRows[0].affectedRows!=seatIds.length)
            throw new AppError(404,"some selected seats are not available")

        const [totalPrice]=await connection.query(
            `select sum(showPrice.price) as price from  showSeats inner join  seats on showSeats.seatId=seats.id 
             inner join showPrice on showSeats.showId=showPrice.showId and seats.type=showPrice.seatType
             where showSeats.seatId in (?) and showSeats.showId=?`,[seatIds,showId])
        console.log(totalPrice)
             const total=totalPrice[0].price;
        if(!total)
            throw new AppError(500,"Something went wrong")
        const [booking]=await connection.query("insert into bookings (userId,showId,totalAmount,status,theaterId,bookingDate,ticketCount) values (?,?,?,?,?,?,?)",[req.user.id,showId,total,"pending",theaterId,currTime,seatIds.length])
        console.log(booking)
        const data=[]
        for(let seat of seatIds){
            data.push([booking.insertId,seat,showId])
        }
        await connection.query(`insert into bookingSeat (bookingId,seatId,showId) values ?`,[data])
        await connection.commit()
        return res.status(201).json({message:"Movie booked inititated",bookingDetails:{id:booking.insertId,price:total}})
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
        const [bookedSeats]=await connection.query("select showSeats.seatId from bookingSeat inner join showSeats on bookingSeat.seatId=showSeats.seatId and bookingSeat.showId=showSeats.showId where bookingSeat.bookingId=?",[bookingId])
        
        const seatsBooked=[]
        for(seat of bookedSeats)
            seatsBooked.push(seat.seatId)

        const seatId=bookedSeats[0].seatId
        const [lockedSeats]=await connection.query(`select id from showSeats where seatId=? and status=? and expiresAt>? and showId=?`,[seatId,"pending",currTime,showId])

        if(lockedSeats.length==0){
            await connection.query("insert into refund (bookingId) values (?)",[bookingId])
            await connection.commit()
            throw new AppError(410,"Seat released payment will be refunded within 2-3 working days")
        }

        await connection.query(`update showSeats set status=? where seatId in (?) and showId=?`,["booked",seatsBooked,showId])
        await connection.query("update bookings set status=? where id=?",["completed",bookingId])
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

const orders=asyncHandler(async(req,res)=>{
    const userId=req.user.id
    const [result]=await pool.query(
        `select bookings.id,theaters.name as theaterName,bookings.status,shows.showDate,movies.name,bookings.totalAmount as price
        from bookings inner join shows inner join movies  inner join theaters on 
        bookings.showId=shows.id and shows.movieId=movies.id and bookings.theaterId=theaters.id
        where bookings.userId=?`,[userId]
    )
    return res.status(200).json({message:"success",data:result})
})

const ordersbyId=asyncHandler(async(req,res)=>{
    const bookingId=req.query.bookingId
    console.log(bookingId)
    const [user]=await pool.query("select userId from bookings where bookings.id=?",[bookingId])
    if(user[0].userId!=req.user.id)
        throw new AppError(401,"Entry restricted")

    const [result] = await pool.query(
        `SELECT 
            bookings.id,
            bookingSeat.seatId,
            theaters.name AS theaterName,
            bookings.status,
            
            shows.showDate,
            movies.name,
            bookings.totalAmount AS price
        FROM bookings
        INNER JOIN shows ON bookings.showId = shows.id
        INNER JOIN movies ON shows.movieId = movies.id
        INNER JOIN theaters ON bookings.theaterId = theaters.id
        INNER JOIN bookingSeat ON bookings.id = bookingSeat.bookingId
        WHERE bookings.id = ?`,
        [bookingId]
    );
    return res.status(200).json({message:"success",data:result})
})

module.exports={bookTickets,payment,orders,ordersbyId}