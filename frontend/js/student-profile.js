// Initialize Firebase
console.log("Starting student-profile.js...");

// Ensure Firebase is initialized
if (!firebase) {
  console.error("Firebase is not initialized!");
} else {
  console.log("Firebase is available");
}

// Initialize Firestore
const db = firebase.firestore();
console.log("Firestore initialized");

// Get student ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get("id");
console.log("Student ID from URL:", studentId);

// Student data
let studentData = null;

// Attendance data
let attendanceData = [];

// Notes data
let notesData = [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements after the document is loaded
  initializeDOMElements();
  initializeTheme();
  loadStudentData();
  setupTabNavigation();
  setupEventListeners();
});

// Initialize DOM elements
function initializeDOMElements() {
  window.studentFullName = document.getElementById("studentFullName");
  window.studentIdElement = document.getElementById("studentId");
  window.studentClass = document.getElementById("studentClass");
  window.studentBirthDate = document.getElementById("studentBirthDate");
  window.studentGender = document.getElementById("studentGender");
  window.attendanceRate = document.getElementById("attendanceRate");
  window.absenceDays = document.getElementById("absenceDays");
  window.totalDays = document.getElementById("totalDays");
  window.themeToggle = document.getElementById("themeToggle");
  window.notificationContainer = document.getElementById(
    "notificationContainer"
  );
  window.tabButtons = document.querySelectorAll(".tab-btn");
  window.tabPanels = document.querySelectorAll(".tab-panel");
  window.attendanceTableBody = document.getElementById("attendanceTableBody");
  window.notesContainer = document.getElementById("notesContainer");
  window.monthFilter = document.getElementById("monthFilter");
  window.editStudentBtn = document.getElementById("editStudentBtn");
  window.printProfileBtn = document.getElementById("printProfileBtn");
  window.addNoteBtn = document.getElementById("addNoteBtn");
  window.editContactBtn = document.getElementById("editContactBtn");

  // Student Profile Modal
  window.noteModal = document.getElementById("noteModal");
  window.noteModalCloseBtn = document.querySelector("#noteModal .close-btn");
  window.noteForm = document.getElementById("noteForm");
  window.cancelNoteBtn = document.getElementById("cancelNoteBtn");

  // Contact Info Modal
  window.contactModal = document.getElementById("contactModal");
  window.contactModalCloseBtn = document.querySelector(
    "#contactModal .close-btn"
  );
  window.contactForm = document.getElementById("contactForm");
  window.cancelContactBtn = document.getElementById("cancelContactBtn");

  // Contact Info Elements
  window.studentAddress = document.getElementById("studentAddress");
  window.studentPhone = document.getElementById("studentPhone");
  window.studentEmail = document.getElementById("studentEmail");
  window.parentName = document.getElementById("parentName");
  window.parentRelation = document.getElementById("parentRelation");
  window.parentPhone = document.getElementById("parentPhone");
  window.parentEmail = document.getElementById("parentEmail");
  window.parentAddress = document.getElementById("parentAddress");
}

// Initialize theme from localStorage
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

// Toggle theme between light and dark
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update theme icon
  updateThemeIcon(newTheme);

  // Show notification
  showNotification(
    newTheme === "dark" ? "تم تفعيل الوضع المظلم" : "تم تفعيل الوضع الفاتح",
    "info"
  );
}

// Update the theme toggle icon based on current theme
function updateThemeIcon(theme) {
  if (themeToggle) {
    const iconClass = theme === "dark" ? "fa-sun" : "fa-moon";
    themeToggle.innerHTML = `<i class="fas ${iconClass}"></i>`;
  }
}

// Show notification
function showNotification(message, type = "info") {
  if (!notificationContainer) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Create notification with icon
  let icon = "info-circle";
  if (type === "success") icon = "check-circle";
  if (type === "error") icon = "exclamation-circle";

  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  notificationContainer.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.add("active");
  }, 10);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Load student data
async function loadStudentData() {
  console.log("Loading student data for ID:", studentId);
  try {
    console.log("Attempting to fetch student document...");
    const studentDoc = await db.collection("students").doc(studentId).get();
    console.log("Fetch completed");

    if (!studentDoc.exists) {
      console.log("No student found with ID:", studentId);
      showNotification("الطالب غير موجود", "error");
      return;
    }

    console.log("Student document exists, getting data...");
    const student = studentDoc.data();
    console.log("Raw student data:", student);

    // Store student data globally
    studentData = student;

    // Update UI elements if they exist
    if (studentFullName)
      studentFullName.textContent = `${student.first_name} ${student.last_name}`;
    if (studentIdElement)
      studentIdElement.textContent = student.registration_id || studentId;
    if (studentGender) studentGender.textContent = student.gender || "غير محدد";
    if (studentBirthDate)
      studentBirthDate.textContent =
        formatDate(student.birth_date) || "غير محدد";

    // Load class info
    let classInfo = [];
    if (student.grade_ref) {
      try {
        const gradeDoc = await student.grade_ref.get();
        if (gradeDoc.exists) {
          classInfo.push(gradeDoc.data().name);
        }
      } catch (error) {
        console.error("Error loading grade info:", error);
      }
    }
    if (student.specialty_ref) {
      try {
        const specialtyDoc = await student.specialty_ref.get();
        if (specialtyDoc.exists) {
          classInfo.push(specialtyDoc.data().name);
        }
      } catch (error) {
        console.error("Error loading specialty info:", error);
      }
    }
    if (student.class_ref) {
      try {
        const classDoc = await student.class_ref.get();
        if (classDoc.exists) {
          classInfo.push(classDoc.data().name);
        }
      } catch (error) {
        console.error("Error loading class info:", error);
      }
    }
    if (studentClass)
      studentClass.textContent = classInfo.join(" - ") || "غير محدد";

    // Update contact info if elements exist
    if (studentAddress)
      studentAddress.textContent = student.address || "غير محدد";
    if (studentPhone) studentPhone.textContent = student.phone || "غير محدد";
    if (studentEmail) studentEmail.textContent = student.email || "غير محدد";
    if (parentName) parentName.textContent = student.parent_name || "غير محدد";
    if (parentRelation)
      parentRelation.textContent = student.parent_relation || "غير محدد";
    if (parentPhone)
      parentPhone.textContent = student.parent_phone || "غير محدد";
    if (parentEmail)
      parentEmail.textContent = student.parent_email || "غير محدد";
    if (parentAddress)
      parentAddress.textContent = student.parent_address || "غير محدد";

    // Load attendance stats
    loadAttendanceStats(studentId);

    // Load notes
    loadNotes();
  } catch (error) {
    console.error("Error loading student data:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الطالب", "error");
  }
}

// Load attendance statistics
async function loadAttendanceStats(studentId) {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 8, 1); // September 1st

    const attendanceSnapshot = await db
      .collection("attendance")
      .where("student_id", "==", studentId)
      .where("date", ">=", startOfYear)
      .get();

    const total = attendanceSnapshot.size;
    let present = 0;

    attendanceSnapshot.forEach((doc) => {
      if (doc.data().status === "present") {
        present++;
      }
    });

    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    attendanceRate.textContent = `${rate}%`;
    absenceDays.textContent = absent;
    totalDays.textContent = total;
  } catch (error) {
    console.error("Error loading attendance stats:", error);
    showNotification("حدث خطأ أثناء تحميل إحصائيات الحضور", "error");
  }
}

// Set up tabs navigation
function setupTabNavigation() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;

      // Remove active class from all buttons and panels
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanels.forEach((panel) => panel.classList.remove("active"));

      // Add active class to clicked button and corresponding panel
      button.classList.add("active");
      document.getElementById(`${target}-tab`).classList.add("active");
    });
  });
}

// Set up event listeners
function setupEventListeners() {
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Month filter for attendance
  if (monthFilter) {
    monthFilter.addEventListener("change", filterAttendanceByMonth);
  }

  // Edit student button
  if (editStudentBtn) {
    editStudentBtn.addEventListener("click", () => {
      window.location.href = `students.html?edit=${studentId}`;
    });
  }

  // Print profile button
  if (printProfileBtn) {
    printProfileBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Add note button
  if (addNoteBtn) {
    addNoteBtn.addEventListener("click", openNoteModal);
  }

  // Edit contact button
  if (editContactBtn) {
    editContactBtn.addEventListener("click", openContactModal);
  }

  // Note modal close button
  if (noteModalCloseBtn) {
    noteModalCloseBtn.addEventListener("click", closeNoteModal);
  }

  // Cancel note button
  if (cancelNoteBtn) {
    cancelNoteBtn.addEventListener("click", closeNoteModal);
  }

  // Note form submission
  if (noteForm) {
    noteForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const noteData = {
          student_id: studentId,
          date: e.target.noteDate.value,
          type: e.target.noteType.value,
          content: e.target.noteContent.value,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection("student_notes").add(noteData);
        showNotification("تم إضافة الملاحظة بنجاح", "success");

        // Reset form and reload notes
        e.target.reset();
        document.getElementById("noteModal").style.display = "none";
        loadNotes();
      } catch (error) {
        console.error("Error adding note:", error);
        showNotification("حدث خطأ أثناء إضافة الملاحظة", "error");
      }
    });
  }

  // Contact modal close button
  if (contactModalCloseBtn) {
    contactModalCloseBtn.addEventListener("click", closeContactModal);
  }

  // Cancel contact button
  if (cancelContactBtn) {
    cancelContactBtn.addEventListener("click", closeContactModal);
  }

  // Contact form submission
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);
  }
}

// Filter attendance data by month
function filterAttendanceByMonth() {
  const selectedMonth = monthFilter.value;

  if (!selectedMonth) {
    // Show all attendance records
    displayAttendanceData(attendanceData);
    return;
  }

  // Filter records by selected month
  const filteredData = attendanceData.filter((record) => {
    return record.date.getMonth() + 1 === parseInt(selectedMonth);
  });

  displayAttendanceData(filteredData);
}

// Display attendance data in the table
function displayAttendanceData(data) {
  if (!attendanceTableBody) return;

  attendanceTableBody.innerHTML = "";

  if (data.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="5" class="empty-data">لا توجد سجلات حضور</td>
    `;
    attendanceTableBody.appendChild(row);
    return;
  }

  data.forEach((record) => {
    const row = document.createElement("tr");

    // Format date
    const dateOptions = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = record.date.toLocaleDateString("ar-SA", dateOptions);

    // Get day name
    const dayOptions = { weekday: "long" };
    const dayName = record.date.toLocaleDateString("ar-SA", dayOptions);

    // Status translation and style
    let statusText = "حاضر";
    let statusClass = "present";

    if (record.status === "absent") {
      statusText = "غائب";
      statusClass = "absent";
    } else if (record.status === "late") {
      statusText = "متأخر";
      statusClass = "late";
    }

    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${dayName}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>${record.time || "-"}</td>
      <td>${record.notes || "-"}</td>
    `;

    attendanceTableBody.appendChild(row);
  });
}

// Load notes data
async function loadNotes() {
  try {
    const notesSnapshot = await db
      .collection("student_notes")
      .where("student_id", "==", studentId)
      .orderBy("date", "desc")
      .get();

    if (notesSnapshot.empty) {
      notesContainer.innerHTML = `
        <div class="empty-notes">
          <i class="fas fa-sticky-note"></i>
          <p>لا توجد ملاحظات حتى الآن</p>
        </div>
      `;
      return;
    }

    notesContainer.innerHTML = "";
    notesSnapshot.forEach((doc) => {
      const note = doc.data();
      const noteElement = createNoteElement(note, doc.id);
      notesContainer.appendChild(noteElement);
    });
  } catch (error) {
    console.error("Error loading notes:", error);
    showNotification("حدث خطأ أثناء تحميل الملاحظات", "error");
  }
}

function createNoteElement(note, noteId) {
  const div = document.createElement("div");
  div.className = "note-card";
  div.innerHTML = `
    <div class="note-header">
      <span class="note-date">${formatDate(note.date)}</span>
      <span class="note-type ${note.type}">${note.type}</span>
    </div>
    <div class="note-content">${note.content}</div>
    <div class="note-actions">
      <button onclick="deleteNote('${noteId}')" class="btn-danger">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  return div;
}

// Delete note
async function deleteNote(noteId) {
  if (confirm("هل أنت متأكد من حذف هذه الملاحظة؟")) {
    try {
      await db.collection("student_notes").doc(noteId).delete();
      showNotification("تم حذف الملاحظة بنجاح", "success");
      loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      showNotification("حدث خطأ أثناء حذف الملاحظة", "error");
    }
  }
}

// Handle contact form submission
contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const updates = {
      address: e.target.studentAddress.value,
      phone: e.target.studentPhone.value,
      email: e.target.studentEmail.value,
      parent_name: e.target.parentName.value,
      parent_relation: e.target.parentRelation.value,
      parent_phone: e.target.parentPhone.value,
      parent_email: e.target.parentEmail.value,
      parent_address: e.target.parentAddress.value,
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("students").doc(studentId).update(updates);
    showNotification("تم تحديث معلومات الاتصال بنجاح", "success");

    // Close modal and reload data
    document.getElementById("contactModal").style.display = "none";
    loadStudentData();
  } catch (error) {
    console.error("Error updating contact info:", error);
    showNotification("حدث خطأ أثناء تحديث معلومات الاتصال", "error");
  }
});

// Open note modal
function openNoteModal() {
  if (!noteModal) return;

  // Set current date as default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("noteDate").value = today;

  // Clear form
  noteForm.reset();

  // Show modal
  noteModal.style.display = "block";
}

// Close note modal
function closeNoteModal() {
  if (!noteModal) return;

  noteModal.style.display = "none";
}

// Open contact modal
function openContactModal() {
  if (!contactModal) return;

  // Fill form with current data
  document.getElementById("editStudentAddress").value =
    studentData.address || "";
  document.getElementById("editStudentPhone").value = studentData.phone || "";
  document.getElementById("editStudentEmail").value = studentData.email || "";

  const parentInfo = studentData.parent || {};
  document.getElementById("editParentName").value = parentInfo.name || "";
  document.getElementById("editParentRelation").value =
    parentInfo.relation || "الأب";
  document.getElementById("editParentPhone").value = parentInfo.phone || "";
  document.getElementById("editParentEmail").value = parentInfo.email || "";
  document.getElementById("editParentAddress").value =
    parentInfo.address || studentData.address || "";

  // Show modal
  contactModal.style.display = "block";
}

// Close contact modal
function closeContactModal() {
  if (!contactModal) return;

  contactModal.style.display = "none";
}

// Helper function to format dates
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ar-SA");
}
