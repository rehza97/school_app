// DOM Elements
const studentFullName = document.getElementById("studentFullName");
const studentIdElement = document.getElementById("studentId");
const studentClassElement = document.getElementById("studentClass");
const studentBirthDateElement = document.getElementById("studentBirthDate");
const studentGenderElement = document.getElementById("studentGender");
const attendanceRateElement = document.getElementById("attendanceRate");
const absenceDaysElement = document.getElementById("absenceDays");
const totalDaysElement = document.getElementById("totalDays");
const themeToggle = document.getElementById("themeToggle");
const notificationContainer = document.getElementById("notificationContainer");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const attendanceTableBody = document.getElementById("attendanceTableBody");
const notesContainer = document.getElementById("notesContainer");
const monthFilter = document.getElementById("monthFilter");
const editStudentBtn = document.getElementById("editStudentBtn");
const printProfileBtn = document.getElementById("printProfileBtn");
const addNoteBtn = document.getElementById("addNoteBtn");
const editContactBtn = document.getElementById("editContactBtn");

// Student Profile Modal
const noteModal = document.getElementById("noteModal");
const noteModalCloseBtn = document.querySelector("#noteModal .close-btn");
const noteForm = document.getElementById("noteForm");
const cancelNoteBtn = document.getElementById("cancelNoteBtn");

// Contact Info Modal
const contactModal = document.getElementById("contactModal");
const contactModalCloseBtn = document.querySelector("#contactModal .close-btn");
const contactForm = document.getElementById("contactForm");
const cancelContactBtn = document.getElementById("cancelContactBtn");

// Contact Info Elements
const studentAddressElement = document.getElementById("studentAddress");
const studentPhoneElement = document.getElementById("studentPhone");
const studentEmailElement = document.getElementById("studentEmail");
const parentNameElement = document.getElementById("parentName");
const parentRelationElement = document.getElementById("parentRelation");
const parentPhoneElement = document.getElementById("parentPhone");
const parentEmailElement = document.getElementById("parentEmail");
const parentAddressElement = document.getElementById("parentAddress");

// Student ID from URL
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get("id");

// Student data
let studentData = null;

// Attendance data
let attendanceData = [];

// Notes data
let notesData = [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme();
  loadStudentData();
  setupTabNavigation();
  setupEventListeners();
});

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
function loadStudentData() {
  if (!studentId) {
    showNotification("لم يتم تحديد هوية الطالب", "error");
    setTimeout(() => {
      window.location.href = "students.html";
    }, 2000);
    return;
  }

  try {
    // Get student from database
    studentData = db.students.getById(studentId);

    if (!studentData) {
      showNotification("لم يتم العثور على الطالب", "error");
      setTimeout(() => {
        window.location.href = "students.html";
      }, 2000);
      return;
    }

    // Update UI with student data
    updateStudentProfile();
    loadAttendanceData();
    loadNotesData();
    loadContactInfo();
  } catch (error) {
    console.error("Error loading student data:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الطالب", "error");
  }
}

// Update student profile with data
function updateStudentProfile() {
  studentFullName.textContent = `${studentData.firstName} ${studentData.lastName}`;
  studentIdElement.textContent = studentData.studentId || "-";

  // Get class details
  const classId = studentData.class;
  let className = "-";

  if (classId) {
    const classComponents = getClassComponents(classId);
    if (classComponents) {
      className = `${classComponents.level} - ${classComponents.specialty} - ${classComponents.section}`;
    }
  }

  studentClassElement.textContent = className;

  // Format birthdate
  if (studentData.birthDate) {
    const birthDate = new Date(studentData.birthDate);
    const formattedDate = birthDate.toLocaleDateString("ar-SA");
    studentBirthDateElement.textContent = formattedDate;
  } else {
    studentBirthDateElement.textContent = "-";
  }

  studentGenderElement.textContent = studentData.gender || "-";

  // Update attendance stats
  updateAttendanceStats();
}

// Parse class ID to get components
function getClassComponents(classId) {
  try {
    const [levelId, specialtyId, sectionId] = classId.split("-");

    // Get level, specialty, and section names from database
    const level = db.levels.getById(levelId)?.name || levelId;
    const specialty = db.specialties.getById(specialtyId)?.name || specialtyId;
    const section = db.sections.getById(sectionId)?.name || sectionId;

    return { level, specialty, section };
  } catch (error) {
    console.error("Error parsing class ID:", error);
    return null;
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
      // Redirect to students page with edit parameter
      window.location.href = `students.html?edit=${studentId}`;
    });
  }

  // Print profile button
  if (printProfileBtn) {
    printProfileBtn.addEventListener("click", printStudentProfile);
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
    noteForm.addEventListener("submit", handleNoteSubmit);
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

// Load attendance data for the student
function loadAttendanceData() {
  try {
    // Get real attendance data from database
    attendanceData = db.attendance.getByStudent(studentId);

    if (!attendanceData || attendanceData.length === 0) {
      // If no data exists, use empty array
      attendanceData = [];
      displayAttendanceData([]);
      updateAttendanceStats();
      return;
    }

    // Sort by date (most recent first)
    attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display attendance data
    displayAttendanceData(attendanceData);

    // Update attendance stats
    updateAttendanceStats();
  } catch (error) {
    console.error("Error loading attendance data:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الحضور", "error");
  }
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

// Update attendance statistics
function updateAttendanceStats() {
  try {
    // Get attendance statistics from database
    const stats = db.attendance.getStudentStats(studentId);

    const totalDays = stats.total || 0;
    const absentDays = stats.absent || 0;
    const presentDays = stats.present || 0;
    const attendanceRate = stats.presentRate || 0;

    // Update UI elements
    totalDaysElement.textContent = totalDays;
    absenceDaysElement.textContent = absentDays;
    attendanceRateElement.textContent = `${Math.round(attendanceRate)}%`;

    // Animate counting
    animateCounter(totalDaysElement, totalDays);
    animateCounter(absenceDaysElement, absentDays);
    animateCounter(attendanceRateElement, Math.round(attendanceRate), "%");
  } catch (error) {
    console.error("Error updating attendance stats:", error);

    // Fallback to calculating from attendance data if database method fails
    const totalDays = attendanceData.length;
    const absentDays = attendanceData.filter(
      (record) => record.status === "absent"
    ).length;
    const presentDays = totalDays - absentDays;
    const attendanceRate =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    totalDaysElement.textContent = totalDays;
    absenceDaysElement.textContent = absentDays;
    attendanceRateElement.textContent = `${attendanceRate}%`;

    // Animate counting
    animateCounter(totalDaysElement, totalDays);
    animateCounter(absenceDaysElement, absentDays);
    animateCounter(attendanceRateElement, attendanceRate, "%");
  }
}

// Animate counter
function animateCounter(element, targetValue, suffix = "") {
  if (!element) return;

  let currentValue = 0;
  const duration = 1000; // 1 second
  const interval = Math.min(50, duration / targetValue); // Max 20 FPS or fewer steps for small numbers
  const increment = targetValue / (duration / interval);

  if (targetValue === 0) {
    element.textContent = `0${suffix}`;
    return;
  }

  const timer = setInterval(() => {
    currentValue += increment;
    element.textContent = `${Math.floor(currentValue)}${suffix}`;

    if (currentValue >= targetValue) {
      element.textContent = `${targetValue}${suffix}`;
      clearInterval(timer);
    }
  }, interval);
}

// Load notes data
function loadNotesData() {
  try {
    // Mock data - in a real app, this would come from the database
    notesData = [
      {
        id: "note1",
        date: new Date(2023, 2, 5), // March 5, 2023
        type: "academic",
        content: "الطالب متفوق في مادة الرياضيات ويحتاج إلى مزيد من التحدي.",
        teacher: "أحمد محمد",
      },
      {
        id: "note2",
        date: new Date(2023, 1, 20), // February 20, 2023
        type: "behavior",
        content: "الطالب يتحدث كثيرًا أثناء الحصة ويشتت انتباه زملائه.",
        teacher: "محمد علي",
      },
      {
        id: "note3",
        date: new Date(2023, 0, 15), // January 15, 2023
        type: "achievement",
        content:
          "حصل الطالب على المركز الأول في مسابقة الخط العربي على مستوى المدرسة.",
        teacher: "فاطمة أحمد",
      },
    ];

    // Sort by date (most recent first)
    notesData.sort((a, b) => b.date - a.date);

    // Display notes
    displayNotes();
  } catch (error) {
    console.error("Error loading notes data:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الملاحظات", "error");
  }
}

// Display notes
function displayNotes() {
  if (!notesContainer) return;

  notesContainer.innerHTML = "";

  if (notesData.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-notes">
        <i class="fas fa-sticky-note"></i>
        <p>لا توجد ملاحظات حتى الآن</p>
      </div>
    `;
    return;
  }

  notesData.forEach((note) => {
    const noteCard = document.createElement("div");
    noteCard.className = "note-card";

    // Format date
    const formattedDate = note.date.toLocaleDateString("ar-SA");

    // Get type translation
    let typeText = "أخرى";
    if (note.type === "academic") typeText = "أكاديمية";
    if (note.type === "behavior") typeText = "سلوكية";
    if (note.type === "achievement") typeText = "إنجاز";

    noteCard.innerHTML = `
      <div class="note-header">
        <span class="note-type ${note.type}">${typeText}</span>
        <span class="note-date">${formattedDate}</span>
      </div>
      <div class="note-content">${note.content}</div>
      <div class="note-teacher">بواسطة: ${note.teacher}</div>
    `;

    notesContainer.appendChild(noteCard);
  });
}

// Load contact information
function loadContactInfo() {
  try {
    // In a real app, this would come from the database
    // For now, use mock data if not available in student data

    // Student contact info
    studentAddressElement.textContent = studentData.address || "غير محدد";
    studentPhoneElement.textContent = studentData.phone || "غير محدد";
    studentEmailElement.textContent = studentData.email || "غير محدد";

    // Parent contact info
    const parentInfo = studentData.parent || {};
    parentNameElement.textContent = parentInfo.name || "غير محدد";
    parentRelationElement.textContent = parentInfo.relation || "غير محدد";
    parentPhoneElement.textContent = parentInfo.phone || "غير محدد";
    parentEmailElement.textContent = parentInfo.email || "غير محدد";
    parentAddressElement.textContent =
      parentInfo.address || studentData.address || "غير محدد";
  } catch (error) {
    console.error("Error loading contact info:", error);
    showNotification("حدث خطأ أثناء تحميل معلومات الاتصال", "error");
  }
}

// Print student profile
function printStudentProfile() {
  window.print();
}

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

// Handle note form submission
function handleNoteSubmit(e) {
  e.preventDefault();

  const noteDate = document.getElementById("noteDate").value;
  const noteType = document.getElementById("noteType").value;
  const noteContent = document.getElementById("noteContent").value;

  if (!noteDate || !noteType || !noteContent) {
    showNotification("يرجى تعبئة جميع الحقول المطلوبة", "error");
    return;
  }

  // Create new note
  const newNote = {
    id: `note${Date.now()}`,
    date: new Date(noteDate),
    type: noteType,
    content: noteContent,
    teacher: "المدير", // In a real app, this would be the logged-in user
  };

  // Add note to data
  notesData.unshift(newNote);

  // Update display
  displayNotes();

  // Close modal
  closeNoteModal();

  // Show success notification
  showNotification("تمت إضافة الملاحظة بنجاح", "success");
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

// Handle contact form submission
function handleContactSubmit(e) {
  e.preventDefault();

  // Get form values
  const studentAddress = document.getElementById("editStudentAddress").value;
  const studentPhone = document.getElementById("editStudentPhone").value;
  const studentEmail = document.getElementById("editStudentEmail").value;

  const parentName = document.getElementById("editParentName").value;
  const parentRelation = document.getElementById("editParentRelation").value;
  const parentPhone = document.getElementById("editParentPhone").value;
  const parentEmail = document.getElementById("editParentEmail").value;
  const parentAddress = document.getElementById("editParentAddress").value;

  // Update student data
  studentData.address = studentAddress;
  studentData.phone = studentPhone;
  studentData.email = studentEmail;

  // Create or update parent info
  if (!studentData.parent) studentData.parent = {};
  studentData.parent.name = parentName;
  studentData.parent.relation = parentRelation;
  studentData.parent.phone = parentPhone;
  studentData.parent.email = parentEmail;
  studentData.parent.address = parentAddress;

  // Update the database
  db.students.update(studentData);

  // Update display
  loadContactInfo();

  // Close modal
  closeContactModal();

  // Show success notification
  showNotification("تم تحديث معلومات الاتصال بنجاح", "success");
}

// Utility function to add CSS classes for print media
function addPrintStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    @media print {
      .sidebar, header, .theme-toggle, .btn-primary, .btn-secondary, #notificationContainer, .tabs-nav {
        display: none !important;
      }
      
      body {
        background-color: white !important;
        color: black !important;
      }
      
      .main-content {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
      }
      
      .tab-panel {
        display: block !important;
        break-inside: avoid;
      }
      
      .dashboard-content {
        padding: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);
}
