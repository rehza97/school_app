// DOM Elements - Stats
const totalLevelsElement = document.getElementById("totalLevels");
const totalSpecialtiesElement = document.getElementById("totalSpecialties");
const totalSectionsElement = document.getElementById("totalSections");

// DOM Elements - Hierarchy Tree
const hierarchyTree = document.getElementById("hierarchyTree");
const emptyState = document.getElementById("emptyState");
const expandAllBtn = document.getElementById("expandAllBtn");
const collapseAllBtn = document.getElementById("collapseAllBtn");
const addLevelBtn = document.getElementById("addLevelBtn");
const addFirstLevelBtn = document.getElementById("addFirstLevelBtn");

// DOM Elements - Class Students Card
const classStudentsCard = document.getElementById("classStudentsCard");
const selectedClassName = document.getElementById("selectedClassName");
const closeClassViewBtn = document.getElementById("closeClassViewBtn");
const studentSearchInput = document.getElementById("studentSearchInput");
const classStudentsTableBody = document.getElementById(
  "classStudentsTableBody"
);
const studentPrevPage = document.getElementById("studentPrevPage");
const studentNextPage = document.getElementById("studentNextPage");
const studentPageNumbers = document.getElementById("studentPageNumbers");

// DOM Elements - Level Modal
const levelModal = document.getElementById("levelModal");
const levelModalTitle = document.getElementById("levelModalTitle");
const levelModalClose = document.getElementById("levelModalClose");
const levelForm = document.getElementById("levelForm");
const levelId = document.getElementById("levelId");
const levelName = document.getElementById("levelName");
const cancelLevelBtn = document.getElementById("cancelLevelBtn");

// DOM Elements - Specialty Modal
const specialtyModal = document.getElementById("specialtyModal");
const specialtyModalTitle = document.getElementById("specialtyModalTitle");
const specialtyModalClose = document.getElementById("specialtyModalClose");
const specialtyForm = document.getElementById("specialtyForm");
const specialtyId = document.getElementById("specialtyId");
const specialtyLevelId = document.getElementById("specialtyLevelId");
const specialtyName = document.getElementById("specialtyName");
const cancelSpecialtyBtn = document.getElementById("cancelSpecialtyBtn");

// DOM Elements - Section Modal
const sectionModal = document.getElementById("sectionModal");
const sectionModalTitle = document.getElementById("sectionModalTitle");
const sectionModalClose = document.getElementById("sectionModalClose");
const sectionForm = document.getElementById("sectionForm");
const sectionId = document.getElementById("sectionId");
const sectionSpecialtyId = document.getElementById("sectionSpecialtyId");
const sectionName = document.getElementById("sectionName");
const cancelSectionBtn = document.getElementById("cancelSectionBtn");

// DOM Elements - Confirm Modal
const confirmModal = document.getElementById("confirmModal");
const confirmModalTitle = document.getElementById("confirmModalTitle");
const confirmModalMessage = document.getElementById("confirmModalMessage");
const confirmModalClose = document.getElementById("confirmModalClose");
const confirmBtn = document.getElementById("confirmBtn");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");

// State
let levels = [];
let specialties = [];
let sections = [];
let students = [];
let currentStudentPage = 1;
let studentPageSize = 10;
let filteredStudents = [];
let selectedSection = null;
let deleteCallback = null;
let isEditMode = false;

// Initialize page
function initialize() {
  // Initialize database if needed
  db.initialize();

  // Load data
  loadData();

  // Add event listeners
  addEventListeners();
}

// Load data from database
function loadData() {
  try {
    // Load levels, specialties, and sections
    levels = db.levels.getAll();
    specialties = db.specialties.getAll();
    sections = db.sections.getAll();
    students = db.students.getAll();

    // Update stats
    updateStats();

    // Render hierarchy tree
    renderHierarchyTree();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Update statistics
function updateStats() {
  try {
    totalLevelsElement.textContent = levels.length;
    totalSpecialtiesElement.textContent = specialties.length;
    totalSectionsElement.textContent = sections.length;
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Show/hide empty state
function toggleEmptyState() {
  if (levels.length === 0) {
    hierarchyTree.style.display = "none";
    emptyState.style.display = "flex";
  } else {
    hierarchyTree.style.display = "block";
    emptyState.style.display = "none";
  }
}

// Add event listeners
function addEventListeners() {
  // Main buttons
  addLevelBtn.addEventListener("click", () => openAddLevelModal());
  addFirstLevelBtn.addEventListener("click", () => openAddLevelModal());
  expandAllBtn.addEventListener("click", expandAllNodes);
  collapseAllBtn.addEventListener("click", collapseAllNodes);
  closeClassViewBtn.addEventListener("click", closeClassView);

  // Level modal
  levelModalClose.addEventListener("click", closeLevelModal);
  cancelLevelBtn.addEventListener("click", closeLevelModal);
  levelForm.addEventListener("submit", saveLevel);

  // Specialty modal
  specialtyModalClose.addEventListener("click", closeSpecialtyModal);
  cancelSpecialtyBtn.addEventListener("click", closeSpecialtyModal);
  specialtyForm.addEventListener("submit", saveSpecialty);

  // Section modal
  sectionModalClose.addEventListener("click", closeSectionModal);
  cancelSectionBtn.addEventListener("click", closeSectionModal);
  sectionForm.addEventListener("submit", saveSection);

  // Confirm modal
  confirmModalClose.addEventListener("click", closeConfirmModal);
  cancelConfirmBtn.addEventListener("click", closeConfirmModal);
  confirmBtn.addEventListener("click", executeDelete);

  // Student search
  studentSearchInput.addEventListener("input", filterClassStudents);

  // Student pagination
  studentPrevPage.addEventListener("click", () => {
    if (currentStudentPage > 1) {
      currentStudentPage--;
      renderClassStudentsTable();
      renderStudentPagination();
    }
  });

  studentNextPage.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredStudents.length / studentPageSize);
    if (currentStudentPage < totalPages) {
      currentStudentPage++;
      renderClassStudentsTable();
      renderStudentPagination();
    }
  });

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === levelModal) closeLevelModal();
    if (event.target === specialtyModal) closeSpecialtyModal();
    if (event.target === sectionModal) closeSectionModal();
    if (event.target === confirmModal) closeConfirmModal();
  });
}

// Render hierarchy tree
function renderHierarchyTree() {
  try {
    // Clear the tree
    hierarchyTree.innerHTML = "";

    // Check if there are levels
    toggleEmptyState();

    if (levels.length === 0) return;

    // Sort levels
    const sortedLevels = [...levels].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Render each level
    sortedLevels.forEach((level) => {
      const levelNode = createLevelNode(level);
      hierarchyTree.appendChild(levelNode);
    });
  } catch (error) {
    console.error("Error rendering hierarchy tree:", error);
  }
}

// Create level node
function createLevelNode(level) {
  // Get specialties for this level
  const levelSpecialties = specialties.filter((s) => s.levelId === level.id);
  const specialtyCount = levelSpecialties.length;

  // Create level node container
  const levelNode = document.createElement("div");
  levelNode.className = "tree-node tree-level";
  levelNode.setAttribute("data-id", level.id);

  // Create level content
  const levelContent = document.createElement("div");
  levelContent.className = "node-content";

  // Create level info
  const levelInfo = document.createElement("div");
  levelInfo.className = "node-info";

  // Toggle button for collapsing/expanding
  const toggleBtn = document.createElement("span");
  toggleBtn.className = "toggle-btn";
  toggleBtn.innerHTML =
    specialtyCount > 0 ? '<i class="fas fa-chevron-down"></i>' : "";
  toggleBtn.addEventListener("click", () => toggleNode(levelNode));

  // Level icon and name
  const levelIconDiv = document.createElement("div");
  levelIconDiv.className = "node-icon level-icon";
  levelIconDiv.innerHTML = '<i class="fas fa-chart-bar"></i>';

  const levelNameSpan = document.createElement("span");
  levelNameSpan.className = "node-name";
  levelNameSpan.textContent = level.name;

  const levelCountSpan = document.createElement("span");
  levelCountSpan.className = "node-count";
  levelCountSpan.textContent = `${specialtyCount} شعبة`;

  // Add elements to level info
  levelInfo.appendChild(toggleBtn);
  levelInfo.appendChild(levelIconDiv);
  levelInfo.appendChild(levelNameSpan);
  levelInfo.appendChild(levelCountSpan);

  // Create level actions
  const levelActions = document.createElement("div");
  levelActions.className = "node-actions";

  // Add specialty button
  const addSpecialtyBtn = document.createElement("button");
  addSpecialtyBtn.className = "node-action-btn add-btn";
  addSpecialtyBtn.setAttribute("title", "إضافة شعبة");
  addSpecialtyBtn.innerHTML = '<i class="fas fa-plus"></i>';
  addSpecialtyBtn.addEventListener("click", () =>
    openAddSpecialtyModal(level.id)
  );

  // Edit level button
  const editLevelBtn = document.createElement("button");
  editLevelBtn.className = "node-action-btn edit-btn";
  editLevelBtn.setAttribute("title", "تعديل السنة الدراسية");
  editLevelBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editLevelBtn.addEventListener("click", () => openEditLevelModal(level.id));

  // Delete level button
  const deleteLevelBtn = document.createElement("button");
  deleteLevelBtn.className = "node-action-btn delete-btn";
  deleteLevelBtn.setAttribute("title", "حذف السنة الدراسية");
  deleteLevelBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
  deleteLevelBtn.addEventListener("click", () =>
    openDeleteLevelConfirmation(level.id, level.name)
  );

  // Add buttons to actions
  levelActions.appendChild(addSpecialtyBtn);
  levelActions.appendChild(editLevelBtn);
  levelActions.appendChild(deleteLevelBtn);

  // Add info and actions to content
  levelContent.appendChild(levelInfo);
  levelContent.appendChild(levelActions);

  // Add content to node
  levelNode.appendChild(levelContent);

  // Add specialties container
  const specialtiesContainer = document.createElement("div");
  specialtiesContainer.className = "children-container";

  // Add specialties to container
  if (specialtyCount > 0) {
    const sortedSpecialties = [...levelSpecialties].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    sortedSpecialties.forEach((specialty) => {
      const specialtyNode = createSpecialtyNode(specialty);
      specialtiesContainer.appendChild(specialtyNode);
    });
  }

  levelNode.appendChild(specialtiesContainer);

  return levelNode;
}

// Create specialty node
function createSpecialtyNode(specialty) {
  // Get sections for this specialty
  const specialtySections = sections.filter(
    (s) => s.specialtyId === specialty.id
  );
  const sectionCount = specialtySections.length;

  // Create specialty node container
  const specialtyNode = document.createElement("div");
  specialtyNode.className = "tree-node tree-specialty";
  specialtyNode.setAttribute("data-id", specialty.id);

  // Create specialty content
  const specialtyContent = document.createElement("div");
  specialtyContent.className = "node-content";

  // Create specialty info
  const specialtyInfo = document.createElement("div");
  specialtyInfo.className = "node-info";

  // Toggle button for collapsing/expanding
  const toggleBtn = document.createElement("span");
  toggleBtn.className = "toggle-btn";
  toggleBtn.innerHTML =
    sectionCount > 0 ? '<i class="fas fa-chevron-down"></i>' : "";
  toggleBtn.addEventListener("click", () => toggleNode(specialtyNode));

  // Specialty icon and name
  const specialtyIconDiv = document.createElement("div");
  specialtyIconDiv.className = "node-icon specialty-icon";
  specialtyIconDiv.innerHTML = '<i class="fas fa-list-alt"></i>';

  const specialtyNameSpan = document.createElement("span");
  specialtyNameSpan.className = "node-name";
  specialtyNameSpan.textContent = specialty.name;

  const specialtyCountSpan = document.createElement("span");
  specialtyCountSpan.className = "node-count";
  specialtyCountSpan.textContent = `${sectionCount} قسم`;

  // Add elements to specialty info
  specialtyInfo.appendChild(toggleBtn);
  specialtyInfo.appendChild(specialtyIconDiv);
  specialtyInfo.appendChild(specialtyNameSpan);
  specialtyInfo.appendChild(specialtyCountSpan);

  // Create specialty actions
  const specialtyActions = document.createElement("div");
  specialtyActions.className = "node-actions";

  // Add section button
  const addSectionBtn = document.createElement("button");
  addSectionBtn.className = "node-action-btn add-btn";
  addSectionBtn.setAttribute("title", "إضافة قسم");
  addSectionBtn.innerHTML = '<i class="fas fa-plus"></i>';
  addSectionBtn.addEventListener("click", () =>
    openAddSectionModal(specialty.id)
  );

  // Edit specialty button
  const editSpecialtyBtn = document.createElement("button");
  editSpecialtyBtn.className = "node-action-btn edit-btn";
  editSpecialtyBtn.setAttribute("title", "تعديل الشعبة");
  editSpecialtyBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editSpecialtyBtn.addEventListener("click", () =>
    openEditSpecialtyModal(specialty.id)
  );

  // Delete specialty button
  const deleteSpecialtyBtn = document.createElement("button");
  deleteSpecialtyBtn.className = "node-action-btn delete-btn";
  deleteSpecialtyBtn.setAttribute("title", "حذف الشعبة");
  deleteSpecialtyBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
  deleteSpecialtyBtn.addEventListener("click", () =>
    openDeleteSpecialtyConfirmation(specialty.id, specialty.name)
  );

  // Add buttons to actions
  specialtyActions.appendChild(addSectionBtn);
  specialtyActions.appendChild(editSpecialtyBtn);
  specialtyActions.appendChild(deleteSpecialtyBtn);

  // Add info and actions to content
  specialtyContent.appendChild(specialtyInfo);
  specialtyContent.appendChild(specialtyActions);

  // Add content to node
  specialtyNode.appendChild(specialtyContent);

  // Add sections container
  const sectionsContainer = document.createElement("div");
  sectionsContainer.className = "children-container";

  // Add sections to container
  if (sectionCount > 0) {
    const sortedSections = [...specialtySections].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    sortedSections.forEach((section) => {
      const sectionNode = createSectionNode(section);
      sectionsContainer.appendChild(sectionNode);
    });
  }

  specialtyNode.appendChild(sectionsContainer);

  return specialtyNode;
}

// Create section node
function createSectionNode(section) {
  // Count students in this section
  const sectionStudents = students.filter((s) => s.sectionId === section.id);
  const studentCount = sectionStudents.length;

  // Create section node container
  const sectionNode = document.createElement("div");
  sectionNode.className = "tree-node tree-section";
  sectionNode.setAttribute("data-id", section.id);

  // Create section content
  const sectionContent = document.createElement("div");
  sectionContent.className = "node-content";

  // Create section info
  const sectionInfo = document.createElement("div");
  sectionInfo.className = "node-info";

  // Section icon and name
  const sectionIconDiv = document.createElement("div");
  sectionIconDiv.className = "node-icon section-icon";
  sectionIconDiv.innerHTML = '<i class="fas fa-school"></i>';

  const sectionNameSpan = document.createElement("span");
  sectionNameSpan.className = "node-name";
  sectionNameSpan.textContent = section.name;

  const sectionCountSpan = document.createElement("span");
  sectionCountSpan.className = "node-count";
  sectionCountSpan.textContent = `${studentCount} طالب`;

  // Add elements to section info
  sectionInfo.appendChild(sectionIconDiv);
  sectionInfo.appendChild(sectionNameSpan);
  sectionInfo.appendChild(sectionCountSpan);

  // Create section actions
  const sectionActions = document.createElement("div");
  sectionActions.className = "node-actions";

  // View students button
  const viewStudentsBtn = document.createElement("button");
  viewStudentsBtn.className = "node-action-btn view-btn";
  viewStudentsBtn.setAttribute("title", "عرض الطلاب");
  viewStudentsBtn.innerHTML = '<i class="fas fa-eye"></i>';
  viewStudentsBtn.addEventListener("click", () => openClassView(section));

  // Edit section button
  const editSectionBtn = document.createElement("button");
  editSectionBtn.className = "node-action-btn edit-btn";
  editSectionBtn.setAttribute("title", "تعديل القسم");
  editSectionBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editSectionBtn.addEventListener("click", () =>
    openEditSectionModal(section.id)
  );

  // Delete section button
  const deleteSectionBtn = document.createElement("button");
  deleteSectionBtn.className = "node-action-btn delete-btn";
  deleteSectionBtn.setAttribute("title", "حذف القسم");
  deleteSectionBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
  deleteSectionBtn.addEventListener("click", () =>
    openDeleteSectionConfirmation(section.id, section.name)
  );

  // Add buttons to actions
  sectionActions.appendChild(viewStudentsBtn);
  sectionActions.appendChild(editSectionBtn);
  sectionActions.appendChild(deleteSectionBtn);

  // Add info and actions to content
  sectionContent.appendChild(sectionInfo);
  sectionContent.appendChild(sectionActions);

  // Add content to node
  sectionNode.appendChild(sectionContent);

  return sectionNode;
}

// Toggle node expansion
function toggleNode(node) {
  node.classList.toggle("collapsed");

  // Update toggle button icon
  const toggleBtn = node.querySelector(".toggle-btn i");
  if (toggleBtn) {
    toggleBtn.className = node.classList.contains("collapsed")
      ? "fas fa-chevron-left"
      : "fas fa-chevron-down";
  }
}

// Expand all nodes
function expandAllNodes() {
  const allNodes = document.querySelectorAll(".tree-node");
  allNodes.forEach((node) => {
    node.classList.remove("collapsed");
    const toggleBtn = node.querySelector(".toggle-btn i");
    if (toggleBtn) {
      toggleBtn.className = "fas fa-chevron-down";
    }
  });
}

// Collapse all nodes
function collapseAllNodes() {
  const allNodes = document.querySelectorAll(".tree-node");
  allNodes.forEach((node) => {
    if (node.querySelector(".children-container").children.length > 0) {
      node.classList.add("collapsed");
      const toggleBtn = node.querySelector(".toggle-btn i");
      if (toggleBtn) {
        toggleBtn.className = "fas fa-chevron-left";
      }
    }
  });
}
