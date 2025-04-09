// API Service for handling backend communications
class ApiService {
  constructor() {
    this.baseUrl = process.env.API_URL || "http://localhost:3000/api";
    this.token = localStorage.getItem("token");
    this.firebaseConfig = {
      // Will be populated from environment variables
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };
  }

  // Initialize Firebase (will be implemented during transition)
  async initializeFirebase() {
    // TODO: Implement Firebase initialization
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Something went wrong");
    }
    return response.json();
  }

  // Helper method to get headers
  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
  }

  // Authentication
  async login(code) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Students
  async getStudents() {
    try {
      const response = await fetch(`${this.baseUrl}/students`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      return await response.json();
    } catch (error) {
      console.error("Get students error:", error);
      throw error;
    }
  }

  async createStudent(studentData) {
    try {
      const response = await fetch(`${this.baseUrl}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error("Failed to create student");
      }

      return await response.json();
    } catch (error) {
      console.error("Create student error:", error);
      throw error;
    }
  }

  // Teachers
  async getTeachers() {
    try {
      const response = await fetch(`${this.baseUrl}/teachers`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }

      return await response.json();
    } catch (error) {
      console.error("Get teachers error:", error);
      throw error;
    }
  }

  async createTeacher(teacherData) {
    try {
      const response = await fetch(`${this.baseUrl}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(teacherData),
      });

      if (!response.ok) {
        throw new Error("Failed to create teacher");
      }

      return await response.json();
    } catch (error) {
      console.error("Create teacher error:", error);
      throw error;
    }
  }

  // Sections
  async getSections() {
    try {
      const response = await fetch(`${this.baseUrl}/sections`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sections");
      }

      return await response.json();
    } catch (error) {
      console.error("Get sections error:", error);
      throw error;
    }
  }

  async createSection(sectionData) {
    try {
      const response = await fetch(`${this.baseUrl}/sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(sectionData),
      });

      if (!response.ok) {
        throw new Error("Failed to create section");
      }

      return await response.json();
    } catch (error) {
      console.error("Create section error:", error);
      throw error;
    }
  }

  // File Upload
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      return await response.json();
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  }

  // Logout method
  logout() {
    this.token = null;
    localStorage.removeItem("token");
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;
