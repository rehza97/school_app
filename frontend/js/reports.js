// DOM Elements
const reportTabs = document.querySelectorAll(".report-tab");
const reportPanels = document.querySelectorAll(".report-panel");
const attendanceGenerateBtn = document.getElementById("attendanceGenerateBtn");
const studentGenerateBtn = document.getElementById("studentGenerateBtn");
const classGenerateBtn = document.getElementById("classGenerateBtn");
const exportBtns = document.querySelectorAll(".export-btn");
const printBtns = document.querySelectorAll(".print-btn");

// Charts
let attendanceTrendChart;
let attendanceByClassChart;
let studentByClassChart;
let studentByGenderChart;
let classComparisonChart;

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  setupTabNavigation();
  setupEventListeners();
  loadSampleData();
});

// Initialize theme from localStorage
function initTheme() {
  const currentTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
}

// Toggle theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update charts with new theme colors
  updateChartsTheme();

  showNotification(
    `تم تغيير المظهر إلى الوضع ${newTheme === "light" ? "النهاري" : "الليلي"}`
  );
}

// Setup tab navigation
function setupTabNavigation() {
  reportTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and panels
      reportTabs.forEach((t) => t.classList.remove("active"));
      reportPanels.forEach((p) => p.classList.remove("active"));

      // Add active class to clicked tab and corresponding panel
      tab.classList.add("active");
      const panelId = tab.getAttribute("data-target");
      document.getElementById(panelId).classList.add("active");
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Theme toggle button
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // Generate report buttons
  if (attendanceGenerateBtn) {
    attendanceGenerateBtn.addEventListener("click", generateAttendanceReport);
  }

  if (studentGenerateBtn) {
    studentGenerateBtn.addEventListener("click", generateStudentReport);
  }

  if (classGenerateBtn) {
    classGenerateBtn.addEventListener("click", generateClassReport);
  }

  // Export buttons
  exportBtns.forEach((btn) => {
    btn.addEventListener("click", handleExport);
  });

  // Print buttons
  printBtns.forEach((btn) => {
    btn.addEventListener("click", handlePrint);
  });
}

// Show notification
function showNotification(message, type = "info") {
  const notificationContainer = document.getElementById(
    "notificationContainer"
  );
  if (!notificationContainer) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
    `;

  notificationContainer.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Load sample data for demonstration
function loadSampleData() {
  // Initialize attendance report charts
  initAttendanceTrendChart();
  initAttendanceByClassChart();

  // Initialize student report charts
  initStudentByClassChart();
  initStudentByGenderChart();

  // Initialize class report charts
  initClassComparisonChart();

  // Populate tables with sample data
  populateSampleTables();
}

// Initialize attendance trend chart
function initAttendanceTrendChart() {
  const ctx = document.getElementById("attendanceTrendChart");
  if (!ctx) return;

  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim() || "#333";
  const gridColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--border-color")
      .trim() || "#ddd";

  attendanceTrendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "يناير"],
      datasets: [
        {
          label: "معدل الحضور",
          data: [92, 88, 95, 89, 91, 94],
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
        {
          label: "معدل الغياب",
          data: [8, 12, 5, 11, 9, 6],
          borderColor: "#e74c3c",
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },
      },
    },
  });
}

// Initialize attendance by class chart
function initAttendanceByClassChart() {
  const ctx = document.getElementById("attendanceByClassChart");
  if (!ctx) return;

  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim() || "#333";
  const gridColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--border-color")
      .trim() || "#ddd";

  attendanceByClassChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "الصف الأول",
        "الصف الثاني",
        "الصف الثالث",
        "الصف الرابع",
        "الصف الخامس",
        "الصف السادس",
      ],
      datasets: [
        {
          label: "معدل الحضور",
          data: [95, 88, 92, 85, 90, 93],
          backgroundColor: "rgba(52, 152, 219, 0.7)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
            font: {
              size: 12,
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },
      },
    },
  });
}

// Initialize student by class chart
function initStudentByClassChart() {
  const ctx = document.getElementById("studentByClassChart");
  if (!ctx) return;

  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim() || "#333";

  studentByClassChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [
        "الصف الأول",
        "الصف الثاني",
        "الصف الثالث",
        "الصف الرابع",
        "الصف الخامس",
        "الصف السادس",
      ],
      datasets: [
        {
          data: [35, 40, 30, 38, 32, 25],
          backgroundColor: [
            "#3498db",
            "#2ecc71",
            "#e74c3c",
            "#f39c12",
            "#9b59b6",
            "#1abc9c",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: textColor,
            font: {
              size: 12,
            },
          },
        },
      },
    },
  });
}

// Initialize student by gender chart
function initStudentByGenderChart() {
  const ctx = document.getElementById("studentByGenderChart");
  if (!ctx) return;

  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim() || "#333";

  studentByGenderChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["ذكور", "إناث"],
      datasets: [
        {
          data: [120, 80],
          backgroundColor: ["#3498db", "#e84393"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor,
            font: {
              size: 12,
            },
          },
        },
      },
    },
  });
}

// Initialize class comparison chart
function initClassComparisonChart() {
  const ctx = document.getElementById("classComparisonChart");
  if (!ctx) return;

  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim() || "#333";
  const gridColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--border-color")
      .trim() || "#ddd";

  classComparisonChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "عدد الطلاب",
        "معدل الحضور",
        "متوسط الدرجات",
        "النشاط",
        "السلوك",
        "التفاعل",
      ],
      datasets: [
        {
          label: "الصف الأول",
          data: [80, 90, 85, 70, 95, 80],
          backgroundColor: "rgba(52, 152, 219, 0.2)",
          borderColor: "rgba(52, 152, 219, 1)",
          pointBackgroundColor: "rgba(52, 152, 219, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(52, 152, 219, 1)",
        },
        {
          label: "الصف الثاني",
          data: [70, 85, 90, 85, 75, 90],
          backgroundColor: "rgba(46, 204, 113, 0.2)",
          borderColor: "rgba(46, 204, 113, 1)",
          pointBackgroundColor: "rgba(46, 204, 113, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(46, 204, 113, 1)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor,
            font: {
              size: 12,
            },
          },
        },
      },
      scales: {
        r: {
          angleLines: {
            color: gridColor,
          },
          grid: {
            color: gridColor,
          },
          pointLabels: {
            color: textColor,
          },
          ticks: {
            color: textColor,
            backdropColor: "transparent",
          },
        },
      },
    },
  });
}

// Update charts theme
function updateChartsTheme() {
  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim() || "#333";
  const gridColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--border-color")
      .trim() || "#ddd";

  const charts = [
    attendanceTrendChart,
    attendanceByClassChart,
    studentByClassChart,
    studentByGenderChart,
    classComparisonChart,
  ];

  charts.forEach((chart) => {
    if (!chart) return;

    // Update legend text color
    if (chart.options.plugins.legend) {
      chart.options.plugins.legend.labels.color = textColor;
    }

    // Update axes colors for cartesian charts
    if (chart.options.scales && chart.options.scales.x) {
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.x.grid.color = gridColor;
      chart.options.scales.y.ticks.color = textColor;
      chart.options.scales.y.grid.color = gridColor;
    }

    // Update radar chart colors
    if (chart.options.scales && chart.options.scales.r) {
      chart.options.scales.r.angleLines.color = gridColor;
      chart.options.scales.r.grid.color = gridColor;
      chart.options.scales.r.pointLabels.color = textColor;
      chart.options.scales.r.ticks.color = textColor;
    }

    chart.update();
  });
}

// Populate sample tables
function populateSampleTables() {
  // Sample data for frequent absences table
  const frequentAbsenceTable = document.getElementById("frequentAbsenceTable");
  if (frequentAbsenceTable) {
    const tbody = frequentAbsenceTable.querySelector("tbody");
    const sampleData = [
      {
        id: "1001",
        name: "أحمد محمد",
        class: "الصف الرابع",
        absenceDays: 12,
        absenceRate: "15%",
      },
      {
        id: "1042",
        name: "سارة أحمد",
        class: "الصف الثالث",
        absenceDays: 10,
        absenceRate: "12.5%",
      },
      {
        id: "1128",
        name: "خالد عبدالله",
        class: "الصف الخامس",
        absenceDays: 8,
        absenceRate: "10%",
      },
      {
        id: "1056",
        name: "نورة محمد",
        class: "الصف السادس",
        absenceDays: 7,
        absenceRate: "8.75%",
      },
      {
        id: "1073",
        name: "محمد علي",
        class: "الصف الأول",
        absenceDays: 6,
        absenceRate: "7.5%",
      },
    ];

    tbody.innerHTML = "";
    sampleData.forEach((student) => {
      tbody.innerHTML += `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${student.class}</td>
                    <td>${student.absenceDays}</td>
                    <td>${student.absenceRate}</td>
                    <td>
                        <button class="action-btn view" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
    });
  }

  // Sample data for attendance by class table
  const attendanceByClassTable = document.getElementById(
    "attendanceByClassTable"
  );
  if (attendanceByClassTable) {
    const tbody = attendanceByClassTable.querySelector("tbody");
    const sampleData = [
      {
        class: "الصف الأول",
        students: 35,
        attendanceRate: "95%",
        absenceRate: "5%",
      },
      {
        class: "الصف الثاني",
        students: 40,
        attendanceRate: "88%",
        absenceRate: "12%",
      },
      {
        class: "الصف الثالث",
        students: 30,
        attendanceRate: "92%",
        absenceRate: "8%",
      },
      {
        class: "الصف الرابع",
        students: 38,
        attendanceRate: "85%",
        absenceRate: "15%",
      },
      {
        class: "الصف الخامس",
        students: 32,
        attendanceRate: "90%",
        absenceRate: "10%",
      },
      {
        class: "الصف السادس",
        students: 25,
        attendanceRate: "93%",
        absenceRate: "7%",
      },
    ];

    tbody.innerHTML = "";
    sampleData.forEach((cls) => {
      tbody.innerHTML += `
                <tr>
                    <td>${cls.class}</td>
                    <td>${cls.students}</td>
                    <td>${cls.attendanceRate}</td>
                    <td>${cls.absenceRate}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill green" style="width: ${cls.attendanceRate}"></div>
                        </div>
                    </td>
                    <td>
                        <button class="action-btn view" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn print" title="طباعة التقرير">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="action-btn export" title="تصدير التقرير">
                            <i class="fas fa-file-export"></i>
                        </button>
                    </td>
                </tr>
            `;
    });
  }
}

// Generate attendance report
function generateAttendanceReport() {
  const fromDate = document.getElementById("attendanceFromDate").value;
  const toDate = document.getElementById("attendanceToDate").value;
  const classFilter = document.getElementById("attendanceClassFilter").value;

  if (!fromDate || !toDate) {
    showNotification("الرجاء تحديد نطاق زمني للتقرير", "error");
    return;
  }

  showNotification("جاري إنشاء تقرير الحضور...", "info");

  // Simulate loading
  setTimeout(() => {
    showNotification("تم إنشاء تقرير الحضور بنجاح", "success");

    // Update charts and tables with new data (using sample data for demo)
    updateChartsWithNewData();
  }, 1500);
}

// Generate student report
function generateStudentReport() {
  const reportType = document.getElementById("studentReportType").value;
  const classFilter = document.getElementById("studentClassFilter").value;

  showNotification("جاري إنشاء تقرير الطلاب...", "info");

  // Simulate loading
  setTimeout(() => {
    showNotification("تم إنشاء تقرير الطلاب بنجاح", "success");

    // Update charts with new data (using sample data for demo)
    updateChartsWithNewData();
  }, 1500);
}

// Generate class report
function generateClassReport() {
  const reportType = document.getElementById("classReportType").value;
  const levelFilter = document.getElementById("classLevelFilter").value;

  showNotification("جاري إنشاء تقرير الفصول...", "info");

  // Simulate loading
  setTimeout(() => {
    showNotification("تم إنشاء تقرير الفصول بنجاح", "success");

    // Update charts with new data (using sample data for demo)
    updateChartsWithNewData();
  }, 1500);
}

// Update charts with new data (for demo purposes)
function updateChartsWithNewData() {
  // This function would normally fetch data from the server
  // For this demo, we'll just update the charts with random data

  if (attendanceTrendChart) {
    attendanceTrendChart.data.datasets[0].data = generateRandomData(6, 85, 98);
    attendanceTrendChart.data.datasets[1].data = generateRandomData(6, 2, 15);
    attendanceTrendChart.update();
  }

  if (attendanceByClassChart) {
    attendanceByClassChart.data.datasets[0].data = generateRandomData(
      6,
      80,
      97
    );
    attendanceByClassChart.update();
  }

  if (studentByClassChart) {
    studentByClassChart.data.datasets[0].data = generateRandomData(6, 20, 45);
    studentByClassChart.update();
  }

  if (classComparisonChart) {
    classComparisonChart.data.datasets[0].data = generateRandomData(6, 70, 95);
    classComparisonChart.data.datasets[1].data = generateRandomData(6, 70, 95);
    classComparisonChart.update();
  }
}

// Generate random data for charts
function generateRandomData(count, min, max) {
  return Array.from(
    { length: count },
    () => Math.floor(Math.random() * (max - min + 1)) + min
  );
}

// Handle export button click
function handleExport(e) {
  const reportType =
    e.currentTarget.getAttribute("data-report") || "attendance";
  showNotification(
    `جاري تصدير تقرير ${getReportTypeName(reportType)}...`,
    "info"
  );

  // Simulate export process
  setTimeout(() => {
    showNotification(
      `تم تصدير تقرير ${getReportTypeName(reportType)} بنجاح`,
      "success"
    );
  }, 1500);
}

// Handle print button click
function handlePrint(e) {
  const reportType =
    e.currentTarget.getAttribute("data-report") || "attendance";

  // Add print styles
  const printStyles = document.createElement("style");
  printStyles.id = "print-styles";
  printStyles.textContent = `
        @media print {
            body * {
                visibility: hidden;
            }
            .report-panel.active, .report-panel.active * {
                visibility: visible;
            }
            .report-panel.active {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            .card-actions, .action-btn, .sidebar, .notification-container {
                display: none !important;
            }
        }
    `;
  document.head.appendChild(printStyles);

  // Print
  window.print();

  // Remove print styles
  document.head.removeChild(printStyles);

  showNotification(
    `تمت طباعة تقرير ${getReportTypeName(reportType)}`,
    "success"
  );
}

// Get report type name in Arabic
function getReportTypeName(type) {
  const types = {
    attendance: "الحضور",
    student: "الطلاب",
    class: "الفصول",
  };
  return types[type] || "النظام";
}
