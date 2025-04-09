import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/storage_service.dart';
import '../services/notification_service.dart';
import 'student_profile_page.dart';

class AttendancePage extends StatefulWidget {
  final String className;
  final String subject;
  final String classId;

  const AttendancePage({
    super.key,
    required this.className,
    required this.subject,
    required this.classId,
  });

  @override
  State<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends State<AttendancePage> {
  final TextEditingController _searchController = TextEditingController();
  bool _showAbsentOnly = false;

  // Sample student data - replace with actual data later
  final List<Map<String, dynamic>> students = [
    {
      'id': '001',
      'name': 'أحمد علي',
      'isPresent': true,
    },
    {
      'id': '002',
      'name': 'سارة محمد',
      'isPresent': false,
    },
    {
      'id': '003',
      'name': 'عمر حسن',
      'isPresent': true,
    },
    {
      'id': '004',
      'name': 'فاطمة إبراهيم',
      'isPresent': true,
    },
    {
      'id': '005',
      'name': 'يوسف أحمد',
      'isPresent': false,
    },
  ];

  List<Map<String, dynamic>> get filteredStudents {
    return students.where((student) {
      if (_showAbsentOnly && student['isPresent']) {
        return false;
      }

      final searchQuery = _searchController.text.toLowerCase();
      if (searchQuery.isEmpty) {
        return true;
      }

      return student['name'].toString().toLowerCase().contains(searchQuery) ||
          student['id'].toString().toLowerCase().contains(searchQuery);
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.className),
              Text(
                'الرياضيات - الحضور ${widget.subject}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.more_vert),
              onPressed: () {
                // Add menu options here
              },
            ),
          ],
        ),
        body: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Search bar
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'البحث بالاسم أو الرقم',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor: Colors.grey[50],
                    ),
                    onChanged: (value) {
                      setState(() {});
                    },
                  ),
                  const SizedBox(height: 8),
                  // Absent only switch
                  SwitchListTile(
                    title: const Text('إظهار الغائبين فقط'),
                    value: _showAbsentOnly,
                    onChanged: (bool value) {
                      setState(() {
                        _showAbsentOnly = value;
                      });
                    },
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: filteredStudents.length,
                itemBuilder: (context, index) {
                  final student = filteredStudents[index];
                  return Container(
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Colors.grey[200]!,
                          width: 1,
                        ),
                      ),
                    ),
                    child: ListTile(
                      leading: Switch(
                        value: student['isPresent'],
                        onChanged: (bool value) {
                          setState(() {
                            student['isPresent'] = value;
                          });
                        },
                        activeColor: Colors.green,
                      ),
                      title: Text(
                        student['name'],
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      subtitle: Text('رقم الطالب: ${student['id']}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            student['isPresent']
                                ? Icons.check_circle
                                : Icons.cancel,
                            color: student['isPresent']
                                ? Colors.green
                                : Colors.red,
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.person),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => StudentProfilePage(
                                    student: student,
                                  ),
                                ),
                              );
                            },
                            tooltip: 'عرض ملف الطالب',
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
        bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton(
            onPressed: () {
              // Save attendance logic here
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم تسجيل الحضور بنجاح'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'تسجيل الحضور',
              style: TextStyle(fontSize: 16),
            ),
          ),
        ),
      ),
    );
  }
}
