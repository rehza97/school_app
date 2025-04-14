class Class {
  final String classId;
  final String name;
  final String grade;
  final String section;
  final String academicYear;

  Class({
    required this.classId,
    required this.name,
    required this.grade,
    required this.section,
    required this.academicYear,
  });

  factory Class.fromMap(Map<String, dynamic> map) {
    return Class(
      classId: map['classId'] ?? '',
      name: map['name'] ?? '',
      grade: map['grade'] ?? '',
      section: map['section'] ?? '',
      academicYear: map['academicYear'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'classId': classId,
      'name': name,
      'grade': grade,
      'section': section,
      'academicYear': academicYear,
    };
  }

  String get displayName => '$grade-$section';
}
