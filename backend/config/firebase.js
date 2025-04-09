const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin
const initializeFirebase = () => {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin initialized successfully");
    return admin;
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw error;
  }
};

// Export Firebase services
const getFirebaseServices = () => {
  return {
    auth: admin.auth(),
    firestore: admin.firestore(),
    storage: admin.storage(),
  };
};

module.exports = {
  initializeFirebase,
  getFirebaseServices,
};
