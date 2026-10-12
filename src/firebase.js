import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBkW4fVwTQ3fdnE_fxARkNwecXDa_W3Sto",
  authDomain: "expense-tracker-c9dd3.firebaseapp.com",
  projectId: "expense-tracker-c9dd3",
  storageBucket: "expense-tracker-c9dd3.firebasestorage.app",
  messagingSenderId: "1086169031695",
  appId: "1:1086169031695:web:1b4e937f367fb1978ef7a",
  measurementId: "G-MF88P4B00N"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const provider = new GoogleAuthProvider()