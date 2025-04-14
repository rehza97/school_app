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

      // Find the registration ID column index
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      let regIdColIndex = -1;
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        const cell = worksheet[cellAddress];
        if (cell && cell.v === "رقم التعريف") {
          regIdColIndex = C;
          break;
        }
      }

      // If found, force that column to be read as text
      if (regIdColIndex !== -1) {
        for (let R = range.s.r + 1; R <= range.e.r; R++) {
          const cellAddress = XLSX.utils.encode_cell({
            r: R,
            c: regIdColIndex,
          });
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].t = "s"; // Force cell type to be string
            worksheet[cellAddress].z = "@"; // Force text format
            // Ensure the value is stored as a string
            worksheet[cellAddress].v = worksheet[cellAddress].v.toString();
          }
        }
      }

      // Convert to JSON with header:1 to get full array representation
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false, // This ensures dates and numbers are parsed as strings
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
      rows.forEach((row, rowIndex) => {
        // Skip empty rows
        if (row.every((cell) => !cell)) {
          return;
        }

        const obj = {};
        headers.forEach((header, index) => {
          if (header && index < row.length) {
            // Ensure registration_id is always a string
            if (header === "رقم التعريف" && row[index]) {
              obj[header] = row[index].toString();
              console.log(`Row ${rowIndex + 1} registration_id:`, {
                original: row[index],
                converted: obj[header],
                type: typeof obj[header],
              });
            } else {
              obj[header] = row[index];
            }
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

    // Process all records
    for (let i = 0; i < currentFileData.length; i++) {
      const record = currentFileData[i];

      // Map Arabic column names to English field names
      const processedRecord = {
        registration_id: (
          record["رقم التعريف"] ||
          record["رقم الهوية"] ||
          record["الرقم التعريفي"] ||
          record["معرف الطالب"]
        ).toString(),
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

      // Debug log for registration ID
      console.log(
        `Record ${i + 1}/${currentFileData.length} registration_id:`,
        {
          value: processedRecord.registration_id,
          type: typeof processedRecord.registration_id,
          length: processedRecord.registration_id.length,
        }
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

  // Student form submit
  const studentForm = document.getElementById("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const studentId = studentForm.getAttribute("data-student-id");

      if (studentId) {
        // Update existing student
        await updateStudent(studentId, studentForm);
      } else {
        // Add new student
        await addStudent(studentForm);
      }
    });
  }
}

// Update students table with current data
function updateStudentsTable() {
  if (!studentsTableBody) return;

  // Clear existing rows
  studentsTableBody.innerHTML = "";

  // Calculate pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Create table rows
  paginatedStudents.forEach((student) => {
    const row = document.createElement("tr");

    // Add data cells
    row.innerHTML = `
      <td>${student.registration_id || ""}</td>
      <td>${student.first_name || ""}</td>
      <td>${student.last_name || ""}</td>
      <td>${student.gender || ""}</td>
      <td>${formatDate(student.birth_date) || ""}</td>
      <td>${student.education_level_name || ""}</td>
      <td>${student.specialty_name || ""}</td>
      <td>${student.section_name || ""}</td>
      <td>${student.education_system_name || ""}</td>
      <td>
        <span class="status-badge ${student.active ? "active" : "inactive"}">
          ${student.active ? "نشط" : "غير نشط"}
        </span>
      </td>
      <td class="actions">
        <button onclick="viewStudent(${
          student.id
        })" class="btn-icon" title="عرض">
          <i class="fas fa-eye"></i>
        </button>
        <button onclick="editStudent(${
          student.id
        })" class="btn-icon" title="تعديل">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteStudent(${
          student.id
        })" class="btn-icon delete" title="حذف">
          <i class="fas fa-trash"></i>
        </button>
        </td>
      `;

    studentsTableBody.appendChild(row);
  });

  // Update pagination info
  document.getElementById("currentPage").textContent = currentPage;
  document.getElementById("totalPages").textContent = Math.ceil(
    filteredStudents.length / pageSize
  );

  // Update pagination buttons
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 1;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled =
      currentPage >= Math.ceil(filteredStudents.length / pageSize);
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-LY");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
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

// Show add student modal
function showAddStudentModal() {
  const modal = document.getElementById("studentModal");
  const form = document.getElementById("studentForm");
  const modalTitle = document.getElementById("modalTitle");

  // Reset form
  form.reset();
  form.removeAttribute("data-student-id");

  // Set modal title
  modalTitle.textContent = "إضافة طالب جديد";

  // Show modal
  modal.style.display = "block";

  // Setup close handlers
  const closeBtn = modal.querySelector(".close-btn");
  const cancelBtn = document.getElementById("cancelModalBtn");

  closeBtn.onclick = () => (modal.style.display = "none");
  cancelBtn.onclick = () => (modal.style.display = "none");

  // Close on outside click
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

// View student details
async function viewStudent(id) {
  try {
    showLoading(true);
    const response = await window.db.getById("/students", id);

    if (response.success) {
      const student = response.data;
      const modal = document.getElementById("studentModal");
      const form = document.getElementById("studentForm");
      const modalTitle = document.getElementById("modalTitle");

      // Set modal title
      modalTitle.textContent = "عرض بيانات الطالب";

      // Fill form fields
      Object.keys(student).forEach((key) => {
        const input = form.elements[key];
        if (input) {
          input.value = student[key];
          input.disabled = true;
        }
      });

      // Show modal
      modal.style.display = "block";

      // Setup close handlers
      const closeBtn = modal.querySelector(".close-btn");
      const cancelBtn = document.getElementById("cancelModalBtn");

      closeBtn.onclick = () => {
        modal.style.display = "none";
        // Re-enable form fields
        Array.from(form.elements).forEach((input) => (input.disabled = false));
      };

      cancelBtn.onclick = () => {
        modal.style.display = "none";
        // Re-enable form fields
        Array.from(form.elements).forEach((input) => (input.disabled = false));
      };
    } else {
      showNotification("فشل في تحميل بيانات الطالب", "error");
    }
  } catch (error) {
    console.error("Error viewing student:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الطالب", "error");
  } finally {
    showLoading(false);
  }
}

// Edit student
async function editStudent(id) {
  try {
    showLoading(true);
    const response = await window.db.getById("/students", id);

    if (response.success) {
      const student = response.data;
      const modal = document.getElementById("studentModal");
      const form = document.getElementById("studentForm");
      const modalTitle = document.getElementById("modalTitle");

      // Set modal title and student ID
      modalTitle.textContent = "تعديل بيانات الطالب";
      form.setAttribute("data-student-id", id);

      // Fill form fields
      Object.keys(student).forEach((key) => {
        const input = form.elements[key];
        if (input) {
          input.value = student[key];
        }
      });

      // Show modal
      modal.style.display = "block";

      // Setup close handlers
      const closeBtn = modal.querySelector(".close-btn");
      const cancelBtn = document.getElementById("cancelModalBtn");

      closeBtn.onclick = () => (modal.style.display = "none");
      cancelBtn.onclick = () => (modal.style.display = "none");
    } else {
      showNotification("فشل في تحميل بيانات الطالب", "error");
    }
  } catch (error) {
    console.error("Error editing student:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات الطالب", "error");
  } finally {
    showLoading(false);
  }
}

// Add new student
async function addStudent(form) {
  try {
    showLoading(true);

    // Get form data
    const formData = new FormData(form);
    let studentData = Object.fromEntries(formData.entries());

    // Ensure registration_id is treated as a string
    if (studentData.registration_id) {
      studentData.registration_id = studentData.registration_id.toString();
    }

    // Debug log
    console.log("Adding student with data:", {
      ...studentData,
      registration_id_type: typeof studentData.registration_id,
      registration_id_length: studentData.registration_id?.length,
    });

    // Add student
    const response = await window.db.add("/students", studentData);

    console.log("Server response:", response);

    if (response.success) {
      showNotification("تم إضافة الطالب بنجاح", "success");

      // Close modal
      document.getElementById("studentModal").style.display = "none";

      // Reload students
      await loadStudents();
    } else {
      showNotification("فشل في إضافة الطالب", "error");
    }
  } catch (error) {
    console.error("Error adding student:", error);
    showNotification("حدث خطأ أثناء إضافة الطالب", "error");
  } finally {
    showLoading(false);
  }
}

// Update existing student
async function updateStudent(id, form) {
  try {
    showLoading(true);

    // First get existing student data
    const existingStudentResponse = await window.db.getById("/students", id);
    if (!existingStudentResponse.success) {
      throw new Error("Failed to fetch existing student data");
    }
    const existingStudent = existingStudentResponse.data;

    console.log("Existing student data:", existingStudent);

    // Get form data
    const formData = new FormData(form);
    const updatedData = Object.fromEntries(formData.entries());

    // Debug log form data
    console.log("Form data before processing:", {
      ...updatedData,
      registration_id_type: typeof updatedData.registration_id,
      registration_id_length: updatedData.registration_id?.length,
    });

    // Ensure registration_id is treated as a string
    if (updatedData.registration_id) {
      updatedData.registration_id = updatedData.registration_id.toString();
    }

    // Merge existing data with updated data
    const studentData = {
      ...existingStudent,
      ...updatedData,
      id: id, // Ensure ID is preserved
      active: existingStudent.active, // Preserve active status
      // Keep registration_id as string
      registration_id:
        updatedData.registration_id || existingStudent.registration_id,
      // Convert other ID fields to numbers
      education_level_id: updatedData.education_level_id
        ? Number(updatedData.education_level_id)
        : existingStudent.education_level_id,
      specialty_id: updatedData.specialty_id
        ? Number(updatedData.specialty_id)
        : existingStudent.specialty_id,
      section_id: updatedData.section_id
        ? Number(updatedData.section_id)
        : existingStudent.section_id,
      education_system_id: updatedData.education_system_id
        ? Number(updatedData.education_system_id)
        : existingStudent.education_system_id,
    };

    // Debug log final data
    console.log("Final data being sent to server:", {
      ...studentData,
      registration_id_type: typeof studentData.registration_id,
      registration_id_length: studentData.registration_id?.length,
    });

    // Update student
    const response = await window.db.update(`/students/${id}`, studentData);

    console.log("Server response:", response);

    if (response.success) {
      showNotification("تم تحديث بيانات الطالب بنجاح", "success");

      // Close modal
      const modal = document.getElementById("studentModal");
      modal.style.display = "none";

      // Reload students
      await loadStudents();
    } else {
      showNotification("فشل في تحديث بيانات الطالب", "error");
    }
  } catch (error) {
    console.error("Error updating student:", error);
    showNotification("حدث خطأ أثناء تحديث بيانات الطالب", "error");
  } finally {
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

    const response = await window.db.delete(`/students/${id}`);

    if (response.success) {
      showNotification("تم حذف الطالب بنجاح", "success");
      await loadStudents();
    } else {
      showNotification("فشل في حذف الطالب", "error");
    }
  } catch (error) {
    console.error("Error deleting student:", error);
    showNotification("حدث خطأ أثناء حذف الطالب", "error");
  } finally {
    showLoading(false);
  }
}
