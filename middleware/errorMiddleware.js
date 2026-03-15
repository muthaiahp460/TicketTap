const errorMiddleware=(err,req,res,next)=>{
    console.log(err.stack)
    const statusCode=err.statusCode
    if(err.isOperational)
        res.status(statusCode).json({success:false,message:err.message})
    else
        res.status(500).json({success:false,message:"Internal server error"})
}

module.exports={errorMiddleware}