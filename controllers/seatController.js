const {asyncHandler}=require("../errorHandler/asyncHandler")
const {pool}=require("../config/dbConnection")
const { AppError } = require("../errorHandler/appError")

const addSeat=asyncHandler(async(req,res)=>{   
    const {screenId,rows,seatCount,premium,lounge}=req.body;
    if(!screenId || !rows || !seatCount || !premium || !lounge)
        throw new AppError(400,"Fields cannot be empty")
    
    if(!Array.isArray(rows) || !Array.isArray(premium) || !Array.isArray(lounge))
        throw new AppError(400,"Input field format invalid")

    if(typeof(seatCount)!="number" || seatCount<=0)
        throw new AppError(400,"Invalid seat count")

    const [existingScreen]=await pool.query("select * from screens where id=?",[screenId])
    if(existingScreen.length==0)
        throw new AppError(404,"screen not found")

    const [existingSeating]=await pool.query("select id from seats where screenId=?",[screenId])
    const rowSet=new Set(rows),premiumSet=new Set(premium),loungeSet=new Set(lounge)
    for(let p of premium){
        if(!rowSet.has(p))
            throw new AppError(400,"Premium should be valid row")
    }
    for(let l of lounge)
    {
        if(!rowSet.has(l))
            throw new AppError(400,"Lounge should be valid row")
    }

    for(let l of lounge){
        if(premiumSet.has(l))
            throw new AppError(400,"Same row cannot be both Lounge and Premium")
    }

    if(existingSeating.length>0)
        throw new AppError(409,`seating arrangement for screen ${screenId} already exist`)

    const arr=[];
    for(let seat of rows){
        for(let i=1;i<=seatCount;i++){
            if(premiumSet.has(seat))
                arr.push([screenId,seat,i,"premium"])
            else if(loungeSet.has(seat))
                arr.push([screenId,seat,i,"lounge"])
            else
                arr.push([screenId,seat,i,"normal"])
        }
    }   
    await pool.query("insert into seats (screenId,rowNo,seatNo,type) values ?",[arr])
    return res.status(201).json({message:"Seat layout created successfully"})
}) 

// const getSeats=asyncHandler(async(req,res)=>{ //show prices after adding showPrices
//     const screenId=req.query.screenId
//     if(!screenId)
//         throw new AppError(400,"Screen Id cannot be empty")
//     const [existingScreen]=await pool.query("select * from screens where id=?",[screenId])
//     if(existingScreen.length==0)
//         throw new AppError(404,"screen doesnt exist")
//     const [seats]=await pool.query("select * from seats where screenId=?",[screenId])
//     return res.status(200).json({message:"success",data:seats})
// })

const getSeats=asyncHandler(async(req,res)=>{ //show prices after adding showPrices
    const screenId=req.query.screenId
    if(!screenId)
        throw new AppError(400,"Screen Id cannot be empty")
    const [existingScreen]=await pool.query("select * from screens where id=?",[screenId])
    if(existingScreen.length==0)
        throw new AppError(404,"screen doesnt exist")
    const [seats]=await pool.query(`select seats.id,seats.rowNo,seats.seatNo,
                                   concat(seats.rowNo,seats.seatNo) as seat,seats.type,showPrice.price
                                   from seats inner join showPrice on seats.type=showPrice.seatType`)

    const data=[]
    for(let seat of seats){
        if(data.length==0){
            data.push(
                {   price:seat.price,
                    rows:seat.rowNo,
                    seats:[seat.seat]   
                }
            )
            continue;
        }
        for(i=0;i<data.length;i++){
            if(data[i].rows==seat.rowNo){
                data[i].seats.push(seat.seat)
                break;
            }
        }
        if(i==data.length)
        {
            data.push(
                {
                    price:seat.price,
                    rows:seat.rowNo,
                    seats:[seat.seat]
                }
            )
        }
    }
    return res.status(200).json({message:"success",data:data})
})

const deleteSeats=asyncHandler(async(req,res)=>{
    const screenId=req.query.screenId
    if(!screenId)
        throw new AppError(400,"Screen Id cannot be empty")
    const [existingSeating]=await pool.query("select * from seats where screenId=?",[screenId])
    if(existingSeating.length==0)
        throw new AppError(404,"seating arrangement doesnt exist for this screen")
    const [existingScreen]=await pool.query("select * from screens where id=?",[screenId])
    if(existingScreen.length==0)
        throw new AppError(404,"screen doesnt exist")
    const currDate=new Date();
    const [existingShows]=await pool.query("select * from shows where screenId=? and showDate>=?",[screenId,currDate])
    if(existingShows.length>0)
        throw new AppError(409,"Cannot delete seats because shows are already scheduled for this screen")
    const [result]=await pool.query("delete from seats where screenId=?",[screenId])
    return res.status(200).json({message:"seats deleted successfully"})
})

const setSeatPrices=asyncHandler(async(req,res)=>{
    const showId=parseInt(req.query.showId)
    if(!showId)
        throw new AppError(400,"Show Id cannot be empty")
    let {normalPrice,premiumPrice,loungePrice}=req.body
    if(!normalPrice || !premiumPrice || !loungePrice)
        throw new AppError(400,"All price fields are required")
    normalPrice=Number(normalPrice)
    premiumPrice=Number(premiumPrice)
    loungePrice=Number(loungePrice)
    const [showDetails]=await pool.query("select screenId from shows where id=?",[showId])
    if(showDetails.length==0)
        throw new AppError(404,"Show not found")
    const [existingScreen]=await pool.query("select id from screens where id=?",[showDetails[0].screenId])
    if(existingScreen.length==0)
        throw new AppError(404,"Show Screen doesnt exist")
    const [existingSeats]=await pool.query("select id from seats where screenId=?",[existingScreen[0].id])
    if(existingSeats.length==0)
        throw new AppError(404,"seating arrangement doesnt exist for this screen")

    const [existingPricing]=await pool.query("select * from showPrice where showId=?",[showId])
    if(existingPricing.length>0){
        await pool.query(`update showPrice 
                          set price= CASE 
                              when seatType="normal" then  ?
                              when seatType="premium" then ?
                              when seatType="lounge" then ?
                          END
                          where showId=?`,[normalPrice,premiumPrice,loungePrice,showId])
        return res.status(200).json({message:"Seat prices updated successfully"})
    }
    else{
        await pool.query(`insert into showPrice (seatType,price,showId) 
                          values 
                          ('normal',?,?),
                          ('premium',?,?),
                          ('lounge',?,?)`,
                        [
                            normalPrice,showId,
                            premiumPrice,showId,
                            loungePrice,showId
                        ])
        return res.status(200).json({message:"Seat prices set successfully"})
    }
})



module.exports={addSeat,getSeats,deleteSeats,setSeatPrices}