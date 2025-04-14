import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/course.dart';
import '../models/class.dart';
import '../models/session.dart';
import '../services/firebase_service.dart';
import '../services/auth_service.dart';
import 'attendance_page.dart';

class CoursesPage extends StatefulWidget {
  const CoursesPage({super.key});

  @override
  State<CoursesPage> createState() => _CoursesPageState();
}

class _CoursesPageState extends State<CoursesPage> {
  final FirebaseService _firebaseService = FirebaseService();
  List<Course> _courses = [];
  Map<String, SchoolClass> _classes = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final teacher =
          Provider.of<AuthService>(context, listen: false).getCurrentTeacher();

      if (teacher == null) {
        throw Exception('لم يتم العثور على بيانات المعلم');
      }

      // Get courses for this teacher
      final courses =
          await _firebaseService.getCoursesByTeacherId(teacher.teacherId);

      // Get class details for each course
      final Map<String, SchoolClass> classes = {};
      for (var course in courses) {
        final classData = await _firebaseService.getClassById(course.classId);
        if (classData != null) {
          classes[course.classId] = classData;
        }
      }

      setState(() {
        _courses = courses;
        _classes = classes;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorDialog('خطأ في تحميل بيانات الدورات: $e');
    }
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

  Future<void> _createNewSession(Course course) async {
    final now = DateTime.now();
    final date =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final time =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    final session = Session(
      sessionId: '', // Will be set by Firestore
      date: date,
      startTime: time,
      endTime:
          '${(now.hour + 1).toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
      room: 'قاعة ${course.courseId}',
    );

    try {
      final sessionId =
          await _firebaseService.createSession(course.courseId, session);

      if (sessionId != null) {
        // Update the session with the ID
        final updatedSession = Session(
          sessionId: sessionId,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          room: session.room,
        );

        if (mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AttendancePage(
                course: course,
                session: updatedSession,
              ),
            ),
          );
        }
      } else {
        _showErrorDialog('فشل في إنشاء جلسة جديدة');
      }
    } catch (e) {
      _showErrorDialog('خطأ في إنشاء جلسة جديدة: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('الدورات الدراسية'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadCourses,
              tooltip: 'تحديث',
            ),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _courses.isEmpty
                ? const Center(
                    child: Text(
                      'لا توجد دورات دراسية متاحة',
                      style: TextStyle(fontSize: 18),
                    ),
                  )
                : ListView.builder(
                    itemCount: _courses.length,
                    itemBuilder: (context, index) {
                      final course = _courses[index];
                      final classData = _classes[course.classId];

                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ExpansionTile(
                          title: Text(
                            course.subject,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          subtitle: classData != null
                              ? Text(
                                  '${classData.schoolYear} - ${classData.field} - ${classData.section}',
                                )
                              : null,
                          leading: const Icon(Icons.book),
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'الفصل الدراسي: ${course.semester}',
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () => _createNewSession(course),
                                    icon: const Icon(Icons.add),
                                    label: const Text('تسجيل حضور جديد'),
                                    style: ElevatedButton.styleFrom(
                                      minimumSize:
                                          const Size(double.infinity, 50),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
