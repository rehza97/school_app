// API Configuration
// Use the API_CONFIG from database.js instead of redefining it here
// const API_BASE_URL = "http://localhost:3000/api"; // Change this to match your backend URL

// Global variables
let currentFile = null;
let currentFileType = null;

// Remove module imports since we're using script tags
// const store = {
//   students: [],
//   teachers: [],
//   sections: []
// };

document.addEventListener("DOMContentLoaded", () => {
  setupFileUpload();
  initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
  // Check if we're running the backend
  const backendConnected = await checkBackendConnection();
  updateConnectionStatus(backendConnected);

  // Initialize components
  initializeSidebar();
  updateHeaderInfo();

  // Load dashboard stats
  await updateDashboardStats();
}

/**
 * Check if the backend is connected
 * @returns {Promise<boolean>} - Backend connection status
 */
async function checkBackendConnection() {
  try {
    return await db.checkConnection();
  } catch (error) {
    console.error("Error checking backend connection:", error);
    return false;
  }
}

/**
 * Update the connection status display in the UI
 * @param {boolean} isConnected - Whether the backend is connected
 */
function updateConnectionStatus(isConnected) {
  const connectionStatusElement = document.getElementById("connectionStatus");
  if (!connectionStatusElement) return;

  if (isConnected) {
    connectionStatusElement.textContent = "متصل بقاعدة البيانات";
    connectionStatusElement.className = "badge bg-success";
  } else {
    connectionStatusElement.textContent = "غير متصل بقاعدة البيانات";
    connectionStatusElement.className = "badge bg-danger";
  }
}

/**
 * Initialize the sidebar navigation
 */
function initializeSidebar() {
  const currentPage = getCurrentPage();
  const sidebarLinks = document.querySelectorAll(".sidebar-nav .nav-link");

  sidebarLinks.forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (linkPath === currentPage) {
      link.classList.add("active");
    }

    // Add click event listeners if needed
    link.addEventListener("click", function (e) {
      // Any special handling for sidebar links can go here
    });
  });
}

/**
 * Get the current page filename
 * @returns {string} - Current page filename
 */
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split("/").pop();
  return page || "index.html";
}

/**
 * Update the header information
 */
function updateHeaderInfo() {
  const schoolNameElement = document.getElementById("schoolName");
  if (schoolNameElement) {
    schoolNameElement.textContent = "مدرسة النجاح الابتدائية"; // This could come from config
  }

  // Set current date
  const currentDateElement = document.getElementById("currentDate");
  if (currentDateElement) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const now = new Date();
    currentDateElement.textContent = now.toLocaleDateString("ar-LY", options);
  }
}

/**
 * Update dashboard statistics
 */
async function updateDashboardStats() {
  const studentsCountElement = document.getElementById("studentsCount");
  const teachersCountElement = document.getElementById("teachersCount");

  if (studentsCountElement) {
    try {
      const count = await db.getStudentCount();
      studentsCountElement.textContent = count;
    } catch (error) {
      console.error("Error getting student count:", error);
      studentsCountElement.textContent = "0";
    }
  }

  if (teachersCountElement) {
    try {
      const count = await db.getTeacherCount();
      teachersCountElement.textContent = count;
    } catch (error) {
      console.error("Error getting teacher count:", error);
      teachersCountElement.textContent = "0";
    }
  }
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - Message type (success, error, info, warning)
 */
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `alert alert-${type} notification`;
  notification.textContent = message;

  const container =
    document.querySelector(".notification-container") || document.body;
  container.appendChild(notification);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 5000);
}

// Export functions for use in other modules
window.app = {
  showNotification,
};

function setupFileUpload() {
  const studentDragDropZone = document.getElementById("studentDragDropZone");
  const teacherDragDropZone = document.getElementById("teacherDragDropZone");
  const studentFileInput = document.getElementById("studentExcelFile");
  const teacherFileInput = document.getElementById("teacherExcelFile");
  const previewSection = document.getElementById("previewSection");
  const previewTable = document.getElementById("previewTable");
  const recordCount = document.getElementById("recordCount");
  const uploadBtn = document.getElementById("uploadBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  // Add click handlers for the drag-drop zones
  studentDragDropZone.addEventListener("click", () => {
    studentFileInput.click();
  });

  teacherDragDropZone.addEventListener("click", () => {
    teacherFileInput.click();
  });

  // Student file drag and drop
  studentDragDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    studentDragDropZone.classList.add("dragover");
  });

  studentDragDropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    studentDragDropZone.classList.remove("dragover");
  });

  studentDragDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    studentDragDropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (isValidExcelFile(file)) {
      handleFileSelect(e, "student");
    } else {
      showNotification("الرجاء اختيار ملف Excel صالح", "error");
    }
  });

  // Teacher file drag and drop
  teacherDragDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    teacherDragDropZone.classList.add("dragover");
  });

  teacherDragDropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    teacherDragDropZone.classList.remove("dragover");
  });

  teacherDragDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    teacherDragDropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (isValidExcelFile(file)) {
      handleFileSelect(e, "teacher");
    } else {
      showNotification("الرجاء اختيار ملف Excel صالح", "error");
    }
  });

  // File input change handlers
  studentFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (isValidExcelFile(file)) {
      handleFileSelect(e, "student");
    } else {
      showNotification("الرجاء اختيار ملف Excel صالح", "error");
      e.target.value = "";
    }
  });

  teacherFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (isValidExcelFile(file)) {
      handleFileSelect(e, "teacher");
    } else {
      showNotification("الرجاء اختيار ملف Excel صالح", "error");
      e.target.value = "";
    }
  });

  // Upload and cancel buttons
  uploadBtn.addEventListener("click", async () => {
    if (!currentFile || !currentFileType) {
      showNotification("الرجاء اختيار ملف أولاً", "error");
      return;
    }
    await handleFileUpload();
  });

  cancelBtn.addEventListener("click", () => {
    resetUploadForm();
  });
}

function isValidExcelFile(file) {
  if (!file) return false;
  const validTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  return validTypes.includes(file.type);
}

// Function to handle file selection
async function handleFileSelect(event, type) {
  try {
    const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
    if (!file) {
      showNotification("لم يتم اختيار ملف", "error");
      return;
    }

    currentFile = file;
    currentFileType = type;

    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert the worksheet to JSON with specific options
        let jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Use first row as headers
          raw: false, // Convert all cells to strings
          defval: "", // Use empty string for empty cells
        });

        // Remove empty rows and validate data
        jsonData = jsonData.filter(
          (row) =>
            Array.isArray(row) &&
            row.length > 0 &&
            row.some((cell) => cell !== "")
        );

        if (jsonData.length < 2) {
          // Need at least headers and one data row
          showNotification("الملف لا يحتوي على بيانات صالحة", "error");
          resetUploadForm();
          return;
        }

        // Get headers and data
        const headers = jsonData[0];
        const rows = jsonData.slice(1);

        // Map data based on type
        let mappedData;
        if (type === "teacher") {
          mappedData = rows
            .map((row) => {
              // Ensure row has enough columns
              if (!Array.isArray(row) || row.length < 8) {
                return null;
              }
              return {
                "رقم التعريف": row[0] || "",
                اللقب: row[1] || "",
                الاسم: row[2] || "",
                "تاريخ الازدياد": row[3] || "",
                الرتبة: row[4] || "",
                المادة: row[5] || "",
                الدرجة: row[6] || "",
                "تاريخ السريان": row[7] || "",
              };
            })
            .filter(
              (row) =>
                row !== null &&
                row["رقم التعريف"] &&
                row["اللقب"] &&
                row["الاسم"]
            );
        } else {
          mappedData = rows
            .map((row) => {
              // Ensure row has enough columns
              if (!Array.isArray(row) || row.length < 12) {
                return null;
              }
              return {
                "رقم التعريف": row[0] || "",
                اللقب: row[1] || "",
                الاسم: row[2] || "",
                الجنس: row[3] || "",
                "تاريخ الازدياد": row[4] || "",
                القسم: row[5] || "",
                السنة: row[6] || "",
                "مكان الازدياد": row[7] || "",
                "رقم عقد الميلاد": row[8] || "",
                "عقد الميلاد": row[9] || "",
                "نظام التدريس": row[10] || "",
                الشعبة: row[11] || "",
              };
            })
            .filter(
              (row) =>
                row !== null &&
                row["رقم التعريف"] &&
                row["اللقب"] &&
                row["الاسم"]
            );
        }

        if (mappedData.length === 0) {
          showNotification("لا توجد بيانات صالحة في الملف", "error");
          resetUploadForm();
          return;
        }

        // Display preview
        displayPreview(mappedData, type);

        // Show preview section
        document.getElementById("previewSection").style.display = "block";
        document.getElementById("recordCount").textContent = mappedData.length;
      } catch (error) {
        console.error("Error processing file:", error);
        showNotification("حدث خطأ أثناء معالجة الملف", "error");
        resetUploadForm();
      }
    };

    reader.onerror = function () {
      console.error("Error reading file");
      showNotification("حدث خطأ أثناء قراءة الملف", "error");
      resetUploadForm();
    };

    reader.readAsArrayBuffer(file);
  } catch (error) {
    console.error("Error handling file:", error);
    showNotification("حدث خطأ أثناء معالجة الملف", "error");
    resetUploadForm();
  }
}

// Function to display preview
function displayPreview(data, type) {
  const table = document.getElementById("previewTable");
  table.innerHTML = "";

  // Create table header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // Set headers based on type
  const headers =
    type === "teacher"
      ? [
          "رقم التعريف",
          "اللقب",
          "الاسم",
          "تاريخ الازدياد",
          "الرتبة",
          "المادة",
          "الدرجة",
          "تاريخ السريان",
        ]
      : [
          "رقم التعريف",
          "اللقب",
          "الاسم",
          "الجنس",
          "تاريخ التسجيل",
          "تاريخ الازدياد",
          "القسم",
          "السنة",
        ];

  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement("tbody");
  data.slice(0, 10).forEach((row) => {
    // Show only first 10 rows in preview
    const tr = document.createElement("tr");
    headers.forEach((header) => {
      const td = document.createElement("td");
      td.textContent = row[header] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

// Function to handle file upload
async function handleFileUpload() {
  if (!currentFile || !currentFileType) {
    showNotification("الرجاء اختيار ملف أولاً", "error");
    return;
  }

  try {
    // Use the uploadFile function from database.js instead of direct fetch
    const result = await window.db.uploadFile(currentFile, currentFileType);

    showNotification("تم رفع الملف بنجاح", "success");
    document.getElementById("previewSection").style.display = "none";
    updateCounts(); // Update the counts after successful upload
  } catch (error) {
    console.error("Upload error:", error);
    showNotification(error.message || "حدث خطأ أثناء رفع الملف", "error");
  }
}

function resetUploadForm() {
  const previewSection = document.getElementById("previewSection");
  const studentFileInput = document.getElementById("studentExcelFile");
  const teacherFileInput = document.getElementById("teacherExcelFile");

  previewSection.style.display = "none";
  studentFileInput.value = "";
  teacherFileInput.value = "";
  currentFile = null;
  currentFileType = null;
}

async function updateCounts() {
  try {
    // Use the functions from database.js to get counts
    const studentsCount = await window.db.getStudentCount();
    const teachersCount = await window.db.getTeacherCount();

    document.getElementById("totalStudents").textContent = studentsCount || "0";
    document.getElementById("totalTeachers").textContent = teachersCount || "0";
  } catch (error) {
    console.error("Error updating counts:", error);
    // Set counts to 0 on error
    document.getElementById("totalStudents").textContent = "0";
    document.getElementById("totalTeachers").textContent = "0";
  }
}

// Initial load
async function loadInitialData() {
  await updateCounts();
}
