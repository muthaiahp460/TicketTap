const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");

  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      message: err.message
    });
  }
  console.log(err.message)
  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};

module.exports = { errorMiddleware };