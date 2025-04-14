const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database connection
const dbPath = path.join(__dirname, "school.db");
console.log("Database path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Connected to SQLite database");
    // Check if tables exist before initializing
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='students'",
      [],
      (err, row) => {
        if (err) {
          console.error("Error checking database tables:", err);
          return;
        }

        if (!row) {
          // Tables don't exist, create them but don't populate with mock data
          console.log("Database tables don't exist, creating schema...");
          initDatabaseSchema();
        } else {
          console.log("Database tables already exist, skipping initialization");
        }
      }
    );
  }
});

// Initialize database tables without mock data
function initDatabaseSchema() {
  console.log("Initializing database tables...");
  db.serialize(() => {
    // Create education_level table (السنة - level of student)
    console.log("Creating education_level table...");
    db.run(
      `
      CREATE TABLE IF NOT EXISTS education_level (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,                    -- اسم المستوى التعليمي
        description TEXT,                    -- وصف المستوى
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
      (err) => {
        if (err) console.error("Error creating education_level table:", err);
        else {
          console.log("Education level table created successfully");
          seedEducationLevels();
        }
      }
    );

    // Create specialty table (الشعبة - student specialty)
    console.log("Creating specialty table...");
    db.run(
      `
      CREATE TABLE IF NOT EXISTS specialty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,                    -- اسم التخصص
        description TEXT,                    -- وصف التخصص
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
      (err) => {
        if (err) console.error("Error creating specialty table:", err);
        else {
          console.log("Specialty table created successfully");
          seedSpecialties();
        }
      }
    );

    // Create education_system table (نظام التمدرس - intern/extern)
    console.log("Creating education_system table...");
    db.run(
      `
      CREATE TABLE IF NOT EXISTS education_system (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,                    -- اسم نظام التمدرس
        description TEXT,                    -- وصف النظام
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      [],
      (err) => {
        if (err) console.error("Error creating education_system table:", err);
        else {
          console.log("Education system table created successfully");
          seedEducationSystems();
        }
      }
    );

    // Create sections table
    console.log("Creating sections table...");
    db.run(
      `
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,                    -- اسم القسم
        capacity INTEGER,                    -- سعة القسم
        year TEXT,                           -- السنة الدراسية
        teacher_id INTEGER,                  -- المعلم المسؤول
        education_level_id INTEGER,          -- مستوى التعليم لهذا القسم
        specialty_id INTEGER,                -- تخصص القسم
        description TEXT,                    -- وصف القسم
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers (id),
        FOREIGN KEY (education_level_id) REFERENCES education_level (id),
        FOREIGN KEY (specialty_id) REFERENCES specialty (id)
      )
    `,
      [],
      (err) => {
        if (err) console.error("Error creating sections table:", err);
        else console.log("Sections table created successfully");
      }
    );

    // Create students table with updated Arabic column names
    console.log("Creating students table...");
    db.run(
      `
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id TEXT UNIQUE,           -- رقم التعريف
        last_name TEXT,                        -- اللقب
        first_name TEXT,                       -- الاسم
        gender TEXT,                           -- الجنس
        birth_date TEXT,                       -- تاريخ الازدياد
        birth_place TEXT,                      -- مكان الازدياد
        birth_by_judgment TEXT,                -- مولود بحكم
        birth_certificate TEXT,                -- عقد الميلاد
        birth_record_year TEXT,                -- سنة التسجيل في سجل الولادات
        birth_certificate_number TEXT,         -- رقم عقد الميلاد
        registration_number TEXT,              -- رقم القيد
        registration_date TEXT,                -- تاريخ التسجيل بالمدرسة
        education_level_id INTEGER,            -- السنة (مستوى الطالب في المدرسة)
        specialty_id INTEGER,                  -- الشعبة (تخصص الطالب)
        section_id INTEGER,                    -- القسم (مكان الدراسة داخل المدرسة)
        education_system_id INTEGER,           -- نظام التمدرس (داخلي أو خارجي)
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (education_level_id) REFERENCES education_level (id),
        FOREIGN KEY (specialty_id) REFERENCES specialty (id),
        FOREIGN KEY (section_id) REFERENCES sections (id),
        FOREIGN KEY (education_system_id) REFERENCES education_system (id)
      )
    `,
      [],
      (err) => {
        if (err) console.error("Error creating students table:", err);
        else console.log("Students table created successfully");
      }
    );

    // Create teacher_roles table
    console.log("Creating teacher_roles table...");
    db.run(
      `
      CREATE TABLE IF NOT EXISTS teacher_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `,
      [],
      (err) => {
        if (err) console.error("Error creating teacher_roles table:", err);
        else console.log("Teacher_roles table created successfully");
      }
    );

    // Create subjects table
    console.log("Creating subjects table...");
    db.run(
      `
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `,
      [],
      (err) => {
        if (err) console.error("Error creating subjects table:", err);
        else console.log("Subjects table created successfully");
      }
    );

    // Create or update teachers table with all required fields
    console.log("Creating teachers table...");
    db.run(
      `
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        gender TEXT,
        birth_date TEXT,
        photo_path TEXT,
        role_id INTEGER,
        subject_id INTEGER,
        level INTEGER,
        start_date TEXT,
        email TEXT,
        phone TEXT,
        active INTEGER DEFAULT 1,
        FOREIGN KEY (role_id) REFERENCES teacher_roles(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )
    `,
      [],
      (err) => {
        if (err) console.error("Error creating teachers table:", err);
        else console.log("Teachers table created successfully");
      }
    );

    // Create class_schedule table
    console.log("Creating class_schedule table...");
    db.run(
      `CREATE TABLE IF NOT EXISTS class_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        day_of_week TEXT NOT NULL,      -- يوم الأسبوع
        start_time TEXT NOT NULL,       -- وقت البداية
        end_time TEXT NOT NULL,         -- وقت النهاية
        room TEXT,                      -- القاعة
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections (id),
        FOREIGN KEY (teacher_id) REFERENCES teachers (id),
        FOREIGN KEY (subject_id) REFERENCES subjects (id),
        UNIQUE(section_id, teacher_id, subject_id, day_of_week, start_time)
      )`,
      [],
      (err) => {
        if (err) console.error("Error creating class_schedule table:", err);
        else console.log("Class schedule table created successfully");
      }
    );

    // Create student_section table for tracking student enrollment in sections
    console.log("Creating student_section table...");
    db.run(
      `CREATE TABLE IF NOT EXISTS student_section (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        academic_year TEXT NOT NULL,     -- السنة الدراسية
        enrollment_date DATE NOT NULL,   -- تاريخ التسجيل
        status TEXT DEFAULT 'active',    -- الحالة (active, transferred, graduated)
        notes TEXT,                      -- ملاحظات
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (section_id) REFERENCES sections (id),
        UNIQUE(student_id, section_id, academic_year)
      )`,
      [],
      (err) => {
        if (err) console.error("Error creating student_section table:", err);
        else console.log("Student section table created successfully");
      }
    );

    // Create attendance table
    console.log("Creating attendance table...");
    db.run(
      `CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        class_schedule_id INTEGER NOT NULL,
        attendance_date DATE NOT NULL,
        status TEXT NOT NULL,           -- present, absent, late, excused
        notes TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (class_schedule_id) REFERENCES class_schedule (id),
        UNIQUE(student_id, class_schedule_id, attendance_date)
      )`,
      [],
      (err) => {
        if (err) console.error("Error creating attendance table:", err);
        else console.log("Attendance table created successfully");
      }
    );

    // Create attendance_summary table for monthly reports
    console.log("Creating attendance_summary table...");
    db.run(
      `CREATE TABLE IF NOT EXISTS attendance_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        subject_id INTEGER,
        academic_year TEXT NOT NULL,
        month INTEGER NOT NULL,         -- 1-12
        present_count INTEGER DEFAULT 0,
        absent_count INTEGER DEFAULT 0,
        late_count INTEGER DEFAULT 0,
        excused_count INTEGER DEFAULT 0,
        last_updated DATETIME,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (section_id) REFERENCES sections (id),
        FOREIGN KEY (subject_id) REFERENCES subjects (id),
        UNIQUE(student_id, section_id, subject_id, academic_year, month)
      )`,
      [],
      (err) => {
        if (err) console.error("Error creating attendance_summary table:", err);
        else console.log("Attendance summary table created successfully");
      }
    );

    console.log("Database tables initialization completed");
  });
}

// Functions for seeding data - keep these but don't call them automatically
function seedEducationLevels() {
  const levels = [
    { name: "السنة الأولى", description: "المستوى الأول من الدراسة" },
    { name: "السنة الثانية", description: "المستوى الثاني من الدراسة" },
    { name: "السنة الثالثة", description: "المستوى الثالث من الدراسة" },
    { name: "السنة الرابعة", description: "المستوى الرابع من الدراسة" },
    { name: "السنة الخامسة", description: "المستوى الخامس من الدراسة" },
    { name: "السنة السادسة", description: "المستوى السادس من الدراسة" },
  ];

  // Check if there are existing records
  db.get("SELECT COUNT(*) as count FROM education_level", [], (err, row) => {
    if (err) {
      console.error("Error checking education levels:", err);
      return;
    }

    // Only seed if table is empty
    if (row.count === 0) {
      console.log("Seeding education levels...");
      levels.forEach((level) => {
        db.run(
          "INSERT INTO education_level (name, description) VALUES (?, ?)",
          [level.name, level.description],
          (err) => {
            if (err) console.error("Error seeding education level:", err);
          }
        );
      });
    } else {
      console.log("Education levels table already has data, skipping seed");
    }
  });
}

function seedSpecialties() {
  const specialties = [
    { name: "علمي", description: "تخصص العلوم الطبيعية والفيزيائية" },
    { name: "أدبي", description: "تخصص العلوم الإنسانية والأدبية" },
    { name: "رياضي", description: "تخصص الرياضيات والإحصاء" },
    { name: "فني", description: "تخصص التقنيات والفنون التطبيقية" },
    {
      name: "جذع مشترك آداب",
      description: "تخصص مشترك للعلوم الأدبية والإنسانية",
    },
  ];

  // Check if there are existing records
  db.get("SELECT COUNT(*) as count FROM specialty", [], (err, row) => {
    if (err) {
      console.error("Error checking specialties:", err);
      return;
    }

    // Only seed if table is empty
    if (row.count === 0) {
      console.log("Seeding specialties...");
      specialties.forEach((specialty) => {
        db.run(
          "INSERT INTO specialty (name, description) VALUES (?, ?)",
          [specialty.name, specialty.description],
          (err) => {
            if (err) console.error("Error seeding specialty:", err);
          }
        );
      });
    } else {
      console.log("Specialties table already has data, skipping seed");
    }
  });
}

function seedEducationSystems() {
  const systems = [
    { name: "داخلي", description: "طالب مقيم داخل المدرسة" },
    { name: "خارجي", description: "طالب غير مقيم داخل المدرسة" },
  ];

  // Check if there are existing records
  db.get("SELECT COUNT(*) as count FROM education_system", [], (err, row) => {
    if (err) {
      console.error("Error checking education systems:", err);
      return;
    }

    // Only seed if table is empty
    if (row.count === 0) {
      console.log("Seeding education systems...");
      systems.forEach((system) => {
        db.run(
          "INSERT INTO education_system (name, description) VALUES (?, ?)",
          [system.name, system.description],
          (err) => {
            if (err) console.error("Error seeding education system:", err);
          }
        );
      });
    } else {
      console.log("Education systems table already has data, skipping seed");
    }
  });
}

function seedSections() {
  // We will add sections after education levels and specialties are created
  setTimeout(() => {
    // First, get the education levels
    db.all(
      "SELECT * FROM education_level WHERE active = 1",
      [],
      (err, educationLevels) => {
        if (err) {
          console.error("Error retrieving education levels:", err);
          return;
        }

        // Then get the specialties
        db.all(
          "SELECT * FROM specialty WHERE active = 1",
          [],
          (err, specialties) => {
            if (err) {
              console.error("Error retrieving specialties:", err);
              return;
            }

            // Check if there are existing records in the sections table
            db.get("SELECT COUNT(*) as count FROM sections", [], (err, row) => {
              if (err) {
                console.error("Error checking sections:", err);
                return;
              }

              // Only seed if table is empty
              if (row.count === 0) {
                console.log("Seeding sections...");

                // Create sections for each education level and specialty combination
                educationLevels.forEach((level) => {
                  // Extract the year number from the level name
                  const yearMatch = level.name.match(
                    /الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة/
                  );
                  if (!yearMatch) return;

                  // For first year, create common trunk sections
                  if (level.name.includes("الأولى")) {
                    // Create جذع مشترك آداب section
                    db.run(
                      `INSERT INTO sections (
                    name, 
                    capacity, 
                    education_level_id, 
                    specialty_id, 
                    description,
                    year,
                    active
                  ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
                      [
                        "جذع مشترك آداب",
                        40,
                        level.id,
                        specialties.find((s) => s.name === "أدبي")?.id,
                        "قسم مشترك للعلوم الأدبية والإنسانية",
                        new Date().getFullYear().toString(),
                      ],
                      (err) => {
                        if (err)
                          console.error("Error creating آداب section:", err);
                        else console.log("Created جذع مشترك آداب section");
                      }
                    );

                    // Create جذع مشترك علوم section
                    db.run(
                      `INSERT INTO sections (
                    name, 
                    capacity, 
                    education_level_id, 
                    specialty_id, 
                    description,
                    year,
                    active
                  ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
                      [
                        "جذع مشترك علوم",
                        40,
                        level.id,
                        specialties.find((s) => s.name === "علمي")?.id,
                        "قسم مشترك للعلوم الطبيعية والرياضيات",
                        new Date().getFullYear().toString(),
                      ],
                      (err) => {
                        if (err)
                          console.error("Error creating علوم section:", err);
                        else console.log("Created جذع مشترك علوم section");
                      }
                    );
                  } else {
                    // For other years, create sections for each specialty
                    specialties.forEach((specialty) => {
                      // Skip جذع مشترك specialty for non-first year
                      if (specialty.name.includes("جذع مشترك")) return;

                      // Create section A and B for each combination
                      ["أ", "ب"].forEach((suffix) => {
                        const sectionName = `${level.name} ${specialty.name} ${suffix}`;
                        db.run(
                          `INSERT INTO sections (
                        name, 
                        capacity, 
                        education_level_id, 
                        specialty_id, 
                        description,
                        year,
                        active
                      ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
                          [
                            sectionName,
                            35, // Standard capacity
                            level.id,
                            specialty.id,
                            `قسم ${specialty.name} للسنة ${level.name}`,
                            new Date().getFullYear().toString(),
                          ],
                          (err) => {
                            if (err)
                              console.error(
                                `Error creating section ${sectionName}:`,
                                err
                              );
                            else console.log(`Created section: ${sectionName}`);
                          }
                        );
                      });
                    });
                  }
                });
              } else {
                console.log("Sections table already has data, skipping seed");
              }
            });
          }
        );
      }
    );
  }, 1000); // Wait 1 second to ensure education levels and specialties are created first
}

// Export API for creating reference data manually when needed
const seedApi = {
  seedEducationLevels,
  seedSpecialties,
  seedEducationSystems,
  seedSections,
};

module.exports = { db, seedApi };
