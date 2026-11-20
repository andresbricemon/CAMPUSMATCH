import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import { bundledPhotos, campusZones, discoverySections, places, services } from "./data";
import { conDistancia } from "./distance";
import {
  CONTENT_KEYS,
  type CampusContent,
  type ContentKey,
  type DiscoveryItem,
  type SessionUser,
} from "./types";

const LOCAL_KEY = "campusmatch-content";

function sectionItems(id: "activities" | "clubs" | "opportunities"): DiscoveryItem[] {
  return discoverySections.find((section) => section.id === id)?.items ?? [];
}

/** Contenido original incluido en el código (src/data.ts). */
export const defaultContent: CampusContent = {
  places: places.map(conDistancia),
  zones: campusZones,
  services,
  activities: sectionItems("activities"),
  clubs: sectionItems("clubs"),
  opportunities: sectionItems("opportunities"),
};

const ASSET_PREFIX = "asset:";

/** Reemplaza recursivamente las URL de fotos del build por "asset:<nombre>" (o al revés). */
function mapPhotoSrc<T>(items: T, direction: "encode" | "decode"): T {
  const byUrl = new Map(Object.entries(bundledPhotos).map(([name, url]) => [url, name]));
  return JSON.parse(JSON.stringify(items), (key, value) => {
    if (key !== "src" || typeof value !== "string") return value;
    if (direction === "encode") {
      const name = byUrl.get(value);
      return name ? `${ASSET_PREFIX}${name}` : value;
    }
    if (value.startsWith(ASSET_PREFIX)) return bundledPhotos[value.slice(ASSET_PREFIX.length)] ?? "";
    return value;
  });
}

function readLocal(): Partial<Record<ContentKey, unknown[]>> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Carga el contenido del campus. Cada sección guardada por un administrador
 * (Firestore `content/{sección}` o localStorage en modo demo) reemplaza a la original.
 */
export async function loadContent(): Promise<CampusContent> {
  const content: CampusContent = { ...defaultContent };
  const apply = (key: string, items: unknown) => {
    if ((CONTENT_KEYS as string[]).includes(key) && Array.isArray(items)) {
      (content as Record<string, unknown>)[key] = mapPhotoSrc(items, "decode");
    }
  };
  if (firebaseEnabled && db) {
    try {
      const snap = await getDocs(collection(db, "content"));
      snap.forEach((entry) => apply(entry.id, entry.data().items));
    } catch (error) {
      // Si las reglas aún no están publicadas o no hay conexión, se usa el contenido original.
      console.error("No se pudo cargar el contenido editable:", error);
    }
  } else {
    Object.entries(readLocal()).forEach(([key, items]) => apply(key, items));
  }
  // La distancia nunca se toma de lo guardado: siempre se calcula desde la posición.
  content.places = content.places.map(conDistancia);
  return content;
}

/** Recalcula la distancia de los lugares. Úsalo después de editar `places`. */
export function withComputedDistances<K extends ContentKey>(
  key: K,
  items: CampusContent[K],
): CampusContent[K] {
  if (key !== "places") return items;
  return (items as CampusContent["places"]).map(conDistancia) as CampusContent[K];
}

/** Guarda una sección completa del contenido. Solo los administradores tienen permiso. */
export async function saveContentSection<K extends ContentKey>(
  key: K,
  items: CampusContent[K],
  user: SessionUser,
): Promise<void> {
  // La distancia es un dato calculado: no se guarda.
  const stored =
    key === "places"
      ? (items as CampusContent["places"]).map(({ distance: _distance, ...place }) => place)
      : items;
  // JSON elimina los campos `undefined`, que Firestore no acepta.
  const clean = mapPhotoSrc(stored, "encode");
  if (firebaseEnabled && db) {
    await setDoc(doc(db, "content", key), {
      items: clean,
      updatedAt: serverTimestamp(),
      updatedBy: user.email,
    });
    return;
  }
  const local = readLocal();
  local[key] = clean as unknown[];
  localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
}

/** Borra los cambios de una sección y vuelve al contenido original de data.ts. */
export async function resetContentSection(key: ContentKey): Promise<void> {
  if (firebaseEnabled && db) {
    await deleteDoc(doc(db, "content", key));
    return;
  }
  const local = readLocal();
  delete local[key];
  localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
}

/**
 * Un usuario es administrador si existe el documento `admins/{correo}` en Firestore
 * (se crea a mano desde la consola). En modo demo el usuario de prueba es administrador.
 */
export async function checkIsAdmin(user: SessionUser): Promise<boolean> {
  if (!firebaseEnabled || !db) return true;
  try {
    const snap = await getDoc(doc(db, "admins", user.email.toLowerCase()));
    return snap.exists();
  } catch {
    return false;
  }
}
