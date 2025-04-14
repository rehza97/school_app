class Session {
  final String sessionId;
  final String date;
  final String startTime;
  final String endTime;
  final String room;

  Session({
    required this.sessionId,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.room,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      sessionId: json['sessionId'] ?? '',
      date: json['date'] ?? '',
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      room: json['room'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sessionId': sessionId,
      'date': date,
      'startTime': startTime,
      'endTime': endTime,
      'room': room,
    };
  }
}
