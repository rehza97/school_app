enum AttendanceStatus {
  present,
  absent,
  late,
}

class Attendance {
  final String studentId;
  final AttendanceStatus status;
  final String? remark;

  Attendance({
    required this.studentId,
    required this.status,
    this.remark,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      studentId: json['studentId'] ?? '',
      status: _parseStatus(json['status'] ?? 'absent'),
      remark: json['remark'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'studentId': studentId,
      'status': status.toString().split('.').last,
      'remark': remark,
    };
  }

  static AttendanceStatus _parseStatus(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return AttendanceStatus.present;
      case 'late':
        return AttendanceStatus.late;
      case 'absent':
      default:
        return AttendanceStatus.absent;
    }
  }
}
