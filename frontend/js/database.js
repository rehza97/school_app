/**
 * Global Database Module
 * This module provides centralized data access and management for the entire application.
 * All pages can import and use this module to interact with the application data.
 */

// Common API configuration
const API_CONFIG = {
  BASE_URL: "http://localhost:3000/api",
  STUDENTS: "/students",
  TEACHERS: "/teachers",
  SECTIONS: "/sections",
  SUBJECTS: "/subjects",
  CLASS_SCHEDULES: "/class-schedules",
  ATTENDANCE: "/attendance",
  UPLOAD: "/upload",
  STUDENT_COUNT: "/students/count",
  TEACHER_COUNT: "/teachers/count",
  TEACHER_ROLES: "/teacher-roles",
  STUDENT_IMPORT: "/students/import",
  TEACHER_IMPORT: "/teachers/import",
};

// Error handling helper
const handleApiError = (error) => {
  console.error("API Error:", error);
  return { success: false, error: error.message || "Unknown error occurred" };
};

// Database API Methods
const api = {
  // Make the API_CONFIG accessible
  API_CONFIG,

  // Check if the backend is available
  async checkConnection() {
    try {
      // First try the health-check endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/health-check`);
      if (!response.ok) {
        console.error("Health check failed:", response.status);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Connection check failed:", error);
      // Show a more user-friendly error message
      const errorMessage = document.createElement("div");
      errorMessage.className = "connection-error";
      errorMessage.innerHTML = `
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>لا يمكن الاتصال بالخادم</h3>
          <p>يرجى التأكد من تشغيل الخادم على المنفذ ${API_CONFIG.PORT}</p>
          <button onclick="window.location.reload()">إعادة المحاولة</button>
        </div>
      `;
      document.body.appendChild(errorMessage);
      return false;
    }
  },

  // Get all entities by type
  async getAll(entityType = API_CONFIG.STUDENTS) {
    try {
      const url = `${API_CONFIG.BASE_URL}${entityType}`;
      console.log("Fetching data from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch data from ${entityType}`
        );
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error in getAll:", error);
      return { success: false, error: error.message || "Failed to fetch data" };
    }
  },

  // Get entity by ID
  async getById(entityType, id) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${entityType}/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch entity with ID ${id}`
        );
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Add new entity
  async add(entityType, data) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${entityType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to add entity to ${entityType}`
        );
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Update entity
  async update(entityPath, data) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${entityPath}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to update entity at ${entityPath}`
        );
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Delete entity
  async delete(entityPath) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${entityPath}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to delete entity at ${entityPath}`
        );
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Upload file
  async uploadFile(file, type) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.UPLOAD}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Import data (generic method)
  async importData(entityPath, data) {
    try {
      console.log(
        `Sending ${data.length} records to import API at ${entityPath}`
      );

      // Log the first record for debugging
      if (data.length > 0) {
        console.log("First record sample:", data[0]);
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${entityPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Try different payload formats - some backends expect { data: [...] }, others expect { students: [...] }
        // Here we'll try a more generic approach that should work in most cases
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(
          errorData.error || `Failed to import data to ${entityPath}`
        );
      }

      const result = await response.json();
      console.log("Import response:", result);
      return { success: true, ...result };
    } catch (error) {
      console.error("Error in importData:", error);
      return {
        success: false,
        error: error.message || "Failed to import data",
      };
    }
  },

  // Get student count
  async getStudentCount() {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.STUDENT_COUNT}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get student count");
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error("Error getting student count:", error);
      return 0;
    }
  },

  // Get teacher count
  async getTeacherCount() {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.TEACHER_COUNT}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get teacher count");
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error("Error getting teacher count:", error);
      return 0;
    }
  },

  // Get attendance records for date
  async getAttendanceForDate(date) {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ATTENDANCE}?date=${date}`;
      console.log("Fetching attendance from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch attendance for date ${date}`
        );
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get attendance records for student
  async getAttendanceForStudent(studentId) {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ATTENDANCE}?student_id=${studentId}`;
      console.log("Fetching student attendance from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to fetch attendance for student ${studentId}`
        );
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get attendance summary
  async getAttendanceSummary(params = {}) {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const queryString = queryParams.toString();
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ATTENDANCE}/summary${
        queryString ? "?" + queryString : ""
      }`;

      console.log("Fetching attendance summary from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch attendance summary`
        );
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Save attendance record
  async saveAttendance(data) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ATTENDANCE}`,
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
        throw new Error(errorData.error || `Failed to save attendance record`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Save batch attendance records
  async saveBatchAttendance(data) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ATTENDANCE}/batch`,
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
          errorData.error || `Failed to save batch attendance records`
        );
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get class schedules
  async getClassSchedules(params = {}) {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const queryString = queryParams.toString();
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.CLASS_SCHEDULES}${
        queryString ? "?" + queryString : ""
      }`;

      console.log("Fetching class schedules from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch class schedules`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Create class schedule
  async createClassSchedule(data) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.CLASS_SCHEDULES}`,
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
        throw new Error(errorData.error || `Failed to create class schedule`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get subjects
  async getSubjects() {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.SUBJECTS}`;
      console.log("Fetching subjects from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch subjects`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Expose the database module to the window object
window.db = api;

// Log initialization
console.log("Database module initialized");
