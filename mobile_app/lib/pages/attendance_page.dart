import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/student.dart';
import '../models/attendance.dart';
import '../models/course.dart';
import '../models/session.dart';
import '../services/firebase_service.dart';
import '../services/auth_service.dart';

class AttendancePage extends StatefulWidget {
  final Course course;
  final Session session;

  const AttendancePage({
    super.key,
    required this.course,
    required this.session,
  });

  @override
  State<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends State<AttendancePage> {
  final FirebaseService _firebaseService = FirebaseService();
  List<Student> _students = [];
  Map<String, AttendanceStatus> _attendanceStatus = {};
  Map<String, TextEditingController> _remarkControllers = {};
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  Future<void> _loadStudents() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Get students for this class
      final students =
          await _firebaseService.getStudentsByClassId(widget.course.classId);

      // Get existing attendance records
      final attendanceRecords = await _firebaseService.getAttendanceBySessionId(
        widget.course.courseId,
        widget.session.sessionId,
      );

      // Initialize attendance status map
      final Map<String, AttendanceStatus> statusMap = {};
      final Map<String, TextEditingController> remarkMap = {};

      for (var student in students) {
        // Default to present
        statusMap[student.studentId] = AttendanceStatus.present;
        remarkMap[student.studentId] = TextEditingController();
      }

      // Update with existing attendance records
      for (var record in attendanceRecords) {
        statusMap[record.studentId] = record.status;
        if (record.remark != null) {
          remarkMap[record.studentId]?.text = record.remark!;
        }
      }

      setState(() {
        _students = students;
        _attendanceStatus = statusMap;
        _remarkControllers = remarkMap;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorDialog('خطأ في تحميل بيانات الطلاب: $e');
    }
  }

  Future<void> _saveAttendance() async {
    setState(() {
      _isSaving = true;
    });

    try {
      // Create attendance records
      final List<Attendance> attendances = [];

      for (var student in _students) {
        attendances.add(
          Attendance(
            studentId: student.studentId,
            status:
                _attendanceStatus[student.studentId] ?? AttendanceStatus.absent,
            remark: _remarkControllers[student.studentId]?.text,
          ),
        );
      }

      // Save to Firestore
      final success = await _firebaseService.batchUpdateAttendance(
        widget.course.courseId,
        widget.session.sessionId,
        attendances,
      );

      setState(() {
        _isSaving = false;
      });

      if (success) {
        _showSuccessDialog();
      } else {
        _showErrorDialog('فشل في حفظ بيانات الحضور');
      }
    } catch (e) {
      setState(() {
        _isSaving = false;
      });
      _showErrorDialog('خطأ في حفظ بيانات الحضور: $e');
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تم الحفظ بنجاح'),
        content: const Text('تم حفظ بيانات الحضور بنجاح'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(); // Go back to previous screen
            },
            child: const Text('حسناً'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('خطأ'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('حسناً'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    // Dispose all text controllers
    for (var controller in _remarkControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text('تسجيل الحضور - ${widget.course.subject}'),
          actions: [
            if (!_isLoading)
              IconButton(
                icon: const Icon(Icons.save),
                onPressed: _isSaving ? null : _saveAttendance,
                tooltip: 'حفظ',
              ),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  // Session info
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: Colors.blue.withOpacity(0.1),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today, color: Colors.blue),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'التاريخ: ${widget.session.date}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'الوقت: ${widget.session.startTime} - ${widget.session.endTime}',
                              ),
                              Text('القاعة: ${widget.session.room}'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Attendance controls
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildAttendanceButton(
                          AttendanceStatus.present,
                          'حاضر',
                          Colors.green,
                        ),
                        _buildAttendanceButton(
                          AttendanceStatus.late,
                          'متأخر',
                          Colors.orange,
                        ),
                        _buildAttendanceButton(
                          AttendanceStatus.absent,
                          'غائب',
                          Colors.red,
                        ),
                      ],
                    ),
                  ),

                  // Students list
                  Expanded(
                    child: ListView.builder(
                      itemCount: _students.length,
                      itemBuilder: (context, index) {
                        final student = _students[index];
                        final status = _attendanceStatus[student.studentId] ??
                            AttendanceStatus.absent;
                        final remarkController =
                            _remarkControllers[student.studentId];

                        return Card(
                          margin: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 4,
                          ),
                          child: ListTile(
                            title: Text(
                                '${student.firstName} ${student.lastName}'),
                            subtitle: TextField(
                              controller: remarkController,
                              decoration: const InputDecoration(
                                hintText: 'ملاحظات',
                                border: InputBorder.none,
                              ),
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Radio<AttendanceStatus>(
                                  value: AttendanceStatus.present,
                                  groupValue: status,
                                  onChanged: (value) {
                                    setState(() {
                                      _attendanceStatus[student.studentId] =
                                          value!;
                                    });
                                  },
                                ),
                                Radio<AttendanceStatus>(
                                  value: AttendanceStatus.late,
                                  groupValue: status,
                                  onChanged: (value) {
                                    setState(() {
                                      _attendanceStatus[student.studentId] =
                                          value!;
                                    });
                                  },
                                ),
                                Radio<AttendanceStatus>(
                                  value: AttendanceStatus.absent,
                                  groupValue: status,
                                  onChanged: (value) {
                                    setState(() {
                                      _attendanceStatus[student.studentId] =
                                          value!;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
        floatingActionButton: _isSaving
            ? const FloatingActionButton(
                onPressed: null,
                child: CircularProgressIndicator(color: Colors.white),
              )
            : FloatingActionButton(
                onPressed: _saveAttendance,
                child: const Icon(Icons.save),
              ),
      ),
    );
  }

  Widget _buildAttendanceButton(
    AttendanceStatus status,
    String label,
    Color color,
  ) {
    return ElevatedButton.icon(
      onPressed: () {
        setState(() {
          // Set all students to this status
          for (var student in _students) {
            _attendanceStatus[student.studentId] = status;
          }
        });
      },
      icon: Icon(Icons.check, color: color),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withOpacity(0.1),
        foregroundColor: color,
      ),
    );
  }
}
