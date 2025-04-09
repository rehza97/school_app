/**
 * Database Connector
 * This file ensures that all pages are connected to the same database instance
 * It also provides a simple API to check database health and initialize data
 */

document.addEventListener("DOMContentLoaded", function () {
  // Check if the database is properly initialized
  if (typeof window.db === "undefined") {
    console.error(
      "Error: Database not found. Make sure database.js is loaded."
    );
    showDatabaseError("لم يتم العثور على قاعدة البيانات.");
    return;
  }

  // Initialize database if needed
  if (typeof window.db.initialize === "function") {
    window.db.initialize();
  }

  // Check if all required collections exist
  checkDatabaseIntegrity();

  // Initialize page data based on current page
  initCurrentPageData();

  console.log("Database connection established");
});

/**
 * Check database integrity
 * Makes sure all required collections exist
 */
function checkDatabaseIntegrity() {
  const requiredCollections = Object.values(window.STORAGE_KEYS || {});

  // No storage keys found
  if (requiredCollections.length === 0) {
    console.error("Error: No storage keys defined in database.");
    showDatabaseError("تعريفات قاعدة البيانات غير موجودة.");
    return;
  }

  // Check each collection
  let missingCollections = [];
  requiredCollections.forEach((key) => {
    const data = localStorage.getItem(key);
    if (data === null) {
      missingCollections.push(key);
      // Initialize empty collection
      localStorage.setItem(key, JSON.stringify([]));
    }
  });

  // Report missing collections
  if (missingCollections.length > 0) {
    console.warn("Created missing collections:", missingCollections.join(", "));
  }
}

/**
 * Initialize data for the current page
 */
function initCurrentPageData() {
  const currentPage = window.location.pathname.split("/").pop();

  switch (currentPage) {
    case "index.html":
    case "":
      // Dashboard page
      updateDashboardStats();
      break;

    case "students.html":
      // Students page
      if (typeof loadStudents === "function") {
        loadStudents();
      }
      break;

    case "teachers.html":
      // Teachers page
      if (typeof loadTeachers === "function") {
        loadTeachers();
      }
      break;

    case "classes.html":
      // Classes page
      if (typeof loadClasses === "function") {
        loadClasses();
      }
      break;

    case "attendance.html":
      // Attendance page
      if (typeof loadAttendance === "function") {
        loadAttendance();
      }
      break;

    case "reports.html":
      // Reports page
      if (typeof loadReports === "function") {
        loadReports();
      }
      break;

    case "student-profile.html":
      // Student profile page
      loadStudentProfile();
      break;
  }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
  try {
    // Update dashboard stats if elements exist
    const totalStudentsEl = document.getElementById("totalStudents");
    const totalTeachersEl = document.getElementById("totalTeachers");
    const totalClassesEl = document.getElementById("totalClasses");

    if (totalStudentsEl) {
      totalStudentsEl.textContent = window.db.students.getAll().length;
    }

    if (totalTeachersEl) {
      totalTeachersEl.textContent = window.db.teachers.getAll().length;
    }

    if (totalClassesEl) {
      totalClassesEl.textContent = window.db.classes.getAll().length;
    }
  } catch (error) {
    console.error("Error updating dashboard stats:", error);
  }
}

/**
 * Load student profile data
 */
function loadStudentProfile() {
  try {
    // Get student ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get("id");

    if (!studentId) {
      showDatabaseError("معرف الطالب غير موجود في الرابط.");
      return;
    }

    // Get student data
    const student = window.db.students.getById(studentId);

    if (!student) {
      showDatabaseError("لم يتم العثور على الطالب.");
      return;
    }

    // Update student profile if update function exists
    if (typeof updateStudentProfile === "function") {
      updateStudentProfile(student);
    }
  } catch (error) {
    console.error("Error loading student profile:", error);
    showDatabaseError("حدث خطأ أثناء تحميل ملف الطالب.");
  }
}

/**
 * Show database error message
 * @param {string} message - Error message to display
 */
function showDatabaseError(message) {
  const container = document.querySelector(".container") || document.body;

  // Create error message element
  const errorEl = document.createElement("div");
  errorEl.className = "database-error";
  errorEl.innerHTML = `
    <div class="error-icon"><i class="fas fa-database"></i></div>
    <h2>خطأ في قاعدة البيانات</h2>
    <p>${message}</p>
    <button class="btn-primary" onclick="window.location.href='index.html'">
      العودة للرئيسية
    </button>
  `;

  // Add error styles
  const style = document.createElement("style");
  style.textContent = `
    .database-error {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
      text-align: center;
      padding: 2rem;
    }
    .database-error .error-icon {
      font-size: 4rem;
      color: #e74c3c;
      margin-bottom: 1rem;
    }
    .database-error h2 {
      margin-bottom: 1rem;
    }
    .database-error button {
      margin-top: 2rem;
    }
  `;

  document.head.appendChild(style);
  container.appendChild(errorEl);
}
