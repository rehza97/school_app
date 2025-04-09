import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/teacher.dart';

class AuthService {
  static const String _currentTeacherKey = 'current_teacher';
  final SharedPreferences _prefs;

  // Simple test data with short codes
  final List<Teacher> _teachers = [
    Teacher(
      id: '1',
      name: 'Math Teacher',
      subject: 'Mathematics',
      accessCode: '111', // Simple 3-digit code
    ),
    Teacher(
      id: '2',
      name: 'Science Teacher',
      subject: 'Science',
      accessCode: '222', // Simple 3-digit code
    ),
    Teacher(
      id: '3',
      name: 'English Teacher',
      subject: 'English',
      accessCode: '333', // Simple 3-digit code
    ),
  ];

  AuthService(this._prefs);

  Future<Teacher?> login(String accessCode) async {
    if (accessCode.isEmpty) {
      throw Exception('Access code cannot be empty');
    }

    try {
      final teacher = _teachers.firstWhere(
        (t) => t.accessCode == accessCode.trim(),
        orElse: () => throw Exception('Invalid access code'),
      );

      // Save the logged-in teacher
      await _prefs.setString(_currentTeacherKey, jsonEncode(teacher.toJson()));
      return teacher;
    } catch (e) {
      await logout(); // Clear any existing login state on error
      rethrow;
    }
  }

  Teacher? getCurrentTeacher() {
    try {
      final teacherJson = _prefs.getString(_currentTeacherKey);
      if (teacherJson == null) return null;
      return Teacher.fromJson(jsonDecode(teacherJson));
    } catch (e) {
      // If there's any error reading the stored teacher data,
      // clear it and return null
      logout();
      return null;
    }
  }

  Future<void> logout() async {
    await _prefs.remove(_currentTeacherKey);
  }
}
