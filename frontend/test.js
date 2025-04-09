const { db, initializeTables } = require("./db");

// Test functions for database operations
const TestDB = {
  // Add a new teacher
  async addTeacher(teacher) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO teachers (first_name, last_name, subject, birth_date, position) 
                        VALUES (?, ?, ?, ?, ?)`;
      db.run(
        sql,
        [
          teacher.firstName,
          teacher.lastName,
          teacher.subject,
          teacher.birthDate,
          teacher.position,
        ],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...teacher });
        }
      );
    });
  },

  // Get all teachers
  async getAllTeachers() {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM teachers WHERE active = 1";
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  // Update a teacher
  async updateTeacher(id, updates) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE teachers 
                        SET first_name = ?, last_name = ?, subject = ?, birth_date = ?, position = ?
                        WHERE id = ?`;
      db.run(
        sql,
        [
          updates.firstName,
          updates.lastName,
          updates.subject,
          updates.birthDate,
          updates.position,
          id,
        ],
        function (err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Delete a teacher (soft delete)
  async deleteTeacher(id) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE teachers SET active = 0 WHERE id = ?";
      db.run(sql, [id], function (err) {
        if (err) reject(err);
        resolve({ changes: this.changes });
      });
    });
  },
};

// Run test cases
async function runTests() {
  try {
    // First, initialize the database tables
    await initializeTables();

    console.log("Starting database tests...");

    // Test 1: Add a new teacher
    const newTeacher = {
      firstName: "محمد",
      lastName: "أحمد",
      subject: "رياضيات",
      birthDate: "1980-01-01",
      position: "مدرس أول",
    };
    console.log("\nTest 1: Adding a new teacher");
    const addedTeacher = await TestDB.addTeacher(newTeacher);
    console.log("Added teacher:", addedTeacher);

    // Test 2: Get all teachers
    console.log("\nTest 2: Getting all teachers");
    const allTeachers = await TestDB.getAllTeachers();
    console.log("All teachers:", allTeachers);

    // Test 3: Update a teacher
    const updateData = {
      ...newTeacher,
      position: "مدرس خبير",
    };
    console.log("\nTest 3: Updating teacher");
    const updateResult = await TestDB.updateTeacher(
      addedTeacher.id,
      updateData
    );
    console.log("Update result:", updateResult);

    // Test 4: Delete a teacher
    console.log("\nTest 4: Deleting teacher");
    const deleteResult = await TestDB.deleteTeacher(addedTeacher.id);
    console.log("Delete result:", deleteResult);

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      } else {
        console.log("Database connection closed");
      }
    });
  }
}

// Run the tests
runTests();
