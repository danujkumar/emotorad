//This is centralized error handling mechanism to handle all types of error and report normal error to the end users

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  let statusCode = err.status || 500;
  let message =
    "An unexpected error occurred. The internet connection may not be good, or you may not be providing all the required information.";

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
