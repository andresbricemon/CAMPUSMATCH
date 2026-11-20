export type StudentProfileState = {
  career: string;
  faculty: string;
  semester: string;
  selectedInterests: string[];
  selectedGoals: string[];
};

/** Datos básicos del usuario autenticado que la interfaz necesita mostrar. */
export type SessionUser = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
};

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/* ---------- Contenido editable del campus ---------- */

export type Category = "Estudio" | "Deporte" | "Salud" | "Alimentación" | "Eventos";
export type Noise = "Silencioso" | "Moderado" | "Activo";

export type Photo = { src: string; alt: string; credit: string };

/** Marcador del mapa tal como se escribe en data.ts y se guarda en Firestore (sin distancia). */
export type PlaceData = Omit<Place, "distance">;

/** Marcador del mapa (lugar puntual). */
export type Place = {
  id: string;
  name: string;
  category: Category;
  /** Posición en el mapa, en % del ancho/alto de la imagen. */
  x: number;
  y: number;
  /** Metros desde la entrada Cra. 11. Siempre calculada con distanciaDesdeEntrada (src/distance.ts). */
  distance: number;
  noise: Noise;
  schedule: string;
  openNow: boolean;
  capacity: number;
  compatibility: number;
  description: string;
  images: string[];
  tags?: string[];
  photo?: Photo;
  instagram?: string[];
};

/** Zona dibujada sobre el mapa (edificio o área). La geometría no se edita desde la app. */
export type CampusZone = {
  id: string;
  name: string;
  category: Category;
  info?: string;
  icon?: string;
  tags?: string[];
  photo?: Photo;
  instagram?: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  shape: string;
};

export type Service = {
  title: string;
  description: string;
  faculty: string;
  type: string;
  available: boolean;
  tags: string[];
  url?: string;
};

/** Elemento de Actividades, Clubes u Oportunidades. */
export type DiscoveryItem = {
  title: string;
  meta: string;
  tags: string[];
  url?: string;
};

export type CampusContent = {
  places: Place[];
  zones: CampusZone[];
  services: Service[];
  activities: DiscoveryItem[];
  clubs: DiscoveryItem[];
  opportunities: DiscoveryItem[];
};

export type ContentKey = keyof CampusContent;

export const CONTENT_KEYS: ContentKey[] = [
  "places",
  "zones",
  "services",
  "activities",
  "clubs",
  "opportunities",
];
