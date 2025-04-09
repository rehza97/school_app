import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

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
}
