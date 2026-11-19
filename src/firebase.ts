import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/** Dominio institucional permitido para iniciar sesión. */
export const ALLOWED_DOMAIN = (import.meta.env.VITE_ALLOWED_DOMAIN || "unimilitar.edu.co").toLowerCase();

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Si no hay configuración de Firebase (.env vacío), la app corre en "modo demo":
 * sin login real y guardando el perfil solo en este navegador.
 */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (firebaseEnabled) {
  app = initializeApp(config);
  auth = getAuth(app);
  auth.languageCode = "es";
  db = getFirestore(app);
}

export function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // "hd" sugiere a Google mostrar solo cuentas del dominio institucional.
  // La validación real se hace en el cliente (AuthGate) y en las reglas de Firestore.
  provider.setCustomParameters({ hd: ALLOWED_DOMAIN, prompt: "select_account" });
  return provider;
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`));
}

export { auth, db };
