const {pool}=require("../config/dbConnection")
const {AppError}=require("../errorHandler/appError") 
const {asyncHandler}=require("../errorHandler/asyncHandler")

const addMovie=asyncHandler(async(req,res)=>{
    const {name,duration,language,genre,cast,rating}=req.body
    if(!name || !duration || !language || !genre || !cast || !rating)
        throw new AppError(400,"Fields cannot be null")
    const now= new Date()
    const year=now.getFullYear()
    const [exisiting]=await pool.query("select * from movies where name=? and language=? and year=?",[name,language,year])
    if(exisiting.length===1)
        throw new AppError(409,"Movie already exist")
    const [result]=await pool.query("insert into movies (name,duration,language,genre,cast,rating,year) values(?,?,?,?,?,?,?)",[name,duration,language,genre,cast,rating,year])
    if(result.affectedRows===0)
        throw new AppError(500,"Cannot able to add Movie")
    return res.status(201).json({message:"Movie added successfully",movieId:result.insertId})
})

const getMovies=asyncHandler(async(req,res)=>{
    const movieName=req.query.name;
    if(!movieName){
        const [movies]=await pool.query("select id,name,language,rating from movies limit 20")
        return res.status(200).json({message:"success",data:movies})
    }
    else{
        const [movies]=await pool.query("select id,name,language,rating,year from movies where name like ?",[`${movieName}%`])
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
    const [data]=await pool.query("select shows.startTime,screens.screenNo,theaters.name from screens inner join shows inner join theaters on shows.screenId=screens.id and screens.theaterId=theaters.id where shows.movieId=?",[movieId]);
    return res.status(200).json({message:"success",data:data})
})

module.exports={addMovie,getMovies,getMoviesById,getMovieshows}
