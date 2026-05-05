const {pool}=require("../config/dbConnection")
const {AppError}=require("../errorHandler/appError") 
const {asyncHandler}=require("../errorHandler/asyncHandler")

const getTheaterAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const [theaterRows] = await pool.query(
    "SELECT id FROM theaters WHERE userId = ?",
    [req.user.id]
  );

  const theaterIds = theaterRows.map(t => t.id);

  const [movieCountResult] = await pool.query(
    `SELECT COUNT(DISTINCT movies.id) AS movieCount
     FROM movies
     JOIN shows ON shows.movieId = movies.id
     JOIN screens ON shows.screenId = screens.id
     WHERE screens.theaterId IN (?) and shows.showDate between ? and ?`,
    [theaterIds,startDate,endDate]
  );

  const [bookingCountResult] = await pool.query(
    `SELECT COUNT(*) AS bookingCount
     FROM bookings
     WHERE theaterId IN (?) AND status = ? and
     bookingDate between ? and ?`,
    [theaterIds, "completed",startDate,endDate]
  );

  const [revenueResult] = await pool.query(
    `SELECT SUM(totalAmount) AS totalRevenue
     FROM bookings
     WHERE theaterId IN (?) AND status = ? and
     bookingDate between ? and ?`,
    [theaterIds, "completed",startDate,endDate]
  );

  return res.status(200).json({
    theaterIds,
    totalTheaters: theaterIds.length,
    movieCount: movieCountResult[0].movieCount,
    bookingCount: bookingCountResult[0].bookingCount,
    totalRevenue: revenueResult[0].totalRevenue
  });
});

const TheatermovieRevenue=asyncHandler(async(req,res)=>{
    const theaterId=parseInt(req.params.id, 10);
    const movieId=parseInt(req.query.movieId, 10);
    
    if(isNaN(theaterId) || theaterId < 1)
        throw new AppError(400, "Invalid theater ID");
    if(isNaN(movieId) || movieId < 1)
        throw new AppError(400, "Invalid movie ID");
    
    const [owner]=await pool.query("select userId from theaters where id=?",[theaterId])
    if(!owner.length || owner[0].userId!==req.user.id)
        throw new AppError(403,"Entry restricted")
    const [result]=await pool.query(
        `select coalesce(sum(totalAmount),0) as revenue from bookings 
         inner join shows on bookings.showId=shows.id
         where bookings.theaterId=? and shows.movieId=?`,[theaterId,movieId])

    return res.status(200).json({message:"success",data:result})
})

module.exports={TheatermovieRevenue,getTheaterAnalytics}