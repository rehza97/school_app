import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/student.dart';

class StorageService {
  static const String _attendanceKey = 'attendance_records';
  static const String _classesKey = 'class_sections';

  final SharedPreferences _prefs;

  StorageService(this._prefs);

  Future<void> saveAttendanceRecord(
    String classId,
    String date,
    List<Student> students,
  ) async {
    final records = _prefs.getStringList(_attendanceKey) ?? [];
    final record = {
      'classId': classId,
      'date': date,
      'students': students.map((s) => s.toJson()).toList(),
    };
    records.add(jsonEncode(record));
    await _prefs.setStringList(_attendanceKey, records);
  }

  Future<List<Map<String, dynamic>>> getAttendanceRecords(
      String classId) async {
    final records = _prefs.getStringList(_attendanceKey) ?? [];
    return records
        .map((r) => jsonDecode(r))
        .where((r) => r['classId'] == classId)
        .toList()
        .cast<Map<String, dynamic>>();
  }

  Future<void> saveClassSections(List<Map<String, dynamic>> sections) async {
    final sectionsJson = sections.map((s) => jsonEncode(s)).toList();
    await _prefs.setStringList(_classesKey, sectionsJson);
  }

  List<Map<String, dynamic>> getClassSections() {
    final sections = _prefs.getStringList(_classesKey) ?? [];
    return sections
        .map((s) => jsonDecode(s))
        .toList()
        .cast<Map<String, dynamic>>();
  }
}
