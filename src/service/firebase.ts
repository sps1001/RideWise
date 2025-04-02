import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCxV8dzbxpRilGLTEJ4OKfdCVgrwgPQCjk",
  authDomain: "ridewise-e2fb6.firebaseapp.com",
  projectId: "ridewise-e2fb6",
  storageBucket: "ridewise-e2fb6.appspot.com",
  messagingSenderId: "47109715495",
  appId: "1:47109715495:android:bf2f72d6e2d94fd6578002",
};

// Initialize Firebase only if not already initialized (prevents duplicate errors)
let app;
if (!global.firebaseApp) {
  app = initializeApp(firebaseConfig);
  global.firebaseApp = app;
} else {
  app = global.firebaseApp;
}

// Export Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
