/**
 * dijkstra.js
 * Implementación manual del algoritmo de Dijkstra para grafos dirigidos
 * ponderados y acíclicos (DAGs). Genera un historial de pasos pedagógicos
 * para su visualización interactiva.
 *
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

import { reconstructPath, getPathEdges } from './paths.js';

/**
 * Ejecuta Dijkstra y devuelve la lista ordenada de pasos.
 * Cada paso guarda una copia del estado (distancias, predecesores, visitados)
 * para poder mostrarlo sin recalcular.
 *
 * @param {object} graph - Instancia de Graph (getNodes, getOutgoingEdges)
 * @param {string} origin
 * @param {string} destination
 * @returns {Array<object>}
 */
export function runDijkstra(graph, origin, destination) {
  const nodes = graph.getNodes();
  const steps = [];

  const distances = {};
  const predecessors = {};
  const visited = [];

  for (const node of nodes) {
    distances[node] = Infinity;
    predecessors[node] = null;
  }
  distances[origin] = 0;

  /** Registra un paso con una copia del estado actual. */
  function pushStep(data) {
    steps.push({
      stepIndex: steps.length,
      currentNode: null,
      distances: { ...distances },
      predecessors: { ...predecessors },
      visited: [...visited],
      highlight: { targetNode: null, evaluatingEdge: null, improvedEdge: null, pathEdges: [] },
      isFinal: false,
      finalData: null,
      ...data
    });
  }

  // Paso 0: inicialización
  pushStep({
    currentNode: origin,
    title: 'Fase inicial: inicialización de etiquetas',
    explanation: `Se fija dist(${origin}) = 0 para el origen y dist(v) = ∞ para los demás vértices. El conjunto de visitados está vacío.`,
    mathOperation: `dist(${origin}) = 0 | dist(v) = ∞ para todo v ≠ ${origin}`
  });

  const unvisited = new Set(nodes);
  let iteration = 1;

  while (unvisited.size > 0) {
    // Selección del vértice no visitado con menor distancia tentativa
    let current = null;
    let minDistance = Infinity;
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    // Los vértices restantes no son alcanzables desde el origen
    if (current === null) break;

    pushStep({
      currentNode: current,
      title: `Iteración ${iteration}: selección del vértice ${current}`,
      explanation: `Se selecciona ${current} por ser el vértice no visitado con menor distancia tentativa: dist(${current}) = ${distances[current]}. Se examinarán sus aristas salientes.`,
      mathOperation: `u* = argmin { dist(u) | u ∈ NoVisitados } = ${current} (dist = ${distances[current]})`
    });

    // Relajación de las aristas salientes
    for (const edge of graph.getOutgoingEdges(current)) {
      const neighbor = edge.to;
      const currentDist = distances[current];
      const newDist = currentDist + edge.weight;
      const previousDist = distances[neighbor];
      const prevStr = previousDist === Infinity ? '∞' : String(previousDist);

      if (newDist < previousDist) {
        distances[neighbor] = newDist;
        predecessors[neighbor] = current;

        pushStep({
          currentNode: current,
          title: `Relajación de arista: ${current} → ${neighbor}`,
          explanation: `Se evalúa ${current} → ${neighbor} (peso ${edge.weight}). Nueva distancia: ${currentDist} + ${edge.weight} = ${newDist}. Como ${newDist} < ${prevStr}, se actualiza dist(${neighbor}) = ${newDist} y su predecesor pasa a ser ${current}.`,
          mathOperation: `${currentDist} + ${edge.weight} = ${newDist} < dist(${neighbor}) [${prevStr}] ⇒ dist(${neighbor}) = ${newDist}, pred(${neighbor}) = ${current}`,
          highlight: { targetNode: neighbor, evaluatingEdge: edge.id, improvedEdge: edge.id, pathEdges: [] }
        });
      } else {
        pushStep({
          currentNode: current,
          title: `Arista descartada: ${current} → ${neighbor}`,
          explanation: `Se evalúa ${current} → ${neighbor} (peso ${edge.weight}). Distancia calculada: ${currentDist} + ${edge.weight} = ${newDist}. Como ${newDist} no es menor que ${previousDist}, no mejora el camino conocido y se mantiene dist(${neighbor}) = ${previousDist}.`,
          mathOperation: `${currentDist} + ${edge.weight} = ${newDist} ≥ dist(${neighbor}) [${previousDist}] ⇒ sin cambios`,
          highlight: { targetNode: neighbor, evaluatingEdge: edge.id, improvedEdge: null, pathEdges: [] }
        });
      }
    }

    // Marcar como visitado
    unvisited.delete(current);
    visited.push(current);

    pushStep({
      currentNode: current,
      title: `Vértice ${current} marcado como visitado`,
      explanation: `Se evaluaron todas las aristas salientes de ${current}. Su distancia mínima (${distances[current]}) ya es definitiva.`,
      mathOperation: `Visitados = {${visited.join(', ')}}`
    });

    iteration++;
  }

  // Paso final: reconstrucción del camino mínimo
  const reachable = distances[destination] !== Infinity;
  const path = reachable ? reconstructPath(predecessors, origin, destination, distances) : [];

  pushStep({
    title: 'Resultado final: camino mínimo',
    explanation: reachable
      ? `Algoritmo completado. La distancia mínima de ${origin} a ${destination} es ${distances[destination]}, siguiendo los predecesores desde ${destination} hasta ${origin}.`
      : `Algoritmo finalizado. No existe una ruta dirigida de ${origin} a ${destination} (distancia = ∞).`,
    mathOperation: reachable
      ? `dist(${origin} → ${destination}) = ${distances[destination]}`
      : `dist(${origin} → ${destination}) = ∞`,
    highlight: { targetNode: null, evaluatingEdge: null, improvedEdge: null, pathEdges: getPathEdges(path) },
    isFinal: true,
    finalData: { reachable, distance: distances[destination], path, origin, destination }
  });

  return steps;
}
