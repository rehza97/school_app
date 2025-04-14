import 'class.dart';
import 'teacher.dart';

class Course {
  final String courseId;
  final String name;
  final String description;
  final Class classInfo;
  final Teacher teacher;
  final String schedule;
  final int credits;
  final String? syllabusUrl;

  Course({
    required this.courseId,
    required this.name,
    required this.description,
    required this.classInfo,
    required this.teacher,
    required this.schedule,
    required this.credits,
    this.syllabusUrl,
  });

  factory Course.fromMap(Map<String, dynamic> map) {
    return Course(
      courseId: map['courseId'] ?? '',
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      classInfo: Class.fromMap(map['classInfo'] ?? {}),
      teacher: Teacher.fromMap(map['teacher'] ?? {}),
      schedule: map['schedule'] ?? '',
      credits: map['credits'] ?? 0,
      syllabusUrl: map['syllabusUrl'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'courseId': courseId,
      'name': name,
      'description': description,
      'classInfo': classInfo.toMap(),
      'teacher': teacher.toMap(),
      'schedule': schedule,
      'credits': credits,
      'syllabusUrl': syllabusUrl,
    };
  }
}
