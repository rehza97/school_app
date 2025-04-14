const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const xlsx = require("xlsx");
const { db } = require("./db");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
// Configure CORS to allow requests from frontend
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Increase payload size limit to 50MB
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
require("fs").mkdirSync(uploadsDir, { recursive: true });

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get all education levels
app.get("/api/education-levels", (req, res) => {
  const query = "SELECT * FROM education_level WHERE active = 1";
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving education levels:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// Get all education systems
app.get("/api/education-systems", (req, res) => {
  const query = "SELECT * FROM education_system WHERE active = 1";
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving education systems:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// Get all specialties
app.get("/api/specialties", (req, res) => {
  const query = "SELECT * FROM specialty WHERE active = 1";
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving specialties:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// Get all sections
app.get("/api/sections", (req, res) => {
  const query = "SELECT * FROM sections WHERE active = 1";
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving sections:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// Configure multer for file uploads with increased size limit
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB size limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel files are allowed."));
    }
  },
});

// Count endpoints
app.get("/api/students/count", (req, res) => {
  db.get(
    "SELECT COUNT(*) as count FROM students WHERE active = 1",
    (err, row) => {
      if (err) {
        console.error("Error getting student count:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }
      res.json({ count: row ? row.count : 0 });
    }
  );
});

app.get("/api/teachers/count", (req, res) => {
  db.get(
    "SELECT COUNT(*) as count FROM teachers WHERE active = 1",
    (err, row) => {
      if (err) {
        console.error("Error getting teacher count:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }
      res.json({ count: row ? row.count : 0 });
    }
  );
});

// Get all students with related data
app.get("/api/students", (req, res) => {
  const query = `
    SELECT 
      s.*,
      el.name as education_level_name,
      sp.name as specialty_name,
      sec.name as section_name,
      es.name as education_system_name
    FROM students s
    LEFT JOIN education_level el ON s.education_level_id = el.id
    LEFT JOIN specialty sp ON s.specialty_id = sp.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN education_system es ON s.education_system_id = es.id
    WHERE s.active = 1
    ORDER BY s.last_name, s.first_name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving students:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// Get student by ID with related data
app.get("/api/students/:id", (req, res) => {
  const query = `
    SELECT 
      s.*,
      el.name as education_level_name,
      sp.name as specialty_name,
      sec.name as section_name,
      es.name as education_system_name
    FROM students s
    LEFT JOIN education_level el ON s.education_level_id = el.id
    LEFT JOIN specialty sp ON s.specialty_id = sp.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN education_system es ON s.education_system_id = es.id
    WHERE s.id = ? AND s.active = 1
  `;

  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      console.error("Error retrieving student:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!row) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(row);
  });
});

// Add new student
app.post("/api/students", (req, res) => {
  const {
    registration_id,
    last_name,
    first_name,
    gender,
    birth_date,
    birth_place,
    birth_by_judgment,
    birth_certificate,
    birth_record_year,
    birth_certificate_number,
    registration_number,
    registration_date,
    education_level_id,
    specialty_id,
    section_id,
    education_system_id,
  } = req.body;

  // Handle Excel date conversion if needed (Excel dates are days since 1/1/1900)
  let formattedBirthDate = birth_date;
  if (birth_date && !isNaN(birth_date) && birth_date > 10000) {
    // This looks like an Excel serial date
    try {
      const excelEpoch = new Date(1899, 11, 30);
      const daysSinceEpoch = parseInt(birth_date);
      const dateObj = new Date(
        excelEpoch.getTime() + daysSinceEpoch * 86400000
      );
      formattedBirthDate = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD format
      console.log(
        `Converted Excel date ${birth_date} to ${formattedBirthDate}`
      );
    } catch (err) {
      console.warn(`Failed to convert date ${birth_date}:`, err);
      formattedBirthDate = birth_date;
    }
  }

  // First check if student with this registration_id already exists
  db.get(
    "SELECT id FROM students WHERE registration_id = ?",
    [registration_id],
    (err, row) => {
      if (err) {
        console.error("Error checking for existing student:", err);
        return res.status(500).json({ error: "Failed to add student" });
      }

      if (row) {
        // Student exists, update instead of insert
        console.log(
          `Student with registration_id ${registration_id} already exists. Updating...`
        );

        db.run(
          `UPDATE students SET 
            last_name = ?, 
            first_name = ?, 
            gender = ?, 
            birth_date = ?, 
            birth_place = ?, 
            birth_by_judgment = ?, 
            birth_certificate = ?, 
            birth_record_year = ?, 
            birth_certificate_number = ?,
            registration_number = ?,
            registration_date = ?,
            education_level_id = ?,
            specialty_id = ?,
            section_id = ?,
            education_system_id = ?,
            active = 1
          WHERE registration_id = ?`,
          [
            last_name,
            first_name,
            gender,
            formattedBirthDate,
            birth_place,
            birth_by_judgment,
            birth_certificate,
            birth_record_year,
            birth_certificate_number,
            registration_number,
            registration_date,
            education_level_id,
            specialty_id,
            section_id,
            education_system_id,
            registration_id,
          ],
          function (err) {
            if (err) {
              console.error("Error updating existing student:", err);
              return res
                .status(500)
                .json({ error: "Failed to update student" });
            }

            res.status(200).json({ id: row.id, updated: true });
          }
        );
      } else {
        // New student, insert
        db.run(
          `INSERT INTO students (
            registration_id, 
            last_name, 
            first_name, 
            gender, 
            birth_date, 
            birth_place, 
            birth_by_judgment, 
            birth_certificate, 
            birth_record_year, 
            birth_certificate_number,
            registration_number,
            registration_date,
            education_level_id,
            specialty_id,
            section_id,
            education_system_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            registration_id,
            last_name,
            first_name,
            gender,
            formattedBirthDate,
            birth_place,
            birth_by_judgment,
            birth_certificate,
            birth_record_year,
            birth_certificate_number,
            registration_number,
            registration_date,
            education_level_id,
            specialty_id,
            section_id,
            education_system_id,
          ],
          function (err) {
            if (err) {
              console.error("Error adding student:", err);
              return res.status(500).json({ error: "Failed to add student" });
            }

            res.status(201).json({ id: this.lastID });
          }
        );
      }
    }
  );
});

// Update student
app.put("/api/students/:id", (req, res) => {
  const {
    registration_id,
    last_name,
    first_name,
    gender,
    birth_date,
    birth_place,
    birth_by_judgment,
    birth_certificate,
    birth_record_year,
    birth_certificate_number,
    registration_number,
    registration_date,
    education_level_id,
    specialty_id,
    section_id,
    education_system_id,
    active,
  } = req.body;

      db.run(
    `UPDATE students SET 
      registration_id = ?, 
      last_name = ?, 
      first_name = ?, 
      gender = ?, 
      birth_date = ?, 
      birth_place = ?, 
      birth_by_judgment = ?, 
      birth_certificate = ?, 
      birth_record_year = ?, 
      birth_certificate_number = ?,
      registration_number = ?,
      registration_date = ?,
      education_level_id = ?,
      specialty_id = ?,
      section_id = ?,
      education_system_id = ?,
      active = ?
    WHERE id = ?`,
    [
      registration_id,
      last_name,
      first_name,
      gender,
      birth_date,
      birth_place,
      birth_by_judgment,
      birth_certificate,
      birth_record_year,
      birth_certificate_number,
      registration_number,
      registration_date,
      education_level_id,
      specialty_id,
      section_id,
      education_system_id,
      active ? 1 : 0,
      req.params.id,
    ],
        function (err) {
      if (err) {
        console.error("Error updating student:", err);
        return res.status(500).json({ error: "Failed to update student" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json({ success: true });
    }
  );
});

  // Teacher routes
app.get("/api/teachers", (req, res) => {
  console.log("GET /api/teachers called");

  const query = `
    SELECT 
      t.*,
      r.name as role_name,
      s.name as subject_name
    FROM teachers t
    LEFT JOIN teacher_roles r ON t.role_id = r.id
    LEFT JOIN subjects s ON t.subject_id = s.id
    ORDER BY t.last_name, t.first_name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving teachers:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    console.log(`Returning ${rows ? rows.length : 0} teachers`);
    if (rows && rows.length > 0) {
      console.log("Sample teacher data:", rows[0]);
    }

        res.json(rows);
      });
});

app.post("/api/teachers", (req, res) => {
      const { first_name, last_name, subject, birth_date, position } = req.body;
      db.run(
        "INSERT INTO teachers (first_name, last_name, subject, birth_date, position) VALUES (?, ?, ?, ?, ?)",
        [first_name, last_name, subject, birth_date, position],
        function (err) {
      if (err) {
        console.error("Error creating teacher:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
          res.status(201).json({ id: this.lastID });
        }
      );
});

  // Section routes
app.get("/api/sections", (req, res) => {
      db.all("SELECT * FROM sections WHERE active = 1", [], (err, rows) => {
    if (err) {
      console.error("Error fetching sections:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows || []);
  });
});

app.post("/api/sections", (req, res) => {
      const { name, capacity, teacher_id } = req.body;
      db.run(
        "INSERT INTO sections (name, capacity, teacher_id) VALUES (?, ?, ?)",
        [name, capacity, teacher_id],
        function (err) {
      if (err) {
        console.error("Error creating section:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
          res.status(201).json({ id: this.lastID });
        }
      );
});

  // File upload route
app.post("/api/upload", upload.single("file"), (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { type } = req.body;
        if (!type || !["student", "teacher"].includes(type)) {
          return res.status(400).json({ error: "Invalid file type specified" });
        }

        // Process the Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to array of arrays first
        const rawData = xlsx.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: "",
        });

        // Remove empty rows and get headers and data
        const nonEmptyRows = rawData.filter((row) =>
          row.some((cell) => cell !== "")
        );
        if (nonEmptyRows.length < 2) {
          // Need at least headers and one data row
      return res.status(400).json({ error: "لا توجد بيانات صالحة في الملف" });
        }

        const rows = nonEmptyRows.slice(1); // Skip header row

        // Begin transaction
    db.run("BEGIN TRANSACTION", async (err) => {
      if (err) {
        console.error("Transaction error:", err);
        return res.status(500).json({ error: "Database error" });
      }

          let successCount = 0;

      try {
          // Process records based on type
          if (type === "teacher") {
            for (const row of rows) {
              // Skip rows where essential fields are empty
              if (!row[0] || !row[1] || !row[2]) continue;

                db.run(
              `INSERT INTO teachers (
                    registration_id, last_name, first_name, birth_date,
                    rank, subject, grade, effective_date, active
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                  [
                    row[0]?.toString().trim(), // registration_id
                    row[1]?.toString().trim(), // last_name
                    row[2]?.toString().trim(), // first_name
                    row[3]?.toString().trim(), // birth_date
                    row[4]?.toString().trim(), // rank
                    row[5]?.toString().trim(), // subject
                    row[6]?.toString().trim() || "0", // grade
                    row[7]?.toString().trim() || null, // effective_date
                  ],
                  (err) => {
                if (!err) successCount++;
              }
            );
            }
          } else {
            // Handle student data
            for (const row of rows) {
              // Skip rows where essential fields are empty
              if (!row[0] || !row[1] || !row[2]) continue;

                db.run(
              `INSERT INTO students (
                    registration_id, last_name, first_name, gender,
                    birth_date, section, year, registration_place,
                    contract_number, birth_certificate, teaching_system,
                    division, active
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                  [
                    row[0]?.toString().trim(), // رقم التعريف
                    row[1]?.toString().trim(), // اللقب
                    row[2]?.toString().trim(), // الاسم
                    row[3]?.toString().trim(), // الجنس
                    row[4]?.toString().trim(), // تاريخ الازدياد
                    row[5]?.toString().trim(), // القسم
                    row[6]?.toString().trim(), // السنة
                    row[7]?.toString().trim(), // مكان الازدياد
                    row[8]?.toString().trim(), // رقم عقد الميلاد
                    row[9]?.toString().trim(), // عقد الميلاد
                    row[10]?.toString().trim(), // نظام التدريس
                    row[11]?.toString().trim(), // الشعبة
                  ],
                  (err) => {
                if (!err) successCount++;
              }
            );
          }
        }

        // Commit the transaction
        db.run("COMMIT", (commitErr) => {
          if (commitErr) {
            console.error("Commit error:", commitErr);
            return res
              .status(500)
              .json({ error: "Database error during commit" });
          }

          // Delete the uploaded file after processing
          require("fs").unlinkSync(req.file.path);

          if (successCount === 0) {
            return res
              .status(400)
              .json({ error: "لا توجد بيانات صالحة في الملف" });
          }

          res.json({
            message: "تم معالجة الملف بنجاح",
            recordsProcessed: successCount,
          });
          });
        } catch (error) {
          // Rollback transaction on error
        db.run("ROLLBACK", () => {
          console.error("Processing error:", error);
          res.status(500).json({ error: "Error processing file" });
          });
        }
    });
      } catch (error) {
        console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
});

// Student import endpoint - no auth required
app.post("/api/students/import", (req, res) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ error: "Invalid request format" });
  }

  console.log(`Received ${students.length} students to import`);

  // Begin transaction
  db.run("BEGIN TRANSACTION", (err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Track import results
    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    const errors = [];

    // Create promises for all DB operations to ensure ordered execution
    const promises = [];

    // First, load all reference data to allow lookups by name
    const loadReferenceData = () => {
      return new Promise((resolve, reject) => {
        const referenceData = {
          educationLevels: [],
          specialties: [],
          sections: [],
          educationSystems: [],
        };

        // Load education levels
        db.all(
          "SELECT * FROM education_level WHERE active = 1",
          [],
          (err, rows) => {
            if (err) {
              console.error("Error loading education levels:", err);
              return reject(err);
            }
            referenceData.educationLevels = rows || [];

            // Load specialties
            db.all(
              "SELECT * FROM specialty WHERE active = 1",
              [],
              (err, rows) => {
                if (err) {
                  console.error("Error loading specialties:", err);
                  return reject(err);
                }
                referenceData.specialties = rows || [];

                // Load sections
                db.all(
                  "SELECT * FROM sections WHERE active = 1",
                  [],
                  (err, rows) => {
                    if (err) {
                      console.error("Error loading sections:", err);
                      return reject(err);
                    }
                    referenceData.sections = rows || [];

                    // Load education systems
                    db.all(
                      "SELECT * FROM education_system WHERE active = 1",
                      [],
                      (err, rows) => {
                        if (err) {
                          console.error(
                            "Error loading education systems:",
                            err
                          );
                          return reject(err);
                        }
                        referenceData.educationSystems = rows || [];

                        resolve(referenceData);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    };

    // Helper function to find reference ID by name
    const findReferenceIdByName = (referenceArray, name) => {
      if (!name || !referenceArray || !referenceArray.length) {
        return null;
      }

      // Normalize the name for comparison
      const normalizedName = name.toString().trim().toLowerCase();

      // Try exact match first
      let found = referenceArray.find(
        (item) => item.name.toLowerCase() === normalizedName
      );

      // If no exact match, try partial match
      if (!found) {
        found = referenceArray.find(
          (item) =>
            normalizedName.includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(normalizedName)
        );
      }

      // Special case for "جذع مشترك آداب" which should match to literature specialty
      if (
        !found &&
        normalizedName.includes("جذع") &&
        normalizedName.includes("آداب")
      ) {
        // Try to find a specialty related to literature/arts
        found = referenceArray.find(
          (item) =>
            item.name.toLowerCase().includes("أدب") ||
            item.name.toLowerCase() === "أدبي"
        );

        if (found) {
          console.log(
            `Special case match: "${name}" matched to literature specialty "${found.name}"`
          );
        }
      }

      // For education levels (years), handle numeric values
      if (
        !found &&
        referenceArray.some((item) => item.name.includes("السنة"))
      ) {
        // Extract year number if the name is like "السنة الأولى"
        const yearMatch = normalizedName.match(
          /(\d+)|الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة/
        );
        if (yearMatch) {
          const yearWord = yearMatch[0];
          let yearNumber;

          // Map Arabic ordinal words to numbers
          if (yearWord === "الأولى") yearNumber = 1;
          else if (yearWord === "الثانية") yearNumber = 2;
          else if (yearWord === "الثالثة") yearNumber = 3;
          else if (yearWord === "الرابعة") yearNumber = 4;
          else if (yearWord === "الخامسة") yearNumber = 5;
          else if (yearWord === "السادسة") yearNumber = 6;
          else yearNumber = parseInt(yearWord);

          if (yearNumber) {
            // Find education level with matching year
            found = referenceArray.find((item) => {
              const levelMatch = item.name.match(
                /(\d+)|الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة/
              );
              if (levelMatch) {
                const levelWord = levelMatch[0];
                let levelNumber;

                if (levelWord === "الأولى") levelNumber = 1;
                else if (levelWord === "الثانية") levelNumber = 2;
                else if (levelWord === "الثالثة") levelNumber = 3;
                else if (levelWord === "الرابعة") levelNumber = 4;
                else if (levelWord === "الخامسة") levelNumber = 5;
                else if (levelWord === "السادسة") levelNumber = 6;
                else levelNumber = parseInt(levelWord);

                return levelNumber === yearNumber;
              }
              return false;
            });
          }
        }
      }

      // For education systems, handle special cases
      if (
        !found &&
        referenceArray.some(
          (item) => item.name === "داخلي" || item.name === "خارجي"
        )
      ) {
        if (
          normalizedName.includes("داخل") ||
          normalizedName.includes("intern")
        ) {
          found = referenceArray.find((item) => item.name === "داخلي");
        } else if (
          normalizedName.includes("خارج") ||
          normalizedName.includes("extern")
        ) {
          found = referenceArray.find((item) => item.name === "خارجي");
        }
      }

      console.log(
        `Reference lookup: "${name}" -> ${
          found ? `"${found.name}" (ID: ${found.id})` : "not found"
        }`
      );
      return found ? found.id : null;
    };

    // Helper function to convert Excel date to ISO string
    const convertExcelDate = (excelDate) => {
      if (!excelDate || isNaN(excelDate)) return excelDate;

      try {
        const excelEpoch = new Date(1899, 11, 30);
        const daysSinceEpoch = parseInt(excelDate);
        if (daysSinceEpoch > 10000) {
          // Looks like an Excel date
          const dateObj = new Date(
            excelEpoch.getTime() + daysSinceEpoch * 86400000
          );
          return dateObj.toISOString().split("T")[0]; // YYYY-MM-DD format
        }
      } catch (err) {
        console.warn(`Failed to convert date ${excelDate}:`, err);
      }

      return excelDate;
    };

      // Process each student
    const processStudents = (referenceData) => {
      console.log(
        `Starting to process ${students.length} students with reference data`
      );

      const studentPromises = students.map((student, index) => {
        return new Promise(async (resolve) => {
          try {
            // Keep registration_id as a number if it's numeric (don't convert to string)
            let registrationId = student.registration_id;
            if (typeof registrationId === "string" && !isNaN(registrationId)) {
              registrationId = Number(registrationId);
              console.log(
                `Converted registration_id string "${student.registration_id}" to number: ${registrationId}`
              );
            }

            // Convert Excel dates
            const formattedBirthDate = convertExcelDate(student.birth_date);
            const formattedRegistrationDate = convertExcelDate(
              student.registration_date
            );

            // Process reference data - create if doesn't exist
            let education_level_id = null;
            let specialty_id = null;
            let section_id = null;
            let education_system_id = null;

            try {
              // Find or create education level
              const educationLevelName =
                student.education_level_name ||
                student.education_level ||
                student.level ||
                student.السنة;
              if (educationLevelName) {
                education_level_id = await findOrCreateReferenceData(
                  "education_level",
                  educationLevelName
                );
              }

              // Find or create specialty
              const specialtyName =
                student.specialty_name || student.specialty || student.الشعبة;
              if (specialtyName) {
                specialty_id = await findOrCreateReferenceData(
                  "specialty",
                  specialtyName
                );
              }

              // Find or create section
              const sectionName =
                student.section_name || student.section || student.القسم;
              if (sectionName) {
                section_id = await findOrCreateReferenceData(
                  "sections",
                  sectionName
                );
              }

              // Find or create education system
              const educationSystemName =
                student.education_system_name ||
                student.education_system ||
                student.system ||
                student["نظام التمدرس"] ||
                student["نظام التدريس"];
              if (educationSystemName) {
                education_system_id = await findOrCreateReferenceData(
                  "education_system",
                  educationSystemName
                );
              }
            } catch (refErr) {
              console.error(
                `Error processing reference data for student ${registrationId}:`,
                refErr
              );
            }

            // Debug info
            console.log(`Processing student ${index + 1}/${students.length}:`, {
              registration_id: registrationId,
              name: `${student.first_name} ${student.last_name}`,
              education_level_id,
              education_level_name:
                student.education_level_name ||
                student.education_level ||
                student.level ||
                student.السنة,
              specialty_id,
              specialty_name:
                student.specialty_name || student.specialty || student.الشعبة,
              section_id,
              section_name:
                student.section_name || student.section || student.القسم,
              education_system_id,
              education_system_name:
                student.education_system_name ||
                student.education_system ||
                student.system ||
                student["نظام التمدرس"] ||
                student["نظام التدريس"],
            });

        // Check if student already exists
          db.get(
              "SELECT id FROM students WHERE registration_id = ?",
              [registrationId],
            (err, row) => {
                if (err) {
                  console.error(
                    `Error checking student existence for ID ${registrationId}:`,
                    err
                  );
                  errorCount++;
                  errors.push({ index, error: err.message });
                  return resolve();
                }

                if (row) {
          // Update existing student
            db.run(
              `UPDATE students SET 
                last_name = ?, 
                first_name = ?, 
                gender = ?, 
                birth_date = ?, 
                    birth_place = ?, 
                    birth_by_judgment = ?, 
                    birth_certificate = ?, 
                    birth_record_year = ?, 
                    birth_certificate_number = ?,
                    registration_number = ?,
                    registration_date = ?,
                    education_level_id = ?,
                    specialty_id = ?,
                    section_id = ?,
                    education_system_id = ?,
                active = 1 
              WHERE registration_id = ?`,
              [
                      student.last_name,
                      student.first_name,
                      student.gender,
                      formattedBirthDate,
                      student.birth_place,
                      student.birth_by_judgment,
                      student.birth_certificate,
                      student.birth_record_year,
                      student.birth_certificate_number,
                      student.registration_number,
                      formattedRegistrationDate,
                      education_level_id,
                      specialty_id,
                      section_id,
                      education_system_id,
                      registrationId,
                    ],
                    function (err) {
                if (err) {
                        console.error(
                          `Error updating student ${registrationId}:`,
                          err
                        );
                        errorCount++;
                        errors.push({ index, error: err.message });
                } else {
                        updateCount++;
                        console.log(
                          `Updated student ${registrationId}: ${student.first_name} ${student.last_name}`
                        );
                      }
                      processedCount++;
                  resolve();
              }
            );
        } else {
          // Insert new student
            db.run(
              `INSERT INTO students (
                    registration_id, 
                    last_name, 
                    first_name, 
                    gender, 
                    birth_date, 
                    birth_place, 
                    birth_by_judgment, 
                    birth_certificate, 
                    birth_record_year, 
                    birth_certificate_number,
                    registration_number,
                    registration_date,
                    education_level_id,
                    specialty_id,
                    section_id,
                    education_system_id,
                    active
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [
                      registrationId,
                      student.last_name,
                      student.first_name,
                      student.gender,
                      formattedBirthDate,
                      student.birth_place,
                      student.birth_by_judgment,
                      student.birth_certificate,
                      student.birth_record_year,
                      student.birth_certificate_number,
                      student.registration_number,
                      formattedRegistrationDate,
                      education_level_id,
                      specialty_id,
                      section_id,
                      education_system_id,
                    ],
                    function (err) {
                if (err) {
                        console.error(
                          `Error adding student ${registrationId}:`,
                          err
                        );
                        errorCount++;
                        errors.push({ index, error: err.message });
                } else {
                        successCount++;
                        console.log(
                          `Added student ${registrationId}: ${student.first_name} ${student.last_name}`
                        );
                      }
                      processedCount++;
                  resolve();
                    }
                  );
                }
              }
            );
          } catch (e) {
            console.error(`Error processing student at index ${index}:`, e);
            errorCount++;
            errors.push({ index, error: e.message });
            processedCount++;
            resolve();
          }
        });
      });

      return Promise.all(studentPromises);
    };

    // Load reference data then process students
    loadReferenceData()
      .then((referenceData) => {
        console.log("Reference data loaded successfully");
        return processStudents(referenceData);
      })
      .then(() => {
        // All students processed, commit the transaction
        db.run("COMMIT", (err) => {
          if (err) {
            console.error("Error committing transaction:", err);
            db.run("ROLLBACK");
            return res
              .status(500)
              .json({ error: "Database error during commit" });
          }

          console.log(
            `Import complete: ${successCount} added, ${updateCount} updated, ${errorCount} errors`
          );

          res.json({
            success: true,
            message: `تم استيراد البيانات بنجاح: ${successCount} طالب جديد، ${updateCount} طلاب تم تحديثهم، ${errorCount} أخطاء`,
            stats: {
              processed: processedCount,
              added: successCount,
              updated: updateCount,
              errors: errorCount,
            },
            errorDetails: errors.length > 0 ? errors : undefined,
          });
        });
      })
      .catch((err) => {
        console.error("Import process error:", err);
        db.run("ROLLBACK");
        res.status(500).json({ error: "Error during import process" });
      });
  });
});

// Teacher import endpoint - no auth required
app.post("/api/teachers/import", (req, res) => {
  const { teachers } = req.body;

  if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid teacher data provided",
    });
  }

  console.log(`Received ${teachers.length} teachers for import`);

  // We'll keep track of the processed records
  let processedCount = 0;
  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let errors = [];

  // Load reference data first (roles and subjects)
  Promise.all([
    new Promise((resolve, reject) => {
      db.all("SELECT id, name FROM teacher_roles", (err, rows) => {
        if (err) {
          console.error("Error loading teacher roles:", err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    }),
    new Promise((resolve, reject) => {
      db.all("SELECT id, name FROM subjects", (err, rows) => {
        if (err) {
          console.error("Error loading subjects:", err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    }),
  ])
    .then(([roles, subjects]) => {
      const referenceData = {
        roles,
        subjects,
      };

      console.log(
        `Loaded reference data: ${roles.length} roles, ${subjects.length} subjects`
      );

      // Process teachers with the reference data
      return processTeachers(teachers, referenceData);
    })
    .then(() => {
      console.log(
        `Import complete: ${successCount} added, ${updateCount} updated, ${errorCount} errors`
      );

      res.json({
        success: true,
        successCount,
        updateCount,
        errorCount,
        errors: errorCount > 0 ? errors : undefined,
      });
    })
    .catch((err) => {
      console.error("Error during teacher import:", err);

      res.status(500).json({
        success: false,
        message: "Error during import process",
        error: err.message,
      });
    });

  // Process each teacher and handle reference data
  function processTeachers(teachersList, referenceData) {
    console.log(
      `Starting to process ${teachersList.length} teachers with reference data`
    );

    // Function to convert Excel dates to standard format
    function convertExcelDate(excelDate) {
      if (!excelDate) return null;

      // If it's already a string in a date format, return as is
      if (typeof excelDate === "string" && excelDate.includes("/")) {
        return excelDate;
      }

      // If it's a numeric Excel date (days since 1/1/1900)
      if (
        typeof excelDate === "number" ||
        (typeof excelDate === "string" && !isNaN(excelDate) && excelDate > 1000)
      ) {
        try {
          const excelEpoch = new Date(1899, 11, 30);
          const daysSinceEpoch =
            typeof excelDate === "number" ? excelDate : parseInt(excelDate);
          const dateObj = new Date(
            excelEpoch.getTime() + daysSinceEpoch * 86400000
          );
          return dateObj.toISOString().split("T")[0]; // YYYY-MM-DD format
        } catch (err) {
          console.warn(`Failed to convert Excel date ${excelDate}:`, err);
          return excelDate;
        }
      }

      return excelDate;
    }

    const teacherPromises = teachersList.map((teacher, index) => {
      return new Promise(async (resolve) => {
        try {
          // Keep registration_id as a number if it's numeric
          let registrationId = teacher.registration_id;
          if (typeof registrationId === "string" && !isNaN(registrationId)) {
            registrationId = Number(registrationId);
            console.log(
              `Converted registration_id string "${teacher.registration_id}" to number: ${registrationId}`
            );
          }

          // Convert Excel dates
          const formattedBirthDate = convertExcelDate(teacher.birth_date);
          const formattedStartDate = convertExcelDate(
            teacher.start_date || teacher["تاريخ السريان"]
          );

          // Process reference data - create if doesn't exist
          let roleId = null;
          let subjectId = null;

          try {
            // Find or create role
            const roleName = teacher.role_name || teacher["الرتبة"];
            if (roleName) {
              roleId = await findOrCreateReferenceData(
                "teacher_roles",
                roleName
              );
            }

            // Find or create subject
            const subjectName = teacher.subject_name || teacher["المادة"];
            if (subjectName) {
              subjectId = await findOrCreateReferenceData(
                "subjects",
                subjectName
              );
            }
          } catch (refErr) {
            console.error(
              `Error processing reference data for teacher ${registrationId}:`,
              refErr
            );
          }

          // Debug info
          console.log(
            `Processing teacher ${index + 1}/${teachersList.length}:`,
            {
              registration_id: registrationId,
              name: `${teacher.first_name || teacher["الاسم"]} ${
                teacher.last_name || teacher["اللقب"]
              }`,
              role_id: roleId,
              role_name: teacher.role_name || teacher["الرتبة"],
              subject_id: subjectId,
              subject_name: teacher.subject_name || teacher["المادة"],
              level: teacher.level || teacher["الدرجة"],
            }
          );

          // Check if teacher already exists
          db.get(
            "SELECT id FROM teachers WHERE registration_id = ?",
            [registrationId],
            (err, row) => {
              if (err) {
                console.error(
                  `Error checking teacher existence for ID ${registrationId}:`,
                  err
                );
                errorCount++;
                errors.push({ index, error: err.message });
                return resolve();
              }

              if (row) {
                // Update existing teacher
                console.log(
                  `Updating existing teacher: ${
                    teacher.first_name || teacher["الاسم"]
                  } ${teacher.last_name || teacher["اللقب"]}, ID: ${row.id}`
                );

                db.run(
                  `UPDATE teachers SET 
                  last_name = ?, 
                  first_name = ?, 
                  gender = ?, 
                  birth_date = ?, 
                  role_id = ?,
                  subject_id = ?,
                  level = ?,
                  start_date = ?,
                  active = 1
                WHERE registration_id = ?`,
                  [
                    teacher.last_name || teacher["اللقب"],
                    teacher.first_name || teacher["الاسم"],
                    teacher.gender,
                    formattedBirthDate,
                    roleId,
                    subjectId,
                    teacher.level || teacher["الدرجة"],
                    formattedStartDate,
                    registrationId,
                  ],
                  function (err) {
                    if (err) {
                      console.error(
                        `Error updating teacher ${registrationId}:`,
                        err
                      );
                      errorCount++;
                      errors.push({ index, error: err.message });
                    } else {
                      updateCount++;
                      console.log(
                        `Updated teacher ${registrationId}: ${
                          teacher.first_name || teacher["الاسم"]
                        } ${teacher.last_name || teacher["اللقب"]}`
                      );
                    }
                    processedCount++;
                    resolve();
                  }
                );
              } else {
                // Insert new teacher
                console.log(
                  `Inserting new teacher: ${
                    teacher.first_name || teacher["الاسم"]
                  } ${teacher.last_name || teacher["اللقب"]}`
                );

                db.run(
                  `INSERT INTO teachers (
                    registration_id, 
                    last_name, 
                    first_name, 
                    gender, 
                    birth_date, 
                    role_id,
                    subject_id,
                    level,
                    start_date,
                    active
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                  [
                    registrationId,
                    teacher.last_name || teacher["اللقب"],
                    teacher.first_name || teacher["الاسم"],
                    teacher.gender,
                    formattedBirthDate,
                    roleId,
                    subjectId,
                    teacher.level || teacher["الدرجة"],
                    formattedStartDate,
                  ],
                  function (err) {
                    if (err) {
                      console.error(
                        `Error adding teacher ${registrationId}:`,
                        err
                      );
                      errorCount++;
                      errors.push({ index, error: err.message });
                    } else {
                      successCount++;
                      console.log(
                        `Added teacher ${registrationId}: ${
                          teacher.first_name || teacher["الاسم"]
                        } ${teacher.last_name || teacher["اللقب"]}`
                      );
                    }
                    processedCount++;
                    resolve();
                  }
                );
              }
            }
          );
        } catch (e) {
          console.error(`Error processing teacher at index ${index}:`, e);
          errorCount++;
          errors.push({ index, error: e.message });
          processedCount++;
          resolve();
        }
      });
    });

    return Promise.all(teacherPromises);
  }
});

// Get all teacher roles
app.get("/api/teacher-roles", (req, res) => {
  db.all("SELECT * FROM teacher_roles", (err, rows) => {
    if (err) {
      console.error("Error getting teacher roles:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// Get all subjects
app.get("/api/subjects", (req, res) => {
  db.all("SELECT * FROM subjects", (err, rows) => {
    if (err) {
      console.error("Error getting subjects:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// Get all teachers with related data
app.get("/api/teachers", (req, res) => {
  console.log("GET /api/teachers called");

  const query = `
    SELECT 
      t.*,
      r.name as role_name,
      s.name as subject_name
    FROM teachers t
    LEFT JOIN teacher_roles r ON t.role_id = r.id
    LEFT JOIN subjects s ON t.subject_id = s.id
    ORDER BY t.last_name, t.first_name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving teachers:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    console.log(`Returning ${rows ? rows.length : 0} teachers`);
    if (rows && rows.length > 0) {
      console.log("Sample teacher data:", rows[0]);
    }

    res.json(rows);
  });
});

// Import teachers from Excel file
app.post("/api/teachers/import", (req, res) => {
  const { teachers } = req.body;

  if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid teacher data provided",
    });
  }

  console.log(`Received ${teachers.length} teachers for import`);

  // We'll keep track of the processed records
  let processedCount = 0;
  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let errors = [];

  // Load reference data first (roles and subjects)
  Promise.all([
    new Promise((resolve, reject) => {
      db.all("SELECT id, name FROM teacher_roles", (err, rows) => {
        if (err) {
          console.error("Error loading teacher roles:", err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    }),
    new Promise((resolve, reject) => {
      db.all("SELECT id, name FROM subjects", (err, rows) => {
        if (err) {
          console.error("Error loading subjects:", err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    }),
  ])
    .then(([roles, subjects]) => {
      const referenceData = {
        roles,
        subjects,
      };

      console.log(
        `Loaded reference data: ${roles.length} roles, ${subjects.length} subjects`
      );

      // Process teachers with the reference data
      return processTeachers(teachers, referenceData);
    })
    .then(() => {
      console.log(
        `Import complete: ${successCount} added, ${updateCount} updated, ${errorCount} errors`
      );

      res.json({
        success: true,
        successCount,
        updateCount,
        errorCount,
        errors: errorCount > 0 ? errors : undefined,
      });
    })
    .catch((err) => {
      console.error("Error during teacher import:", err);

    res.status(500).json({
      success: false,
        message: "Error during import process",
        error: err.message,
      });
    });

  // Process each teacher and handle reference data
  function processTeachers(teachersList, referenceData) {
    console.log(
      `Starting to process ${teachersList.length} teachers with reference data`
    );

    // Function to convert Excel dates to standard format
    function convertExcelDate(excelDate) {
      if (!excelDate) return null;

      // If it's already a string in a date format, return as is
      if (typeof excelDate === "string" && excelDate.includes("/")) {
        return excelDate;
      }

      // If it's a numeric Excel date (days since 1/1/1900)
      if (
        typeof excelDate === "number" ||
        (typeof excelDate === "string" && !isNaN(excelDate) && excelDate > 1000)
      ) {
        try {
          const excelEpoch = new Date(1899, 11, 30);
          const daysSinceEpoch =
            typeof excelDate === "number" ? excelDate : parseInt(excelDate);
          const dateObj = new Date(
            excelEpoch.getTime() + daysSinceEpoch * 86400000
          );
          return dateObj.toISOString().split("T")[0]; // YYYY-MM-DD format
        } catch (err) {
          console.warn(`Failed to convert Excel date ${excelDate}:`, err);
          return excelDate;
        }
      }

      return excelDate;
    }

    const teacherPromises = teachersList.map((teacher, index) => {
      return new Promise(async (resolve) => {
        try {
          // Keep registration_id as a number if it's numeric
          let registrationId = teacher.registration_id;
          if (typeof registrationId === "string" && !isNaN(registrationId)) {
            registrationId = Number(registrationId);
            console.log(
              `Converted registration_id string "${teacher.registration_id}" to number: ${registrationId}`
            );
          }

          // Convert Excel dates
          const formattedBirthDate = convertExcelDate(teacher.birth_date);
          const formattedStartDate = convertExcelDate(
            teacher.start_date || teacher["تاريخ السريان"]
          );

          // Process reference data - create if doesn't exist
          let roleId = null;
          let subjectId = null;

          try {
            // Find or create role
            const roleName = teacher.role_name || teacher["الرتبة"];
            if (roleName) {
              roleId = await findOrCreateReferenceData(
                "teacher_roles",
                roleName
              );
            }

            // Find or create subject
            const subjectName = teacher.subject_name || teacher["المادة"];
            if (subjectName) {
              subjectId = await findOrCreateReferenceData(
                "subjects",
                subjectName
              );
            }
          } catch (refErr) {
            console.error(
              `Error processing reference data for teacher ${registrationId}:`,
              refErr
            );
          }

          // Debug info
          console.log(
            `Processing teacher ${index + 1}/${teachersList.length}:`,
            {
              registration_id: registrationId,
              name: `${teacher.first_name || teacher["الاسم"]} ${
                teacher.last_name || teacher["اللقب"]
              }`,
              role_id: roleId,
              role_name: teacher.role_name || teacher["الرتبة"],
              subject_id: subjectId,
              subject_name: teacher.subject_name || teacher["المادة"],
              level: teacher.level || teacher["الدرجة"],
            }
          );

          // Check if teacher already exists
          db.get(
            "SELECT id FROM teachers WHERE registration_id = ?",
            [registrationId],
            (err, row) => {
              if (err) {
                console.error(
                  `Error checking teacher existence for ID ${registrationId}:`,
                  err
                );
                errorCount++;
                errors.push({ index, error: err.message });
                return resolve();
              }

              if (row) {
                // Update existing teacher
                console.log(
                  `Updating existing teacher: ${
                    teacher.first_name || teacher["الاسم"]
                  } ${teacher.last_name || teacher["اللقب"]}, ID: ${row.id}`
                );

                db.run(
                  `UPDATE teachers SET 
                  last_name = ?, 
                  first_name = ?, 
                  gender = ?, 
                  birth_date = ?, 
                  role_id = ?,
                  subject_id = ?,
                  level = ?,
                  start_date = ?,
                  active = 1
                WHERE registration_id = ?`,
                  [
                    teacher.last_name || teacher["اللقب"],
                    teacher.first_name || teacher["الاسم"],
                    teacher.gender,
                    formattedBirthDate,
                    roleId,
                    subjectId,
                    teacher.level || teacher["الدرجة"],
                    formattedStartDate,
                    registrationId,
                  ],
                  function (err) {
                    if (err) {
                      console.error(
                        `Error updating teacher ${registrationId}:`,
                        err
                      );
                      errorCount++;
                      errors.push({ index, error: err.message });
                    } else {
                      updateCount++;
                      console.log(
                        `Updated teacher ${registrationId}: ${
                          teacher.first_name || teacher["الاسم"]
                        } ${teacher.last_name || teacher["اللقب"]}`
                      );
                    }
                    processedCount++;
                    resolve();
                  }
                );
              } else {
                // Insert new teacher
                console.log(
                  `Inserting new teacher: ${
                    teacher.first_name || teacher["الاسم"]
                  } ${teacher.last_name || teacher["اللقب"]}`
                );

                db.run(
                  `INSERT INTO teachers (
                    registration_id, 
                    last_name, 
                    first_name, 
                    gender, 
                    birth_date, 
                    role_id,
                    subject_id,
                    level,
                    start_date,
                    active
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                  [
                    registrationId,
                    teacher.last_name || teacher["اللقب"],
                    teacher.first_name || teacher["الاسم"],
                    teacher.gender,
                    formattedBirthDate,
                    roleId,
                    subjectId,
                    teacher.level || teacher["الدرجة"],
                    formattedStartDate,
                  ],
                  function (err) {
                    if (err) {
                      console.error(
                        `Error adding teacher ${registrationId}:`,
                        err
                      );
                      errorCount++;
                      errors.push({ index, error: err.message });
                    } else {
                      successCount++;
                      console.log(
                        `Added teacher ${registrationId}: ${
                          teacher.first_name || teacher["الاسم"]
                        } ${teacher.last_name || teacher["اللقب"]}`
                      );
                    }
                    processedCount++;
                    resolve();
                  }
                );
              }
            }
          );
        } catch (e) {
          console.error(`Error processing teacher at index ${index}:`, e);
          errorCount++;
          errors.push({ index, error: e.message });
          processedCount++;
          resolve();
        }
      });
    });

    return Promise.all(teacherPromises);
  }
});

// Subjects endpoints
app.get("/api/subjects", (req, res) => {
  db.all("SELECT * FROM subjects WHERE active = 1", [], (err, rows) => {
    if (err) {
      console.error("Error fetching subjects:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows || []);
  });
});

app.post("/api/subjects", (req, res) => {
  const { name, description } = req.body;
  db.run(
    "INSERT INTO subjects (name, description) VALUES (?, ?)",
    [name, description],
    function (err) {
      if (err) {
        console.error("Error creating subject:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/api/subjects/:id", (req, res) => {
  const { name, description, active } = req.body;
  db.run(
    "UPDATE subjects SET name = ?, description = ?, active = ? WHERE id = ?",
    [name, description, active ? 1 : 0, req.params.id],
    function (err) {
      if (err) {
        console.error("Error updating subject:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Subject not found" });
      }
      res.json({ success: true });
    }
  );
});

// Class Schedule endpoints
app.get("/api/class-schedules", (req, res) => {
  // Optional query parameters for filtering
  const sectionId = req.query.section_id;
  const teacherId = req.query.teacher_id;

  let query = `
    SELECT cs.*, 
           s.name as section_name,
           t.first_name || ' ' || t.last_name as teacher_name,
           sub.name as subject_name
    FROM class_schedule cs
    JOIN sections s ON cs.section_id = s.id
    JOIN teachers t ON cs.teacher_id = t.id
    JOIN subjects sub ON cs.subject_id = sub.id
    WHERE cs.active = 1
  `;

  const params = [];

  if (sectionId) {
    query += " AND cs.section_id = ?";
    params.push(sectionId);
  }

  if (teacherId) {
    query += " AND cs.teacher_id = ?";
    params.push(teacherId);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching class schedules:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows || []);
  });
});

app.post("/api/class-schedules", (req, res) => {
  const {
    section_id,
    teacher_id,
    subject_id,
    day_of_week,
    start_time,
    end_time,
    room,
  } = req.body;

  // Validate required fields
  if (
    !section_id ||
    !teacher_id ||
    !subject_id ||
    !day_of_week ||
    !start_time ||
    !end_time
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    `INSERT INTO class_schedule (
      section_id, teacher_id, subject_id, day_of_week, start_time, end_time, room
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      section_id,
      teacher_id,
      subject_id,
      day_of_week,
      start_time,
      end_time,
      room,
    ],
    function (err) {
      if (err) {
        console.error("Error creating class schedule:", err);
        if (err.message.includes("UNIQUE constraint failed")) {
          return res
            .status(400)
            .json({ error: "This schedule overlaps with an existing one" });
        }
        return res.status(500).json({ error: "Internal server error" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/api/class-schedules/:id", (req, res) => {
  const {
    section_id,
    teacher_id,
    subject_id,
    day_of_week,
    start_time,
    end_time,
    room,
    active,
  } = req.body;

  db.run(
    `UPDATE class_schedule SET 
      section_id = ?, 
      teacher_id = ?, 
      subject_id = ?, 
      day_of_week = ?,
      start_time = ?,
      end_time = ?,
      room = ?,
      active = ?
    WHERE id = ?`,
    [
      section_id,
      teacher_id,
      subject_id,
      day_of_week,
      start_time,
      end_time,
      room,
      active ? 1 : 0,
      req.params.id,
    ],
    function (err) {
      if (err) {
        console.error("Error updating class schedule:", err);
        if (err.message.includes("UNIQUE constraint failed")) {
          return res
            .status(400)
            .json({ error: "This schedule overlaps with an existing one" });
        }
        return res.status(500).json({ error: "Internal server error" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Class schedule not found" });
      }
      res.json({ success: true });
    }
  );
});

// Attendance endpoints
app.get("/api/attendance", (req, res) => {
  // Optional query parameters for filtering
  const studentId = req.query.student_id;
  const classScheduleId = req.query.class_schedule_id;
  const date = req.query.date;
  const sectionId = req.query.section_id;

  let query = `
    SELECT a.*, 
           s.first_name || ' ' || s.last_name as student_name,
           cs.day_of_week, cs.start_time, cs.end_time,
           sec.name as section_name,
           sub.name as subject_name,
           t.first_name || ' ' || t.last_name as teacher_name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN class_schedule cs ON a.class_schedule_id = cs.id
    JOIN sections sec ON cs.section_id = sec.id
    JOIN subjects sub ON cs.subject_id = sub.id
    JOIN teachers t ON cs.teacher_id = t.id
  `;

  const whereConditions = [];
  const params = [];

  if (studentId) {
    whereConditions.push("a.student_id = ?");
    params.push(studentId);
  }

  if (classScheduleId) {
    whereConditions.push("a.class_schedule_id = ?");
    params.push(classScheduleId);
  }

  if (date) {
    whereConditions.push("a.attendance_date = ?");
    params.push(date);
  }

  if (sectionId) {
    whereConditions.push("cs.section_id = ?");
    params.push(sectionId);
  }

  if (whereConditions.length > 0) {
    query += " WHERE " + whereConditions.join(" AND ");
  }

  query += " ORDER BY a.attendance_date DESC, cs.start_time";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching attendance records:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows || []);
  });
});

app.post("/api/attendance", (req, res) => {
  const {
    student_id,
    class_schedule_id,
    attendance_date,
    status,
    notes,
    created_by,
  } = req.body;

  // Validate required fields
  if (!student_id || !class_schedule_id || !attendance_date || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Begin transaction for atomicity
  db.run("BEGIN TRANSACTION", (err) => {
    if (err) {
      console.error("Begin transaction error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    // Check if record already exists
    db.get(
      "SELECT id FROM attendance WHERE student_id = ? AND class_schedule_id = ? AND attendance_date = ?",
      [student_id, class_schedule_id, attendance_date],
      (err, row) => {
        if (err) {
          console.error("Error checking attendance record:", err);
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Internal server error" });
        }

        let operation;

        if (row) {
          // Update existing record
          operation = db.run(
            `UPDATE attendance SET status = ?, notes = ?, created_by = ? 
             WHERE student_id = ? AND class_schedule_id = ? AND attendance_date = ?`,
            [
              status,
              notes,
              created_by,
              student_id,
              class_schedule_id,
              attendance_date,
            ],
            updateComplete
          );
        } else {
          // Insert new record
          operation = db.run(
            `INSERT INTO attendance (
              student_id, class_schedule_id, attendance_date, status, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              student_id,
              class_schedule_id,
              attendance_date,
              status,
              notes,
              created_by,
            ],
            insertComplete
          );
        }

        function updateComplete(err) {
          if (err) {
            console.error("Error updating attendance record:", err);
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Internal server error" });
          }
          updateAttendanceSummary();
        }

        function insertComplete(err) {
          if (err) {
            console.error("Error inserting attendance record:", err);
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Internal server error" });
          }
          updateAttendanceSummary();
        }

        function updateAttendanceSummary() {
          // Get section_id and subject_id from class_schedule
          db.get(
            "SELECT section_id, subject_id FROM class_schedule WHERE id = ?",
            [class_schedule_id],
            (err, scheduleData) => {
              if (err || !scheduleData) {
                console.error("Error getting schedule data:", err);
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Internal server error" });
              }

              // Extract date components for summary aggregation
              const date = new Date(attendance_date);
              const month = date.getMonth() + 1; // 1-12
              const year = date.getFullYear();
              const academic_year = `${year}-${year + 1}`;

              // Update summary table - first check if record exists
              db.get(
                `SELECT id FROM attendance_summary 
                 WHERE student_id = ? AND section_id = ? AND subject_id = ? AND academic_year = ? AND month = ?`,
                [
                  student_id,
                  scheduleData.section_id,
                  scheduleData.subject_id,
                  academic_year,
                  month,
                ],
                (err, summaryRecord) => {
                  if (err) {
                    console.error("Error checking summary record:", err);
                    db.run("ROLLBACK");
                    return res
                      .status(500)
                      .json({ error: "Internal server error" });
                  }

                  // Get current counts to update properly
                  db.all(
                    `SELECT status, COUNT(*) as count FROM attendance 
                     WHERE student_id = ? AND attendance_date LIKE ? 
                     AND class_schedule_id IN (
                       SELECT id FROM class_schedule 
                       WHERE section_id = ? AND subject_id = ?
                     )
                     GROUP BY status`,
                    [
                      student_id,
                      `${year}-${month.toString().padStart(2, "0")}%`,
                      scheduleData.section_id,
                      scheduleData.subject_id,
                    ],
                    (err, statusCounts) => {
                      if (err) {
                        console.error("Error calculating status counts:", err);
                        db.run("ROLLBACK");
                        return res
                          .status(500)
                          .json({ error: "Internal server error" });
                      }

                      // Initialize counts
                      let present_count = 0;
                      let absent_count = 0;
                      let late_count = 0;
                      let excused_count = 0;

                      // Update counts from query results
                      statusCounts.forEach((item) => {
                        if (item.status === "present")
                          present_count = item.count;
                        else if (item.status === "absent")
                          absent_count = item.count;
                        else if (item.status === "late")
                          late_count = item.count;
                        else if (item.status === "excused")
                          excused_count = item.count;
                      });

                      if (summaryRecord) {
                        // Update existing summary
                        db.run(
                          `UPDATE attendance_summary SET 
                           present_count = ?, absent_count = ?, late_count = ?, excused_count = ?,
                           last_updated = CURRENT_TIMESTAMP
                           WHERE id = ?`,
                          [
                            present_count,
                            absent_count,
                            late_count,
                            excused_count,
                            summaryRecord.id,
                          ],
                          completeTransaction
                        );
                      } else {
                        // Insert new summary
                        db.run(
                          `INSERT INTO attendance_summary (
                            student_id, section_id, subject_id, academic_year, month,
                            present_count, absent_count, late_count, excused_count, last_updated
                          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                          [
                            student_id,
                            scheduleData.section_id,
                            scheduleData.subject_id,
                            academic_year,
                            month,
                            present_count,
                            absent_count,
                            late_count,
                            excused_count,
                          ],
                          completeTransaction
                        );
                      }
                    }
                  );
                }
              );
            }
          );
        }

        function completeTransaction(err) {
          if (err) {
            console.error("Error updating summary:", err);
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Internal server error" });
          }

          // Commit the transaction
          db.run("COMMIT", (err) => {
            if (err) {
              console.error("Commit error:", err);
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Internal server error" });
            }

            res.status(201).json({
              success: true,
              message: "Attendance record saved successfully",
            });
          });
        }
      }
    );
  });
});

// Batch attendance recording
app.post("/api/attendance/batch", (req, res) => {
  const { class_schedule_id, attendance_date, records, created_by } = req.body;

  // Validate required fields
  if (
    !class_schedule_id ||
    !attendance_date ||
    !records ||
    !Array.isArray(records)
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Begin transaction
  db.run("BEGIN TRANSACTION", (err) => {
    if (err) {
      console.error("Begin transaction error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    let success = 0;
    let errors = 0;

    // Get section_id and subject_id from class_schedule
    db.get(
      "SELECT section_id, subject_id FROM class_schedule WHERE id = ?",
      [class_schedule_id],
      (err, scheduleData) => {
        if (err || !scheduleData) {
          console.error("Error getting schedule data:", err);
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Internal server error" });
        }

        // Process each record
        const processRecord = (index) => {
          if (index >= records.length) {
            // All records processed, update summary and commit
            updateSummaryAndCommit();
            return;
          }

          const record = records[index];
          if (!record.student_id || !record.status) {
            errors++;
            processRecord(index + 1);
            return;
          }

          // Check if record already exists
          db.get(
            "SELECT id FROM attendance WHERE student_id = ? AND class_schedule_id = ? AND attendance_date = ?",
            [record.student_id, class_schedule_id, attendance_date],
            (err, row) => {
              if (err) {
                console.error("Error checking attendance record:", err);
                errors++;
                processRecord(index + 1);
                return;
              }

              if (row) {
                // Update existing record
                db.run(
                  `UPDATE attendance SET status = ?, notes = ?, created_by = ? 
                   WHERE id = ?`,
                  [record.status, record.notes || null, created_by, row.id],
                  (err) => {
                    if (err) {
                      console.error("Error updating attendance record:", err);
                      errors++;
                    } else {
                      success++;
                    }
                    processRecord(index + 1);
                  }
                );
              } else {
                // Insert new record
                db.run(
                  `INSERT INTO attendance (
                    student_id, class_schedule_id, attendance_date, status, notes, created_by
                  ) VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    record.student_id,
                    class_schedule_id,
                    attendance_date,
                    record.status,
                    record.notes || null,
                    created_by,
                  ],
                  (err) => {
                    if (err) {
                      console.error("Error inserting attendance record:", err);
                      errors++;
                    } else {
                      success++;
                    }
                    processRecord(index + 1);
                  }
                );
              }
            }
          );
        };

        function updateSummaryAndCommit() {
          // Update attendance summary for all affected students
          const students = [...new Set(records.map((r) => r.student_id))];

          // Extract date components for summary aggregation
          const date = new Date(attendance_date);
          const month = date.getMonth() + 1; // 1-12
          const year = date.getFullYear();
          const academic_year = `${year}-${year + 1}`;

          let updatedStudents = 0;

          const updateStudentSummary = (index) => {
            if (index >= students.length) {
              // All student summaries updated, commit transaction
              commitTransaction();
              return;
            }

            const student_id = students[index];

            // Get status counts for this student
            db.all(
              `SELECT status, COUNT(*) as count FROM attendance 
               WHERE student_id = ? AND attendance_date LIKE ? 
               AND class_schedule_id IN (
                 SELECT id FROM class_schedule 
                 WHERE section_id = ? AND subject_id = ?
               )
               GROUP BY status`,
              [
                student_id,
                `${year}-${month.toString().padStart(2, "0")}%`,
                scheduleData.section_id,
                scheduleData.subject_id,
              ],
              (err, statusCounts) => {
                if (err) {
                  console.error("Error calculating status counts:", err);
                  updateStudentSummary(index + 1);
                  return;
                }

                // Initialize counts
                let present_count = 0;
                let absent_count = 0;
                let late_count = 0;
                let excused_count = 0;

                // Update counts from query results
                statusCounts.forEach((item) => {
                  if (item.status === "present") present_count = item.count;
                  else if (item.status === "absent") absent_count = item.count;
                  else if (item.status === "late") late_count = item.count;
                  else if (item.status === "excused")
                    excused_count = item.count;
                });

                // Check if summary record exists
                db.get(
                  `SELECT id FROM attendance_summary 
                   WHERE student_id = ? AND section_id = ? AND subject_id = ? AND academic_year = ? AND month = ?`,
                  [
                    student_id,
                    scheduleData.section_id,
                    scheduleData.subject_id,
                    academic_year,
                    month,
                  ],
                  (err, summaryRecord) => {
                    if (err) {
                      console.error("Error checking summary record:", err);
                      updateStudentSummary(index + 1);
                      return;
                    }

                    if (summaryRecord) {
                      // Update existing summary
                      db.run(
                        `UPDATE attendance_summary SET 
                         present_count = ?, absent_count = ?, late_count = ?, excused_count = ?,
                         last_updated = CURRENT_TIMESTAMP
                         WHERE id = ?`,
                        [
                          present_count,
                          absent_count,
                          late_count,
                          excused_count,
                          summaryRecord.id,
                        ],
                        (err) => {
                          if (err) {
                            console.error("Error updating summary:", err);
                          } else {
                            updatedStudents++;
                          }
                          updateStudentSummary(index + 1);
                        }
                      );
                    } else {
                      // Insert new summary
                      db.run(
                        `INSERT INTO attendance_summary (
                          student_id, section_id, subject_id, academic_year, month,
                          present_count, absent_count, late_count, excused_count, last_updated
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [
                          student_id,
                          scheduleData.section_id,
                          scheduleData.subject_id,
                          academic_year,
                          month,
                          present_count,
                          absent_count,
                          late_count,
                          excused_count,
                        ],
                        (err) => {
                          if (err) {
                            console.error("Error inserting summary:", err);
                          } else {
                            updatedStudents++;
                          }
                          updateStudentSummary(index + 1);
                        }
                      );
                    }
                  }
                );
              }
            );
          };

          // Start processing student summaries
          updateStudentSummary(0);
        }

        function commitTransaction() {
          // Commit the transaction
          db.run("COMMIT", (err) => {
            if (err) {
              console.error("Commit error:", err);
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Internal server error" });
            }

            res.status(201).json({
              success: true,
              processed: records.length,
              successful: success,
              errors: errors,
              message: "Batch attendance records processed successfully",
            });
          });
        }

        // Start processing records
        processRecord(0);
      }
    );
  });
});

// Attendance reports and summaries
app.get("/api/attendance/summary", (req, res) => {
  // Optional query parameters for filtering
  const studentId = req.query.student_id;
  const sectionId = req.query.section_id;
  const subjectId = req.query.subject_id;
  const academicYear = req.query.academic_year;
  const month = req.query.month;

  let query = `
    SELECT ats.*, 
           s.first_name || ' ' || s.last_name as student_name,
           sec.name as section_name,
           sub.name as subject_name
    FROM attendance_summary ats
    JOIN students s ON ats.student_id = s.id
    JOIN sections sec ON ats.section_id = sec.id
    LEFT JOIN subjects sub ON ats.subject_id = sub.id
  `;

  const whereConditions = [];
  const params = [];

  if (studentId) {
    whereConditions.push("ats.student_id = ?");
    params.push(studentId);
  }

  if (sectionId) {
    whereConditions.push("ats.section_id = ?");
    params.push(sectionId);
  }

  if (subjectId) {
    whereConditions.push("ats.subject_id = ?");
    params.push(subjectId);
  }

  if (academicYear) {
    whereConditions.push("ats.academic_year = ?");
    params.push(academicYear);
  }

  if (month) {
    whereConditions.push("ats.month = ?");
    params.push(month);
  }

  if (whereConditions.length > 0) {
    query += " WHERE " + whereConditions.join(" AND ");
  }

  query += " ORDER BY ats.academic_year DESC, ats.month DESC, student_name";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching attendance summary:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows || []);
  });
});

// API endpoints for education levels
app.get("/api/education-levels", (req, res) => {
  db.all("SELECT * FROM education_level WHERE active = 1", [], (err, rows) => {
    if (err) {
      console.error("Error retrieving education levels:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

app.post("/api/education-levels", (req, res) => {
  const { name, description } = req.body;
  db.run(
    "INSERT INTO education_level (name, description) VALUES (?, ?)",
    [name, description],
    function (err) {
      if (err) {
        console.error("Error adding education level:", err);
        return res.status(500).json({ error: "Failed to add education level" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// API endpoints for specialties
app.get("/api/specialties", (req, res) => {
  db.all("SELECT * FROM specialty WHERE active = 1", [], (err, rows) => {
    if (err) {
      console.error("Error retrieving specialties:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

app.post("/api/specialties", (req, res) => {
  const { name, description } = req.body;
  db.run(
    "INSERT INTO specialty (name, description) VALUES (?, ?)",
    [name, description],
    function (err) {
      if (err) {
        console.error("Error adding specialty:", err);
        return res.status(500).json({ error: "Failed to add specialty" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// API endpoints for education systems
app.get("/api/education-systems", (req, res) => {
  db.all("SELECT * FROM education_system WHERE active = 1", [], (err, rows) => {
    if (err) {
      console.error("Error retrieving education systems:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

app.post("/api/education-systems", (req, res) => {
  const { name, description } = req.body;
  db.run(
    "INSERT INTO education_system (name, description) VALUES (?, ?)",
    [name, description],
    function (err) {
      if (err) {
        console.error("Error adding education system:", err);
        return res
          .status(500)
          .json({ error: "Failed to add education system" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = (attemptedPort) => {
  const server = app.listen(attemptedPort, () => {
    console.log(`Server running on port ${attemptedPort}`);

    // Update API_CONFIG.BASE_URL in frontend/js/database.js
    const fs = require("fs");
    const path = require("path");
    const databaseJsPath = path.join(
      __dirname,
      "..",
      "frontend",
      "js",
      "database.js"
    );

    try {
      if (fs.existsSync(databaseJsPath)) {
        let content = fs.readFileSync(databaseJsPath, "utf8");
        const newBaseUrl = `http://localhost:${attemptedPort}/api`;
        content = content.replace(
          /BASE_URL: "http:\/\/localhost:\d+\/api"/,
          `BASE_URL: "${newBaseUrl}"`
        );
        fs.writeFileSync(databaseJsPath, content, "utf8");
        console.log(
          `Updated API_CONFIG.BASE_URL in database.js to ${newBaseUrl}`
        );
      }
    } catch (err) {
      console.error("Could not update database.js:", err);
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${attemptedPort} is already in use, trying ${attemptedPort + 1}`
      );
      startServer(attemptedPort + 1);
    } else {
      console.error("Server error:", err);
    }
  });
};

// Try to start server with the configured port
startServer(port);

// Find or create reference data by name
const findOrCreateReferenceData = (tableName, name) => {
  return new Promise((resolve, reject) => {
    if (!name) {
      console.log(`No ${tableName} name provided, skipping creation`);
      resolve(null);
      return;
    }

    // Special case for numeric section names (just use the number as ID)
    if (
      tableName === "sections" &&
      !isNaN(name) &&
      String(name).trim().match(/^\d+$/)
    ) {
      const sectionId = parseInt(name);
      console.log(`Checking if section with ID ${sectionId} exists`);

      // Check if a section with this ID exists
      db.get(
        `SELECT id FROM ${tableName} WHERE id = ?`,
        [sectionId],
        (err, row) => {
          if (err) {
            console.error(`Error checking for section ID ${sectionId}:`, err);
            reject(err);
            return;
          }

          if (row) {
            console.log(
              `Found existing section with id ${sectionId}, using it`
            );
            resolve(sectionId);
            return;
          }

          // If section doesn't exist with this ID, create it
          console.log(`Creating new section with id ${sectionId}`);
          try {
            db.run(
              `INSERT INTO ${tableName} (id, name, description) VALUES (?, ?, ?)`,
              [
                sectionId,
                `Section ${sectionId}`,
                `Automatically created section ${sectionId}`,
              ],
              function (err) {
                if (err) {
                  console.error(
                    `Error creating section with ID ${sectionId}:`,
                    err
                  );
                  if (err.code === "SQLITE_CONSTRAINT") {
                    // If we get a constraint error, the section might have been created by another concurrent operation
                    // Just use the ID anyway
                    console.log(
                      `Constraint error for section ${sectionId}, but using the ID anyway`
                    );
                    resolve(sectionId);
                    return;
                  }
                  reject(err);
                  return;
                }

                console.log(`Created new section with id ${sectionId}`);
                resolve(sectionId);
              }
            );
          } catch (err) {
            console.error(
              `Exception creating section with ID ${sectionId}:`,
              err
            );
            // Fall back to using the ID even if creation failed
            resolve(sectionId);
          }
        }
      );
      return;
    }

    console.log(`Looking up ${tableName} with name: "${name}"`);

    // First check if it exists
    db.get(`SELECT id FROM ${tableName} WHERE name = ?`, [name], (err, row) => {
      if (err) {
        console.error(`Error checking for ${tableName}:`, err);
        reject(err);
        return;
      }

      if (row) {
        console.log(`Found existing ${tableName} with id ${row.id}`);
        resolve(row.id);
        return;
      }

      // If not exists, create it
      console.log(`Creating new ${tableName} with name: "${name}"`);
      try {
        db.run(
          `INSERT INTO ${tableName} (name) VALUES (?)`,
          [name],
          function (err) {
            if (err) {
              console.error(`Error creating ${tableName}:`, err);
              if (err.code === "SQLITE_CONSTRAINT") {
                // If we get a constraint error, the item might have been created by another concurrent operation
                // Try to look it up again
                db.get(
                  `SELECT id FROM ${tableName} WHERE name = ?`,
                  [name],
                  (err2, row2) => {
                    if (err2 || !row2) {
                      reject(err);
                      return;
                    }
                    console.log(
                      `Found ${tableName} on second try with id ${row2.id}`
                    );
                    resolve(row2.id);
                  }
                );
                return;
              }
              reject(err);
              return;
            }

            const newId = this.lastID;
            console.log(`Created new ${tableName} with id ${newId}`);
            resolve(newId);
          }
        );
      } catch (err) {
        console.error(`Exception creating ${tableName}:`, err);
        reject(err);
      }
    });
  });
};

// Get section details including teachers and students
app.get("/api/sections/:id", (req, res) => {
  const sectionId = req.params.id;
  const currentYear = new Date().getFullYear().toString();

  // Get basic section info
  db.get(
    `SELECT 
      s.*,
      el.name as education_level_name,
      sp.name as specialty_name,
      t.first_name as supervisor_first_name,
      t.last_name as supervisor_last_name
    FROM sections s
    LEFT JOIN education_level el ON s.education_level_id = el.id
    LEFT JOIN specialty sp ON s.specialty_id = sp.id
    LEFT JOIN teachers t ON s.teacher_id = t.id
    WHERE s.id = ?`,
    [sectionId],
    (err, section) => {
      if (err) {
        console.error("Error retrieving section:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }

      // Get teachers teaching in this section
      db.all(
        `SELECT DISTINCT 
          t.id, t.first_name, t.last_name,
          s.name as subject_name,
          cs.day_of_week, cs.start_time, cs.end_time, cs.room
        FROM class_schedule cs
        JOIN teachers t ON cs.teacher_id = t.id
        JOIN subjects s ON cs.subject_id = s.id
        WHERE cs.section_id = ? AND cs.active = 1`,
        [sectionId],
        (err, teachers) => {
          if (err) {
            console.error("Error retrieving section teachers:", err);
            return res.status(500).json({ error: "Internal server error" });
          }

          // Get students in this section
          db.all(
            `SELECT 
              s.id, s.registration_id, s.first_name, s.last_name,
              ss.enrollment_date, ss.status
            FROM students s
            JOIN student_section ss ON s.id = ss.student_id
            WHERE ss.section_id = ? AND ss.academic_year = ? AND s.active = 1`,
            [sectionId, currentYear],
            (err, students) => {
              if (err) {
                console.error("Error retrieving section students:", err);
                return res.status(500).json({ error: "Internal server error" });
              }

              res.json({
                ...section,
                teachers: teachers || [],
                students: students || [],
              });
            }
          );
        }
      );
    }
  );
});

// Get all sections with basic info including counts
app.get("/api/sections", (req, res) => {
  const currentYear = new Date().getFullYear().toString();

  db.all(
    `SELECT 
      s.*,
      el.name as education_level_name,
      sp.name as specialty_name,
      t.first_name as supervisor_first_name,
      t.last_name as supervisor_last_name,
      (
        SELECT COUNT(DISTINCT cs.teacher_id) 
        FROM class_schedule cs 
        WHERE cs.section_id = s.id AND cs.active = 1
      ) as teacher_count,
      (
        SELECT COUNT(DISTINCT ss.student_id) 
        FROM student_section ss 
        WHERE ss.section_id = s.id AND ss.academic_year = ?
      ) as student_count
    FROM sections s
    LEFT JOIN education_level el ON s.education_level_id = el.id
    LEFT JOIN specialty sp ON s.specialty_id = sp.id
    LEFT JOIN teachers t ON s.teacher_id = t.id
    WHERE s.active = 1
    ORDER BY s.name`,
    [currentYear],
    (err, sections) => {
      if (err) {
        console.error("Error retrieving sections:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(sections);
    }
  );
});

// Update section's supervisor teacher
app.put("/api/sections/:id/supervisor", (req, res) => {
  const { teacher_id } = req.body;

  db.run(
    "UPDATE sections SET teacher_id = ? WHERE id = ?",
    [teacher_id, req.params.id],
    function (err) {
      if (err) {
        console.error("Error updating section supervisor:", err);
        return res.status(500).json({ error: "Failed to update supervisor" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Section not found" });
      }
      res.json({ success: true });
    }
  );
});

// Add teacher schedule to section
app.post("/api/sections/:id/schedule", (req, res) => {
  const { teacher_id, subject_id, day_of_week, start_time, end_time, room } =
    req.body;

  db.run(
    `INSERT INTO class_schedule (
      section_id, teacher_id, subject_id, 
      day_of_week, start_time, end_time, room
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.params.id,
      teacher_id,
      subject_id,
      day_of_week,
      start_time,
      end_time,
      room,
    ],
    function (err) {
      if (err) {
        console.error("Error adding teacher schedule:", err);
        return res.status(500).json({ error: "Failed to add schedule" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Add student to section
app.post("/api/sections/:id/students", (req, res) => {
  const { student_id } = req.body;
  const currentYear = new Date().getFullYear().toString();

  db.run(
    `INSERT INTO student_section (
      student_id, section_id, academic_year, 
      enrollment_date, status
    ) VALUES (?, ?, ?, date('now'), 'active')`,
    [student_id, req.params.id, currentYear],
    function (err) {
      if (err) {
        console.error("Error adding student to section:", err);
        return res.status(500).json({ error: "Failed to add student" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});
