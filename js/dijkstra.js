/**
 * dijkstra.js
 * Implementación manual del algoritmo de Dijkstra para grafos dirigidos
 * ponderados y acíclicos (DAGs). Genera un historial de pasos pedagógicos
 * para su visualización interactiva.
 *
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

import { reconstruirCamino, obtenerAristasDelCamino } from './caminos.js';

/**
 * Ejecuta Dijkstra y devuelve la lista ordenada de pasos.
 * Cada paso guarda una copia del estado (distancias, predecesores, visitados)
 * para poder mostrarlo sin recalcular.
 *
 * @param {object} grafo - Instancia de Grafo (obtenerNodos, obtenerAristasSalientes)
 * @param {string} origen
 * @param {string} destino
 * @returns {Array<object>}
 */
export function ejecutarDijkstra(grafo, origen, destino) {
  const nodos = grafo.obtenerNodos();
  const pasos = [];

  const distancias = {};
  const predecesores = {};
  const visitados = [];

  for (const nodo of nodos) {
    distancias[nodo] = Infinity;
    predecesores[nodo] = null;
  }
  distancias[origen] = 0;

  /** Registra un paso con una copia del estado actual. */
  function registrarPaso(datos) {
    pasos.push({
      indicePaso: pasos.length,
      stepIndex: pasos.length,
      nodoActual: null,
      currentNode: null,
      distancias: { ...distancias },
      distances: { ...distancias },
      predecesores: { ...predecesores },
      predecessors: { ...predecesores },
      visitados: [...visitados],
      visited: [...visitados],
      resaltado: { nodoObjetivo: null, aristaEvaluada: null, aristaMejorada: null, aristasDelCamino: [] },
      highlight: { targetNode: null, evaluatingEdge: null, improvedEdge: null, pathEdges: [] },
      esFinal: false,
      isFinal: false,
      datosFinales: null,
      finalData: null,
      ...datos
    });
  }

  // Paso 0: inicialización
  registrarPaso({
    nodoActual: origen,
    currentNode: origen,
    titulo: 'Fase inicial: inicialización de etiquetas',
    title: 'Fase inicial: inicialización de etiquetas',
    explicacion: `Se fija dist(${origen}) = 0 para el origen y dist(v) = ∞ para los demás vértices. El conjunto de visitados está vacío.`,
    explanation: `Se fija dist(${origen}) = 0 para el origen y dist(v) = ∞ para los demás vértices. El conjunto de visitados está vacío.`,
    operacionMatematica: `dist(${origen}) = 0 | dist(v) = ∞ para todo v ≠ ${origen}`,
    mathOperation: `dist(${origen}) = 0 | dist(v) = ∞ para todo v ≠ ${origen}`
  });

  const noVisitados = new Set(nodos);
  let iteracion = 1;

  while (noVisitados.size > 0) {
    // Selección del vértice no visitado con menor distancia tentativa
    let actual = null;
    let distanciaMinima = Infinity;
    for (const nodo of noVisitados) {
      if (distancias[nodo] < distanciaMinima) {
        distanciaMinima = distancias[nodo];
        actual = nodo;
      }
    }

    // Los vértices restantes no son alcanzables desde el origen
    if (actual === null) break;

    registrarPaso({
      nodoActual: actual,
      currentNode: actual,
      titulo: `Iteración ${iteracion}: selección del vértice ${actual}`,
      title: `Iteración ${iteracion}: selección del vértice ${actual}`,
      explicacion: `Se selecciona ${actual} por ser el vértice no visitado con menor distancia tentativa: dist(${actual}) = ${distancias[actual]}. Se examinarán sus aristas salientes.`,
      explanation: `Se selecciona ${actual} por ser el vértice no visitado con menor distancia tentativa: dist(${actual}) = ${distancias[actual]}. Se examinarán sus aristas salientes.`,
      operacionMatematica: `u* = argmin { dist(u) | u ∈ NoVisitados } = ${actual} (dist = ${distancias[actual]})`,
      mathOperation: `u* = argmin { dist(u) | u ∈ NoVisitados } = ${actual} (dist = ${distancias[actual]})`
    });

    // Relajación de las aristas salientes
    for (const arista of grafo.obtenerAristasSalientes(actual)) {
      const vecino = arista.destino !== undefined ? arista.destino : arista.to;
      const pesoArista = arista.peso !== undefined ? arista.peso : arista.weight;
      const distActual = distancias[actual];
      const nuevaDistancia = distActual + pesoArista;
      const distanciaPrevia = distancias[vecino];
      const previaTexto = distanciaPrevia === Infinity ? '∞' : String(distanciaPrevia);

      if (nuevaDistancia < distanciaPrevia) {
        distancias[vecino] = nuevaDistancia;
        predecesores[vecino] = actual;

        registrarPaso({
          nodoActual: actual,
          currentNode: actual,
          titulo: `Relajación de arista: ${actual} → ${vecino}`,
          title: `Relajación de arista: ${actual} → ${vecino}`,
          explicacion: `Se evalúa ${actual} → ${vecino} (peso ${pesoArista}). Nueva distancia: ${distActual} + ${pesoArista} = ${nuevaDistancia}. Como ${nuevaDistancia} < ${previaTexto}, se actualiza dist(${vecino}) = ${nuevaDistancia} y su predecesor pasa a ser ${actual}.`,
          explanation: `Se evalúa ${actual} → ${vecino} (peso ${pesoArista}). Nueva distancia: ${distActual} + ${pesoArista} = ${nuevaDistancia}. Como ${nuevaDistancia} < ${previaTexto}, se actualiza dist(${vecino}) = ${nuevaDistancia} y su predecesor pasa a ser ${actual}.`,
          operacionMatematica: `${distActual} + ${pesoArista} = ${nuevaDistancia} < dist(${vecino}) [${previaTexto}] ⇒ dist(${vecino}) = ${nuevaDistancia}, pred(${vecino}) = ${actual}`,
          mathOperation: `${distActual} + ${pesoArista} = ${nuevaDistancia} < dist(${vecino}) [${previaTexto}] ⇒ dist(${vecino}) = ${nuevaDistancia}, pred(${vecino}) = ${actual}`,
          resaltado: { nodoObjetivo: vecino, aristaEvaluada: arista.id, aristaMejorada: arista.id, aristasDelCamino: [] },
          highlight: { targetNode: vecino, evaluatingEdge: arista.id, improvedEdge: arista.id, pathEdges: [] }
        });
      } else {
        registrarPaso({
          nodoActual: actual,
          currentNode: actual,
          titulo: `Arista descartada: ${actual} → ${vecino}`,
          title: `Arista descartada: ${actual} → ${vecino}`,
          explicacion: `Se evalúa ${actual} → ${vecino} (peso ${pesoArista}). Distancia calculada: ${distActual} + ${pesoArista} = ${nuevaDistancia}. Como ${nuevaDistancia} no es menor que ${distanciaPrevia}, no mejora el camino conocido y se mantiene dist(${vecino}) = ${distanciaPrevia}.`,
          explanation: `Se evalúa ${actual} → ${vecino} (peso ${pesoArista}). Distancia calculada: ${distActual} + ${pesoArista} = ${nuevaDistancia}. Como ${nuevaDistancia} no es menor que ${distanciaPrevia}, no mejora el camino conocido y se mantiene dist(${vecino}) = ${distanciaPrevia}.`,
          operacionMatematica: `${distActual} + ${pesoArista} = ${nuevaDistancia} ≥ dist(${vecino}) [${distanciaPrevia}] ⇒ sin cambios`,
          mathOperation: `${distActual} + ${pesoArista} = ${nuevaDistancia} ≥ dist(${vecino}) [${distanciaPrevia}] ⇒ sin cambios`,
          resaltado: { nodoObjetivo: vecino, aristaEvaluada: arista.id, aristaMejorada: null, aristasDelCamino: [] },
          highlight: { targetNode: vecino, evaluatingEdge: arista.id, improvedEdge: null, pathEdges: [] }
        });
      }
    }

    // Marcar como visitado
    noVisitados.delete(actual);
    visitados.push(actual);

    registrarPaso({
      nodoActual: actual,
      currentNode: actual,
      titulo: `Vértice ${actual} marcado como visitado`,
      title: `Vértice ${actual} marcado como visitado`,
      explicacion: `Se evaluaron todas las aristas salientes de ${actual}. Su distancia mínima (${distancias[actual]}) ya es definitiva.`,
      explanation: `Se evaluaron todas las aristas salientes de ${actual}. Su distancia mínima (${distancias[actual]}) ya es definitiva.`,
      operacionMatematica: `Visitados = {${visitados.join(', ')}}`,
      mathOperation: `Visitados = {${visitados.join(', ')}}`
    });

    iteracion++;
  }

  // Paso final: reconstrucción del camino mínimo
  const alcanzable = distancias[destino] !== Infinity;
  const camino = alcanzable ? reconstruirCamino(predecesores, origen, destino, distancias) : [];
  const aristasCamino = obtenerAristasDelCamino(camino);

  registrarPaso({
    titulo: 'Resultado final: camino mínimo',
    title: 'Resultado final: camino mínimo',
    explicacion: alcanzable
      ? `Algoritmo completado. La distancia mínima de ${origen} a ${destino} es ${distancias[destino]}, siguiendo los predecesores desde ${destino} hasta ${origen}.`
      : `Algoritmo finalizado. No existe una ruta dirigida de ${origen} a ${destino} (distancia = ∞).`,
    explanation: alcanzable
      ? `Algoritmo completado. La distancia mínima de ${origen} a ${destino} es ${distancias[destino]}, siguiendo los predecesores desde ${destino} hasta ${origen}.`
      : `Algoritmo finalizado. No existe una ruta dirigida de ${origen} a ${destino} (distancia = ∞).`,
    operacionMatematica: alcanzable
      ? `dist(${origen} → ${destino}) = ${distancias[destino]}`
      : `dist(${origen} → ${destino}) = ∞`,
    mathOperation: alcanzable
      ? `dist(${origen} → ${destino}) = ${distancias[destino]}`
      : `dist(${origen} → ${destino}) = ∞`,
    resaltado: { nodoObjetivo: null, aristaEvaluada: null, aristaMejorada: null, aristasDelCamino: aristasCamino },
    highlight: { targetNode: null, evaluatingEdge: null, improvedEdge: null, pathEdges: aristasCamino },
    esFinal: true,
    isFinal: true,
    datosFinales: { alcanzable, distancia: distancias[destino], camino, origen, destino, reachable: alcanzable, distance: distancias[destino], path: camino, origin: origen, destination: destino },
    finalData: { reachable: alcanzable, distance: distancias[destino], path: camino, origin: origen, destination: destino, alcanzable, distancia: distancias[destino], camino }
  });

  return pasos;
}
