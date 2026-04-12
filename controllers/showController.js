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
    return res.status(201).json({message:"show added successfully",showId:result.insertId})
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

const getShowByScreenId=asyncHandler(async(req,res)=>{
    const ScreenId=req.params.screenId
    const [shows]=await pool.query("select * from shows where screenId=?",[ScreenId])
    return res.status(200).json({message:"success",data:shows})
})

const getShowByTheaterId=asyncHandler(async(req,res)=>{
    const theaterId=req.query.theaterId
    const [shows]=await pool.query("select shows.id as id,shows.movieId,shows.screenId,shows.startTime,shows.endTime,screens.theaterId,screens.totalSeats,screens.screenNo,screens.rows,screens.cols from shows inner join screens on shows.screenId=screens.id where screens.theaterId=? order by screenId",[theaterId])
    return res.status(200).json({message:"success",data:shows})
})

const getSeatsByShowId=asyncHandler(async(req,res,next)=>{ //see ticket price for a show
    const showId=req.params.id

    if (!showId)
        throw new AppError(400, "Show Id cannot be empty")

    const [availableSeats] = await pool.query(
        `SELECT 
            showSeats.id,
            showSeats.seatId,
            seats.rowNo,
            seats.seatNo,
            CONCAT(seats.rowNo, seats.seatNo) AS seatLabel,
            seats.type,
            showPrice.price,
            showSeats.status
        FROM showSeats 
        INNER JOIN seats 
            ON showSeats.seatId = seats.id 
        LEFT JOIN showPrice 
            ON showSeats.showId = showPrice.showId 
            AND seats.type = showPrice.seatType
        WHERE showSeats.showId = ?
        ORDER BY showSeats.id`,
        [showId]
    )

    const map = new Map()
    let currentRow = null

    for (let seat of availableSeats) {

        // 🔥 GAP (NULL seat)
        if (!seat.rowNo || !seat.seatNo) {
            if (currentRow) {
                map.get(currentRow).push(null)
            }
            continue
        }

        // 🔥 New row detected
        if (seat.rowNo !== currentRow) {
            currentRow = seat.rowNo
            map.set(currentRow, [])
        }

        map.get(currentRow).push({
            id: seat.id,
            seatId: seat.seatId,
            rowNo: seat.rowNo,
            seatNO: seat.seatNo,
            seatLabel: seat.seatLabel,
            type: seat.type,
            price: seat.price,
            status: seat.status
        })
    }

    return res.status(200).json({
        message: "success",
        data: Array.from(map)
    })
})

const calculatePrice=asyncHandler(async(req,res)=>{
    const {seatIds,showId}=req.body
    if(seatIds.length<=0)
        return res.status(200).json({})
    const [totalPrice]=await pool.query(
            `select sum(showPrice.price) as price from  showSeats inner join  seats on showSeats.seatId=seats.id 
             inner join showPrice on showSeats.showId=showPrice.showId and seats.type=showPrice.seatType
             where showSeats.seatId in (?) and showSeats.showId=?`,[seatIds,showId])
    return res.status(200).json({price:totalPrice[0].price})
})


module.exports={addShow,getShowById,getShowByTheaterId,getSeatsByShowId,calculatePrice,getShowByScreenId}