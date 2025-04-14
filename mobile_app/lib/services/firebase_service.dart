import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/teacher.dart';
import '../models/student.dart';
import '../models/class.dart';
import '../models/course.dart';
import '../models/session.dart';
import '../models/attendance.dart';
import '../models/parent.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  late FirebaseAuth _auth;
  late FirebaseFirestore _firestore;
  late FirebaseStorage _storage;

  Future<void> initialize() async {
    await Firebase.initializeApp();
    _auth = FirebaseAuth.instance;
    _firestore = FirebaseFirestore.instance;
    _storage = FirebaseStorage.instance;
  }

  // Auth methods
  Future<UserCredential> signInWithCode(String code) async {
    // TODO: Implement custom token authentication
    throw UnimplementedError();
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  // Firestore methods
  Future<List<Map<String, dynamic>>> getStudents() async {
    final snapshot = await _firestore.collection('students').get();
    return snapshot.docs.map((doc) => doc.data()).toList();
  }

  Future<void> createStudent(Map<String, dynamic> studentData) async {
    await _firestore.collection('students').add(studentData);
  }

  Future<List<Map<String, dynamic>>> getTeachers() async {
    final snapshot = await _firestore.collection('teachers').get();
    return snapshot.docs.map((doc) => doc.data()).toList();
  }

  Future<void> createTeacher(Map<String, dynamic> teacherData) async {
    await _firestore.collection('teachers').add(teacherData);
  }

  Future<List<Map<String, dynamic>>> getSections() async {
    final snapshot = await _firestore.collection('sections').get();
    return snapshot.docs.map((doc) => doc.data()).toList();
  }

  Future<void> createSection(Map<String, dynamic> sectionData) async {
    await _firestore.collection('sections').add(sectionData);
  }

  // Storage methods
  Future<String> uploadFile(String path, dynamic file) async {
    final ref = _storage.ref().child(path);
    await ref.putFile(file);
    return await ref.getDownloadURL();
  }

  // Teacher operations
  Future<Teacher?> getTeacherByCode(String code) async {
    try {
      final querySnapshot = await _firestore
          .collection('teachers')
          .where('code', isEqualTo: code)
          .get();

      if (querySnapshot.docs.isEmpty) {
        return null;
      }

      final doc = querySnapshot.docs.first;
      final data = doc.data();
      data['teacherId'] = doc.id; // Add the document ID to the data
      return Teacher.fromJson(data);
    } catch (e) {
      print('Error getting teacher by code: $e');
      return null;
    }
  }

  // Student operations
  Future<List<Student>> getStudentsByClassId(String classId) async {
    try {
      final querySnapshot = await _firestore
          .collection('students')
          .where('classId', isEqualTo: classId)
          .get();

      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['studentId'] = doc.id;
        return Student.fromJson(data);
      }).toList();
    } catch (e) {
      print('Error getting students by class ID: $e');
      return [];
    }
  }

  // Class operations
  Future<SchoolClass?> getClassById(String classId) async {
    try {
      final doc = await _firestore.collection('classes').doc(classId).get();

      if (!doc.exists) {
        return null;
      }

      final data = doc.data()!;
      data['classId'] = doc.id;
      return SchoolClass.fromJson(data);
    } catch (e) {
      print('Error getting class by ID: $e');
      return null;
    }
  }

  // Course operations
  Future<List<Course>> getCoursesByTeacherId(String teacherId) async {
    try {
      final querySnapshot = await _firestore
          .collection('courses')
          .where('teacherId', isEqualTo: teacherId)
          .get();

      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['courseId'] = doc.id;
        return Course.fromJson(data);
      }).toList();
    } catch (e) {
      print('Error getting courses by teacher ID: $e');
      return [];
    }
  }

  // Session operations
  Future<List<Session>> getSessionsByCourseId(String courseId) async {
    try {
      final querySnapshot = await _firestore
          .collection('courses')
          .doc(courseId)
          .collection('sessions')
          .orderBy('date', descending: true)
          .get();

      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['sessionId'] = doc.id;
        return Session.fromJson(data);
      }).toList();
    } catch (e) {
      print('Error getting sessions by course ID: $e');
      return [];
    }
  }

  // Attendance operations
  Future<List<Attendance>> getAttendanceBySessionId(
      String courseId, String sessionId) async {
    try {
      final querySnapshot = await _firestore
          .collection('courses')
          .doc(courseId)
          .collection('sessions')
          .doc(sessionId)
          .collection('attendance')
          .get();

      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['studentId'] = doc.id;
        return Attendance.fromJson(data);
      }).toList();
    } catch (e) {
      print('Error getting attendance by session ID: $e');
      return [];
    }
  }

  // Update attendance for a student in a session
  Future<bool> updateAttendance(String courseId, String sessionId,
      String studentId, Attendance attendance) async {
    try {
      await _firestore
          .collection('courses')
          .doc(courseId)
          .collection('sessions')
          .doc(sessionId)
          .collection('attendance')
          .doc(studentId)
          .set(attendance.toJson());

      return true;
    } catch (e) {
      print('Error updating attendance: $e');
      return false;
    }
  }

  // Batch update attendance for multiple students
  Future<bool> batchUpdateAttendance(
      String courseId, String sessionId, List<Attendance> attendances) async {
    try {
      final batch = _firestore.batch();

      for (var attendance in attendances) {
        final docRef = _firestore
            .collection('courses')
            .doc(courseId)
            .collection('sessions')
            .doc(sessionId)
            .collection('attendance')
            .doc(attendance.studentId);

        batch.set(docRef, attendance.toJson());
      }

      await batch.commit();
      return true;
    } catch (e) {
      print('Error batch updating attendance: $e');
      return false;
    }
  }

  // Create a new session
  Future<String?> createSession(String courseId, Session session) async {
    try {
      final docRef = await _firestore
          .collection('courses')
          .doc(courseId)
          .collection('sessions')
          .add(session.toJson());

      return docRef.id;
    } catch (e) {
      print('Error creating session: $e');
      return null;
    }
  }
}
