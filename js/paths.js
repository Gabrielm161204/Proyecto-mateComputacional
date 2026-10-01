/**
 * paths.js
 * Reconstrucción del camino mínimo a partir del mapa de predecesores.
 * Recorre en retroceso (destino -> origen) y luego invierte la secuencia.
 *
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

/**
 * Reconstruye el camino mínimo desde el origen hasta el destino.
 * @param {Record<string, string|null>} predecessors - Predecesor único de cada nodo
 * @param {string} origin
 * @param {string} destination
 * @param {Record<string, number>} distances - Distancias finales
 * @returns {string[]} Secuencia de nodos, o [] si el destino es inalcanzable
 */
export function reconstructPath(predecessors, origin, destination, distances) {
  if (distances[destination] === Infinity || distances[destination] === undefined) {
    return [];
  }

  const path = [];
  let current = destination;
  while (current !== null && current !== undefined) {
    path.push(current);
    if (current === origin) break;
    current = predecessors[current];
  }

  return path.reverse();
}

/**
 * Obtiene los identificadores de aristas ('u-v') que forman el camino.
 * @param {string[]} path
 * @returns {string[]}
 */
export function getPathEdges(path) {
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) {
    edges.push(`${path[i]}-${path[i + 1]}`);
  }
  return edges;
}
