// Verify document loaded
console.log("attendance.js loading...");

// DOM Elements
const currentDateElement = document.getElementById("currentDate");
const displayDateElement = document.getElementById("displayDate");
const todayAttendanceElement = document.getElementById("todayAttendance");
const todayAbsenceElement = document.getElementById("todayAbsence");
const prevDayBtn = document.getElementById("prevDayBtn");
const nextDayBtn = document.getElementById("nextDayBtn");
const todayBtn = document.getElementById("todayBtn");
const searchInput = document.getElementById("searchInput");
const classFilter = document.getElementById("classFilter");
const statusFilter = document.getElementById("statusFilter");
const attendanceTableBody = document.getElementById("attendanceTableBody");
const emptyState = document.getElementById("emptyState");
const markAllPresentBtn = document.getElementById("markAllPresentBtn");
const markAllAbsentBtn = document.getElementById("markAllAbsentBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const historyClassFilter = document.getElementById("historyClassFilter");
const startDateFilter = document.getElementById("startDateFilter");
const endDateFilter = document.getElementById("endDateFilter");
const applyFilterBtn = document.getElementById("applyFilterBtn");
const notificationContainer = document.getElementById("notificationContainer");
const themeToggle = document.getElementById("themeToggle");

// State variables
let selectedDate = new Date();
let currentAttendanceData = [];
let filteredAttendanceData = [];
let students = [];
let sections = [];
let subjects = [];
let classSchedules = [];
let teachers = [];
let currentScheduleId = null;
let currentTeacherId = null;

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, initializing attendance page");

  initializeApp();
});

// Initialize the application
async function initializeApp() {
  try {
    // Initialize theme
    initializeTheme();

    // Format and display current date
    updateDateDisplay();

    // Load data from backend
    await Promise.all([
      loadStudents(),
      loadSections(),
      loadSubjects(),
      loadTeachers(),
      loadClassSchedules(),
    ]);

    // Load attendance for current date
    await loadAttendanceForDate(formatDateForAPI(selectedDate));

    // Setup filters
    populateFilters();

    // Add event listeners
    addEventListeners();

    console.log("Attendance page initialized successfully");
  } catch (error) {
    console.error("Error initializing attendance page:", error);
    showNotification("حدث خطأ أثناء تهيئة الصفحة", "error");
  }
}

// Initialize theme
function initializeTheme() {
  // Default to light theme if not set
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

// Format and display the current date
function updateDateDisplay() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const dateStr = selectedDate.toLocaleDateString("ar-EG", options);

  if (currentDateElement) {
    currentDateElement.textContent = formatDateForDisplay(new Date());
  }

  if (displayDateElement) {
    displayDateElement.textContent = `التاريخ: ${formatDateForDisplay(
      selectedDate
    )}`;
  }
}

// Change the selected date
function changeDate(days) {
  const newDate = new Date(selectedDate);
  newDate.setDate(newDate.getDate() + days);
  selectedDate = newDate;

  updateDateDisplay();
  loadAttendanceForDate(formatDateForAPI(selectedDate));
}

// Reset to today
function goToToday() {
  selectedDate = new Date();
  updateDateDisplay();
  loadAttendanceForDate(formatDateForAPI(selectedDate));
}

// Format date for API (YYYY-MM-DD)
function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date for display (DD/MM/YYYY)
function formatDateForDisplay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

// Load students from API
async function loadStudents() {
  try {
    console.log("Loading students from API...");

    // Check backend connection
    const isConnected = await window.db.checkConnection();
    if (!isConnected) {
      console.error("Backend connection failed");
      showNotification("تعذر الاتصال بالخادم", "error");
      return;
    }

    students = await window.db.getAll("students");
    console.log(`Loaded ${students.length} students from API`);

    return students;
  } catch (error) {
    console.error("Error loading students:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الطلاب", "error");
    return [];
  }
}

// Load sections from API
async function loadSections() {
  try {
    console.log("Loading sections from API...");

    sections = await window.db.getAll("sections");
    console.log(`Loaded ${sections.length} sections from API`);

    return sections;
  } catch (error) {
    console.error("Error loading sections:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الفصول", "error");
    return [];
  }
}

// Load subjects from API
async function loadSubjects() {
  try {
    console.log("Loading subjects from API...");

    subjects = await window.db.getAll("subjects");
    console.log(`Loaded ${subjects.length} subjects from API`);

    return subjects;
  } catch (error) {
    console.error("Error loading subjects:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات المواد", "error");
    return [];
  }
}

// Load teachers from API
async function loadTeachers() {
  try {
    console.log("Loading teachers from API...");

    teachers = await window.db.getAll("teachers");
    console.log(`Loaded ${teachers.length} teachers from API`);

    return teachers;
  } catch (error) {
    console.error("Error loading teachers:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات المعلمين", "error");
    return [];
  }
}

// Load class schedules from API
async function loadClassSchedules() {
  try {
    console.log("Loading class schedules from API...");

    const response = await fetch(
      `${window.db.API_CONFIG.BASE_URL}/class-schedules`
    );
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    classSchedules = await response.json();
    console.log(`Loaded ${classSchedules.length} class schedules from API`);

    // Find current schedule based on day of week
    const dayOfWeek = selectedDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const currentSchedules = classSchedules.filter(
      (schedule) => schedule.day_of_week === dayOfWeek
    );

    if (currentSchedules.length > 0) {
      // For demo, just use the first schedule
      currentScheduleId = currentSchedules[0].id;
      currentTeacherId = currentSchedules[0].teacher_id;
    }

    return classSchedules;
  } catch (error) {
    console.error("Error loading class schedules:", error);
    showNotification("حدث خطأ أثناء تحميل جداول الحصص", "error");
    return [];
  }
}

// Load attendance for specific date
async function loadAttendanceForDate(date) {
  try {
    console.log(`Loading attendance for date: ${date}`);

    // First check if we have a valid schedule for this day
    if (!currentScheduleId) {
      console.warn("No schedule found for this day");
      showNotification("لا يوجد جدول دراسي لهذا اليوم", "warning");

      // Generate empty attendance data for all students
      generateEmptyAttendanceData();
      return;
    }

    // Try to get attendance records from API
    const response = await fetch(
      `${window.db.API_CONFIG.BASE_URL}/attendance?date=${date}`
    );
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const attendanceRecords = await response.json();
    console.log(
      `Loaded ${attendanceRecords.length} attendance records for ${date}`
    );

    if (attendanceRecords.length > 0) {
      // Use the retrieved attendance records
      currentAttendanceData = attendanceRecords;
    } else {
      // Generate empty attendance data for all students
      generateEmptyAttendanceData();
    }

    // Apply filters and render table
    filterAttendanceData();
    updateAttendanceStats();
  } catch (error) {
    console.error("Error loading attendance:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الحضور", "error");

    // Generate empty data as fallback
    generateEmptyAttendanceData();
  }
}

// Generate empty attendance data for all students
function generateEmptyAttendanceData() {
  console.log("Generating empty attendance data");

  // Group students by section
  const studentsBySection = {};

  students.forEach((student) => {
    const sectionId = student.section;
    if (!studentsBySection[sectionId]) {
      studentsBySection[sectionId] = [];
    }
    studentsBySection[sectionId].push(student);
  });

  // Create empty attendance records for all students
  currentAttendanceData = students.map((student) => {
    return {
      id: null, // No DB ID yet
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      class_schedule_id: currentScheduleId,
      attendance_date: formatDateForAPI(selectedDate),
      status: null, // Not marked yet
      notes: "",
      section_name: getSectionName(student.section),
    };
  });

  // Apply filters and render
  filterAttendanceData();
  updateAttendanceStats();
}

// Get section name by ID
function getSectionName(sectionId) {
  const section = sections.find((s) => s.id == sectionId);
  return section ? section.name : "غير محدد";
}

// Filter attendance data based on search and filters
function filterAttendanceData() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const selectedClass = classFilter ? classFilter.value : "";
  const selectedStatus = statusFilter ? statusFilter.value : "";

  console.log(
    `Filtering with: search="${searchTerm}", class="${selectedClass}", status="${selectedStatus}"`
  );

  filteredAttendanceData = currentAttendanceData.filter((record) => {
    // Search term filter
    const nameMatch =
      record.student_name &&
      record.student_name.toLowerCase().includes(searchTerm);
    const sectionMatch =
      record.section_name &&
      record.section_name.toLowerCase().includes(searchTerm);
    const searchMatch = nameMatch || sectionMatch;

    // Class filter
    const classFilterMatch =
      !selectedClass || record.section_name === selectedClass;

    // Status filter
    const statusFilterMatch =
      !selectedStatus || record.status === selectedStatus;

    return searchMatch && classFilterMatch && statusFilterMatch;
  });

  // Render the filtered data
  renderAttendanceTable();
}

// Render attendance table
function renderAttendanceTable() {
  if (!attendanceTableBody) return;

  attendanceTableBody.innerHTML = "";

  if (filteredAttendanceData.length === 0) {
    // Show empty state
    if (emptyState) emptyState.style.display = "flex";
    return;
  }

  // Hide empty state
  if (emptyState) emptyState.style.display = "none";

  // Add rows for each student
  filteredAttendanceData.forEach((record) => {
    const row = document.createElement("tr");

    // Get the student
    const student = students.find((s) => s.id == record.student_id);
    const studentId = student ? student.registration_id : "غير معروف";

    // Create status select element
    const statusSelect = document.createElement("select");
    statusSelect.className = `status-select ${record.status || ""}`;
    statusSelect.setAttribute("data-student-id", record.student_id);

    // Add options
    const options = [
      { value: "", text: "لم يُحدد" },
      { value: "present", text: "حاضر" },
      { value: "absent", text: "غائب" },
      { value: "late", text: "متأخر" },
      { value: "excused", text: "معذور" },
    ];

    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      if (record.status === opt.value) {
        option.selected = true;
      }
      statusSelect.appendChild(option);
    });

    // Add change event to update the status
    statusSelect.addEventListener("change", (e) => {
      const newStatus = e.target.value;
      const studentId = e.target.getAttribute("data-student-id");

      // Update the status in the array
      const recordIndex = currentAttendanceData.findIndex(
        (r) => r.student_id == studentId
      );
      if (recordIndex >= 0) {
        currentAttendanceData[recordIndex].status = newStatus;
        e.target.className = `status-select ${newStatus}`;
      }

      // Update the filtered array too if needed
      const filteredIndex = filteredAttendanceData.findIndex(
        (r) => r.student_id == studentId
      );
      if (filteredIndex >= 0) {
        filteredAttendanceData[filteredIndex].status = newStatus;
      }

      // Update stats
      updateAttendanceStats();
    });

    // Create notes input
    const notesInput = document.createElement("input");
    notesInput.type = "text";
    notesInput.className = "notes-input";
    notesInput.placeholder = "إضافة ملاحظة...";
    notesInput.value = record.notes || "";
    notesInput.setAttribute("data-student-id", record.student_id);

    // Add input event to update notes
    notesInput.addEventListener("input", (e) => {
      const notes = e.target.value;
      const studentId = e.target.getAttribute("data-student-id");

      // Update the notes in the arrays
      const recordIndex = currentAttendanceData.findIndex(
        (r) => r.student_id == studentId
      );
      if (recordIndex >= 0) {
        currentAttendanceData[recordIndex].notes = notes;
      }

      const filteredIndex = filteredAttendanceData.findIndex(
        (r) => r.student_id == studentId
      );
      if (filteredIndex >= 0) {
        filteredAttendanceData[filteredIndex].notes = notes;
      }
    });

    // Add row content
    row.innerHTML = `
      <td>${studentId}</td>
      <td>${record.student_name}</td>
      <td>${record.section_name}</td>
      <td class="status-cell"></td>
      <td>${record.time || "-"}</td>
      <td class="notes-cell"></td>
      <td>
        <button class="action-btn" title="إجراءات إضافية">
          <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;

    // Add status select to the row
    const statusCell = row.querySelector(".status-cell");
    statusCell.appendChild(statusSelect);

    // Add notes input to the row
    const notesCell = row.querySelector(".notes-cell");
    notesCell.appendChild(notesInput);

    attendanceTableBody.appendChild(row);
  });
}

// Update attendance statistics
function updateAttendanceStats() {
  const presentCount = currentAttendanceData.filter(
    (record) => record.status === "present"
  ).length;
  const absentCount = currentAttendanceData.filter(
    (record) => record.status === "absent"
  ).length;

  // Update UI
  if (todayAttendanceElement) {
    todayAttendanceElement.textContent = presentCount;
  }

  if (todayAbsenceElement) {
    todayAbsenceElement.textContent = absentCount;
  }
}

// Populate filter dropdowns
function populateFilters() {
  // Populate class filter
  if (classFilter) {
    // Clear existing options except the first one
    while (classFilter.options.length > 1) {
      classFilter.remove(1);
    }

    // Get unique sections from attendance data
    const uniqueSections = [
      ...new Set(currentAttendanceData.map((r) => r.section_name)),
    ];

    // Add options
    uniqueSections.forEach((section) => {
      if (!section) return;

      const option = document.createElement("option");
      option.value = section;
      option.textContent = section;
      classFilter.appendChild(option);
    });
  }

  // Do the same for history class filter
  if (historyClassFilter) {
    // Clear existing options except the first one
    while (historyClassFilter.options.length > 1) {
      historyClassFilter.remove(1);
    }

    // Get unique sections from attendance data
    const uniqueSections = [
      ...new Set(currentAttendanceData.map((r) => r.section_name)),
    ];

    // Add options
    uniqueSections.forEach((section) => {
      if (!section) return;

      const option = document.createElement("option");
      option.value = section;
      option.textContent = section;
      historyClassFilter.appendChild(option);
    });
  }

  // Set default dates for history filters
  if (startDateFilter) {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    startDateFilter.value = formatDateForAPI(twoWeeksAgo);
  }

  if (endDateFilter) {
    endDateFilter.value = formatDateForAPI(new Date());
  }
}

// Mark all students with a specific status
function markAllWithStatus(status) {
  // Update all visible records with the selected status
  filteredAttendanceData.forEach((record) => {
    record.status = status;

    // Update the main array as well
    const recordIndex = currentAttendanceData.findIndex(
      (r) => r.student_id === record.student_id
    );
    if (recordIndex >= 0) {
      currentAttendanceData[recordIndex].status = status;
    }
  });

  // Update the UI
  renderAttendanceTable();
  updateAttendanceStats();

  // Show notification
  let message = "";
  switch (status) {
    case "present":
      message = "تم تحديد جميع الطلاب كحاضرين";
      break;
    case "absent":
      message = "تم تحديد جميع الطلاب كغائبين";
      break;
    default:
      message = "تم تحديث حالة جميع الطلاب";
  }

  showNotification(message, "info");
}

// Clear all attendance statuses
function clearAllStatuses() {
  // Update all records to null status
  filteredAttendanceData.forEach((record) => {
    record.status = null;

    // Update the main array as well
    const recordIndex = currentAttendanceData.findIndex(
      (r) => r.student_id === record.student_id
    );
    if (recordIndex >= 0) {
      currentAttendanceData[recordIndex].status = null;
    }
  });

  // Update the UI
  renderAttendanceTable();
  updateAttendanceStats();

  showNotification("تم مسح جميع حالات الحضور", "info");
}

// Save attendance to the database
async function saveAttendance() {
  try {
    console.log("Saving attendance data...");

    // Check if we have a valid class schedule
    if (!currentScheduleId) {
      showNotification("لا يوجد جدول دراسي محدد لهذا اليوم", "error");
      return;
    }

    // Format records for the batch API
    const records = currentAttendanceData
      .filter((record) => record.status) // Only save records with a status
      .map((record) => ({
        student_id: record.student_id,
        status: record.status,
        notes: record.notes || "",
      }));

    if (records.length === 0) {
      showNotification("لم يتم تحديد أي حالات حضور للحفظ", "warning");
    return;
  }

    // Prepare data for batch saving
    const data = {
      class_schedule_id: currentScheduleId,
      attendance_date: formatDateForAPI(selectedDate),
      records: records,
      created_by: currentTeacherId || 1, // Default to first teacher if none selected
    };

    console.log("Sending attendance batch:", data);

    // Call the batch API
    const response = await fetch(
      `${window.db.API_CONFIG.BASE_URL}/attendance/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `API returned status ${response.status}`
      );
    }

    const result = await response.json();
    console.log("Attendance saved successfully:", result);

    showNotification(
      `تم حفظ بيانات الحضور بنجاح (${result.successful} سجل)`,
      "success"
    );

    // Reload attendance data to get updated records
    await loadAttendanceForDate(formatDateForAPI(selectedDate));
  } catch (error) {
    console.error("Error saving attendance:", error);
    showNotification("حدث خطأ أثناء حفظ بيانات الحضور", "error");
  }
}

// Load attendance history
async function loadAttendanceHistory() {
  try {
    console.log("Loading attendance history...");

    const startDate = startDateFilter ? startDateFilter.value : "";
    const endDate = endDateFilter ? endDateFilter.value : "";
    const selectedClass = historyClassFilter ? historyClassFilter.value : "";

    if (!startDate || !endDate) {
      showNotification("يرجى تحديد نطاق تاريخ للبحث", "warning");
    return;
  }

    // Construct query parameters
    let url = `${window.db.API_CONFIG.BASE_URL}/attendance?`;
    const params = [];

    if (startDate) {
      params.push(`start_date=${startDate}`);
    }

    if (endDate) {
      params.push(`end_date=${endDate}`);
    }

    if (selectedClass) {
      const section = sections.find((s) => s.name === selectedClass);
      if (section) {
        params.push(`section_id=${section.id}`);
      }
    }

    url += params.join("&");

    // Fetch history data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const historyData = await response.json();
    console.log(`Loaded ${historyData.length} attendance history records`);

    // TODO: Implement history table rendering

    if (historyData.length === 0) {
      showNotification("لا توجد بيانات حضور في النطاق المحدد", "info");
    }
  } catch (error) {
    console.error("Error loading attendance history:", error);
    showNotification("حدث خطأ أثناء تحميل سجل الحضور", "error");
  }
}

// Show notification
function showNotification(message, type = "info") {
  if (!notificationContainer) {
    // Create notification container if it doesn't exist
    const container = document.createElement("div");
    container.id = "notificationContainer";
    container.className = "notification-container";
    document.body.appendChild(container);
    notificationContainer = container;
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Choose icon based on type
  let icon = "info-circle";
  switch (type) {
    case "success":
      icon = "check-circle";
      break;
    case "error":
      icon = "exclamation-circle";
      break;
    case "warning":
      icon = "exclamation-triangle";
      break;
  }

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
    notification.classList.remove("active");
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Add event listeners
function addEventListeners() {
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Date navigation
  if (prevDayBtn) {
    prevDayBtn.addEventListener("click", () => changeDate(-1));
  }

  if (nextDayBtn) {
    nextDayBtn.addEventListener("click", () => changeDate(1));
  }

  if (todayBtn) {
    todayBtn.addEventListener("click", goToToday);
  }

  // Search and filters
  if (searchInput) {
    searchInput.addEventListener("input", filterAttendanceData);
  }

  if (classFilter) {
    classFilter.addEventListener("change", filterAttendanceData);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterAttendanceData);
  }

  // Bulk actions
  if (markAllPresentBtn) {
    markAllPresentBtn.addEventListener("click", () =>
      markAllWithStatus("present")
    );
  }

  if (markAllAbsentBtn) {
    markAllAbsentBtn.addEventListener("click", () =>
      markAllWithStatus("absent")
    );
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", clearAllStatuses);
  }

  // Save button
  if (saveAttendanceBtn) {
    saveAttendanceBtn.addEventListener("click", saveAttendance);
  }

  // History filter
  if (applyFilterBtn) {
    applyFilterBtn.addEventListener("click", loadAttendanceHistory);
  }
}
