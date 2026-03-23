const express=require('express')
const app=express()
const ratelimit=require("express-rate-limit")
const cookieParser=require("cookie-parser")
app.use(cookieParser())
app.use(express.json())
const {errorMiddleware}=require("./middleware/errorMiddleware")
const movieRoute=require("./routes/movieRouter")
const theaterRoute=require("./routes/theaterRoute")
const screenRouter=require("./routes/screenRouter")
const showRoute=require("./routes/showRoute")
const seatRote=require("./routes/seatRouter")
const authRoute=require("./routes/authRouter")
const bookRoute=require("./routes/bookingRouter")
const analysisRoute=require("./routes/analysisRouter")

const limitter=ratelimit(
    {
        windowMs:1*60*1000,
        limit:5
    }
)


app.use(limitter)

app.get('/',(req,res)=>{
    res.json({message:"Server is running"})
})
app.use("/movies",movieRoute)
app.use("/theater",theaterRoute)
app.use("/screen",screenRouter)
app.use("/show",showRoute)
app.use("/seat",seatRote)
app.use("/auth",authRoute)
app.use("/booking",bookRoute)
app.use("/analysis",analysisRoute)

app.use(errorMiddleware)
app.listen(3000)