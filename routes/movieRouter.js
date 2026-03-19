const express=require('express')
const router=express.Router()
const {addMovie, getMovies,getMoviesById,getMovieshows}=require("../Controllers/movieController")
const {validateCreateMovie}=require("../validator/validate")
const {validateMiddleware}=require("../middleware/validateMiddleware")
const {protect,isAdmin}=require("../middleware/authMiddleware")

router.post("/",protect,isAdmin,validateCreateMovie,validateMiddleware,addMovie)
router.get("/",getMovies)
router.get("/:id",getMoviesById)
router.get("/:id/shows",getMovieshows)

module.exports=router