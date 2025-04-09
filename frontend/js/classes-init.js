// Add this function at the beginning of the file, before the DOMContentLoaded event

function initializeSampleData() {
  // Only initialize if no data exists
  if (db.levels.getAll().length === 0) {
    // Add sample levels
    const level1 = {
      id: "1",
      name: "السنة الأولى",
      description: "السنة الأولى من التعليم الثانوي",
    };
    const level2 = {
      id: "2",
      name: "السنة الثانية",
      description: "السنة الثانية من التعليم الثانوي",
    };
    const level3 = {
      id: "3",
      name: "السنة الثالثة",
      description: "السنة الثالثة من التعليم الثانوي",
    };

    db.levels.add(level1);
    db.levels.add(level2);
    db.levels.add(level3);

    // Add sample specialties
    const specialty1 = { id: "1", name: "علوم تجريبية", levelId: "1" };
    const specialty2 = { id: "2", name: "رياضيات", levelId: "1" };
    const specialty3 = { id: "3", name: "آداب", levelId: "2" };

    db.specialties.add(specialty1);
    db.specialties.add(specialty2);
    db.specialties.add(specialty3);

    // Add sample sections
    const section1 = { id: "1", name: "أ", specialtyId: "1", capacity: 30 };
    const section2 = { id: "2", name: "ب", specialtyId: "1", capacity: 30 };
    const section3 = { id: "3", name: "أ", specialtyId: "2", capacity: 25 };

    db.sections.add(section1);
    db.sections.add(section2);
    db.sections.add(section3);

    // Add sample students
    const student1 = {
      studentId: "S001",
      firstName: "أحمد",
      lastName: "محمد",
      birthDate: "2006-01-01",
      gender: "ذكر",
      sectionId: "1",
      active: true,
    };
    const student2 = {
      studentId: "S002",
      firstName: "فاطمة",
      lastName: "علي",
      birthDate: "2006-03-15",
      gender: "أنثى",
      sectionId: "1",
      active: true,
    };

    db.students.add(student1);
    db.students.add(student2);
  }
}

// DOM Elements
document.addEventListener("DOMContentLoaded", function () {
  // Initialize database
  if (window.db && typeof db.initialize === "function") {
    db.initialize();
  }

  // Initialize sample data
  initializeSampleData();

  // Load and display data
  displayStats();
  displayHierarchyTree();
});

function displayStats() {
  const totalLevelsElement = document.getElementById("totalLevels");
  const totalSpecialtiesElement = document.getElementById("totalSpecialties");
  const totalSectionsElement = document.getElementById("totalSections");

  // Get data from localStorage
  const levels = db.levels.getAll();
  const specialties = db.specialties.getAll();
  const sections = db.sections.getAll();

  // Update stats
  totalLevelsElement.textContent = levels.length;
  totalSpecialtiesElement.textContent = specialties.length;
  totalSectionsElement.textContent = sections.length;
}

function displayHierarchyTree() {
  const hierarchyTree = document.getElementById("hierarchyTree");
  const emptyState = document.getElementById("emptyState");

  // Get data from localStorage
  const levels = db.levels.getAll();
  const specialties = db.specialties.getAll();
  const sections = db.sections.getAll();

  // Clear existing content
  hierarchyTree.innerHTML = "";

  // Show/hide empty state
  if (levels.length === 0) {
    hierarchyTree.style.display = "none";
    emptyState.style.display = "flex";
    return;
  } else {
    hierarchyTree.style.display = "block";
    emptyState.style.display = "none";
  }

  // Create and append level nodes
  levels.forEach((level) => {
    const levelNode = createLevelNode(level, specialties, sections);
    hierarchyTree.appendChild(levelNode);
  });
}

function createLevelNode(level, allSpecialties, allSections) {
  const levelSpecialties = allSpecialties.filter((s) => s.levelId === level.id);

  const levelNode = document.createElement("div");
  levelNode.className = "tree-node tree-level";
  levelNode.innerHTML = `
        <div class="node-content">
            <div class="node-info">
                <span class="toggle-btn"><i class="fas fa-chevron-down"></i></span>
                <div class="node-icon level-icon"><i class="fas fa-chart-bar"></i></div>
                <span class="node-name">${level.name}</span>
                <span class="node-count">${levelSpecialties.length} شعبة</span>
            </div>
            <div class="node-actions">
                <button class="node-action-btn add-btn" title="إضافة شعبة">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="node-action-btn edit-btn" title="تعديل السنة الدراسية">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="node-action-btn delete-btn" title="حذف السنة الدراسية">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        <div class="children-container">
            ${createSpecialtiesNodes(levelSpecialties, allSections)}
        </div>
    `;

  // Add event listeners
  const toggleBtn = levelNode.querySelector(".toggle-btn");
  toggleBtn.addEventListener("click", () => toggleNode(levelNode));

  return levelNode;
}

function createSpecialtiesNodes(specialties, allSections) {
  return specialties
    .map((specialty) => {
      const specialtySections = allSections.filter(
        (s) => s.specialtyId === specialty.id
      );
      return `
            <div class="tree-node tree-specialty">
                <div class="node-content">
                    <div class="node-info">
                        <span class="toggle-btn"><i class="fas fa-chevron-down"></i></span>
                        <div class="node-icon specialty-icon"><i class="fas fa-list-alt"></i></div>
                        <span class="node-name">${specialty.name}</span>
                        <span class="node-count">${
                          specialtySections.length
                        } قسم</span>
                    </div>
                    <div class="node-actions">
                        <button class="node-action-btn add-btn" title="إضافة قسم">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="node-action-btn edit-btn" title="تعديل الشعبة">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="node-action-btn delete-btn" title="حذف الشعبة">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="children-container">
                    ${createSectionsNodes(specialtySections)}
                </div>
            </div>
        `;
    })
    .join("");
}

function createSectionsNodes(sections) {
  return sections
    .map((section) => {
      const sectionStudents = db.students
        .getAll()
        .filter((s) => s.sectionId === section.id);
      return `
            <div class="tree-node tree-section">
                <div class="node-content">
                    <div class="node-info">
                        <div class="node-icon section-icon"><i class="fas fa-school"></i></div>
                        <span class="node-name">${section.name}</span>
                        <span class="node-count">${sectionStudents.length} طالب</span>
                    </div>
                    <div class="node-actions">
                        <button class="node-action-btn view-btn" title="عرض الطلاب">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="node-action-btn edit-btn" title="تعديل القسم">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="node-action-btn delete-btn" title="حذف القسم">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

function toggleNode(node) {
  node.classList.toggle("collapsed");
  const toggleIcon = node.querySelector(".toggle-btn i");
  toggleIcon.className = node.classList.contains("collapsed")
    ? "fas fa-chevron-left"
    : "fas fa-chevron-down";
}

// Export functions for use in other files
window.displayStats = displayStats;
window.displayHierarchyTree = displayHierarchyTree;
window.toggleNode = toggleNode;
