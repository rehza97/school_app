const { body, validationResult } = require("express-validator");

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation Error",
      details: errors.array(),
    });
  }
  next();
};

// Validation rules
const rules = {
  // Student validation rules
  student: [
    body("first_name")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters long"),
    body("last_name")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters long"),
    body("birth_date")
      .optional()
      .isDate()
      .withMessage("Invalid birth date format"),
    body("gender")
      .optional()
      .isIn(["male", "female"])
      .withMessage("Gender must be either male or female"),
  ],

  // Teacher validation rules
  teacher: [
    body("first_name")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters long"),
    body("last_name")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters long"),
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("birth_date")
      .optional()
      .isDate()
      .withMessage("Invalid birth date format"),
    body("position")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Position cannot be empty"),
  ],

  // Section validation rules
  section: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Section name is required")
      .isLength({ min: 2 })
      .withMessage("Section name must be at least 2 characters long"),
    body("capacity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive number"),
    body("teacher_id")
      .optional()
      .isInt()
      .withMessage("Teacher ID must be a valid number"),
  ],

  // Login validation rules
  login: [
    body("code")
      .trim()
      .notEmpty()
      .withMessage("Login code is required")
      .isLength({ min: 3, max: 10 })
      .withMessage("Login code must be between 3 and 10 characters"),
  ],

  // File upload validation rules
  fileUpload: [
    body("file").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("No file uploaded");
      }
      if (
        !req.file.mimetype.match(
          /^application\/vnd\.(openxmlformats-officedocument\.spreadsheetml\.sheet|ms-excel)$/
        )
      ) {
        throw new Error("Invalid file type. Only Excel files are allowed.");
      }
      return true;
    }),
  ],
};

module.exports = {
  validate,
  rules,
};
