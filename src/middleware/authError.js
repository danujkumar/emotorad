const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  let statusCode = err.status || 500;
  let message =
    "An unexpected error occurred. The internet connection may not be good, or you may not be providing all the required information.";

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
