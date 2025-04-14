import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/storage_service.dart';
import 'services/notification_service.dart';
import 'services/auth_service.dart';
import 'services/firebase_service.dart';
import 'pages/auth_page.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  final prefs = await SharedPreferences.getInstance();
  final storageService = StorageService(prefs);
  final authService = AuthService(prefs);
  final notificationService = NotificationService();
  final firebaseService = FirebaseService();

  await notificationService.initialize();

  runApp(
    MultiProvider(
      providers: [
        Provider<StorageService>(create: (_) => storageService),
        Provider<AuthService>(create: (_) => authService),
        Provider<NotificationService>(create: (_) => notificationService),
        Provider<FirebaseService>(create: (_) => firebaseService),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'نظام حضور المدرسة',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          primary: Colors.blue,
        ),
        fontFamily: 'Cairo', // Arabic-friendly font
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      themeMode: ThemeMode.system,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('ar', ''), // Arabic
      ],
      locale: const Locale('ar', ''),
      home: const AuthPage(),
    );
  }
}
