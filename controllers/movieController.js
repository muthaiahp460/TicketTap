const {pool}=require("../config/dbConnection")
const {AppError}=require("../errorHandler/appError") 
const {asyncHandler}=require("../errorHandler/asyncHandler")

const getCurrTime=()=>{
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
}

const addMovie=asyncHandler(async(req,res)=>{
    const {name,img,duration,language,genre,cast,rating,certificate}=req.body
    if(!name || !duration || !language || !genre || !cast || !rating || !img || !certificate)
        throw new AppError(400,"Fields cannot be null")
    const now= new Date()
    const year=now.getFullYear()
    const [exisiting]=await pool.query("select * from movies where name=? and language=? and year=?",[name,language,year])
    if(exisiting.length===1)
        throw new AppError(409,"Movie already exist")
    const [result]=await pool.query("insert into movies (name,movieImg,duration,language,genre,cast,rating,year,certificate) values(?,?,?,?,?,?,?,?,?)",[name,img,duration,language,genre,cast,rating,year,certificate])
    if(result.affectedRows===0)
        throw new AppError(500,"Cannot able to add Movie")
    return res.status(201).json({message:"Movie added successfully",movieId:result.insertId})
})

const getMovies=asyncHandler(async(req,res)=>{
    const movieName=req.query.name;
    console.log(movieName)
    if(!movieName){
        const [movies]=await pool.query("select id,name,language,rating,movieImg,certificate from movies limit 12")
        return res.status(200).json({message:"success",data:movies})
    }
    else{
        const [movies]=await pool.query("select id,name,language,rating,year,movieImg,certificate from movies where name like ?",[`${movieName}%`])
        if(movies.length==0)
            throw new AppError(404,"movie not found")
        return res.status(200).json({message:"success",data:movies})
    }
})

const getMoviesById=asyncHandler(async(req,res)=>{
    const movieId=req.params.id;
    const [movies]=await pool.query("select * from movies where id=?",[movieId])
    if(movies.length==0)
        throw new AppError(404,"movie not found")
    return res.status(200).json({message:"success",data:movies[0]})
})

const getMovieshows=asyncHandler(async(req,res)=>{
    const movieId=req.params.id;
    const [data]=await pool.query(`
        select shows.id,shows.startTime,screens.screenNo,theaters.name as theaterName,theaters.img as img,
        Date(showDate) as fullDate,
        Date_format(showDate,'%d') as date,
        Date_format(showDate,'%M') as month,
        Date_format(showDate,'%y') as year,
        weekday(showDate) as day


        from screens 
        inner join shows on shows.screenId=screens.id
        inner join theaters on screens.theaterId=theaters.id 
        where shows.movieId=? and shows.showDate>=curdate() order by fullDate asc`,[movieId]);
    return res.status(200).json({message:"success",data:data})
})

const getRecentBookings=asyncHandler(async(req,res)=>{
    const movieId=req.params.id
    const [result]=await pool.query(`
        select sum(ticketCount) as totalTickets from
        bookings inner join shows on bookings.showId=shows.id
        where movieId=? and bookings.status=? and DATE_ADD(bookings.bookingDate,INTERVAL 24 hour)>=?`,[movieId,"completed",getCurrTime()]
    )
    return res.status(200).json({message:"success",data:result[0].totalTickets})
})

module.exports={addMovie,getMovies,getMoviesById,getMovieshows,getRecentBookings}
