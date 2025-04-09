class Teacher {
  final String id;
  final String name;
  final String subject;
  final String accessCode;

  Teacher({
    required this.id,
    required this.name,
    required this.subject,
    required this.accessCode,
  });

  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(
      id: json['id'],
      name: json['name'],
      subject: json['subject'],
      accessCode: json['accessCode'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'subject': subject,
      'accessCode': accessCode,
    };
  }
}
