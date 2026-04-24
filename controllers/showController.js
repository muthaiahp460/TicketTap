const {asyncHandler}=require("../errorHandler/asyncHandler")
const {pool}=require("../config/dbConnection");
const { AppError } = require("../errorHandler/appError");

const addShow = asyncHandler(async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { movieId, screenId, startTime, endTime, showDate } = req.body;

    if (!movieId || !screenId || !startTime || !endTime || !showDate) {
      throw new AppError(400, "All fields are required");
    }

    if (startTime >= endTime) {
      throw new AppError(400, "Invalid time range");
    }

    const [existingShow] = await connection.query(
      `SELECT id FROM shows 
       WHERE screenId = ? 
       AND showDate = ? 
       AND startTime < ? 
       AND endTime > ?`,
      [screenId, showDate, endTime, startTime]
    );

    if (existingShow.length > 0) {
      throw new AppError(409, "A show is already scheduled in that time");
    }

    const [existingSeat] = await connection.query(
      "SELECT id FROM seats WHERE screenId = ?",
      [screenId]
    );

    if (existingSeat.length === 0) {
      throw new AppError(
        404,
        "Cannot schedule a show: no seating arrangement found"
      );
    }

    const istDateTime = `${showDate}T${startTime}+05:30`;

    const utcDateTime = new Date(istDateTime)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const [result] = await connection.query(
      `INSERT INTO shows (movieId, screenId, startTime, endTime, showDate,showTiming) 
       VALUES (?, ?, ?, ?, ?,?)`,
      [movieId, screenId, startTime, endTime, showDate,utcDateTime]
    );

    if (result.affectedRows === 0) {
      throw new AppError(500, "Unable to add show");
    }

    const showId = result.insertId;

    const seats = existingSeat;

    const data = seats.map((seat) => [seat.id, showId, "available"]);

    await connection.query(
      "INSERT INTO showSeats (seatId, showId, status) VALUES ?",
      [data]
    );
    await connection.commit();

    return res.status(201).json({
      message: "Show added successfully",
      showId,
    });

  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

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
    const [shows]=await pool.query(
                `select screens.id as id,shows.id as showId,shows.movieId,shows.screenId,shows.startTime,shows.endTime,shows.showDate,
                screens.theaterId,screens.totalSeats,screens.screenNo,screens.rows,screens.cols,
                movies.name
                from screens  
                left join shows
                on shows.screenId=screens.id 
                left join movies 
                on shows.movieId=movies.id
                where screens.theaterId=? and (shows.showDate>curdate() or shows.showDate is null )  order by screenId desc`,[theaterId])
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
            showSeats.status,
            DATE_FORMAT(showSeats.expiresAt, '%Y-%m-%dT%H:%i:%sZ') AS expiresAt
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
            status: seat.status,
            expiresAt: seat.expiresAt
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