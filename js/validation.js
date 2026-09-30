/**
 * validation.js
 * Módulo de validación de entradas, pesos, nodos, aristas duplicadas
 * y detección manual de ciclos en grafos dirigidos usando DFS.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

/**
 * Valida la cantidad de nodos ingresada por el usuario.
 * Restricciones académicas: 7 <= n <= 16, entero positivo.
 * @param {any} rawValue 
 * @returns {{ isValid: boolean, error: string | null, value?: number }}
 */
export function validateNodeCount(rawValue) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return { isValid: false, error: 'Debe ingresar un número de nodos.' };
  }

  const trimmed = String(rawValue).trim();

  // Comprobar que solo contenga dígitos enteros
  if (!/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'La cantidad de nodos debe ser un número entero sin decimales ni caracteres extraños.'
    };
  }

  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    return { isValid: false, error: 'Valor numérico no válido.' };
  }

  if (num < 7) {
    return {
      isValid: false,
      error: `La cantidad mínima requerida es 7 nodos (ingresó ${num}).`
    };
  }

  if (num > 16) {
    return {
      isValid: false,
      error: `La cantidad máxima permitida es 16 nodos (ingresó ${num}).`
    };
  }

  return { isValid: true, error: null, value: num };
}

/**
 * Valida el peso de una arista.
 * Restricciones: entero positivo mayor a cero (w >= 1).
 * @param {any} rawWeight 
 * @returns {{ isValid: boolean, error: string | null, value?: number }}
 */
export function validateEdgeWeight(rawWeight) {
  if (rawWeight === undefined || rawWeight === null || String(rawWeight).trim() === '') {
    return { isValid: false, error: 'Debe ingresar el peso de la arista.' };
  }

  const trimmed = String(rawWeight).trim();

  // Comprobar que sea un número entero
  if (!/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'El peso debe ser un número entero positivo (sin decimales ni signos negativos).'
    };
  }

  const weight = Number(trimmed);

  if (weight <= 0) {
    return {
      isValid: false,
      error: 'El peso debe ser un número entero estrictamente mayor que cero (w ≥ 1).'
    };
  }

  return { isValid: true, error: null, value: weight };
}

/**
 * Encuentra un camino dirigido entre dos nodos usando búsqueda en profundidad (DFS) manual.
 * Retorna la secuencia de nodos si existe un camino, o null si no existe.
 * @param {Record<string, Array<{ to: string, weight: number }>>} adjacencyList 
 * @param {string} startNode 
 * @param {string} targetNode 
 * @returns {string[] | null}
 */
export function findDirectedPathDFS(adjacencyList, startNode, targetNode) {
  const visited = new Set();
  const parentMap = new Map();
  const stack = [startNode];
  visited.add(startNode);

  while (stack.length > 0) {
    const current = stack.pop();

    if (current === targetNode) {
      // Reconstruir el camino desde targetNode hasta startNode
      const path = [];
      let curr = targetNode;
      while (curr !== undefined) {
        path.push(curr);
        curr = parentMap.get(curr);
      }
      return path.reverse();
    }

    const neighbors = adjacencyList[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.to)) {
        visited.add(neighbor.to);
        parentMap.set(neighbor.to, current);
        stack.push(neighbor.to);
      }
    }
  }

  return null;
}

/**
 * Valida si una nueva arista puede ser agregada al grafo.
 * Verifica:
 * 1. Existencia de nodos origen y destino.
 * 2. Que no sea una autoarista (origen !== destino).
 * 3. Que la arista no exista ya en la misma dirección.
 * 4. Que el peso sea válido.
 * 5. Que la arista NO produzca un ciclo dirigido (usando DFS manual).
 * 
 * @param {object} graph - Instancia de Graph
 * @param {string} from - Nodo origen
 * @param {string} to - Nodo destino
 * @param {any} rawWeight - Peso sin validar
 * @returns {{ isValid: boolean, error: string | null, weight?: number, cyclePath?: string[] }}
 */
export function validateNewEdge(graph, from, to, rawWeight) {
  if (!from || !to) {
    return { isValid: false, error: 'Debe seleccionar un nodo de origen y un nodo de destino.' };
  }

  const nodes = graph.getNodes();
  if (!nodes.includes(from) || !nodes.includes(to)) {
    return { isValid: false, error: 'Los nodos seleccionados no existen en el grafo actual.' };
  }

  // 1. No autoaristas (u === v)
  if (from === to) {
    return {
      isValid: false,
      error: `No se permiten autoaristas (un vértice no puede conectarse consigo mismo: ${from} → ${to}).`
    };
  }

  // 2. No aristas duplicadas en la misma dirección
  if (graph.hasEdge(from, to)) {
    return {
      isValid: false,
      error: `Ya existe una arista dirigida de ${from} hacia ${to}.`
    };
  }

  // 3. Validar peso
  const weightVal = validateEdgeWeight(rawWeight);
  if (!weightVal.isValid) {
    return { isValid: false, error: weightVal.error };
  }

  // 4. Detección manual de ciclos mediante DFS
  // Si agregamos la arista from -> to, se creará un ciclo si y solo si ya existe
  // un camino dirigido previo desde 'to' hacia 'from'.
  const currentAdj = graph.getAdjacencyList();
  const existingPath = findDirectedPathDFS(currentAdj, to, from);

  if (existingPath) {
    // El camino previo existente es: to -> ... -> from
    // Con la nueva arista from -> to, el ciclo cerrado completo es: to -> ... -> from -> to
    const cycleNodes = [...existingPath, to];
    const cycleFormatted = cycleNodes.join(' → ');
    return {
      isValid: false,
      error: `No se puede agregar ${from} → ${to} porque formaría un ciclo dirigido: ${cycleFormatted}.`,
      cyclePath: cycleNodes
    };
  }

  return { isValid: true, error: null, weight: weightVal.value };
}

/**
 * Valida los parámetros necesarios para ejecutar el algoritmo de Dijkstra.
 * @param {object} graph 
 * @param {string} origin 
 * @param {string} destination 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateDijkstraStart(graph, origin, destination) {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  if (nodes.length === 0) {
    return { isValid: false, error: 'Primero debe configurar y crear los nodos del grafo.' };
  }

  if (edges.length === 0) {
    return { isValid: false, error: 'El grafo debe tener al menos una arista para ejecutar Dijkstra.' };
  }

  if (!origin || !destination) {
    return { isValid: false, error: 'Debe seleccionar tanto el nodo origen como el nodo destino.' };
  }

  if (!nodes.includes(origin) || !nodes.includes(destination)) {
    return { isValid: false, error: 'El nodo origen o destino seleccionado no pertenece al grafo.' };
  }

  if (origin === destination) {
    return {
      isValid: false,
      error: 'El vértice origen y el vértice destino deben ser diferentes para calcular el camino.'
    };
  }

  return { isValid: true, error: null };
}

/**
 * Algoritmo DFS general de 3 colores para verificar si todo el grafo es un DAG (sin ciclos).
 * 0 = Blanco (no visitado), 1 = Gris (en proceso en la pila actual), 2 = Negro (completamente procesado).
 * @param {string[]} nodes 
 * @param {Record<string, Array<{ to: string }>>} adj 
 * @returns {{ isAcyclic: boolean, cycleNodes?: string[] }}
 */
export function verifyGraphIsDAG(nodes, adj) {
  const color = new Map(nodes.map(n => [n, 0]));
  const parent = new Map();

  for (const node of nodes) {
    if (color.get(node) === 0) {
      const cycle = dfsDetectCycle(node, adj, color, parent);
      if (cycle) {
        return { isAcyclic: false, cycleNodes: cycle };
      }
    }
  }

  return { isAcyclic: true };
}

function dfsDetectCycle(u, adj, color, parent) {
  color.set(u, 1); // Gris
  const neighbors = adj[u] || [];

  for (const edge of neighbors) {
    const v = edge.to;
    if (color.get(v) === 1) {
      // Ciclo detectado: retroceder para extraer el ciclo
      const cycle = [v, u];
      let curr = u;
      while (parent.has(curr) && parent.get(curr) !== v) {
        curr = parent.get(curr);
        cycle.push(curr);
      }
      cycle.push(v);
      return cycle.reverse();
    }
    if (color.get(v) === 0) {
      parent.set(v, u);
      const res = dfsDetectCycle(v, adj, color, parent);
      if (res) return res;
    }
  }

  color.set(u, 2); // Negro
  return null;
}
