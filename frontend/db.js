const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create a new database instance
const db = new sqlite3.Database(path.join(__dirname, "school.db"), (err) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Initialize database tables
function initializeTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create Students table
      db.run(
        `CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                birth_date TEXT,
                gender TEXT,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
        (err) => {
          if (err) reject(err);
        }
      );

      // Create Teachers table
      db.run(
        `CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                subject TEXT,
                birth_date TEXT,
                position TEXT,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
        (err) => {
          if (err) reject(err);
        }
      );

      // Create Sections table
      db.run(
        `CREATE TABLE IF NOT EXISTS sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                capacity INTEGER DEFAULT 30,
                teacher_id INTEGER,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id)
            )`,
        (err) => {
          if (err) reject(err);
          else {
            console.log("Database tables initialized");
            resolve();
          }
        }
      );
    });
  });
}

// Export database instance and initialization function
module.exports = {
  db,
  initializeTables,
};
