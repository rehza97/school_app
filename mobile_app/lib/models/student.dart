import 'package:flutter/material.dart';

enum AttendanceStatus {
  present,
  absent,
  late,
  excused;

  Color get color {
    switch (this) {
      case AttendanceStatus.present:
        return Colors.green;
      case AttendanceStatus.absent:
        return Colors.red;
      case AttendanceStatus.late:
        return Colors.orange;
      case AttendanceStatus.excused:
        return Colors.blue;
    }
  }

  IconData get icon {
    switch (this) {
      case AttendanceStatus.present:
        return Icons.check_circle;
      case AttendanceStatus.absent:
        return Icons.cancel;
      case AttendanceStatus.late:
        return Icons.schedule;
      case AttendanceStatus.excused:
        return Icons.medical_services;
    }
  }
}

class Student {
  final String id;
  final String name;
  final String? photoUrl;
  final String? parentEmail;
  final String? parentPhone;
  AttendanceStatus status;
  String? notes;

  Student({
    required this.id,
    required this.name,
    this.photoUrl,
    this.parentEmail,
    this.parentPhone,
    this.status = AttendanceStatus.absent,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'photoUrl': photoUrl,
      'parentEmail': parentEmail,
      'parentPhone': parentPhone,
      'status': status.toString(),
      'notes': notes,
    };
  }

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'],
      name: json['name'],
      photoUrl: json['photoUrl'],
      parentEmail: json['parentEmail'],
      parentPhone: json['parentPhone'],
      status: AttendanceStatus.values.firstWhere(
        (e) => e.toString() == json['status'],
        orElse: () => AttendanceStatus.absent,
      ),
      notes: json['notes'],
    );
  }
}
