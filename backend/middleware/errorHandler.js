// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: err.errors,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authentication token",
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      error: "File Upload Error",
      message: err.message,
    });
  }

  // Handle SQLite errors
  if (err.code === "SQLITE_CONSTRAINT") {
    return res.status(400).json({
      error: "Database Constraint Error",
      message: "A record with this information already exists",
    });
  }

  // Handle file type errors
  if (err.message === "Invalid file type. Only Excel files are allowed.") {
    return res.status(400).json({
      error: "Invalid File Type",
      message: "Only Excel files (.xlsx, .xls) are allowed",
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    status: err.status || 500,
  });
};

module.exports = errorHandler;
