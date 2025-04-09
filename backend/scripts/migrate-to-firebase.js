const {
  initializeFirebase,
  getFirebaseServices,
} = require("../config/firebase");
const { db } = require("../db");
const fs = require("fs");
const path = require("path");

async function migrateToFirebase() {
  try {
    // Initialize Firebase
    initializeFirebase();
    const { firestore, storage } = getFirebaseServices();

    console.log("Starting migration to Firebase...");

    // Migrate students
    console.log("Migrating students...");
    const students = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM students WHERE active = 1", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    for (const student of students) {
      await firestore.collection("students").doc(student.id.toString()).set({
        firstName: student.first_name,
        lastName: student.last_name,
        birthDate: student.birth_date,
        gender: student.gender,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Migrate teachers
    console.log("Migrating teachers...");
    const teachers = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM teachers WHERE active = 1", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    for (const teacher of teachers) {
      await firestore.collection("teachers").doc(teacher.id.toString()).set({
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        subject: teacher.subject,
        birthDate: teacher.birth_date,
        position: teacher.position,
        code: teacher.code,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Migrate sections
    console.log("Migrating sections...");
    const sections = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM sections WHERE active = 1", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    for (const section of sections) {
      await firestore.collection("sections").doc(section.id.toString()).set({
        name: section.name,
        capacity: section.capacity,
        teacherId: section.teacher_id,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Migrate files from uploads directory to Firebase Storage
    console.log("Migrating files...");
    const uploadsDir = path.join(__dirname, "../uploads");
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const fileStream = fs.createReadStream(filePath);
        await storage.bucket().file(`uploads/${file}`).save(fileStream);
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToFirebase();
}

module.exports = { migrateToFirebase };
