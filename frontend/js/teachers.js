// Initialize Firebase and XLSX with debug logging
console.log("🚀 Starting teachers.js initialization...");
console.log("📚 Debug Information:");
console.log(
  "- XLSX Library:",
  typeof XLSX !== "undefined" ? "✅ Loaded" : "❌ Not loaded"
);
console.log("- Excel Version:", XLSX ? XLSX.version : "Not available");
console.log(
  "- Firebase:",
  typeof firebase !== "undefined" ? "✅ Loaded" : "❌ Not loaded"
);

// Global variables with debug
let teachersData = [];
let currentPage = 1;
const pageSize = 10;
let excelData = null;

// Debug configuration
const DEBUG = true;
const DEBUG_LEVELS = {
  INFO: "📘",
  SUCCESS: "✅",
  WARNING: "⚠️",
  ERROR: "❌",
  FIREBASE: "🔥",
  EXCEL: "📊",
  DATA: "📝",
};

function debugLog(message, data = null, level = "INFO") {
  if (!DEBUG) return;

  const icon = DEBUG_LEVELS[level] || DEBUG_LEVELS.INFO;
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];

  if (data) {
    if (typeof data === "object" && data !== null) {
      console.group(`${icon} [${timestamp}] ${message}`);
      Object.entries(data).forEach(([key, value]) => {
        if (key.toLowerCase().includes("ref")) {
          console.log(`${key}:`, value ? value.path : "null");
        } else {
          console.log(`${key}:`, value);
        }
      });
      console.groupEnd();
    } else {
      console.log(`${icon} [${timestamp}] ${message}`, data);
    }
  } else {
    console.log(`${icon} [${timestamp}] ${message}`);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  debugLog("DOM loaded, starting initialization...");
  await initialize();
  debugLog("Initialization complete");
});

// Initialize the page
async function initialize() {
  try {
    debugLog("Starting page initialization");

    // Check Excel-related elements
    const elements = {
      fileInput: document.getElementById("excelFile"),
      uploadBtn: document.getElementById("fileUploadBtn"),
      previewSection: document.getElementById("previewSection"),
      previewTable: document.getElementById("previewTable"),
      recordCount: document.getElementById("recordCount"),
      uploadDataBtn: document.getElementById("uploadBtn"),
      cancelBtn: document.getElementById("cancelBtn"),
    };

    debugLog("Element check results:", elements);

    // Load initial data
    await fetchAndDisplayTeachers();
    setupFileUpload();
    setupPagination();

    debugLog("Page initialization completed successfully");
  } catch (error) {
    console.error("❌ Initialization error:", error);
    showNotification("حدث خطأ أثناء تهيئة الصفحة", "error");
  }
}

// Firebase references

// Load teachers from Firebase
async function fetchAndDisplayTeachers() {
  try {
    debugLog("📥 Fetching teachers from Firebase...", null, "FIREBASE");

    const snapshot = await teachersRef.get();

    // Log Firebase data in console
    console.group("🔥 Firebase Teachers Collection");
    console.log("Collection Path: /teachers");
    console.log(`Total Documents: ${snapshot.size}`);

    const teachersArray = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Timestamps to readable dates
      const createdAt = data.createdAt?.toDate().toISOString();
      const updatedAt = data.updatedAt?.toDate().toISOString();

      console.group(`📄 Document ID: ${doc.id}`);
      const teacherData = {
        id: doc.id,
        birth_date: data.birth_date || "",
        createdAt: createdAt || "",
        first_name: data.first_name || "",
        isActive: data.isActive ?? true,
        last_name: data.last_name || "",
        level: data.level || "",
        registration_id: data.registration_id || "",
        role_ref: data.role_ref?.path || "",
        start_date: data.start_date || "",
        subject_ref: data.subject_ref?.path || "",
        updatedAt: updatedAt || "",
      };

      console.table(teacherData);
      teachersArray.push(teacherData);
      console.groupEnd();
    });
    console.groupEnd();

    // Log the full array of teachers
    console.group("📊 Teachers Data Array");
    console.table(teachersArray);
    console.groupEnd();

    // Clear existing data
    teachersData = teachersArray;
    const tableBody = document.querySelector("#teachersTable tbody");
    if (!tableBody) {
      console.error("❌ Teachers table body not found");
      return;
    }

    if (snapshot.empty) {
      console.log("❌ No teachers found in database");
      console.groupEnd();
      updateStats(0, 0, 0);
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">لا توجد بيانات</td></tr>';
      return;
    }

    let activeCount = 0;
    let subjectsSet = new Set();

    // Fetch reference data
    const [subjectsSnapshot, rolesSnapshot] = await Promise.all([
      subjectsRef.get(),
      rolesRef.get(),
    ]);

    // Create maps for quick lookups
    const subjectsMap = new Map();
    const rolesMap = new Map();

    subjectsSnapshot.forEach((doc) => {
      const data = doc.data();
      subjectsMap.set(doc.id, data.name);
      console.log(`📘 Subject: ${data.name} (${doc.id})`);
    });

    rolesSnapshot.forEach((doc) => {
      const data = doc.data();
      rolesMap.set(doc.id, data.name);
      console.log(`👤 Role: ${data.name} (${doc.id})`);
    });

    // Build table HTML
    let tableHTML = "";
    teachersArray.forEach((teacher) => {
      // Get role and subject names from references
      const roleId = teacher.role_ref.split("/").pop();
      const subjectId = teacher.subject_ref.split("/").pop();
      const roleName = rolesMap.get(roleId) || "";
      const subjectName = subjectsMap.get(subjectId) || "";

      if (subjectName) {
        subjectsSet.add(subjectName);
      }
      if (teacher.isActive) activeCount++;

      tableHTML += `
        <tr>
          <td>
            <div class="teacher-avatar">
              ${
                teacher.photoUrl
                  ? `<img src="${teacher.photoUrl}" alt="${teacher.first_name}">`
                  : '<i class="fas fa-user"></i>'
              }
            </div>
          </td>
          <td>${teacher.registration_id}</td>
          <td>${teacher.last_name}</td>
          <td>${teacher.first_name}</td>
          <td>${formatDate(teacher.birth_date)}</td>
          <td>${roleName}</td>
          <td>${subjectName}</td>
          <td>
            <span class="status-badge ${
              teacher.isActive ? "active" : "inactive"
            }">
              ${teacher.isActive ? "نشط" : "غير نشط"}
            </span>
          </td>
          <td class="actions">
            <button onclick="viewTeacher('${
              teacher.id
            }')" class="btn-icon" title="عرض">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="editTeacher('${
              teacher.id
            }')" class="btn-icon" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteTeacher('${
              teacher.id
            }')" class="btn-icon" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    // Update table content
    tableBody.innerHTML = tableHTML;

    // Log summary statistics
    console.group("📈 Statistics");
    console.table({
      "Total Teachers": teachersArray.length,
      "Active Teachers": activeCount,
      "Unique Subjects": subjectsSet.size,
    });
    console.log("Subjects List:", Array.from(subjectsSet));
    console.groupEnd();

    debugLog(
      `Processed ${teachersArray.length} teachers (${activeCount} active)`,
      null,
      "SUCCESS"
    );
    updateStats(teachersArray.length, activeCount, subjectsSet.size);

    // Setup pagination
    setupPagination();
    updatePagination(teachersArray.length);
  } catch (error) {
    console.error("❌ Error loading teachers:", error);
    debugLog(
      "Error details",
      {
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      "ERROR"
    );
    showNotification("حدث خطأ أثناء تحميل بيانات المعلمين", "error");
  }
}

// Load reference data (subjects)
async function loadReferenceData() {
  try {
    // Load subjects
    const subjectsSnapshot = await db.collection("subjects").get();
    const subjectFilter = document.getElementById("subjectFilter");

    // Clear existing options except the first one
    subjectFilter.innerHTML = '<option value="">جميع المواد</option>';

    subjectsSnapshot.forEach((doc) => {
      const data = doc.data();
      const option = new Option(data.name, doc.id);
      subjectFilter.add(option);
    });

    // Update subjects count
    document.getElementById("totalSubjects").textContent =
      subjectsSnapshot.size;
  } catch (error) {
    console.error("Error loading reference data:", error);
    showNotification("حدث خطأ أثناء تحميل البيانات المرجعية", "error");
  }
}

// Display teachers in table
function displayTeachers(teachers) {
  const tableBody = document.querySelector("#teachersTable tbody");
  if (!tableBody) return;

  if (teachers.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="8" class="no-data">لا توجد بيانات</td></tr>';
    return;
  }

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedTeachers = teachers.slice(start, end);

  tableBody.innerHTML = paginatedTeachers
    .map(
      (teacher) => `
        <tr>
            <td>
                <div class="teacher-avatar">
                    ${
                      teacher.photoUrl
                        ? `<img src="${teacher.photoUrl}" alt="${teacher.first_name}">`
                        : '<i class="fas fa-user"></i>'
                    }
                </div>
            </td>
        <td>${teacher.registration_id || ""}</td>
        <td>${teacher.last_name || ""}</td>
        <td>${teacher.first_name || ""}</td>
            <td>${formatDate(teacher.birth_date) || ""}</td>
            <td>${teacher.role_name || ""}</td>
        <td>${teacher.subject_name || ""}</td>
            <td>
                <span class="status-badge ${
                  teacher.isActive ? "active" : "inactive"
                }">
                    ${teacher.isActive ? "نشط" : "غير نشط"}
                </span>
            </td>
            <td class="actions">
                <button onclick="viewTeacher('${
                  teacher.id
                }')" class="btn-icon" title="عرض">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editTeacher('${
                  teacher.id
                }')" class="btn-icon" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
                <button onclick="deleteTeacher('${
                  teacher.id
                }')" class="btn-icon" title="حذف">
                    <i class="fas fa-trash"></i>
            </button>
        </td>
        </tr>
    `
    )
    .join("");

  updatePagination(teachers.length);
}

// Update stats display
function updateStats(total, active, subjects) {
  document.getElementById("totalTeachers").textContent = total;
  document.getElementById("activeTeachers").textContent = active;
  document.getElementById("totalSubjects").textContent = subjects;
}

// Update pagination controls
function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / pageSize);

  // Update page info text
  const pageInfo = document.querySelector(".page-info");
  if (pageInfo) {
    pageInfo.textContent = `الصفحة ${currentPage} من ${totalPages}`;
  }

  // Update navigation buttons
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 1;
    prevPageBtn.classList.toggle("disabled", currentPage === 1);
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage === totalPages;
    nextPageBtn.classList.toggle("disabled", currentPage === totalPages);
  }

  // Update page numbers
  const pageNumbers = document.getElementById("pageNumbers");
  if (pageNumbers) {
    let pagesHtml = "";
    const maxPages = 5; // Show maximum 5 page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxPages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pagesHtml += `<button class="page-number ${
        i === currentPage ? "active" : ""
      }" 
        data-page="${i}">${i}</button>`;
    }
    pageNumbers.innerHTML = pagesHtml;

    // Add click handlers to page numbers
    const pageButtons = pageNumbers.querySelectorAll(".page-number");
    pageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        currentPage = parseInt(button.dataset.page);
        displayTeachers(teachersData);
      });
    });
  }

  debugLog(`Pagination updated: Page ${currentPage} of ${totalPages}`);
}

// Add pagination event listeners
function setupPagination() {
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        displayTeachers(teachersData);
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(teachersData.length / pageSize);
      if (currentPage < totalPages) {
        currentPage++;
        displayTeachers(teachersData);
      }
    });
  }
}

// Handle file selection with enhanced debugging
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    debugLog("❌ No file selected");
    return;
  }

  debugLog("📁 File selected:", {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024).toFixed(2)} KB`,
  });

  const fileNameElement = document.getElementById("selectedFileName");
  if (fileNameElement) {
    fileNameElement.textContent = file.name;
    debugLog("Updated file name display");
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    debugLog("📖 File read complete, starting processing");

    try {
      debugLog("Parsing Excel file...");
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      debugLog("Workbook sheets found:", workbook.SheetNames);

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      debugLog("Processing first sheet:", workbook.SheetNames[0]);

      // Get all data including empty rows
      const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      debugLog(`Raw data contains ${rawData.length} rows`);

      // Find the header row - look for row containing "الرمز الوظيفي"
      let headerRowIndex = -1;
      for (let i = 0; i < rawData.length; i++) {
        if (
          rawData[i].some(
            (cell) => cell && cell.toString().includes("الرمز الوظيفي")
          )
        ) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error("لم يتم العثور على صف العناوين في الملف");
      }

      debugLog(`Found header row at index ${headerRowIndex}`);

      // Clean up headers - remove extra spaces and normalize
      const headers = rawData[headerRowIndex].map((header) =>
        header ? header.toString().trim() : ""
      );
      debugLog("Cleaned headers:", headers);

      const data = [];
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0 || row.every((cell) => !cell)) {
          debugLog(`Skipping empty row at index ${i}`);
          continue;
        }

        const record = {};
        headers.forEach((header, index) => {
          if (header) {
            let value = row[index];
            // Convert Excel dates to proper format
            if (header === "تاريخ الازدياد" || header === "تاريخ السريان") {
              if (value) {
                try {
                  value = XLSX.SSF.parse_date_code(value);
                  value = new Date(Date.UTC(value.y, value.m - 1, value.d));
                  value = value.toISOString().split("T")[0];
                } catch (e) {
                  debugLog(
                    `Failed to parse date in row ${i + 1}, column ${header}`,
                    e
                  );
                }
              }
            }
            record[header] = value;
          }
        });

        // Only add record if it has at least one non-empty value
        if (Object.values(record).some((val) => val)) {
          data.push(record);
        }
      }

      debugLog(`Processed ${data.length} valid records`);
      if (data.length > 0) {
        debugLog("Sample record:", data[0]);
      }

      excelData = data;
      showPreview(headers, data.slice(0, 5));
    } catch (error) {
      console.error("❌ Excel parsing error:", error);
      showNotification("حدث خطأ أثناء معالجة ملف Excel", "error");
    }
  };

  reader.onerror = function (error) {
    console.error("❌ File reading error:", error);
    showNotification("حدث خطأ أثناء قراءة الملف", "error");
  };

  debugLog("Starting file read operation");
  reader.readAsBinaryString(file);
}

// Show preview of Excel data
function showPreview(headers, data) {
  const previewSection = document.getElementById("previewSection");
  const previewTable = document.getElementById("previewTable");
  const recordCount = document.getElementById("recordCount");

  if (!previewSection || !previewTable || !recordCount) return;

  recordCount.textContent = excelData.length;

  let tableHTML = "<thead><tr>";
  headers.forEach((header) => {
    tableHTML += `<th>${header}</th>`;
  });
  tableHTML += "</tr></thead><tbody>";

  data.forEach((row) => {
    tableHTML += "<tr>";
    headers.forEach((header) => {
      tableHTML += `<td>${row[header] || ""}</td>`;
    });
    tableHTML += "</tr>";
  });

  tableHTML += "</tbody>";
  previewTable.innerHTML = tableHTML;
  previewSection.style.display = "block";
}

// CRUD Operations
async function viewTeacher(id) {
  window.location.href = `teacher-profile.html?id=${id}`;
}

async function editTeacher(id) {
  try {
    const doc = await db.collection("teachers").doc(id).get();
    if (doc.exists) {
      const teacher = doc.data();
      // Open edit modal and populate form
      openTeacherModal(teacher);
    }
  } catch (error) {
    console.error("Error loading teacher data:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات المعلم", "error");
  }
}

async function deleteTeacher(id) {
  if (confirm("هل أنت متأكد من حذف هذا المعلم؟")) {
    try {
      await db.collection("teachers").doc(id).delete();
      showNotification("تم حذف المعلم بنجاح", "success");
      await fetchAndDisplayTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      showNotification("حدث خطأ أثناء حذف المعلم", "error");
    }
  }
}

// Setup event listeners for search and filter
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filteredTeachers = teachersData.filter(
    (teacher) =>
      teacher.first_name?.toLowerCase().includes(searchTerm) ||
      teacher.last_name?.toLowerCase().includes(searchTerm) ||
      teacher.registration_id?.toLowerCase().includes(searchTerm)
  );
  displayTeachers(filteredTeachers);
});

document
  .getElementById("subjectFilter")
  ?.addEventListener("change", filterTeachers);
document
  .getElementById("statusFilter")
  ?.addEventListener("change", filterTeachers);

function filterTeachers() {
  const subjectFilter = document.getElementById("subjectFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  let filtered = [...teachersData];

  if (subjectFilter) {
    filtered = filtered.filter(
      (teacher) => teacher.subject_name === subjectFilter
    );
  }

  if (statusFilter) {
    filtered = filtered.filter(
      (teacher) =>
        (statusFilter === "active" && teacher.isActive) ||
        (statusFilter === "inactive" && !teacher.isActive)
    );
  }

  displayTeachers(filtered);
}

// Initialize reference data from Excel
async function initializeReferenceData(data) {
  try {
    debugLog("Initializing reference data from Excel data");

    // Extract unique subjects and roles
    const subjects = new Set();
    const roles = new Set();

    data.forEach((row) => {
      if (row["المادة"]) subjects.add(row["المادة"].trim());
      if (row["الرتبة"]) roles.add(row["الرتبة"].trim());
    });

    debugLog("Extracted reference data:", {
      subjects: Array.from(subjects),
      roles: Array.from(roles),
    });

    // Create subjects that don't exist
    const subjectsBatch = db.batch();
    const existingSubjects = new Set();

    const subjectsSnapshot = await subjectsRef.get();
    subjectsSnapshot.forEach((doc) => existingSubjects.add(doc.data().name));

    for (const subject of subjects) {
      if (!existingSubjects.has(subject)) {
        const docRef = subjectsRef.doc();
        subjectsBatch.set(docRef, {
          name: subject,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        debugLog(`Added new subject: ${subject}`);
      }
    }

    // Create roles that don't exist
    const rolesBatch = db.batch();
    const existingRoles = new Set();

    const rolesSnapshot = await rolesRef.get();
    rolesSnapshot.forEach((doc) => existingRoles.add(doc.data().name));

    for (const role of roles) {
      if (!existingRoles.has(role)) {
        const docRef = rolesRef.doc();
        rolesBatch.set(docRef, {
          name: role,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        debugLog(`Added new role: ${role}`);
      }
    }

    // Commit both batches
    await Promise.all([subjectsBatch.commit(), rolesBatch.commit()]);

    debugLog("Reference data initialized successfully from Excel data");
    return true;
  } catch (error) {
    console.error("Error initializing reference data:", error);
    showNotification("حدث خطأ أثناء تهيئة البيانات المرجعية", "error");
    return false;
  }
}

// Process Excel data with enhanced validation and error handling
async function processTeacherData(data) {
  debugLog(`🔄 Processing ${data.length} Excel records for teacher creation`);

  const processedData = [];
  let validRecords = 0;
  let invalidRecords = 0;
  let errors = [];
  let creationSummary = {
    attempted: 0,
    successful: 0,
    failed: 0,
    existingUpdated: 0,
  };

  try {
    // Initialize reference data first
    const refDataInitialized = await initializeReferenceData(data);
    if (!refDataInitialized) {
      showNotification("فشل في تهيئة البيانات المرجعية", "error");
      return;
    }

    // Get all existing registration IDs to check for duplicates
    const existingTeachers = await teachersRef.get();
    const existingIds = new Set();
    existingTeachers.forEach((doc) =>
      existingIds.add(doc.data().registration_id)
    );

    // Create maps for quick reference data lookup
    const subjectsMap = new Map();
    const rolesMap = new Map();

    const [subjectsSnapshot, rolesSnapshot] = await Promise.all([
      subjectsRef.get(),
      rolesRef.get(),
    ]);

    subjectsSnapshot.forEach((doc) =>
      subjectsMap.set(doc.data().name, doc.ref)
    );
    rolesSnapshot.forEach((doc) => rolesMap.set(doc.data().name, doc.ref));

    // Process each record
    for (const row of data) {
      try {
        const registration_id = row["الرمز الوظيفي"]?.toString().trim();

        // Skip if this teacher already exists
        if (existingIds.has(registration_id)) {
          debugLog(
            `⚠️ Teacher with ID ${registration_id} already exists, skipping`
          );
          creationSummary.existingUpdated++;
          continue;
        }

        const teacherData = {
          registration_id,
          first_name: row["الاسم"]?.toString().trim(),
          last_name: row["اللقب"]?.toString().trim(),
          birth_date: row["تاريخ الازدياد"] || "",
          role_ref: row["الرتبة"] ? rolesMap.get(row["الرتبة"].trim()) : null,
          subject_ref: row["المادة"]
            ? subjectsMap.get(row["المادة"].trim())
            : null,
          level: row["الدرجة"]?.toString().trim(),
          start_date: row["تاريخ السريان"] || "",
          isActive: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Validate required fields
        const missingFields = [];
        if (!teacherData.registration_id) missingFields.push("الرمز الوظيفي");
        if (!teacherData.first_name) missingFields.push("الاسم");
        if (!teacherData.last_name) missingFields.push("اللقب");
        if (!teacherData.role_ref) missingFields.push("الرتبة");
        if (!teacherData.subject_ref) missingFields.push("المادة");

        if (missingFields.length > 0) {
          debugLog(
            `❌ Invalid record - missing fields: ${missingFields.join(", ")}`
          );
          invalidRecords++;
          errors.push(
            `Record ${
              validRecords + invalidRecords
            }: Missing ${missingFields.join(", ")}`
          );
          continue;
        }

        processedData.push(teacherData);
        validRecords++;
        debugLog(`✅ Valid record processed: ${teacherData.registration_id}`);
      } catch (error) {
        console.error(`❌ Error processing record:`, error);
        invalidRecords++;
        errors.push(
          `Record ${validRecords + invalidRecords}: ${error.message}`
        );
      }
    }

    if (processedData.length === 0) {
      showNotification("لم يتم العثور على بيانات صالحة للرفع", "warning");
      return;
    }

    // Upload to Firebase in batches of 500 (Firestore limit)
    debugLog("🔄 Starting Firebase batch upload...");
    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = db.batch();
      const chunk = processedData.slice(i, i + batchSize);

      chunk.forEach((teacher, index) => {
        debugLog(
          `Preparing batch ${Math.floor(i / batchSize) + 1}, operation ${
            index + 1
          }/${chunk.length}`
        );
        const docRef = teachersRef.doc(teacher.registration_id);
        batch.set(docRef, teacher);
        creationSummary.attempted++;
      });

      batches.push(batch.commit());
    }

    await Promise.all(batches);
    creationSummary.successful = processedData.length;
    debugLog("✅ Batch upload completed", creationSummary);

    const summary = `تم رفع ${validRecords} معلم بنجاح${
      creationSummary.existingUpdated > 0
        ? ` (تم تخطي ${creationSummary.existingUpdated} معلم موجود مسبقاً)`
        : ""
    }`;

    showNotification(summary, "success");
    await fetchAndDisplayTeachers();
    document.getElementById("previewSection").style.display = "none";
  } catch (error) {
    console.error("❌ Firebase upload error:", error);
    debugLog("Upload error details:", {
      message: error.message,
      code: error.code,
      recordsProcessed: creationSummary,
    });
    showNotification("حدث خطأ أثناء رفع البيانات", "error");
  }
}

// Show notification
function showNotification(message, type = "info") {
  const container = document.getElementById("notificationContainer");
  if (!container) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  const icon =
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "exclamation-circle"
      : type === "warning"
      ? "exclamation-triangle"
      : "info-circle";

  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Format date for display
function formatDate(date) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("ar-SA");
  } catch (error) {
    return date; // Return original value if parsing fails
  }
}

// Set up file upload functionality
function setupFileUpload() {
  console.log("Setting up file upload");

  const fileUploadBtn = document.getElementById("fileUploadBtn");
  const fileInput = document.getElementById("excelFile");
  const uploadBtn = document.getElementById("uploadBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  // File upload button click handler
  if (fileUploadBtn) {
    console.log("Added event listener to fileUploadBtn");
    fileUploadBtn.addEventListener("click", () => {
      console.log("File upload button clicked");
      if (fileInput) {
        console.log("Clicking the file input element");
        fileInput.click();
      }
    });
  }

  // File input change handler
  if (fileInput) {
    console.log("Added event listener to excelFileInput");
    fileInput.addEventListener("change", (event) => {
      console.log("File input change event triggered");
      handleFileSelect(event);
    });
  }

  // Upload button click handler
  if (uploadBtn) {
    console.log("Added event listener to uploadBtn");
    uploadBtn.addEventListener("click", () => {
      if (excelData) {
        processTeacherData(excelData);
      } else {
        showNotification("لا توجد بيانات للرفع", "error");
      }
    });
  }

  // Cancel button click handler
  if (cancelBtn) {
    console.log("Added event listener to cancelBtn");
    cancelBtn.addEventListener("click", () => {
      document.getElementById("previewSection").style.display = "none";
      excelData = null;
      if (fileInput) fileInput.value = "";
      document.getElementById("selectedFileName").textContent = "";
    });
  }

  // Set up drag and drop
  const dropZone = document.querySelector(".file-upload-container");
  if (dropZone) {
    console.log("Added drag and drop event listeners to file upload area");

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        handleFileSelect({ target: fileInput });
      }
    });
  }
}

// Firebase connection check with enhanced debugging
async function checkFirebaseConnection() {
  try {
    debugLog("Checking Firebase connection...", null, "FIREBASE");

    const timestamp = firebase.firestore.Timestamp.now();
    debugLog(
      "Firebase timestamp test successful",
      { timestamp: timestamp.toDate() },
      "FIREBASE"
    );

    const connectionDoc = await firebase
      .firestore()
      .collection("_connection_test")
      .doc("test")
      .set({
        timestamp: timestamp,
      });
    debugLog("Firebase write test successful", null, "SUCCESS");

    await firebase
      .firestore()
      .collection("_connection_test")
      .doc("test")
      .delete();
    debugLog("Firebase connection verified", null, "SUCCESS");

    return true;
  } catch (error) {
    debugLog(
      "Firebase connection failed",
      {
        error: error.message,
        code: error.code,
        stack: error.stack,
      },
      "ERROR"
    );
    return false;
  }
}

// Enhanced Excel processing debug
function enhanceExcelDebug(workbook, rawData, headers) {
  debugLog(
    "Excel File Analysis",
    {
      sheetNames: workbook.SheetNames,
      totalSheets: workbook.SheetNames.length,
      activeSheet: workbook.SheetNames[0],
      totalRows: rawData.length,
      headerCount: headers.length,
      headers: headers,
    },
    "EXCEL"
  );

  // Analyze data types in first 5 rows
  const sampleRows = rawData.slice(1, 6);
  const dataAnalysis = headers.map((header) => {
    const values = sampleRows.map((row) => {
      const value = row[headers.indexOf(header)];
      return {
        value: value,
        type: typeof value,
        isDate:
          value &&
          !isNaN(value) &&
          (header.includes("تاريخ") || header.includes("date")),
      };
    });
    return { header, values };
  });

  debugLog("Data Type Analysis (First 5 rows)", dataAnalysis, "EXCEL");
}

// Enhanced Firebase batch operation debugging
function debugBatchOperation(batch, operation, data) {
  const batchSize = operation.end - operation.start;
  debugLog(
    "Batch Operation Details",
    {
      batchNumber: operation.batchNumber,
      totalBatches: operation.totalBatches,
      batchSize: batchSize,
      startIndex: operation.start,
      endIndex: operation.end,
      operationType: "set",
    },
    "FIREBASE"
  );

  // Sample of data being written
  const sampleData = data.slice(operation.start, operation.start + 1)[0];
  debugLog(
    "Batch Data Sample",
    {
      registration_id: sampleData.registration_id,
      name: `${sampleData.first_name} ${sampleData.last_name}`,
      subject: sampleData.subject_ref?.path,
      role: sampleData.role_ref?.path,
    },
    "DATA"
  );
}

// Enhanced reference data debugging
function debugReferenceData(subjects, roles) {
  debugLog(
    "Reference Data Summary",
    {
      uniqueSubjects: subjects.size,
      uniqueRoles: roles.size,
      subjects: Array.from(subjects),
      roles: Array.from(roles),
    },
    "DATA"
  );
}

// Add these lines after the existing processTeacherData function
async function validateTeacherData(teacherData) {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Required fields validation
  const requiredFields = [
    "registration_id",
    "first_name",
    "last_name",
    "role_ref",
    "subject_ref",
  ];

  requiredFields.forEach((field) => {
    if (!teacherData[field]) {
      validationResults.isValid = false;
      validationResults.errors.push(`Missing required field: ${field}`);
    }
  });

  // Date format validation
  ["birth_date", "start_date"].forEach((dateField) => {
    if (teacherData[dateField] && !isValidDate(teacherData[dateField])) {
      validationResults.warnings.push(
        `Invalid date format for ${dateField}: ${teacherData[dateField]}`
      );
    }
  });

  // Registration ID format validation
  if (
    teacherData.registration_id &&
    !/^\d{10,}$/.test(teacherData.registration_id)
  ) {
    validationResults.warnings.push(
      `Registration ID format may be invalid: ${teacherData.registration_id}`
    );
  }

  debugLog(
    "Teacher Data Validation",
    validationResults,
    validationResults.isValid ? "SUCCESS" : "WARNING"
  );
  return validationResults;
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
