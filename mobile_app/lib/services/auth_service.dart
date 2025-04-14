import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/teacher.dart';
import 'firebase_service.dart';

class AuthService {
  static const String _currentTeacherKey = 'current_teacher';
  final SharedPreferences _prefs;
  final FirebaseService _firebaseService;

  AuthService(this._prefs) : _firebaseService = FirebaseService();

  Future<Teacher?> login(String code) async {
    if (code.isEmpty) {
      throw Exception('رمز الدخول لا يمكن أن يكون فارغاً');
    }

    try {
      // Get teacher from Firestore using the code
      final teacher = await _firebaseService.getTeacherByCode(code.trim());

      if (teacher == null) {
        throw Exception('رمز الدخول غير صحيح');
      }

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
