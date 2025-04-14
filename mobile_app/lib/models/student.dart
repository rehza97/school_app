import 'package:flutter/material.dart';

class Student {
  final String studentId;
  final String firstName;
  final String lastName;
  final String gender;
  final String birthDate;
  final String placeOfBirth;
  final String classId;
  final String parentId;

  Student({
    required this.studentId,
    required this.firstName,
    required this.lastName,
    required this.gender,
    required this.birthDate,
    required this.placeOfBirth,
    required this.classId,
    required this.parentId,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      studentId: json['studentId'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      gender: json['gender'] ?? '',
      birthDate: json['birthDate'] ?? '',
      placeOfBirth: json['placeOfBirth'] ?? '',
      classId: json['classId'] ?? '',
      parentId: json['parentId'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'studentId': studentId,
      'firstName': firstName,
      'lastName': lastName,
      'gender': gender,
      'birthDate': birthDate,
      'placeOfBirth': placeOfBirth,
      'classId': classId,
      'parentId': parentId,
    };
  }
}
