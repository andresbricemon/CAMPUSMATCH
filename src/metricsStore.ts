import {
  addDoc,
  collection,
  getCountFromServer,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import type { NeedId } from "./data";
import type { SessionUser } from "./types";

const LOCAL_MATCHES = "campusmatch-matches";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Documento de la colección "matches". En modo demo `createdAt` se guarda en milisegundos. */
type MatchRecord = { uid: string; need: NeedId; placeId: string; createdAt: number };

export type Metrics = {
  /** null si no se pudo contar (p. ej. reglas aún no desplegadas). */
  users: number | null;
  totalMatches: number;
  matchesLast7Days: number;
  topPlaces: { placeId: string; count: number }[];
  topNeeds: { need: string; count: number }[];
};

function readLocalMatches(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_MATCHES);
    return raw ? (JSON.parse(raw) as MatchRecord[]) : [];
  } catch {
    return [];
  }
}

/**
 * Registra que un estudiante obtuvo un resultado en Match.
 * Nunca lanza errores: si falla, la experiencia del estudiante sigue igual.
 */
export async function logMatch(user: SessionUser, need: NeedId, placeId: string): Promise<void> {
  try {
    if (firebaseEnabled && db) {
      await addDoc(collection(db, "matches"), {
        uid: user.uid,
        need,
        placeId,
        createdAt: serverTimestamp(),
      });
      return;
    }
    const matches = readLocalMatches();
    matches.push({ uid: user.uid, need, placeId, createdAt: Date.now() });
    localStorage.setItem(LOCAL_MATCHES, JSON.stringify(matches));
  } catch (error) {
    console.warn("No se pudo registrar el match:", error);
  }
}

function ranking<T extends string>(values: T[], limit: number): { key: T; count: number }[] {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Calcula las métricas del panel de administración. Solo los admins pueden leer estos datos. */
export async function loadMetrics(): Promise<Metrics> {
  let users: number | null = null;
  let matches: MatchRecord[];

  if (firebaseEnabled && db) {
    try {
      users = (await getCountFromServer(collection(db, "users"))).data().count;
    } catch (error) {
      console.warn("No se pudo contar los usuarios:", error);
    }
    // MVP: se leen todos los matches y se agrupan en el navegador.
    const snap = await getDocs(collection(db, "matches"));
    matches = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: data.uid,
        need: data.need,
        placeId: data.placeId,
        // Recién creado puede venir sin hora del servidor todavía.
        createdAt: (data.createdAt as Timestamp | null)?.toMillis() ?? Date.now(),
      };
    });
  } else {
    users = Object.keys(localStorage).filter((key) => key.startsWith("campusmatch-profile-")).length;
    matches = readLocalMatches();
  }

  const since = Date.now() - 7 * DAY_MS;
  return {
    users,
    totalMatches: matches.length,
    matchesLast7Days: matches.filter((match) => match.createdAt >= since).length,
    topPlaces: ranking(
      matches.map((match) => match.placeId),
      5,
    ).map(({ key, count }) => ({ placeId: key, count })),
    topNeeds: ranking(
      matches.map((match) => match.need as string),
      6,
    ).map(({ key, count }) => ({ need: key, count })),
  };
}
