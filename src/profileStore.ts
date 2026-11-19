import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import type { SessionUser, StudentProfileState } from "./types";

const LOCAL_KEY = (uid: string) => `campusmatch-profile-${uid}`;

/** Lee el perfil del estudiante. Devuelve null si aún no lo ha creado. */
export async function loadProfile(user: SessionUser): Promise<StudentProfileState | null> {
  if (firebaseEnabled && db) {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      career: data.career ?? "",
      faculty: data.faculty ?? "",
      semester: data.semester ?? "",
      selectedInterests: Array.isArray(data.selectedInterests) ? data.selectedInterests : [],
      selectedGoals: Array.isArray(data.selectedGoals) ? data.selectedGoals : [],
    };
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY(user.uid));
    return raw ? (JSON.parse(raw) as StudentProfileState) : null;
  } catch {
    return null;
  }
}

/** Guarda (crea o actualiza) el perfil del estudiante. */
export async function saveProfile(user: SessionUser, profile: StudentProfileState): Promise<void> {
  if (firebaseEnabled && db) {
    await setDoc(
      doc(db, "users", user.uid),
      {
        ...profile,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }
  try {
    localStorage.setItem(LOCAL_KEY(user.uid), JSON.stringify(profile));
  } catch {
    /* almacenamiento no disponible: el perfil vive solo en memoria */
  }
}
