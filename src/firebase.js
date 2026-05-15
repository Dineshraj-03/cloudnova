import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDG7xfCXzMp69rgjaq9HNUfB0D30k-FhZw",
  authDomain: "cloudnova-3e3f9.firebaseapp.com",
  projectId: "cloudnova-3e3f9",
  storageBucket: "cloudnova-3e3f9.firebasestorage.app",
  messagingSenderId: "270695597011",
  appId: "1:270695597011:web:8248d39ab593be35c36526",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)