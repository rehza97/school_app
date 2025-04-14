// Verify XLSX library loaded
console.log("teachers.js loading...");
console.log("XLSX available:", typeof XLSX !== "undefined");
console.log(
  "Excel library version:",
  typeof XLSX !== "undefined" ? XLSX.version : "not loaded"
);

// DOM Elements
const totalTeachersElement = document.getElementById("totalTeachers");
const activeTeachersElement = document.getElementById("activeTeachers");
const totalSubjectsElement = document.getElementById("totalSubjects");
const teachersTableBody = document.getElementById("teachersTableBody");
const searchInput = document.getElementById("searchInput");
const subjectFilter = document.getElementById("subjectFilter");
const statusFilter = document.getElementById("statusFilter");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageNumbers = document.getElementById("pageNumbers");
const addTeacherBtn = document.getElementById("addTeacherBtn");
const teacherModal = document.getElementById("teacherModal");
const modalTitle = document.getElementById("modalTitle");
const teacherForm = document.getElementById("teacherForm");
const teacherId = document.getElementById("teacherId");
const teacherName = document.getElementById("teacherName");
const teacherSubject = document.getElementById("teacherSubject");
const teacherStatus = document.getElementById("teacherStatus");
const teacherPhone = document.getElementById("teacherPhone");
const teacherEmail = document.getElementById("teacherEmail");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const modalCloseBtn = document.querySelector(".close");
const fileUploadBtn = document.getElementById("fileUploadBtn");
const excelFileInput = document.getElementById("excelFile");
const notificationContainer = document.getElementById("notificationContainer");
const themeToggle = document.getElementById("themeToggle");
const selectedFileName = document.getElementById("selectedFileName");
const previewSection = document.getElementById("previewSection");
const previewTable = document.getElementById("previewTable");
const recordCount = document.getElementById("recordCount");
const cancelBtn = document.getElementById("cancelBtn");
const uploadBtn = document.getElementById("uploadBtn");

// State
let currentPage = 1;
let pageSize = 10;
let teachers = [];
let filteredTeachers = [];
let currentFileData = null;
let isEditMode = false;
let currentSort = { field: null, direction: "asc" };
let searchTerm = "";
let allTeachers = [];
let subjects = [];
let roles = [];

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded");
  initialize();
});

async function initialize() {
  // Check if XLSX is available
  if (typeof XLSX === "undefined") {
    console.error("XLSX library not loaded!");
    showNotification(
      "فشل تحميل مكتبة Excel. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
      "error"
    );
  } else {
    console.log("XLSX library loaded successfully");
  }

  // Verify all Excel-related elements exist
  const excelElements = {
    fileInput: document.getElementById("excelFile"),
    uploadBtn: document.getElementById("fileUploadBtn"),
    previewSection: document.getElementById("previewSection"),
    previewTable: document.getElementById("previewTable"),
    recordCount: document.getElementById("recordCount"),
    uploadDataBtn: document.getElementById("uploadBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
  };

  console.log("Excel-related elements check:");
  Object.entries(excelElements).forEach(([name, element]) => {
    console.log(`- ${name}: ${element ? "Found" : "MISSING"}`);
  });

  try {
    // Show loading indicator
    showLoading(true);

    // Load teachers from backend
    await loadTeachers();

    // Update stats after loading teachers
    updateStats();

    // Load subject filters after loading teachers
  loadSubjectFilters();

    // Load reference data
    await loadReferenceData();

    // Set up file upload
    setupFileUpload();

    // Set up event listeners
    setupEventListeners();

    // Initialize theme
    checkTheme();

    // Hide loading indicator
    showLoading(false);
  } catch (error) {
    console.error("Error during initialization:", error);
    showNotification("حدث خطأ أثناء تهيئة الصفحة", "error");
    showLoading(false);
  }
}

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

// Load teachers from API
async function loadTeachers() {
  try {
    console.log("Fetching teachers from API...");

    // Make a direct fetch call to the API
    const response = await fetch(`${window.API_CONFIG.BASE_URL}/teachers`);

    if (!response.ok) {
      console.error(
        `Error fetching teachers: ${response.status} ${response.statusText}`
      );
      showNotification("فشل في الاتصال بالخادم", "error");
      return [];
    }

    const data = await response.json();
    console.log(`Fetched ${data ? data.length : 0} teachers from API`);

    // Ensure teachers is always an array
    if (Array.isArray(data)) {
      teachers = data;
    } else {
      console.error("API did not return an array, using empty array instead");
      teachers = [];
    }

    // Initialize filtered list with all teachers
    filteredTeachers = [...teachers];
    console.log(
      `Initialized filtered list with ${filteredTeachers.length} teachers`
    );

    // Update UI
    renderTeachersTable();
    renderPagination();

    return teachers;
  } catch (error) {
    console.error("Error loading teachers:", error);
    showNotification("حدث خطأ أثناء تحميل بيانات المعلمين", "error");
    teachers = [];
    filteredTeachers = [];
    renderTeachersTable();
    renderPagination();
    return [];
  }
}

// Load reference data (subjects and roles)
async function loadReferenceData() {
  try {
    // Fetch subjects
    const subjectsResponse = await fetch(
      `${window.API_CONFIG.BASE_URL}${window.API_CONFIG.SUBJECTS}`
    );
    if (subjectsResponse.ok) {
      subjects = await subjectsResponse.json();
      console.log(`Loaded ${subjects.length} subjects`);
    } else {
      console.error("Failed to load subjects");
    }

    // Fetch teacher roles
    const rolesResponse = await fetch(
      `${window.API_CONFIG.BASE_URL}${window.API_CONFIG.TEACHER_ROLES}`
    );
    if (rolesResponse.ok) {
      roles = await rolesResponse.json();
      console.log(`Loaded ${roles.length} teacher roles`);
    } else {
      console.error("Failed to load teacher roles");
    }

    // Populate dropdowns for reference data
    populateReferenceDropdowns();
  } catch (error) {
    console.error("Error loading reference data:", error);
  }
}

// Populate reference data dropdowns
function populateReferenceDropdowns() {
  // Populate subject filter dropdown
  if (subjectFilter && subjects.length > 0) {
    // Clear existing options except the first one
    while (subjectFilter.options.length > 1) {
      subjectFilter.remove(1);
    }

    // Add subject options
    subjects.forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject.name;
      option.textContent = subject.name;
      subjectFilter.appendChild(option);
    });
  }

  // If there's a teacher subject dropdown in the form, populate it
  const teacherSubjectDropdown = document.getElementById("teacherSubject");
  if (teacherSubjectDropdown && subjects.length > 0) {
    // Clear existing options
    teacherSubjectDropdown.innerHTML = "";

    // Add empty option
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "اختر المادة";
    teacherSubjectDropdown.appendChild(emptyOption);

    // Add subject options
    subjects.forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject.name;
      option.textContent = subject.name;
      teacherSubjectDropdown.appendChild(option);
    });
  }

  // If there's a teacher role dropdown in the form, populate it
  const teacherRoleDropdown = document.getElementById("teacherRole");
  if (teacherRoleDropdown && roles.length > 0) {
    // Clear existing options
    teacherRoleDropdown.innerHTML = "";

    // Add empty option
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "اختر الرتبة";
    teacherRoleDropdown.appendChild(emptyOption);

    // Add role options
    roles.forEach((role) => {
      const option = document.createElement("option");
      option.value = role.name;
      option.textContent = role.name;
      teacherRoleDropdown.appendChild(option);
    });
  }
}

// Update statistics
async function updateStats() {
  try {
    // Get elements
    const totalTeachersElement = document.getElementById("totalTeachers");
    const activeTeachersElement = document.getElementById("activeTeachers");
    const totalSubjectsElement = document.getElementById("totalSubjects");

    // Update from local data first
    if (totalTeachersElement) {
      totalTeachersElement.textContent = teachers.length;
    }

    if (activeTeachersElement) {
      const activeCount = teachers.filter((t) => t.active !== false).length;
      activeTeachersElement.textContent = activeCount;
    }

    if (totalSubjectsElement) {
    // Get unique subjects
      const uniqueSubjects = new Set();
    teachers.forEach((teacher) => {
        if (teacher.subject_name) {
          uniqueSubjects.add(teacher.subject_name);
        }
      });
      totalSubjectsElement.textContent = uniqueSubjects.size;
    }

    console.log("Stats updated from local data");

    // Try to get more accurate counts from API
    try {
      const response = await fetch(
        `${window.API_CONFIG.BASE_URL}${window.API_CONFIG.STATS}`
      );
      if (response.ok) {
        const stats = await response.json();
        console.log("Fetched stats from API:", stats);

        if (totalTeachersElement && stats.total) {
          totalTeachersElement.textContent = stats.total;
        }

        if (activeTeachersElement && stats.active) {
          activeTeachersElement.textContent = stats.active;
        }
      }
    } catch (apiError) {
      console.warn("Could not fetch stats from API:", apiError);
    }
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Load subject filters
function loadSubjectFilters() {
  try {
    // Clear existing options except the first one
    while (subjectFilter.options.length > 1) {
      subjectFilter.remove(1);
    }

    // Get unique subjects
    const uniqueSubjects = new Set();
    teachers.forEach((teacher) => {
      if (teacher.subject_name) {
        uniqueSubjects.add(teacher.subject_name);
      }
    });

    // Add options
    Array.from(uniqueSubjects)
      .sort()
      .forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      subjectFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading subject filters:", error);
  }
}

// Filter teachers based on search term and selected filters
function applyFilters() {
  try {
    searchTerm = searchInput.value.toLowerCase();
    const subject = subjectFilter.value;
    const status = statusFilter.value;

    filteredTeachers = teachers.filter((teacher) => {
      // Search term filter
      const codeMatch =
        teacher.registration_id &&
        teacher.registration_id.toString().toLowerCase().includes(searchTerm);
      const firstNameMatch =
        teacher.first_name &&
        teacher.first_name.toLowerCase().includes(searchTerm);
      const lastNameMatch =
        teacher.last_name &&
        teacher.last_name.toLowerCase().includes(searchTerm);
      const subjectMatch =
        teacher.subject_name &&
        teacher.subject_name.toLowerCase().includes(searchTerm);
      const roleMatch =
        teacher.role_name &&
        teacher.role_name.toLowerCase().includes(searchTerm);

      const searchMatch =
        codeMatch ||
        firstNameMatch ||
        lastNameMatch ||
        subjectMatch ||
        roleMatch;

      // Subject filter
      const subjectFilterMatch = !subject || teacher.subject_name === subject;

      // Status filter
      let statusFilterMatch = true;
      if (status === "active") {
        statusFilterMatch = teacher.active !== false;
      } else if (status === "inactive") {
        statusFilterMatch = teacher.active === false;
      }

      return searchMatch && subjectFilterMatch && statusFilterMatch;
    });

    // Apply sorting if set
    if (currentSort.field) {
      sortTeachers();
    }

    // Reset to first page
    currentPage = 1;

    // Render table and pagination
    renderTeachersTable();
    renderPagination();
  } catch (error) {
    console.error("Error applying filters:", error);
  }
}

// Sort teachers based on current sort field and direction
function sortTeachers() {
  if (!currentSort.field) return;

  filteredTeachers.sort((a, b) => {
    let valueA = a[currentSort.field];
    let valueB = b[currentSort.field];

    // Handle nulls/undefined
    if (valueA === null || valueA === undefined) valueA = "";
    if (valueB === null || valueB === undefined) valueB = "";

    // Handle numeric values
    if (!isNaN(valueA) && !isNaN(valueB)) {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }

    // Handle dates
    if (
      currentSort.field === "birth_date" ||
      currentSort.field === "effective_date"
    ) {
      valueA = valueA ? new Date(valueA).getTime() : 0;
      valueB = valueB ? new Date(valueB).getTime() : 0;
    }

    // String comparison for text
    if (typeof valueA === "string" && typeof valueB === "string") {
      // Use localeCompare for proper string comparison in Arabic
      return currentSort.direction === "asc"
        ? valueA.localeCompare(valueB, "ar")
        : valueB.localeCompare(valueA, "ar");
    }

    // Standard comparison for numbers and dates
    if (currentSort.direction === "asc") {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
}

// Map table index to field name for sorting
function getFieldFromIndex(index) {
  const fieldMap = {
    1: "registration_id",
    2: "last_name",
    3: "first_name",
    4: "birth_date",
    5: "role_name",
    6: "subject_name",
    7: "level",
    8: "start_date",
  };
  return fieldMap[index];
}

// Render teachers table
function renderTeachersTable() {
  try {
    teachersTableBody.innerHTML = "";

    if (filteredTeachers.length === 0) {
      const noDataRow = document.createElement("tr");
      noDataRow.innerHTML = `<td colspan="10" class="no-data">
        <i class="fas fa-info-circle"></i>
        <p>لا توجد بيانات للعرض</p>
      </td>`;
      teachersTableBody.appendChild(noDataRow);
      return;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredTeachers.length);
    const displayedTeachers = filteredTeachers.slice(startIndex, endIndex);

    displayedTeachers.forEach((teacher) => {
      const row = document.createElement("tr");

      // Format birth date
      let birthDate = formatDate(teacher.birth_date);

      // Format the effective date
      let effectiveDate = formatDate(teacher.start_date);

      // Create status badge
      const statusBadge = `
        <span class="status-badge ${teacher.active ? "active" : "inactive"}">
          ${teacher.active ? "نشط" : "غير نشط"}
        </span>
      `;

      row.innerHTML = `
        <td><img src="../images/user-icon.png" alt="صورة" class="user-icon"></td>
        <td>${teacher.registration_id || ""}</td>
        <td>${teacher.last_name || ""}</td>
        <td>${teacher.first_name || ""}</td>
        <td>${birthDate}</td>
        <td>${teacher.role_name || "أستاذ"}</td>
        <td>${teacher.subject_name || ""}</td>
        <td>${teacher.level || "0"}</td>
        <td>${effectiveDate}</td>
        <td>
            <button class="action-btn edit-btn" data-id="${
              teacher.id || teacher.registration_id || ""
            }" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${
              teacher.id || teacher.registration_id || ""
            }" title="حذف">
              <i class="fas fa-trash-alt"></i>
            </button>
        </td>
      `;

      teachersTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    addActionButtonListeners();
  } catch (error) {
    console.error("Error rendering teachers table:", error);
    showNotification("حدث خطأ أثناء عرض بيانات المعلمين", "error");
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

// Render pagination controls
function renderPagination() {
  try {
    if (!pageNumbers) return;

    pageNumbers.innerHTML = "";

    // Calculate total pages
    const totalPages = Math.ceil(filteredTeachers.length / pageSize);

    // Update the page info
    const pageInfoElement = document.querySelector(".pagination .page-info");
    if (pageInfoElement) {
      pageInfoElement.textContent = `الصفحة ${currentPage} من ${totalPages}`;
    } else {
      // Create page info element if it doesn't exist
      const pageInfo = document.createElement("div");
      pageInfo.className = "page-info";
      pageInfo.textContent = `الصفحة ${currentPage} من ${totalPages}`;

      // Insert after the page numbers
      if (pageNumbers.parentNode) {
        pageNumbers.parentNode.insertBefore(pageInfo, pageNumbers.nextSibling);
      }
    }

    // Enable/disable prev/next buttons
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;

    // Generate page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // Create page number elements
    for (let i = startPage; i <= endPage; i++) {
      const pageNum = document.createElement("button");
      pageNum.classList.add("page-number");

      if (i === currentPage) {
        pageNum.classList.add("active");
      }

      pageNum.textContent = i;
      pageNum.addEventListener("click", () => {
        currentPage = i;
        renderTeachersTable();
        renderPagination();
      });

      pageNumbers.appendChild(pageNum);
    }
  } catch (error) {
    console.error("Error rendering pagination:", error);
  }
}

// Add event listeners to action buttons
function addActionButtonListeners() {
  // Edit buttons
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const teacherId = e.currentTarget.getAttribute("data-id");
      openEditTeacherModal(teacherId);
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const teacherId = e.currentTarget.getAttribute("data-id");
      if (confirm("هل أنت متأكد من حذف هذا المعلم؟")) {
        deleteTeacher(teacherId);
      }
    });
  });
}

// Open add teacher modal
function openAddTeacherModal() {
    isEditMode = false;
    modalTitle.textContent = "إضافة معلم جديد";
  teacherForm.reset();
    teacherId.value = "";
    teacherStatus.value = "active";

  // Make sure reference data is loaded for dropdowns
  if (!subjects.length || !roles.length) {
    loadReferenceData();
  }

    teacherModal.style.display = "block";
}

// Open edit teacher modal
function openEditTeacherModal(id) {
  isEditMode = true;
  modalTitle.textContent = "تعديل بيانات المعلم";

  // Find teacher by ID
  const teacher = teachers.find((t) => t.id == id || t.registration_id == id);

    if (!teacher) {
    showNotification("لم يتم العثور على بيانات المعلم", "error");
      return;
    }

  // Ensure reference data is loaded
  if (!subjects.length || !roles.length) {
    loadReferenceData().then(() => populateFormWithTeacher(teacher));
  } else {
    populateFormWithTeacher(teacher);
  }

  // Show modal
  teacherModal.style.display = "block";
}

// Populate form with teacher data
function populateFormWithTeacher(teacher) {
  // Populate form fields
  teacherId.value = teacher.id || teacher.registration_id || "";
  teacherName.value = `${teacher.first_name || ""} ${teacher.last_name || ""}`;

  // Handle subject dropdown
  const teacherSubjectDropdown = document.getElementById("teacherSubject");
  if (teacherSubjectDropdown) {
    // Find and select the matching subject option
    let subjectFound = false;
    for (let i = 0; i < teacherSubjectDropdown.options.length; i++) {
      if (teacherSubjectDropdown.options[i].value === teacher.subject_name) {
        teacherSubjectDropdown.selectedIndex = i;
        subjectFound = true;
        break;
      }
    }

    // If no match found, add the subject as a new option
    if (!subjectFound && teacher.subject_name) {
      const option = document.createElement("option");
      option.value = teacher.subject_name;
      option.textContent = teacher.subject_name;
      teacherSubjectDropdown.appendChild(option);
      teacherSubjectDropdown.value = teacher.subject_name;
    }
  }

  // Handle role dropdown
  const teacherRoleDropdown = document.getElementById("teacherRole");
  if (teacherRoleDropdown) {
    // Find and select the matching role option
    let roleFound = false;
    for (let i = 0; i < teacherRoleDropdown.options.length; i++) {
      if (teacherRoleDropdown.options[i].value === teacher.role_name) {
        teacherRoleDropdown.selectedIndex = i;
        roleFound = true;
        break;
      }
    }

    // If no match found, add the role as a new option
    if (!roleFound && teacher.role_name) {
      const option = document.createElement("option");
      option.value = teacher.role_name;
      option.textContent = teacher.role_name;
      teacherRoleDropdown.appendChild(option);
      teacherRoleDropdown.value = teacher.role_name;
    }
  }

    teacherStatus.value = teacher.active !== false ? "active" : "inactive";
    teacherPhone.value = teacher.phone || "";
    teacherEmail.value = teacher.email || "";
}

// Close modal
function closeModal() {
  teacherModal.style.display = "none";
}

// Save teacher (add or update)
async function saveTeacher(event) {
  event.preventDefault();

  try {
    // Split the full name into first and last name
    const fullName = teacherName.value.trim();
    let firstName = "",
      lastName = "";

    if (fullName.includes(" ")) {
      const nameParts = fullName.split(" ");
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
    } else {
      firstName = fullName;
    }

    // Get form data
    const data = {
      first_name: firstName,
      last_name: lastName,
      subject_name: document.getElementById("teacherSubject").value,
      role_name: document.getElementById("teacherRole").value,
      active: teacherStatus.value === "active",
      phone: teacherPhone.value,
      email: teacherEmail.value,
    };

    let result;

    if (isEditMode) {
      // Update existing teacher
      const id = teacherId.value;
      result = await window.db.update(
        `${window.API_CONFIG.TEACHERS}/${id}`,
        data
      );

      if (result && result.success) {
        showNotification("تم تحديث بيانات المعلم بنجاح", "success");

        // Update teacher in the local array
        const index = teachers.findIndex(
          (t) => t.id == id || t.registration_id == id
        );
        if (index !== -1) {
          teachers[index] = { ...teachers[index], ...data };
        }
      } else {
        throw new Error(result.error || "Failed to update teacher");
      }
    } else {
      // Add new teacher
      result = await window.db.add(window.API_CONFIG.TEACHERS, data);

      if (result && result.success) {
        showNotification("تم إضافة المعلم بنجاح", "success");

        // Add the new teacher to the local array
        teachers.push({ ...data, id: result.id });
      } else {
        throw new Error(result.error || "Failed to add teacher");
      }
    }

    // Close modal and refresh data
    closeModal();
    updateStats();
    loadSubjectFilters();
    applyFilters();
  } catch (error) {
    console.error("Error saving teacher:", error);
    showNotification("حدث خطأ أثناء حفظ بيانات المعلم", "error");
  }
}

// Delete teacher
async function deleteTeacher(id) {
  try {
    const result = await window.db.delete(
      `${window.API_CONFIG.TEACHERS}/${id}`
    );

    if (result) {
      showNotification("تم حذف المعلم بنجاح", "success");

      // Remove teacher from local array
      teachers = teachers.filter((t) => t.id != id && t.registration_id != id);

      // Refresh data
      updateStats();
      loadSubjectFilters();
      applyFilters();
    }
  } catch (error) {
    console.error("Error deleting teacher:", error);
    showNotification("حدث خطأ أثناء حذف المعلم", "error");
  }
}

// Handle file upload button click
function handleFileUploadBtnClick() {
  console.log("File upload button clicked");

  // Get the file input element again to ensure we have it
  const fileInput = document.getElementById("excelFile");

  if (!fileInput) {
    console.error("Excel file input not found in DOM");
    showNotification("تعذر فتح نافذة اختيار الملف", "error");
      return;
    }

  console.log("Clicking the file input element");
  fileInput.click();
}

// Process Excel file
async function handleFileChange(event) {
  console.log("File input change event triggered");

  if (!event) {
    console.error("No event object provided to handleFileChange");
    return;
  }

  if (!event.target) {
    console.error("Event has no target property", event);
    return;
  }

  if (!event.target.files) {
    console.error("Event target has no files property", event.target);
    return;
  }

  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected");
    return;
  }

  try {
    console.log(
      "Processing Excel file:",
      file.name,
      "type:",
      file.type,
      "size:",
      file.size,
      "bytes"
    );
    showNotification("جاري تحليل ملف Excel...", "info");

    // Update selected file name in UI if element exists
    const fileNameElement = document.getElementById("selectedFileName");
    if (fileNameElement) {
      fileNameElement.textContent = file.name;
      console.log("Updated file name display:", file.name);
    } else {
      console.warn("selectedFileName element not found in DOM");
    }

    const data = await readExcelFile(file);
    console.log("Excel data parsed:", data ? data.length : 0, "records");

    if (!data || data.length === 0) {
      console.error("No valid data found in Excel file");
      showNotification("الملف لا يحتوي على بيانات صالحة", "error");
      return;
    }

    // Store data for later processing
    currentFileData = data;

    // Log first few records for debugging
    console.log("Sample data:", data.slice(0, 2));

    // Show preview
    showPreview(data);
  } catch (error) {
    console.error("Error handling Excel file:", error);
    showNotification(
      "حدث خطأ أثناء قراءة ملف Excel: " + error.message,
      "error"
    );
  }
}

// Read Excel file
function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    console.log(`Reading Excel file: ${file.name} (${file.size} bytes)`);

    // Validate file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream", // Some browsers may use this for Excel files
    ];

    if (!validTypes.includes(file.type)) {
      console.warn(`Potentially unsupported file type: ${file.type}`);
      // Continue anyway, but log the warning
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        console.log("File read successfully, processing data...");
        const data = e.target.result;

        // Check if XLSX is available
        if (typeof XLSX === "undefined") {
          console.error("XLSX library not loaded!");
          reject(
            new Error("XLSX library not loaded. Please check script inclusion.")
          );
          return;
        }

        try {
          console.log("Parsing Excel file using XLSX...");
          const workbook = XLSX.read(data, { type: "binary" });
          console.log("Workbook sheets:", workbook.SheetNames);

          if (workbook.SheetNames.length === 0) {
            console.error("Excel file contains no sheets");
            reject(new Error("Excel file contains no sheets"));
            return;
          }

          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];

          // Read the original data as array of arrays to handle the special structure
          console.log("Converting worksheet to array format...");
          const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Use numeric indexing
          raw: false,
            defval: "", // Default empty cells to empty string
          });

          console.log("Raw data rows:", rawData.length);

          // Skip the first 3 rows and use the 4th row as headers
          if (rawData.length < 4) {
            console.error(
              "Excel file doesn't have enough rows for the expected structure"
            );
            reject(
              new Error("Excel file format is not valid - not enough rows")
            );
            return;
          }

          // Get the headers from the 4th row (index 3)
          const headers = rawData[3];
          console.log("Using row 4 as headers:", headers);

          // Process the data starting from row 5 (index 4)
          const processedData = [];
          for (let i = 4; i < rawData.length; i++) {
            const row = rawData[i];
            // Skip empty rows
            if (row.every((cell) => cell === "")) continue;

            const rowData = {};
            // Map each cell to its corresponding header
            headers.forEach((header, index) => {
              if (header && header.trim() !== "") {
                rowData[header] = row[index] || "";
              }
            });

            // Add the processed row if it has any non-empty values
            if (Object.values(rowData).some((val) => val !== "")) {
              processedData.push(rowData);
            }
          }

          console.log("Processed data:", processedData.length, "records");
          if (processedData.length > 0) {
            console.log("First processed record:", processedData[0]);
          }

          resolve(processedData);
        } catch (xlsxError) {
          console.error("Error in XLSX processing:", xlsxError);
          reject(xlsxError);
        }
      } catch (error) {
        console.error("Error parsing Excel:", error);
        reject(error);
      }
    };

    reader.onerror = function (error) {
      console.error("FileReader error:", error);
      reject(new Error("Could not read the file"));
    };

    console.log("Starting to read file as binary string");
    reader.readAsBinaryString(file);
  });
}

// Show preview of the imported data
function showPreview(data) {
  if (!data || data.length === 0) {
    showNotification("لا توجد بيانات للعرض", "warning");
    return;
  }

  // Get headers from the first record
  const headers = Object.keys(data[0]);

  // Update record count
  recordCount.textContent = data.length;

  // Create table header
  let tableHTML = "<thead><tr>";
  headers.forEach((header) => {
    tableHTML += `<th>${header}</th>`;
  });
  tableHTML += "</tr></thead>";

  // Create table body
  tableHTML += "<tbody>";
  data.slice(0, 10).forEach((row) => {
    // Show only first 10 rows for preview
    tableHTML += "<tr>";
    headers.forEach((header) => {
      tableHTML += `<td>${row[header] || ""}</td>`;
    });
    tableHTML += "</tr>";
  });
  tableHTML += "</tbody>";

  // Set table content
  previewTable.innerHTML = tableHTML;

  // Show preview section
  previewSection.style.display = "block";
}

// Process teacher data from Excel
async function processTeacherData() {
  if (!currentFileData || currentFileData.length === 0) {
    showNotification("لا توجد بيانات للمعالجة", "error");
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

      console.log("Original record:", record);

      // Map Arabic column names to English field names, accounting for spaces in column names
      const processedRecord = {
        registration_id:
          record["رقم التعريف"] ||
          record["الرمز الوظيفي"] ||
          record["الرمز الوظيفي "] || // Note the added space
          record["معرف المعلم"],
        first_name:
          record["الاسم"] ||
          record["الاسم "] ||
          record["اسم المعلم"] ||
          record["الاسم الاول"],
        last_name:
          record["اللقب"] ||
          record["اللقب "] ||
          record["لقب المعلم"] ||
          record["اسم العائلة"],
        gender: record["الجنس"] || record["النوع"],
        birth_date:
          record["تاريخ الازدياد"] ||
          record["تاريخ الازدياد "] || // Note the added space
          record["تاريخ الميلاد"] ||
          record["تاريخ الولادة"],
        role_name:
          record["الرتبة"] ||
          record["الرتبة "] ||
          record["المنصب"] ||
          record["الوظيفة"],
        subject_name:
          record["المادة"] || record["المادة "] || record["مادة التدريس"],
        level: record["الدرجة"] || record["الدرجة "] || record["المستوى"],
        start_date:
          record["تاريخ السريان"] ||
          record["تاريخ السريان "] || // Note the added space
          record["تاريخ التثبيت"] ||
          record["تاريخ البدء"],
        phone: record["الهاتف"] || record["رقم الهاتف"],
        email: record["البريد الإلكتروني"] || record["الايميل"],
      };

      console.log(
        `Record ${i + 1}/${currentFileData.length}:`,
        processedRecord
      );

      // More lenient validation - consider a record valid if it has any identifying information
      if (
        processedRecord.registration_id ||
        processedRecord.first_name ||
        processedRecord.last_name ||
        (processedRecord.role_name && processedRecord.subject_name)
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
      showNotification("لا توجد بيانات صالحة للإدخال", "error");
      return;
    }

    // Send data to the server
    console.log("Sending data to server:", processedData);
    const response = await fetch(
      `${window.API_CONFIG.BASE_URL}${window.API_CONFIG.TEACHER_IMPORT}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teachers: processedData }),
      }
    );

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
        `تم الاستيراد بنجاح: تمت إضافة ${result.successCount} معلم، وتحديث ${result.updateCount} معلم`,
        "success"
      );

      // Hide preview section
      previewSection.style.display = "none";

      // Reset file input
      excelFileInput.value = "";
      selectedFileName.textContent = "";

      // Reset current file data
      currentFileData = null;

      // Refresh data
      await loadTeachers();
    } else {
      showNotification(`فشل الاستيراد: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("Error processing file:", error);
    showLoading(false);
    showNotification(`خطأ: ${error.message}`, "error");
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
  const tableContainer = document.querySelector(".table-container");

  if (tableContainer) {
    if (isLoading) {
      tableContainer.classList.add("loading");
    } else {
      tableContainer.classList.remove("loading");
    }
  }
}

// Set up event listeners
function setupEventListeners() {
  // Search input
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentPage = 1;
      applyFilters();
    });
  }

  // Subject filter
  if (subjectFilter) {
    subjectFilter.addEventListener("change", function () {
      currentPage = 1;
      applyFilters();
    });
  }

  // Status filter
  if (statusFilter) {
    statusFilter.addEventListener("change", function () {
      currentPage = 1;
      applyFilters();
    });
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Add teacher button
  if (addTeacherBtn) {
    addTeacherBtn.addEventListener("click", openAddTeacherModal);
  }

  // Export button
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", exportToExcel);
  }

  // Modal close button
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }

  // Cancel modal button
  if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", closeModal);
  }

  // Form submission
  if (teacherForm) {
    teacherForm.addEventListener("submit", saveTeacher);
  }

  // Pagination buttons
  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      renderTeachersTable();
      renderPagination();
    }
  });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", function () {
    const totalPages = Math.ceil(filteredTeachers.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderTeachersTable();
      renderPagination();
    }
  });
  }
}

// Export teachers data to Excel
function exportToExcel() {
  try {
    if (!filteredTeachers || filteredTeachers.length === 0) {
      showNotification("لا توجد بيانات للتصدير", "warning");
      return;
    }

    // Prepare data for export
    const exportData = filteredTeachers.map((teacher) => ({
      "الرمز الوظيفي": teacher.registration_id,
      اللقب: teacher.last_name,
      الاسم: teacher.first_name,
      "تاريخ الازدياد": teacher.birth_date,
      الرتبة: teacher.role_name,
      المادة: teacher.subject_name,
      الدرجة: teacher.level,
      "تاريخ السريان": teacher.start_date,
      "رقم الهاتف": teacher.phone,
      "البريد الإلكتروني": teacher.email,
      الحالة: teacher.active === false ? "غير نشط" : "نشط",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");

    // Generate Excel file
    XLSX.writeFile(wb, "teachers_data.xlsx");

    showNotification("تم تصدير البيانات بنجاح", "success");
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    showNotification(`خطأ في تصدير البيانات: ${error.message}`, "error");
  }
}

// Theme management
function checkTheme() {
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark-mode", isDarkMode);
  themeToggle.querySelector("i").className = isDarkMode
    ? "fas fa-sun"
    : "fas fa-moon";
}

// Update API Configuration
window.API_CONFIG = {
  BASE_URL: "http://localhost:3000/api",
  TEACHERS: "/teachers",
  SUBJECTS: "/subjects",
  TEACHER_ROLES: "/teacher-roles",
  STATS: "/teachers/count",
  TEACHER_IMPORT: "/teachers/import",
};

// Set up file upload
function setupFileUpload() {
  console.log("Setting up file upload");

  // Add event listener to file upload button
  if (fileUploadBtn) {
    fileUploadBtn.addEventListener("click", handleFileUploadBtnClick);
    console.log("Added event listener to fileUploadBtn");
  } else {
    console.error("fileUploadBtn element not found");
  }

  // Add event listener to file input for file selection
  if (excelFileInput) {
  excelFileInput.addEventListener("change", handleFileChange);
    console.log("Added event listener to excelFileInput");
  } else {
    console.error("excelFileInput element not found");
  }

  // Add event listeners for preview actions
  if (uploadBtn) {
    uploadBtn.addEventListener("click", processTeacherData);
    console.log("Added event listener to uploadBtn");
  } else {
    console.error("uploadBtn element not found");
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      previewSection.style.display = "none";
      excelFileInput.value = "";
      selectedFileName.textContent = "";
      currentFileData = null;
    });
    console.log("Added event listener to cancelBtn");
  } else {
    console.error("cancelBtn element not found");
  }

  // Set up drag and drop for file upload area
  const fileUploadArea = document.querySelector(".file-upload-container");
  if (fileUploadArea) {
    fileUploadArea.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.add("drag-over");
    });

    fileUploadArea.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove("drag-over");
    });

    fileUploadArea.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove("drag-over");

      if (e.dataTransfer.files.length) {
        excelFileInput.files = e.dataTransfer.files;
        const event = new Event("change");
        excelFileInput.dispatchEvent(event);
      }
    });

    console.log("Added drag and drop event listeners to file upload area");
  } else {
    console.error("File upload area element not found");
  }
}
