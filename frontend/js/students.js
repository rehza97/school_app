// DOM Elements - Only keeping essential elements
const studentsTable = document.getElementById("studentsTable");
const notificationContainer = document.getElementById("notificationContainer");
const themeToggle = document.getElementById("themeToggle");

// Stats Elements
const totalStudentsEl = document.getElementById("totalStudents");
const activeStudentsEl = document.getElementById("activeStudents");
const inactiveStudentsEl = document.getElementById("inactiveStudents");
const studentsTableBody = document.getElementById("studentsTableBody");

// Global variables
let students = [];
let filteredStudents = [];
let currentPage = 1;
let pageSize = 10;
let sortField = "registration_id";
let sortDirection = "asc";
let currentFileData = null;

// Reference data
let educationLevels = [];
let specialties = [];
let sections = [];
let educationSystems = [];

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize theme
    initializeTheme();

    // Show loading indicator
    showLoading(true);

    // Setup event listeners
    setupEventListeners();

    // Setup file upload
    setupFileUpload();

    // Load student data
    await loadStudents();

    // Hide loading indicator
    showLoading(false);
  } catch (error) {
    console.error("Error initializing page:", error);
    showNotification("حدث خطأ أثناء تحميل البيانات", "error");
    showLoading(false);
  }
});

// Initialize theme
function initializeTheme() {
  // Default to light theme
  const savedTheme = "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

// Toggle theme between light and dark
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);

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

// Load students from the backend
async function loadStudents() {
  try {
    showLoading(true);

    // Check if backend is available
    const backendAvailable = await window.db.checkConnection();
    if (!backendAvailable) {
      console.error("Backend server is not responding");
      showNotification(
        "لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل الخادم.",
        "error"
      );
      showLoading(false);
      return;
    }

    // Load students
    const response = await window.db.getAll("/students");

    if (response.success) {
      students = response.data || [];

      // Load reference data
      await loadReferenceData();

      // Initialize filtered students
      filteredStudents = [...students];

      // Update stats
      updateStats();

      // Update table
      updateStudentsTable();
    } else {
      console.error("Failed to load students:", response.error);
      showNotification("فشل في تحميل بيانات الطلاب", "error");
    }

    showLoading(false);
  } catch (error) {
    console.error("Error loading students:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الطلاب", "error");
    showLoading(false);
  }
}

// Load reference data (education levels, specialties, sections, education systems)
async function loadReferenceData() {
  try {
    // Load education levels
    const levelsResponse = await window.db.getAll("/education-levels");
    if (levelsResponse.success) {
      educationLevels = levelsResponse.data || [];
    } else {
      console.error("Error loading education levels:", levelsResponse.error);
    }

    // Load specialties
    const specialtiesResponse = await window.db.getAll("/specialties");
    if (specialtiesResponse.success) {
      specialties = specialtiesResponse.data || [];
    } else {
      console.error("Error loading specialties:", specialtiesResponse.error);
    }

    // Load sections
    const sectionsResponse = await window.db.getAll("/sections");
    if (sectionsResponse.success) {
      sections = sectionsResponse.data || [];
    } else {
      console.error("Error loading sections:", sectionsResponse.error);
    }

    // Load education systems
    const systemsResponse = await window.db.getAll("/education-systems");
    if (systemsResponse.success) {
      educationSystems = systemsResponse.data || [];
    } else {
      console.error("Error loading education systems:", systemsResponse.error);
    }

    // Populate dropdowns
    populateReferenceDropdowns();
  } catch (error) {
    console.error("Error loading reference data:", error);
    showNotification("حدث خطأ أثناء تحميل البيانات المرجعية", "error");
  }
}

// Populate reference dropdowns (both form and filters)
function populateReferenceDropdowns() {
  // Populate education level dropdown
  const educationLevelSelect = document.getElementById("educationLevel");
  const educationLevelFilter = document.getElementById("educationLevelFilter");

  if (educationLevelSelect) {
    // Clear previous options except first
    educationLevelSelect.innerHTML =
      '<option value="">اختر المستوى التعليمي</option>';

    // Add new options
    educationLevels.forEach((level) => {
      const option = document.createElement("option");
      option.value = level.id;
      option.textContent = level.name;
      educationLevelSelect.appendChild(option);
    });
  }

  if (educationLevelFilter) {
    // Clear previous options except first
    educationLevelFilter.innerHTML = '<option value="">جميع المستويات</option>';

    // Add new options
    educationLevels.forEach((level) => {
      const option = document.createElement("option");
      option.value = level.id;
      option.textContent = level.name;
      educationLevelFilter.appendChild(option);
    });
  }

  // Populate specialty dropdown
  const specialtySelect = document.getElementById("specialty");
  const specialtyFilter = document.getElementById("specialtyFilter");

  if (specialtySelect) {
    // Clear previous options except first
    specialtySelect.innerHTML = '<option value="">اختر التخصص</option>';

    // Add new options
    specialties.forEach((specialty) => {
      const option = document.createElement("option");
      option.value = specialty.id;
      option.textContent = specialty.name;
      specialtySelect.appendChild(option);
    });
  }

  if (specialtyFilter) {
    // Clear previous options except first
    specialtyFilter.innerHTML = '<option value="">جميع التخصصات</option>';

    // Add new options
    specialties.forEach((specialty) => {
      const option = document.createElement("option");
      option.value = specialty.id;
      option.textContent = specialty.name;
      specialtyFilter.appendChild(option);
    });
  }

  // Populate section dropdown
  const sectionSelect = document.getElementById("section");
  const sectionFilter = document.getElementById("sectionFilter");

  if (sectionSelect) {
    // Clear previous options except first
    sectionSelect.innerHTML = '<option value="">اختر القسم</option>';

    // Add new options
    sections.forEach((section) => {
      const option = document.createElement("option");
      option.value = section.id;
      option.textContent = section.name;
      sectionSelect.appendChild(option);
    });
  }

  if (sectionFilter) {
    // Clear previous options except first
    sectionFilter.innerHTML = '<option value="">جميع الأقسام</option>';

    // Add new options
    sections.forEach((section) => {
      const option = document.createElement("option");
      option.value = section.id;
      option.textContent = section.name;
      sectionFilter.appendChild(option);
    });
  }

  // Populate education system dropdown
  const educationSystemSelect = document.getElementById("educationSystem");
  const educationSystemFilter = document.getElementById(
    "educationSystemFilter"
  );

  if (educationSystemSelect) {
    // Clear previous options except first
    educationSystemSelect.innerHTML =
      '<option value="">اختر نظام التمدرس</option>';

    // Add new options
    educationSystems.forEach((system) => {
      const option = document.createElement("option");
      option.value = system.id;
      option.textContent = system.name;
      educationSystemSelect.appendChild(option);
    });
  }

  if (educationSystemFilter) {
    // Clear previous options except first
    educationSystemFilter.innerHTML =
      '<option value="">جميع أنظمة التمدرس</option>';

    // Add new options
    educationSystems.forEach((system) => {
      const option = document.createElement("option");
      option.value = system.id;
      option.textContent = system.name;
      educationSystemFilter.appendChild(option);
    });
  }
}

// Filter students based on search and filter values
function filterStudents() {
  const searchTerm =
    document.getElementById("searchInput")?.value?.toLowerCase() || "";
  const educationLevelFilter =
    document.getElementById("educationLevelFilter")?.value || "";
  const specialtyFilter =
    document.getElementById("specialtyFilter")?.value || "";
  const sectionFilter = document.getElementById("sectionFilter")?.value || "";
  const educationSystemFilter =
    document.getElementById("educationSystemFilter")?.value || "";
  const statusFilter = document.getElementById("statusFilter")?.value || "";

  // Reset filtered students
  filteredStudents = [...students];

  // Filter based on search term
  if (searchTerm) {
    filteredStudents = filteredStudents.filter((student) => {
      return (
        student.first_name?.toLowerCase().includes(searchTerm) ||
        student.last_name?.toLowerCase().includes(searchTerm) ||
        student.registration_id?.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Filter based on education level
  if (educationLevelFilter) {
    filteredStudents = filteredStudents.filter((student) => {
      return student.education_level_id == educationLevelFilter;
    });
  }

  // Filter based on specialty
  if (specialtyFilter) {
    filteredStudents = filteredStudents.filter((student) => {
      return student.specialty_id == specialtyFilter;
    });
  }

  // Filter based on section
  if (sectionFilter) {
    filteredStudents = filteredStudents.filter((student) => {
      return student.section_id == sectionFilter;
    });
  }

  // Filter based on education system
  if (educationSystemFilter) {
    filteredStudents = filteredStudents.filter((student) => {
      return student.education_system_id == educationSystemFilter;
    });
  }

  // Filter based on status
  if (statusFilter) {
    const isActive = statusFilter === "active";
    filteredStudents = filteredStudents.filter((student) => {
      return isActive ? student.active == 1 : student.active == 0;
    });
  }

  // Reset to first page
  currentPage = 1;

  // Update table with filtered results
  updateStudentsTable();
}

// Update stats from filtered data
function updateStats() {
  try {
    // Calculate totals from the students array
    const total = students.length;
    const active = students.filter((student) => student.active == 1).length;
    const inactive = students.filter((student) => student.active == 0).length;

    // Update the UI with the counts
    if (totalStudentsEl) totalStudentsEl.textContent = total;
    if (activeStudentsEl) activeStudentsEl.textContent = active;
    if (inactiveStudentsEl) inactiveStudentsEl.textContent = inactive;
  } catch (error) {
    console.error("Error updating stats:", error);
    // Set default values on error
    if (totalStudentsEl) totalStudentsEl.textContent = "0";
    if (activeStudentsEl) activeStudentsEl.textContent = "0";
    if (inactiveStudentsEl) inactiveStudentsEl.textContent = "0";
  }
}

// Setup file upload
function setupFileUpload() {
  const dragDropZone = document.getElementById("studentDragDropZone");
  const fileInput = document.getElementById("studentExcelFile");
  const cancelBtn = document.getElementById("cancelBtn");
  const uploadBtn = document.getElementById("uploadBtn");

  if (!dragDropZone || !fileInput) return;

  // Handle file selection
  fileInput.addEventListener("change", (e) => {
    handleFileSelect(e.target.files);
  });

  // Handle drag over
  dragDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragDropZone.classList.add("drag-over");
  });

  // Handle drag leave
  dragDropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragDropZone.classList.remove("drag-over");
  });

  // Handle drop
  dragDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDropZone.classList.remove("drag-over");
    handleFileSelect(e.dataTransfer.files);
  });

  // Cancel preview and upload
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      const previewSection = document.getElementById("previewSection");
      if (previewSection) {
        previewSection.style.display = "none";
      }

      // Reset file input
      if (fileInput) {
        fileInput.value = "";
      }
    });
  }

  // Handle file upload
  if (uploadBtn) {
    uploadBtn.addEventListener("click", processStudentData);
  }
}

// Handle file select
function handleFileSelect(files) {
  if (!files || files.length === 0) return;

  const file = files[0];

  // Check file type
  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    showNotification("يرجى اختيار ملف Excel (.xlsx أو .xls)", "error");
    return;
  }

  // Read file
  readExcelFile(file);
}

// Read Excel file
function readExcelFile(file) {
  showLoading(true);

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON with header:1 to get full array representation
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      // Log the first several rows to understand structure
      console.log("Excel first 5 rows:", jsonData.slice(0, 5));

      // Validate data has at least some rows
      if (jsonData.length < 2) {
        showNotification("الملف لا يحتوي على بيانات كافية", "error");
        showLoading(false);
        return;
      }

      // Find the header row (look for row containing key fields like "الاسم" or "رقم التعريف")
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (
          row.some(
            (cell) =>
              typeof cell === "string" &&
              (cell.includes("الاسم") ||
                cell.includes("رقم التعريف") ||
                cell.includes("رقم القيد"))
          )
        ) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        // Default to 4th row (index 3) if we can't identify a header row
        headerRowIndex = 3;
        console.log("Could not identify header row, using default (row 4)");
      } else {
        console.log("Found header row at index:", headerRowIndex);
      }

      // Get headers
      const headers = jsonData[headerRowIndex];
      console.log("Headers:", headers);

      // Get data (from row after headers)
      const rows = jsonData.slice(headerRowIndex + 1);

      // Create array of objects
      const formattedData = [];
      rows.forEach((row) => {
        // Skip empty rows
        if (row.every((cell) => !cell)) {
          return;
        }

        const obj = {};
        headers.forEach((header, index) => {
          if (header && index < row.length) {
            obj[header] = row[index];
          }
        });
        formattedData.push(obj);
      });

      console.log(
        "Formatted data (first 3 records):",
        formattedData.slice(0, 3)
      );
      console.log("Total records found:", formattedData.length);

      // Store data for later use
      currentFileData = formattedData;

      // Show preview
      showExcelPreview(headers, formattedData);

      showLoading(false);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      showNotification("حدث خطأ أثناء قراءة ملف Excel", "error");
      showLoading(false);
    }
  };

  reader.onerror = function () {
    console.error("Error reading file");
    showNotification("حدث خطأ أثناء قراءة الملف", "error");
    showLoading(false);
  };

  reader.readAsArrayBuffer(file);
}

// Show Excel preview
function showExcelPreview(headers, data) {
  const previewTable = document.getElementById("previewTable");
  const previewSection = document.getElementById("previewSection");
  const recordCount = document.getElementById("recordCount");

  if (!previewTable || !previewSection || !recordCount) return;

  // Show preview section
  previewSection.style.display = "block";

  // Set record count
  recordCount.textContent = data.length;

  // Clear table
  previewTable.innerHTML = "";

  // Create header row
  const headerRow = document.createElement("tr");

  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header || "-";
    headerRow.appendChild(th);
  });

  previewTable.appendChild(headerRow);

  // Create data rows (limit to 10 rows for preview)
  const previewData = data.slice(0, 10);

  previewData.forEach((row) => {
    const tr = document.createElement("tr");

    headers.forEach((header) => {
      const td = document.createElement("td");
      td.textContent = row[header] || "-";
      tr.appendChild(td);
    });

    previewTable.appendChild(tr);
  });

  // If there are more rows, add ellipsis
  if (data.length > 10) {
    const ellipsisRow = document.createElement("tr");
    const ellipsisCell = document.createElement("td");
    ellipsisCell.colSpan = headers.length;
    ellipsisCell.textContent = "...";
    ellipsisCell.className = "ellipsis-cell";
    ellipsisRow.appendChild(ellipsisCell);
    previewTable.appendChild(ellipsisRow);
  }
}

// Process student data from Excel
async function processStudentData() {
  if (!currentFileData || currentFileData.length === 0) {
    showNotification("No data to process", "error");
    return;
  }

  showLoading(true);

  try {
    console.log(
      "Starting to process Excel file with",
      currentFileData.length,
      "records"
    );

    // Prepare data for backend processing
    const processedData = [];

    // Process all records without limiting to 50
    for (let i = 0; i < currentFileData.length; i++) {
      const record = currentFileData[i];

      // Map Arabic column names to English field names
      const processedRecord = {
        registration_id:
          record["رقم التعريف"] ||
          record["رقم الهوية"] ||
          record["الرقم التعريفي"] ||
          record["معرف الطالب"],
        first_name:
          record["الاسم"] || record["اسم الطالب"] || record["الاسم الاول"],
        last_name:
          record["اللقب"] || record["لقب الطالب"] || record["اسم العائلة"],
        gender: record["الجنس"] || record["النوع"],
        birth_date:
          record["تاريخ الازدياد"] ||
          record["تاريخ الميلاد"] ||
          record["تاريخ الولادة"],
        birth_place:
          record["مكان الازدياد"] ||
          record["مكان الميلاد"] ||
          record["مكان الولادة"],
        birth_by_judgment: record["مولود بحكم"] || record["ولادة بحكم قضائي"],
        birth_certificate: record["عقد الميلاد"] || record["شهادة الميلاد"],
        birth_record_year:
          record["سنة التسجيل في سجل الولادات"] || record["سنة تسجيل الميلاد"],
        birth_certificate_number:
          record["رقم عقد الميلاد"] || record["رقم شهادة الميلاد"],
        registration_number: record["رقم القيد"] || record["رقم التسجيل"],
        registration_date:
          record["تاريخ التسجيل بالمدرسة"] || record["تاريخ التسجيل"],
        education_level_name:
          record["السنة"] || record["المستوى"] || record["المستوى التعليمي"],
        specialty_name: record["الشعبة"] || record["التخصص"],
        section_name: record["القسم"],
        education_system_name:
          record["نظام التمدرس"] || record["نظام التدريس"] || record["النظام"],
      };

      console.log(
        `Record ${i + 1}/${currentFileData.length}:`,
        processedRecord
      );

      // Check if record has at least registration_id or name info
      if (
        processedRecord.registration_id ||
        (processedRecord.first_name && processedRecord.last_name) ||
        processedRecord.first_name ||
        processedRecord.last_name
      ) {
        processedData.push(processedRecord);
      } else {
        console.warn(
          `Skipping record ${i + 1} due to missing required fields:`,
          record
        );
      }
    }

    console.log(
      `Processed ${processedData.length} valid records out of ${currentFileData.length} total`
    );

    if (processedData.length === 0) {
      showLoading(false);
      showNotification("No valid records found in the file", "error");
      return;
    }

    // Send data to the server
    console.log("Sending data to server:", processedData);
    const response = await fetch(`${API_CONFIG.BASE_URL}/students/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ students: processedData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("Import result:", result);

    // Show results
    showLoading(false);
    if (result.success) {
      showNotification(
        `Import completed: ${result.successCount} added, ${result.updateCount} updated`,
        "success"
      );

      // Refresh data
      loadStudents();
    } else {
      showNotification(`Import failed: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("Error processing file:", error);
    showLoading(false);
    showNotification(`Error: ${error.message}`, "error");
  }

  // Reset file input and current file data
  const fileInput = document.getElementById("studentExcelFile");
  if (fileInput) {
    fileInput.value = "";
  }
  currentFileData = null;
}

// Helper function to find reference ID by name
function findReferenceIdByName(referenceArray, name) {
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

  // For education levels (years), handle numeric values
  if (!found && referenceArray.some((item) => item.name.includes("السنة"))) {
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
    if (normalizedName.includes("داخل") || normalizedName.includes("intern")) {
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
}

// Setup event listeners
function setupEventListeners() {
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Add student button
  const addStudentBtn = document.getElementById("addStudentBtn");
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", showAddStudentModal);
  }

  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", filterStudents);
  }

  // Filter dropdowns
  const educationLevelFilter = document.getElementById("educationLevelFilter");
  if (educationLevelFilter) {
    educationLevelFilter.addEventListener("change", filterStudents);
  }

  const specialtyFilter = document.getElementById("specialtyFilter");
  if (specialtyFilter) {
    specialtyFilter.addEventListener("change", filterStudents);
  }

  const sectionFilter = document.getElementById("sectionFilter");
  if (sectionFilter) {
    sectionFilter.addEventListener("change", filterStudents);
  }

  const educationSystemFilter = document.getElementById(
    "educationSystemFilter"
  );
  if (educationSystemFilter) {
    educationSystemFilter.addEventListener("change", filterStudents);
  }

  // Status filter
  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", filterStudents);
  }

  // Pagination buttons
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        updateStudentsTable();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(filteredStudents.length / pageSize);
      if (currentPage < totalPages) {
        currentPage++;
        updateStudentsTable();
      }
    });
  }

  // Close modal buttons
  const closeModalBtns = document.querySelectorAll(".close-btn");
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) {
        modal.classList.remove("open");
      }
    });
  });

  const cancelModalBtn = document.getElementById("cancelModalBtn");
  if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", () => {
      const modal = document.getElementById("studentModal");
      if (modal) {
        modal.classList.remove("open");
      }
    });
  }

  // Sortable columns
  const sortableHeaders = document.querySelectorAll(".sortable");
  sortableHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const field = header.getAttribute("data-field");
      if (field) {
        // If clicking on the same field, toggle direction
        if (sortField === field) {
          sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
          sortField = field;
          sortDirection = "asc";
        }

        // Update sort indicators
        document.querySelectorAll(".sort-indicator").forEach((indicator) => {
          indicator.textContent = "";
        });

        // Set the sort indicator for the clicked header
        const indicator = header.querySelector(".sort-indicator");
        if (indicator) {
          indicator.textContent = sortDirection === "asc" ? "▲" : "▼";
        }

        // Update the table with sorted data
        updateStudentsTable();
      }
    });
  });
}

// Update students table with current data
function updateStudentsTable() {
  const tableBody = document.getElementById("studentsTableBody");
  if (!tableBody) return;

  // Clear table
  tableBody.innerHTML = "";

  // Sort the filtered students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    // For numeric fields
    if (
      [
        "active",
        "education_level_id",
        "specialty_id",
        "section_id",
        "education_system_id",
      ].includes(sortField)
    ) {
      const valA = a[sortField] === null ? -1 : a[sortField];
      const valB = b[sortField] === null ? -1 : b[sortField];
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }

    // For date fields
    if (sortField === "birth_date" || sortField === "registration_date") {
      const dateA = a[sortField] ? new Date(a[sortField]) : new Date(0);
      const dateB = b[sortField] ? new Date(b[sortField]) : new Date(0);
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }

    // For string fields
    const valA = a[sortField] === null ? "" : a[sortField];
    const valB = b[sortField] === null ? "" : b[sortField];

    return sortDirection === "asc"
      ? valA.toString().localeCompare(valB.toString())
      : valB.toString().localeCompare(valA.toString());
  });

  // Paginate the results
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = sortedStudents.slice(
    startIndex,
    startIndex + pageSize
  );

  // If no students, show message
  if (paginatedStudents.length === 0) {
    const noDataRow = document.createElement("tr");
    const noDataCell = document.createElement("td");
    noDataCell.colSpan = 11; // Updated to match the number of columns
    noDataCell.textContent = "لا توجد بيانات متاحة";
    noDataCell.className = "no-data";
    noDataRow.appendChild(noDataCell);
    tableBody.appendChild(noDataRow);
  } else {
    // Add rows for each student
    paginatedStudents.forEach((student) => {
      const row = document.createElement("tr");
      row.className = student.active == 0 ? "inactive-row" : "";

      // Registration ID
      const idCell = document.createElement("td");
      idCell.textContent = student.registration_id || "-";
      row.appendChild(idCell);

      // First Name
      const firstNameCell = document.createElement("td");
      firstNameCell.textContent = student.first_name || "-";
      row.appendChild(firstNameCell);

      // Last Name
      const lastNameCell = document.createElement("td");
      lastNameCell.textContent = student.last_name || "-";
      row.appendChild(lastNameCell);

      // Gender
      const genderCell = document.createElement("td");
      genderCell.textContent = student.gender || "-";
      row.appendChild(genderCell);

      // Birth Date
      const birthDateCell = document.createElement("td");
      birthDateCell.textContent = student.birth_date
        ? new Date(student.birth_date).toLocaleDateString("ar-SA")
        : "-";
      row.appendChild(birthDateCell);

      // Education Level
      const educationLevelCell = document.createElement("td");
      const educationLevel = educationLevels.find(
        (level) => level.id === student.education_level_id
      );
      educationLevelCell.textContent = educationLevel
        ? educationLevel.name
        : "-";
      row.appendChild(educationLevelCell);

      // Specialty
      const specialtyCell = document.createElement("td");
      const specialty = specialties.find(
        (spec) => spec.id === student.specialty_id
      );
      specialtyCell.textContent = specialty ? specialty.name : "-";
      row.appendChild(specialtyCell);

      // Section
      const sectionCell = document.createElement("td");
      const section = sections.find((sec) => sec.id === student.section_id);
      sectionCell.textContent = section ? section.name : "-";
      row.appendChild(sectionCell);

      // Education System
      const educationSystemCell = document.createElement("td");
      const educationSystem = educationSystems.find(
        (sys) => sys.id === student.education_system_id
      );
      educationSystemCell.textContent = educationSystem
        ? educationSystem.name
        : "-";
      row.appendChild(educationSystemCell);

      // Status
      const statusCell = document.createElement("td");
      const statusSpan = document.createElement("span");
      statusSpan.className = `status-badge ${
        student.active == 1 ? "active" : "inactive"
      }`;
      statusSpan.textContent = student.active == 1 ? "نشط" : "غير نشط";
      statusCell.appendChild(statusSpan);
      row.appendChild(statusCell);

      // Actions
      const actionsCell = document.createElement("td");
      actionsCell.className = "actions-cell";

      // View Button
      const viewBtn = document.createElement("button");
      viewBtn.className = "action-btn view-btn";
      viewBtn.title = "عرض بيانات الطالب";
      viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
      viewBtn.onclick = () => viewStudent(student.id);
      actionsCell.appendChild(viewBtn);

      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.className = "action-btn edit-btn";
      editBtn.title = "تعديل بيانات الطالب";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.onclick = () => editStudent(student.id);
      actionsCell.appendChild(editBtn);

      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "action-btn delete-btn";
      deleteBtn.title = "حذف الطالب";
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteBtn.onclick = () => deleteStudent(student.id);
      actionsCell.appendChild(deleteBtn);

      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });
  }

  // Update pagination info
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  document.getElementById("currentPage").textContent = currentPage;
  document.getElementById("totalPages").textContent = totalPages;

  // Update pagination button states
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 1;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return "";

  try {
    // Format to local date string (without time)
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA");
  } catch (error) {
    return dateString; // Fallback to original string if error
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

// Show or hide loading indicator
function showLoading(isLoading) {
  const tableWrapper = document.querySelector(".table-wrapper");

  if (tableWrapper) {
    if (isLoading) {
      tableWrapper.classList.add("loading");
    } else {
      tableWrapper.classList.remove("loading");
    }
  }
}

// Show student modal for adding new student
function showAddStudentModal() {
  const modal = document.getElementById("studentModal");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("studentForm");

  if (modal && modalTitle) {
    modalTitle.textContent = "إضافة طالب جديد";
    modal.classList.add("open");
  }

  // Reset form
  if (form) {
    form.reset();

    // Enable all form fields
    const inputs = form.querySelectorAll("input, select");
    inputs.forEach((input) => {
      input.disabled = false;
      input.readOnly = false;
    });

    // Set form submit action to add student
    form.onsubmit = async (e) => {
      e.preventDefault();
      await addStudent(form);
    };
  }
}

// View student details
function viewStudent(id) {
  const student = students.find((s) => s.id === id);

  if (!student) {
    showNotification("لم يتم العثور على بيانات الطالب", "error");
    return;
  }

  // Show the modal
  const modal = document.getElementById("studentModal");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("studentForm");

  if (modal && modalTitle) {
    modalTitle.textContent = "عرض بيانات الطالب";
    modal.classList.add("open");

    // Set form to read-only mode
    if (form) {
      // Fill the form with student data
      document.getElementById("studentId").value =
        student.registration_id || "";
      document.getElementById("studentId").readOnly = true;

      document.getElementById("firstName").value = student.first_name || "";
      document.getElementById("firstName").readOnly = true;

      document.getElementById("lastName").value = student.last_name || "";
      document.getElementById("lastName").readOnly = true;

      document.getElementById("gender").value = student.gender || "";
      document.getElementById("gender").disabled = true;

      document.getElementById("birthDate").value = student.birth_date || "";
      document.getElementById("birthDate").readOnly = true;

      document.getElementById("birthPlace").value = student.birth_place || "";
      document.getElementById("birthPlace").readOnly = true;

      document.getElementById("birthByJudgment").value =
        student.birth_by_judgment || "";
      document.getElementById("birthByJudgment").readOnly = true;

      document.getElementById("birthCertificate").value =
        student.birth_certificate || "";
      document.getElementById("birthCertificate").readOnly = true;

      document.getElementById("birthRecordYear").value =
        student.birth_record_year || "";
      document.getElementById("birthRecordYear").readOnly = true;

      document.getElementById("birthCertificateNumber").value =
        student.birth_certificate_number || "";
      document.getElementById("birthCertificateNumber").readOnly = true;

      document.getElementById("registrationNumber").value =
        student.registration_number || "";
      document.getElementById("registrationNumber").readOnly = true;

      document.getElementById("registrationDate").value =
        student.registration_date || "";
      document.getElementById("registrationDate").readOnly = true;

      document.getElementById("educationLevel").value =
        student.education_level_id || "";
      document.getElementById("educationLevel").disabled = true;

      document.getElementById("specialty").value = student.specialty_id || "";
      document.getElementById("specialty").disabled = true;

      document.getElementById("section").value = student.section_id || "";
      document.getElementById("section").disabled = true;

      document.getElementById("educationSystem").value =
        student.education_system_id || "";
      document.getElementById("educationSystem").disabled = true;

      // Hide the save button
      form.querySelector('button[type="submit"]').style.display = "none";

      // Change the cancel button text
      form.querySelector("#cancelModalBtn").textContent = "إغلاق";

      // Remove form submit handler
      form.onsubmit = (e) => {
        e.preventDefault();
        modal.classList.remove("open");
      };
    }
  }
}

// Edit student
function editStudent(id) {
  const student = students.find((s) => s.id === id);

  if (!student) {
    showNotification("لم يتم العثور على بيانات الطالب", "error");
    return;
  }

  // Show the modal
  const modal = document.getElementById("studentModal");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("studentForm");

  if (modal && modalTitle) {
    modalTitle.textContent = "تعديل بيانات الطالب";
    modal.classList.add("open");

    // Fill form with student data
    if (form) {
      // Fill the form with student data
      document.getElementById("studentId").value =
        student.registration_id || "";
      document.getElementById("firstName").value = student.first_name || "";
      document.getElementById("lastName").value = student.last_name || "";
      document.getElementById("gender").value = student.gender || "";
      document.getElementById("birthDate").value = student.birth_date || "";
      document.getElementById("birthPlace").value = student.birth_place || "";
      document.getElementById("birthByJudgment").value =
        student.birth_by_judgment || "";
      document.getElementById("birthCertificate").value =
        student.birth_certificate || "";
      document.getElementById("birthRecordYear").value =
        student.birth_record_year || "";
      document.getElementById("birthCertificateNumber").value =
        student.birth_certificate_number || "";
      document.getElementById("registrationNumber").value =
        student.registration_number || "";
      document.getElementById("registrationDate").value =
        student.registration_date || "";
      document.getElementById("educationLevel").value =
        student.education_level_id || "";
      document.getElementById("specialty").value = student.specialty_id || "";
      document.getElementById("section").value = student.section_id || "";
      document.getElementById("educationSystem").value =
        student.education_system_id || "";

      // Enable all form fields
      const inputs = form.querySelectorAll("input, select");
      inputs.forEach((input) => {
        input.disabled = false;
        input.readOnly = false;
      });

      // Show the save button
      const saveBtn = form.querySelector('button[type="submit"]');
      saveBtn.style.display = "block";
      saveBtn.textContent = "حفظ التغييرات";

      // Change the cancel button text
      form.querySelector("#cancelModalBtn").textContent = "إلغاء";

      // Set form submit handler to update student
      form.onsubmit = async (e) => {
        e.preventDefault();
        await updateStudent(student.id, form);
      };
    }
  }
}

// Add student to database
async function addStudent(form) {
  try {
    showLoading(true);

    // Get form data
    const formData = new FormData(form);
    const studentData = {};

    // Convert FormData to object
    formData.forEach((value, key) => {
      // Convert ID fields to integers
      if (key.endsWith("_id") && value) {
        studentData[key] = parseInt(value);
      } else {
        studentData[key] = value;
      }
    });

    // Set default active status
    studentData.active = 1;

    // Send to API
    const response = await window.db.add("/students", studentData);

    if (response.success) {
      showNotification("تم إضافة الطالب بنجاح", "success");

      // Close the modal
      const modal = document.getElementById("studentModal");
      if (modal) {
        modal.classList.remove("open");
      }

      // Reload students
      await loadStudents();
    } else {
      throw new Error(response.error || "Failed to add student");
    }

    showLoading(false);
  } catch (error) {
    console.error("Error adding student:", error);
    showNotification("حدث خطأ أثناء إضافة الطالب", "error");
    showLoading(false);
  }
}

// Update student in database
async function updateStudent(id, form) {
  try {
    showLoading(true);

    // Get form data
    const formData = new FormData(form);
    const studentData = {};

    // Convert FormData to object
    formData.forEach((value, key) => {
      // Convert ID fields to integers
      if (key.endsWith("_id") && value) {
        studentData[key] = parseInt(value);
      } else {
        studentData[key] = value;
      }
    });

    // Ensure the ID is included
    studentData.id = id;

    // Maintain active status (from existing student data)
    const existingStudent = students.find((s) => s.id === id);
    if (existingStudent) {
      studentData.active = existingStudent.active;
    }

    // Send to API
    const response = await window.db.update(`/students/${id}`, studentData);

    if (response.success) {
      showNotification("تم تحديث بيانات الطالب بنجاح", "success");

      // Close the modal
      const modal = document.getElementById("studentModal");
      if (modal) {
        modal.classList.remove("open");
      }

      // Reload students
      await loadStudents();
    } else {
      throw new Error(response.error || "Failed to update student");
    }

    showLoading(false);
  } catch (error) {
    console.error("Error updating student:", error);
    showNotification("حدث خطأ أثناء تحديث بيانات الطالب", "error");
    showLoading(false);
  }
}

// Delete student
async function deleteStudent(id) {
  if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
    return;
  }

  try {
    showLoading(true);

    // We'll do a soft delete by setting active to 0
    const student = students.find((s) => s.id === id);
    if (!student) {
      throw new Error("Student not found");
    }

    // Set active status to 0
    student.active = 0;

    // Update in database
    const response = await window.db.update(`/students/${id}`, student);

    if (response.success) {
      showNotification("تم حذف الطالب بنجاح", "success");

      // Reload students
      await loadStudents();
    } else {
      throw new Error(response.error || "Failed to delete student");
    }

    showLoading(false);
  } catch (error) {
    console.error("Error deleting student:", error);
    showNotification("حدث خطأ أثناء حذف الطالب", "error");
    showLoading(false);
  }
}
