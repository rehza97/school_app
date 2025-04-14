class Parent {
  final String parentId;
  final String name;
  final String email;
  final String phone;
  final String studentId;

  Parent({
    required this.parentId,
    required this.name,
    required this.email,
    required this.phone,
    required this.studentId,
  });

  factory Parent.fromJson(Map<String, dynamic> json) {
    return Parent(
      parentId: json['parentId'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      studentId: json['studentId'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'parentId': parentId,
      'name': name,
      'email': email,
      'phone': phone,
      'studentId': studentId,
    };
  }
}
