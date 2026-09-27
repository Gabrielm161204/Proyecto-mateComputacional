/**
 * paths.js
 * Módulo para la reconstrucción, conteo y formateo de todos los caminos mínimos.
 * Recorre en retroceso (backtracking) el mapa de predecesores múltiples
 * para hallar todas las rutas óptimas alternativas entre origen y destino.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 * Asignatura: Matemática Computacional
 */

/**
 * Reconstruye todos los caminos mínimos desde el vértice destino hacia el origen
 * utilizando el mapa de múltiples predecesores óptimos.
 * 
 * @param {Record<string, string[]>} predecessors - Mapa de predecesores para cada nodo
 * @param {string} origin - Nodo de inicio
 * @param {string} destination - Nodo de llegada
 * @param {Record<string, number>} distances - Mapa de distancias finales
 * @returns {string[][]} Array de secuencias de nodos, cada una representando un camino óptimo
 */
export function findAllShortestPaths(predecessors, origin, destination, distances) {
  // Si el destino es inalcanzable o no tiene distancia finita
  if (!distances || distances[destination] === Infinity || distances[destination] === undefined) {
    return [];
  }

  // Caso especial: origen y destino son el mismo
  if (origin === destination) {
    return [[origin]];
  }

  // Si el destino no tiene predecesores registrados
  if (!predecessors[destination] || predecessors[destination].length === 0) {
    return [];
  }

  const allPaths = [];
  const visitedOnBranch = new Set();

  /**
   * Función recursiva de backtracking para explorar todas las ramas de predecesores
   * @param {string} current - Nodo actual que se está evaluando hacia atrás
   * @param {string[]} accumulatedPath - Secuencia de nodos acumulada (desde destino)
   */
  function backtrack(current, accumulatedPath) {
    if (current === origin) {
      allPaths.push([origin, ...accumulatedPath]);
      return;
    }

    const parents = predecessors[current] || [];
    for (const parent of parents) {
      // Prevención de ciclos en el backtracking
      const branchKey = `${parent}->${current}`;
      if (!visitedOnBranch.has(branchKey)) {
        visitedOnBranch.add(branchKey);
        backtrack(parent, [current, ...accumulatedPath]);
        visitedOnBranch.delete(branchKey);
      }
    }
  }

  backtrack(destination, []);

  // Eliminar posibles caminos duplicados y ordenar alfabéticamente para presentación consistente
  const uniqueMap = new Map();
  for (const path of allPaths) {
    const key = path.join('→');
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, path);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Extrae todos los identificadores de aristas ('u-v') que forman parte
 * de al menos un camino mínimo final.
 * @param {string[][]} paths - Lista de caminos mínimos
 * @returns {Set<string>} Conjunto de IDs de aristas ('A-B', 'B-D', etc.)
 */
export function getShortestPathEdges(paths) {
  const edgeSet = new Set();
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      edgeSet.add(`${from}-${to}`);
    }
  }
  return edgeSet;
}

/**
 * Formatea una secuencia de nodos como una cadena legible con flechas.
 * Ejemplo: ['A', 'C', 'D', 'H'] -> "A → C → D → H"
 * @param {string[]} path 
 * @returns {string}
 */
export function formatPathSequence(path) {
  return path.join(' → ');
}

/**
 * Calcula el costo total de un camino sumando los pesos de sus aristas
 * utilizando la matriz de pesos del grafo para doble verificación académica.
 * @param {string[]} path 
 * @param {Array<{ from: string, to: string, weight: number }>} edges 
 * @returns {number}
 */
export function calculatePathCost(path, edges) {
  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edge = edges.find(e => e.from === from && e.to === to);
    if (edge) {
      totalCost += edge.weight;
    }
  }
  return totalCost;
}
