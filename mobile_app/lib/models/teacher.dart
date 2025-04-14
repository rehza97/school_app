class Teacher {
  final String teacherId;
  final String firstName;
  final String lastName;
  final String email;
  final String phoneNumber;
  final String? profileImageUrl;

  Teacher({
    required this.teacherId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phoneNumber,
    this.profileImageUrl,
  });

  factory Teacher.fromMap(Map<String, dynamic> map) {
    return Teacher(
      teacherId: map['teacherId'] ?? '',
      firstName: map['firstName'] ?? '',
      lastName: map['lastName'] ?? '',
      email: map['email'] ?? '',
      phoneNumber: map['phoneNumber'] ?? '',
      profileImageUrl: map['profileImageUrl'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'teacherId': teacherId,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phoneNumber': phoneNumber,
      'profileImageUrl': profileImageUrl,
    };
  }

  String get fullName => '$firstName $lastName';
}
