/**
 * caminos.js
 * Reconstrucción del camino mínimo a partir del mapa de predecesores.
 * Recorre en retroceso (destino -> origen) y luego invierte la secuencia.
 *
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

/**
 * Reconstruye el camino mínimo desde el origen hasta el destino.
 * @param {Record<string, string|null>} predecesores - Predecesor único de cada nodo
 * @param {string} origen - Vértice origen
 * @param {string} destino - Vértice destino
 * @returns {string[]} Secuencia de nodos del camino
 */
export function reconstruirCamino(predecesores, origen, destino) {
  const camino = [];
  let actual = destino;
  while (actual !== null && actual !== undefined) {
    camino.push(actual);
    if (actual === origen) break;
    actual = predecesores[actual];
  }
  return camino.reverse();
}

/**
 * Obtiene los identificadores de aristas ('u-v') que forman el camino.
 * @param {string[]} camino
 * @returns {string[]}
 */
export function obtenerAristasDelCamino(camino) {
  const aristas = [];
  for (let i = 0; i < camino.length - 1; i++) {
    aristas.push(`${camino[i]}-${camino[i + 1]}`);
  }
  return aristas;
}
