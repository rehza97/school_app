import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'auth_page.dart';
import 'attendance_page.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final currentTeacher = authService.getCurrentTeacher();

    if (currentTeacher == null) {
      return const AuthPage();
    }

    // Sample data structure for classes
    final Map<String, List<Map<String, dynamic>>> classesData = {
      'الصف الأول الابتدائي': [
        {
          'section': 'شعبة أ',
          'studentCount': 32,
          'time': '8:00 ص',
          'day': 'الأحد',
          'location': 'قاعة 101',
          'lastAttendance': '26-03-2024',
          'attendanceRate': 95,
        },
        {
          'section': 'شعبة ب',
          'studentCount': 30,
          'time': '9:30 ص',
          'day': 'الأحد',
          'location': 'قاعة 102',
          'lastAttendance': '26-03-2024',
          'attendanceRate': 92,
        },
      ],
      'الصف الثاني الابتدائي': [
        {
          'section': 'شعبة أ',
          'studentCount': 28,
          'time': '10:00 ص',
          'day': 'الأحد',
          'location': 'قاعة 201',
          'lastAttendance': '26-03-2024',
          'attendanceRate': 98,
        },
        {
          'section': 'شعبة ب',
          'studentCount': 29,
          'time': '11:30 ص',
          'day': 'الأحد',
          'location': 'قاعة 202',
          'lastAttendance': '26-03-2024',
          'attendanceRate': 94,
        },
      ],
    };

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('الفصول الدراسية'),
            Text(
              'مدرس ${currentTeacher.subject}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authService.logout();
              if (context.mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const AuthPage()),
                );
              }
            },
            tooltip: 'تسجيل الخروج',
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: classesData.length,
        itemBuilder: (context, gradeIndex) {
          final grade = classesData.keys.elementAt(gradeIndex);
          final sections = classesData[grade]!;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ExpansionTile(
                title: Text(
                  grade,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                children: sections.map((section) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 8.0,
                    ),
                    child: Card(
                      elevation: 2,
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => AttendancePage(
                                className: '$grade - ${section['section']}',
                                subject: currentTeacher.subject,
                                classId: '${grade}_${section['section']}',
                              ),
                            ),
                          );
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    section['section'],
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.blue.shade50,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      '${section['studentCount']} طالب',
                                      style: TextStyle(
                                        color: Colors.blue.shade700,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  const Icon(Icons.access_time,
                                      size: 16, color: Colors.grey),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${section['day']} - ${section['time']}',
                                    style: const TextStyle(color: Colors.grey),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.location_on,
                                      size: 16, color: Colors.grey),
                                  const SizedBox(width: 4),
                                  Text(
                                    section['location'],
                                    style: const TextStyle(color: Colors.grey),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'آخر حضور: ${section['lastAttendance']}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.green.shade50,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      'نسبة الحضور: ${section['attendanceRate']}%',
                                      style: TextStyle(
                                        color: Colors.green.shade700,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}
