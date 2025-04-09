import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class StudentProfilePage extends StatelessWidget {
  final Map<String, dynamic> student;

  const StudentProfilePage({
    super.key,
    required this.student,
  });

  @override
  Widget build(BuildContext context) {
    // Sample attendance history data
    final List<Map<String, dynamic>> attendanceHistory = [
      {
        'date': '2024-03-26',
        'status': 'حاضر',
        'subject': 'الرياضيات',
        'notes': '',
      },
      {
        'date': '2024-03-25',
        'status': 'غائب',
        'subject': 'الرياضيات',
        'notes': 'مريض',
      },
      {
        'date': '2024-03-24',
        'status': 'حاضر',
        'subject': 'الرياضيات',
        'notes': '',
      },
    ];

    // Calculate attendance statistics
    final int totalDays = attendanceHistory.length;
    final int presentDays =
        attendanceHistory.where((record) => record['status'] == 'حاضر').length;
    final double attendanceRate = (presentDays / totalDays) * 100;

    return Scaffold(
      appBar: AppBar(
        title: const Text('ملف الطالب'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Student Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const CircleAvatar(
                      radius: 50,
                      child: Icon(Icons.person, size: 50),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      student['name']?.toString() ?? 'غير محدد',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'رقم الطالب: ${student['id']?.toString() ?? 'غير محدد'}',
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          children: [
                            const Text('تاريخ الميلاد'),
                            Text(
                              student['dateOfBirth']?.toString() ?? 'غير محدد',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          children: [
                            const Text('الجنس'),
                            Text(
                              student['gender']?.toString() ?? 'غير محدد',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Attendance Statistics Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'إحصائيات الحضور',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatCard(
                          'نسبة الحضور',
                          '${attendanceRate.toStringAsFixed(1)}%',
                          Colors.blue,
                        ),
                        _buildStatCard(
                          'أيام الحضور',
                          '$presentDays',
                          Colors.green,
                        ),
                        _buildStatCard(
                          'أيام الغياب',
                          '${totalDays - presentDays}',
                          Colors.red,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Attendance History
            const Text(
              'سجل الحضور',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: attendanceHistory.length,
              itemBuilder: (context, index) {
                final record = attendanceHistory[index];
                final bool isPresent = record['status'] == 'حاضر';

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: ListTile(
                    leading: Icon(
                      isPresent ? Icons.check_circle : Icons.cancel,
                      color: isPresent ? Colors.green : Colors.red,
                    ),
                    title: Text(record['date']?.toString() ?? ''),
                    subtitle: Text(record['subject']?.toString() ?? ''),
                    trailing: record['notes']?.toString().isNotEmpty == true
                        ? Tooltip(
                            message: record['notes'],
                            child: const Icon(Icons.note),
                          )
                        : null,
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
