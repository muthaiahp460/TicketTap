const express=require('express')
const router=express.Router()
const {addMovie, getMovies,getMoviesById,getMovieshows}=require("../Controllers/movieController")

router.post("/",addMovie)
router.get("/",getMovies)
router.get("/:id",getMoviesById)
router.get("/:id/shows",getMovieshows)

module.exports=router