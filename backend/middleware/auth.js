/**
 * Auth Middleware
 * This middleware handles authentication for the API
 */

const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.position || "teacher" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Auth middleware to verify token
const auth = (req, res, next) => {
  // For development and testing, skip auth if specified in .env
  if (process.env.SKIP_AUTH === "true") {
    return next();
  }

  // Get token from header
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    console.log("Authentication failed: No token provided");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Authentication failed: Invalid token", error.message);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = { auth, generateToken };
