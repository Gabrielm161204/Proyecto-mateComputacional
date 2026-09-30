/**
 * dijkstra.js
 * Implementación manual completa del Algoritmo de Dijkstra para grafos dirigidos
 * ponderados y acíclicos (DAGs) con soporte para múltiples caminos mínimos.
 * 
 * Genera un historial exhaustivo de pasos pedagógicos para su visualización
 * interactiva en la interfaz de usuario.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

import { findAllShortestPaths, getShortestPathEdges } from './paths.js';

/**
 * Función auxiliar para clonar profundamente el objeto de predecesores.
 * @param {Record<string, string[]>} preds 
 * @returns {Record<string, string[]>}
 */
function clonePredecessors(preds) {
  const copy = {};
  for (const [k, v] of Object.entries(preds)) {
    copy[k] = [...v];
  }
  return copy;
}

/**
 * Ejecuta el algoritmo de Dijkstra y genera el historial completo de pasos pedagógicos.
 * 
 * @param {object} graph - Instancia de Graph con getNodes(), getEdges(), getOutgoingEdges()
 * @param {string} origin - Vértice de origen
 * @param {string} destination - Vértice de destino
 * @returns {Array<object>} Lista ordenada de pasos de ejecución
 */
export function runDijkstra(graph, origin, destination) {
  const nodes = graph.getNodes();
  const steps = [];

  // 1. Estructuras de datos iniciales
  const distances = {};
  const predecessors = {};
  const visited = [];

  for (const node of nodes) {
    distances[node] = Infinity;
    predecessors[node] = [];
  }
  distances[origin] = 0;

  // Paso 0: Inicialización
  steps.push({
    stepIndex: 0,
    iteration: 0,
    phase: 'INIT',
    currentNode: origin,
    currentEdge: null,
    edgeEvaluationType: null,
    distances: { ...distances },
    predecessors: clonePredecessors(predecessors),
    visited: [...visited],
    unvisited: [...nodes],
    title: 'Fase Inicial: Inicialización de etiquetas',
    explanation: `Se inicia el algoritmo de Dijkstra. La distancia tentativa al vértice origen (${origin}) se establece en 0, y para todos los demás vértices se fija en ∞ (infinito). El conjunto de visitados está vacío.`,
    mathOperation: `dist(${origin}) = 0 | dist(v) = ∞ para todo v ≠ ${origin}`,
    highlight: {
      currentNode: origin,
      targetNode: null,
      evaluatingEdge: null,
      improvedEdge: null,
      tiedEdge: null,
      pathEdges: []
    },
    isFinal: false,
    finalData: null
  });

  let iterationCounter = 1;

  // Conjunto de no visitados
  const unvisitedSet = new Set(nodes);

  while (unvisitedSet.size > 0) {
    // 2. Selección del vértice no visitado con menor distancia tentativa
    let minNode = null;
    let minDistance = Infinity;

    for (const node of unvisitedSet) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        minNode = node;
      }
    }

    // Si la menor distancia encontrada es Infinity, los nodos restantes son inalcanzables desde el origen
    if (minNode === null || minDistance === Infinity) {
      // Registrar paso indicando que los nodos restantes son inalcanzables
      steps.push({
        stepIndex: steps.length,
        iteration: iterationCounter,
        phase: 'UNREACHABLE_BREAK',
        currentNode: null,
        currentEdge: null,
        edgeEvaluationType: null,
        distances: { ...distances },
        predecessors: clonePredecessors(predecessors),
        visited: [...visited],
        unvisited: Array.from(unvisitedSet),
        title: 'Vértices restantes inalcanzables',
        explanation: `Todos los vértices no visitados restantes {${Array.from(unvisitedSet).join(', ')}} tienen distancia tentativa ∞. No existen aristas dirigidas hacia ellos desde los vértices explorados.`,
        mathOperation: 'min { dist(v) | v ∈ NoVisitados } = ∞',
        highlight: {
          currentNode: null,
          targetNode: null,
          evaluatingEdge: null,
          improvedEdge: null,
          tiedEdge: null,
          pathEdges: []
        },
        isFinal: false,
        finalData: null
      });
      break;
    }

    const current = minNode;

    // Paso: Selección de vértice actual
    steps.push({
      stepIndex: steps.length,
      iteration: iterationCounter,
      phase: 'SELECT_NODE',
      currentNode: current,
      currentEdge: null,
      edgeEvaluationType: null,
      distances: { ...distances },
      predecessors: clonePredecessors(predecessors),
      visited: [...visited],
      unvisited: Array.from(unvisitedSet),
      title: `Iteración ${iterationCounter}: Selección del vértice ${current}`,
      explanation: `Se selecciona el vértice ${current} por ser el vértice no visitado con menor distancia tentativa acumulada: dist(${current}) = ${distances[current]}. A continuación se examinarán sus aristas salientes.`,
      mathOperation: `u* = argmin { dist(u) | u ∈ NoVisitados } = ${current} (dist = ${distances[current]})`,
      highlight: {
        currentNode: current,
        targetNode: null,
        evaluatingEdge: null,
        improvedEdge: null,
        tiedEdge: null,
        pathEdges: []
      },
      isFinal: false,
      finalData: null
    });

    // 3. Revisión y relajación de aristas salientes
    const outgoingEdges = graph.getOutgoingEdges(current);

    if (outgoingEdges.length === 0) {
      steps.push({
        stepIndex: steps.length,
        iteration: iterationCounter,
        phase: 'NO_OUTGOING',
        currentNode: current,
        currentEdge: null,
        edgeEvaluationType: null,
        distances: { ...distances },
        predecessors: clonePredecessors(predecessors),
        visited: [...visited],
        unvisited: Array.from(unvisitedSet),
        title: `Vértice ${current}: Sin aristas salientes`,
        explanation: `El vértice ${current} no posee aristas dirigidas salientes. Su distancia queda consolidada.`,
        mathOperation: `gradoSalida(${current}) = 0`,
        highlight: {
          currentNode: current,
          targetNode: null,
          evaluatingEdge: null,
          improvedEdge: null,
          tiedEdge: null,
          pathEdges: []
        },
        isFinal: false,
        finalData: null
      });
    } else {
      for (const edge of outgoingEdges) {
        const neighbor = edge.to;
        const weight = edge.weight;
        const edgeId = edge.id;

        // Si el vecino ya está en el conjunto de visitados, su distancia es óptima definitiva
        if (visited.includes(neighbor)) {
          steps.push({
            stepIndex: steps.length,
            iteration: iterationCounter,
            phase: 'EVALUATE_EDGE',
            currentNode: current,
            currentEdge: { ...edge },
            edgeEvaluationType: 'visited_skipped',
            distances: { ...distances },
            predecessors: clonePredecessors(predecessors),
            visited: [...visited],
            unvisited: Array.from(unvisitedSet),
            title: `Evaluación de arista ${current} → ${neighbor} (Omitida)`,
            explanation: `Se examina la arista ${current} → ${neighbor} (peso ${weight}). El vértice ${neighbor} ya fue visitado previamente y su distancia mínima definitiva ya está fijada. No requiere reevaluación.`,
            mathOperation: `${neighbor} ∈ Visitados ⇒ dist(${neighbor}) es definitiva`,
            highlight: {
              currentNode: current,
              targetNode: neighbor,
              evaluatingEdge: edgeId,
              improvedEdge: null,
              tiedEdge: null,
              pathEdges: []
            },
            isFinal: false,
            finalData: null
          });
          continue;
        }

        const currentDist = distances[current];
        const newDist = currentDist + weight;
        const previousDist = distances[neighbor];
        const prevDistStr = previousDist === Infinity ? '∞' : String(previousDist);

        if (newDist < previousDist) {
          // Caso 1: Estricta mejora (Relajación de arista)
          distances[neighbor] = newDist;
          predecessors[neighbor] = [current]; // Reemplaza predecesores

          steps.push({
            stepIndex: steps.length,
            iteration: iterationCounter,
            phase: 'EVALUATE_EDGE',
            currentNode: current,
            currentEdge: { ...edge },
            edgeEvaluationType: 'improved',
            distances: { ...distances },
            predecessors: clonePredecessors(predecessors),
            visited: [...visited],
            unvisited: Array.from(unvisitedSet),
            title: `Relajación de arista: ${current} → ${neighbor}`,
            explanation: `Se evalúa la arista ${current} → ${neighbor} con peso ${weight}. La nueva distancia calculada es dist(${current}) + ${weight} = ${currentDist} + ${weight} = ${newDist}. Como ${newDist} < ${prevDistStr}, se relaja la arista: se actualiza dist(${neighbor}) = ${newDist} y se establece como predecesor único a [${current}].`,
            mathOperation: `dist(${current}) + peso(${current} → ${neighbor}) = ${currentDist} + ${weight} = ${newDist} < dist(${neighbor}) [${prevDistStr}] ⇒ Se actualiza dist(${neighbor}) = ${newDist}`,
            highlight: {
              currentNode: current,
              targetNode: neighbor,
              evaluatingEdge: edgeId,
              improvedEdge: edgeId,
              tiedEdge: null,
              pathEdges: []
            },
            isFinal: false,
            finalData: null
          });
        } else if (newDist === previousDist) {
          // Caso 2: Empate de distancia (Múltiples caminos mínimos)
          if (!predecessors[neighbor].includes(current)) {
            predecessors[neighbor].push(current);
          }

          steps.push({
            stepIndex: steps.length,
            iteration: iterationCounter,
            phase: 'EVALUATE_EDGE',
            currentNode: current,
            currentEdge: { ...edge },
            edgeEvaluationType: 'tied',
            distances: { ...distances },
            predecessors: clonePredecessors(predecessors),
            visited: [...visited],
            unvisited: Array.from(unvisitedSet),
            title: `Camino mínimo alternativo: ${current} → ${neighbor}`,
            explanation: `Se evalúa la arista ${current} → ${neighbor} con peso ${weight}. La distancia calculada es dist(${current}) + ${weight} = ${currentDist} + ${weight} = ${newDist}. Como ${newDist} es igual a la distancia tentativa conocida (${previousDist}), se conserva la distancia y se registra a ${current} como un predecesor óptimo alternativo: [${predecessors[neighbor].join(', ')}].`,
            mathOperation: `dist(${current}) + peso(${current} → ${neighbor}) = ${currentDist} + ${weight} = ${newDist} == dist(${neighbor}) [${previousDist}] ⇒ Se añade ${current} a los predecesores`,
            highlight: {
              currentNode: current,
              targetNode: neighbor,
              evaluatingEdge: edgeId,
              improvedEdge: null,
              tiedEdge: edgeId,
              pathEdges: []
            },
            isFinal: false,
            finalData: null
          });
        } else {
          // Caso 3: No mejora la distancia conocida
          steps.push({
            stepIndex: steps.length,
            iteration: iterationCounter,
            phase: 'EVALUATE_EDGE',
            currentNode: current,
            currentEdge: { ...edge },
            edgeEvaluationType: 'worse',
            distances: { ...distances },
            predecessors: clonePredecessors(predecessors),
            visited: [...visited],
            unvisited: Array.from(unvisitedSet),
            title: `Arista descartada: ${current} → ${neighbor}`,
            explanation: `Se evalúa la arista ${current} → ${neighbor} con peso ${weight}. La distancia calculada es ${currentDist} + ${weight} = ${newDist}. Como ${newDist} > ${previousDist}, la arista no ofrece un camino más corto y se descarta, manteniendo intacta la distancia y predecesores de ${neighbor}.`,
            mathOperation: `dist(${current}) + peso(${current} → ${neighbor}) = ${currentDist} + ${weight} = ${newDist} > dist(${neighbor}) [${previousDist}] ⇒ Se mantiene dist(${neighbor}) = ${previousDist}`,
            highlight: {
              currentNode: current,
              targetNode: neighbor,
              evaluatingEdge: edgeId,
              improvedEdge: null,
              tiedEdge: null,
              pathEdges: []
            },
            isFinal: false,
            finalData: null
          });
        }
      }
    }

    // 4. Marcar nodo como visitado
    unvisitedSet.delete(current);
    visited.push(current);

    steps.push({
      stepIndex: steps.length,
      iteration: iterationCounter,
      phase: 'NODE_VISITED',
      currentNode: current,
      currentEdge: null,
      edgeEvaluationType: null,
      distances: { ...distances },
      predecessors: clonePredecessors(predecessors),
      visited: [...visited],
      unvisited: Array.from(unvisitedSet),
      title: `Vértice ${current} marcado como visitado`,
      explanation: `Todas las aristas salientes del vértice ${current} han sido evaluadas. El vértice ingresa al conjunto de visitados. Su distancia mínima acumulada (${distances[current]}) es ahora definitiva.`,
      mathOperation: `Visitados = {${visited.join(', ')}}`,
      highlight: {
        currentNode: current,
        targetNode: null,
        evaluatingEdge: null,
        improvedEdge: null,
        tiedEdge: null,
        pathEdges: []
      },
      isFinal: false,
      finalData: null
    });

    iterationCounter++;
  }

  // 5. Paso final: Reconstrucción y análisis de resultados
  const isReachable = distances[destination] !== Infinity;
  let finalPaths = [];
  let pathEdgesSet = new Set();

  if (isReachable) {
    finalPaths = findAllShortestPaths(predecessors, origin, destination, distances);
    pathEdgesSet = getShortestPathEdges(finalPaths);
  }

  const finalExplanation = isReachable
    ? `Algoritmo completado exitosamente. La distancia mínima calculada desde ${origin} hasta ${destination} es ${distances[destination]}. Se encontraron ${finalPaths.length} camino(s) mínimo(s) óptimo(s).`
    : `Algoritmo finalizado. No existe una ruta dirigida desde el vértice ${origin} hasta el vértice ${destination} (distancia = ∞).`;

  steps.push({
    stepIndex: steps.length,
    iteration: iterationCounter - 1,
    phase: 'COMPLETE',
    currentNode: null,
    currentEdge: null,
    edgeEvaluationType: null,
    distances: { ...distances },
    predecessors: clonePredecessors(predecessors),
    visited: [...visited],
    unvisited: Array.from(unvisitedSet),
    title: 'Resultado Final: Determinación de Caminos Mínimos',
    explanation: finalExplanation,
    mathOperation: isReachable
      ? `dist(${origin} → ${destination}) = ${distances[destination]} | Rutas óptimas: ${finalPaths.length}`
      : `dist(${origin} → ${destination}) = ∞ (Destino inalcanzable)`,
    highlight: {
      currentNode: null,
      targetNode: null,
      evaluatingEdge: null,
      improvedEdge: null,
      tiedEdge: null,
      pathEdges: Array.from(pathEdgesSet)
    },
    isFinal: true,
    finalData: {
      reachable: isReachable,
      distance: distances[destination],
      paths: finalPaths,
      pathCount: finalPaths.length,
      origin,
      destination
    }
  });

  return steps;
}
