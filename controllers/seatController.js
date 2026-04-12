const {asyncHandler}=require("../errorHandler/asyncHandler")
const {pool}=require("../config/dbConnection")
const { AppError } = require("../errorHandler/appError")

const addSeat = asyncHandler(async (req, res) => {
    const { screenId, layout } = req.body;

    // 🔒 Validation
    if (!screenId || !layout || !Array.isArray(layout)) {
        throw new AppError(400, "Invalid input");
    }

    // 🔍 Check screen exists
    const [existingScreen] = await pool.query(
        "SELECT * FROM screens WHERE id=?",
        [screenId]
    );

    if (existingScreen.length === 0) {
        throw new AppError(404, "Screen not found");
    }

    // 🔥 DELETE existing layout
    await pool.query(
        "DELETE FROM seats WHERE screenId=?",
        [screenId]
    );

    // 🔥 Flatten layout
    const flatLayout = layout.flat().filter(Boolean);

    const arr = [];

    for (let seat of flatLayout) {

        // 🔥 GAP → store NULL
        if (!seat.rowNO || !seat.seatNo) {
            arr.push([
                screenId,
                null,
                null,
                null   // 🔥 type = NULL
            ]);
            continue;
        }

        arr.push([
            screenId,
            seat.rowNO,
            seat.seatNo,
            seat.type || "normal"
        ]);
    }

    // 🔥 Bulk insert
    if (arr.length > 0) {
        await pool.query(
            "INSERT INTO seats (screenId, rowNo, seatNo, type) VALUES ?",
            [arr]
        );
    }

    return res.status(201).json({
        success: true,
        message: "Seat layout created successfully"
    });
});

const getSeats = asyncHandler(async (req, res) => {
    const screenId = req.query.screenId

    // 🔒 Validation
    if (!screenId)
        throw new AppError(400, "Screen Id cannot be empty")

    // 🔍 Check screen exists
    const [existingScreen] = await pool.query(
        "SELECT * FROM screens WHERE id=?",
        [screenId]
    )

    if (existingScreen.length === 0)
        throw new AppError(404, "screen doesnt exist")

    // 🔥 Fetch seats (IMPORTANT: keep order)
    const [seats] = await pool.query(`
        SELECT 
            seats.id,
            seats.rowNo,
            seats.seatNo,
            seats.type,
            showPrice.price
        FROM seats 
        LEFT JOIN showPrice 
            ON seats.type = showPrice.seatType
        WHERE seats.screenId = ?
        ORDER BY seats.id
    `, [screenId])

    const map = new Map()

    let currentRow = null

    for (let seat of seats) {

        // 🔥 GAP (NULL row)
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

        // 🔥 Push seat
        map.get(currentRow).push({
            id: seat.id,
            rowNo: seat.rowNo,
            seatNO: seat.seatNo,
            type: seat.type,
            price: seat.price,
            status: "available"
        })
    }

    return res.status(200).json({
        message: "success",
        data: Array.from(map)
    })
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
    const [existingSeats]=await pool.query("select id from seats where screenId=?",[showDetails[0].screenId])
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