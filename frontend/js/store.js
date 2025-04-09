// Simple state management system
class Store {
  constructor() {
    this.state = {
      students: [],
      teachers: [],
      sections: [],
      loading: false,
      error: null,
      user: null,
    };

    this.listeners = new Set();
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Update state and notify listeners
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Actions
  async fetchStudents() {
    try {
      this.setState({ loading: true, error: null });
      const students = await apiService.getStudents();
      this.setState({ students, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  async fetchTeachers() {
    try {
      this.setState({ loading: true, error: null });
      const teachers = await apiService.getTeachers();
      this.setState({ teachers, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  async fetchSections() {
    try {
      this.setState({ loading: true, error: null });
      const sections = await apiService.getSections();
      this.setState({ sections, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  async createStudent(studentData) {
    try {
      this.setState({ loading: true, error: null });
      const newStudent = await apiService.createStudent(studentData);
      this.setState({
        students: [...this.state.students, newStudent],
        loading: false,
      });
      return newStudent;
    } catch (error) {
      this.setState({ error: error.message, loading: false });
      throw error;
    }
  }

  async createTeacher(teacherData) {
    try {
      this.setState({ loading: true, error: null });
      const newTeacher = await apiService.createTeacher(teacherData);
      this.setState({
        teachers: [...this.state.teachers, newTeacher],
        loading: false,
      });
      return newTeacher;
    } catch (error) {
      this.setState({ error: error.message, loading: false });
      throw error;
    }
  }

  async createSection(sectionData) {
    try {
      this.setState({ loading: true, error: null });
      const newSection = await apiService.createSection(sectionData);
      this.setState({
        sections: [...this.state.sections, newSection],
        loading: false,
      });
      return newSection;
    } catch (error) {
      this.setState({ error: error.message, loading: false });
      throw error;
    }
  }

  async uploadFile(file) {
    try {
      this.setState({ loading: true, error: null });
      const result = await apiService.uploadFile(file);
      this.setState({ loading: false });
      return result;
    } catch (error) {
      this.setState({ error: error.message, loading: false });
      throw error;
    }
  }

  // Clear error
  clearError() {
    this.setState({ error: null });
  }

  // Logout
  logout() {
    localStorage.removeItem("token");
    this.setState({
      students: [],
      teachers: [],
      sections: [],
      user: null,
      error: null,
    });
  }
}

// Create a singleton instance
const store = new Store();
export default store;
