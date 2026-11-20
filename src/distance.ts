/**
 * Distancia aproximada a pie desde la entrada de la Carrera 11.
 * Las coordenadas de los lugares están en % sobre src/assets/campus-map.png (959 × 540 px).
 */

/** Entrada de la Carrera 11, en % del ancho y alto del mapa. */
export const ENTRADA_CRA_11 = { x: 21.6, y: 34 };

/** Metros por píxel del mapa (calibrado con las canchas de baloncesto, 28 m). */
export const METROS_POR_PX = 0.21;

/** La ruta a pie no es una línea recta. */
export const FACTOR_CAMINO = 1.3;

const PX_POR_PORCENTAJE_X = 9.59; // 959 px / 100
const PX_POR_PORCENTAJE_Y = 5.4; // 540 px / 100

/** Metros aproximados a pie desde la entrada Cra. 11, redondeados a múltiplos de 10. */
export function distanciaDesdeEntrada(p: { x: number; y: number }): number {
  const dx = (p.x - ENTRADA_CRA_11.x) * PX_POR_PORCENTAJE_X;
  const dy = (p.y - ENTRADA_CRA_11.y) * PX_POR_PORCENTAJE_Y;
  const metros = Math.hypot(dx, dy) * METROS_POR_PX * FACTOR_CAMINO;
  return Math.round(metros / 10) * 10;
}

/** Devuelve el lugar con `distance` calculada a partir de su posición (ignora cualquier valor previo). */
export function conDistancia<T extends { x: number; y: number }>(
  place: T,
): Omit<T, "distance"> & { distance: number } {
  return { ...place, distance: distanciaDesdeEntrada(place) };
}

/** Texto que se muestra en la interfaz. */
export function textoDistancia(metros: number): string {
  return `a ~${metros} m de la entrada Cra. 11`;
}
