import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../models/student.dart';

class NotificationService {
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(initSettings);
  }

  Future<void> sendAbsentNotification({
    required Student student,
    required String className,
    required String date,
  }) async {
    if (student.parentEmail == null) return;

    const androidDetails = AndroidNotificationDetails(
      'attendance_channel',
      'Attendance Notifications',
      channelDescription: 'Notifications for student attendance',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      student.id.hashCode,
      'Absence Notification',
      '${student.name} was marked ${student.status.name} in $className on $date',
      details,
    );
  }

  Future<void> sendAdminNotification({
    required String className,
    required String date,
    required int totalStudents,
    required int presentCount,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'admin_channel',
      'Admin Notifications',
      channelDescription: 'Notifications for administrators',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final attendanceRate =
        (presentCount / totalStudents * 100).toStringAsFixed(1);

    await _notifications.show(
      className.hashCode,
      'Attendance Summary - $className',
      'Attendance rate for $date: $attendanceRate% ($presentCount/$totalStudents students present)',
      details,
    );
  }
}
