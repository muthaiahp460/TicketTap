const {body}=require("express-validator")

const validateCreateTheater=[
    body("name").notEmpty().withMessage("Theater name cannot be null")
    .isString().withMessage("Theater name should be a string")
]

const validateCreateMovie=[
    body("name").notEmpty().withMessage("Movie name should not be empty")
    .isString().withMessage("Movie name should be a string"),
    body("duration").notEmpty().withMessage("Duration should not be empty")
    .isInt({min:1}).withMessage("Duration should be a valid"),
    body("language").notEmpty().withMessage("Language should not be empty")
    .isString().withMessage("language should be a string"),
    body("genre").notEmpty().withMessage("Genre should not be empty")
    .isString().withMessage("Genre should be a string"),
    body("cast").notEmpty().withMessage("Cast should not be empty")
    .isString().withMessage("Cast should be a string"),
    body("rating").notEmpty().withMessage("Rating should not be empty")
    .isFloat({min:0,max:10}).withMessage("Rating should be a number between 0 and 10")
]

const validateCreateScreen=[
    body("theaterId").notEmpty().withMessage("Theater Id should not be empty")
    .isInt({min:1}).withMessage("Theater Id should be valid"),
    body("screenNo").notEmpty().withMessage("Screen number should not be empty")
    .isInt({min:1}).withMessage("ScreenNo number should be valid"),
    body("seats").notEmpty().withMessage("Seats should not be empty")
    .isInt({min:1}).withMessage("Seats should be valid")
]


const validateCreateShow=[
    body("movieId").notEmpty().withMessage("Movie Id should not be empty")
    .isInt({min:1}).withMessage("Movie Id should be valid"),
    body("screenId").notEmpty().withMessage("Screen Id should not be empty")
    .isInt({min:1}).withMessage("Screen Id should be valid")
]

const validateCreateSeat=[
    body("screenId").notEmpty().withMessage("Screen Id should not be empty")
    .isInt({min:1}).withMessage("Screen Id should be valid"),
    body("rows").notEmpty().withMessage("Rows should not be empty")
    .isArray({min:1}).withMessage("Rows should be an array with at least one element"),
    body("seatCount").notEmpty().withMessage("Seat count should not be empty")
    .isInt({min:1}).withMessage("Seat count should be a valid number"),
    body("premium").notEmpty().withMessage("Premium rows should not be empty")
    .isArray().withMessage("Premium should be an array"),
    body("lounge").notEmpty().withMessage("Lounge rows should not be empty")
    .isArray().withMessage("Lounge should be an array")
]

const validateRegister=[
    body("name").notEmpty().withMessage("name should not be empty")
    .isString().withMessage("Name should be a string"),
    body("email").isEmail().withMessage("Invalid Email"),
    body("phoneNo")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone number must be 10 digits and start with 6-9"),
    body("password").isStrongPassword({
        minLength:6,
        minUppercase:1,
        minLowercase:1,
        minNumbers:1,
        minSymbols:1
    }).withMessage("Password is weak"),
    body("role").notEmpty().withMessage("role cannot be empty")

]

module.exports={validateCreateTheater, validateCreateMovie, validateCreateScreen, validateCreateShow, validateCreateSeat,validateRegister}