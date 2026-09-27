/**
 * app.bundle.js
 * Versión empaquetada unificada para soporte universal.
 * Permite que el simulador funcione tanto al abrirlo directamente con doble clic (file:///)
 * como en entornos con servidor (Live Server, GitHub Pages).
 * 
 * Contiene todas las implementaciones nativas del equipo sin librerías externas para los cálculos.
 */

(function() {
  // Evitar doble inicialización si el módulo ES6 ya se ejecutó
  if (window.__APP_INITIALIZED__) return;

  // ==========================================
  // 1. MODELO DEL GRAFO (graph.js)
  // ==========================================
  class Graph {
    constructor() {
      this.nodes = [];
      this.edges = [];
    }

    setNodes(count) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      this.nodes = [];
      for (let i = 0; i < count; i++) {
        this.nodes.push(letters[i]);
      }
      this.edges = [];
    }

    getNodes() {
      return [...this.nodes];
    }

    getEdges() {
      return this.edges.map(e => ({ ...e }));
    }

    addEdge(from, to, weight) {
      const id = `${from}-${to}`;
      const edge = { id, from, to, weight: Number(weight) };
      this.edges.push(edge);
      return { success: true, edge };
    }

    removeEdge(from, to) {
      const initialLength = this.edges.length;
      this.edges = this.edges.filter(e => !(e.from === from && e.to === to));
      return this.edges.length < initialLength;
    }

    clearEdges() {
      this.edges = [];
    }

    reset() {
      this.nodes = [];
      this.edges = [];
    }

    hasEdge(from, to) {
      return this.edges.some(e => e.from === from && e.to === to);
    }

    getOutgoingEdges(node) {
      return this.edges.filter(e => e.from === node);
    }

    getAdjacencyList() {
      const adj = {};
      for (const node of this.nodes) {
        adj[node] = [];
      }
      for (const edge of this.edges) {
        if (adj[edge.from]) {
          adj[edge.from].push({ to: edge.to, weight: edge.weight });
        }
      }
      return adj;
    }

    getAdjacencyMatrix() {
      const n = this.nodes.length;
      const nodeIndex = new Map(this.nodes.map((node, i) => [node, i]));
      const matrix = Array.from({ length: n }, () => Array(n).fill(null));

      for (let i = 0; i < n; i++) {
        matrix[i][i] = 0;
      }

      for (const edge of this.edges) {
        const u = nodeIndex.get(edge.from);
        const v = nodeIndex.get(edge.to);
        if (u !== undefined && v !== undefined) {
          matrix[u][v] = edge.weight;
        }
      }

      return { nodes: [...this.nodes], matrix };
    }

    computeTopologicalRanks() {
      const ranks = new Map(this.nodes.map(n => [n, 0]));
      const inDegree = new Map(this.nodes.map(n => [n, 0]));
      const adj = this.getAdjacencyList();

      for (const edge of this.edges) {
        inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      }

      const queue = [];
      for (const node of this.nodes) {
        if (inDegree.get(node) === 0) {
          queue.push(node);
          ranks.set(node, 0);
        }
      }

      while (queue.length > 0) {
        const curr = queue.shift();
        const currRank = ranks.get(curr);
        const neighbors = adj[curr] || [];

        for (const { to } of neighbors) {
          const nextRank = Math.max(ranks.get(to) || 0, currRank + 1);
          ranks.set(to, nextRank);
          inDegree.set(to, inDegree.get(to) - 1);
          if (inDegree.get(to) === 0) {
            queue.push(to);
          }
        }
      }

      this.nodes.forEach((node, idx) => {
        if (!ranks.has(node) || Number.isNaN(ranks.get(node))) {
          ranks.set(node, Math.floor(idx / 2));
        }
      });

      return ranks;
    }

    toCytoscapeElements() {
      const ranks = this.computeTopologicalRanks();
      const rankGroups = new Map();
      for (const node of this.nodes) {
        const r = ranks.get(node) || 0;
        if (!rankGroups.has(r)) rankGroups.set(r, []);
        rankGroups.get(r).push(node);
      }

      const elements = [];
      const xSpacing = 160;
      const ySpacing = 110;
      const xOffset = 80;
      const yOffset = 80;

      for (const [rank, groupNodes] of rankGroups.entries()) {
        const totalInRank = groupNodes.length;
        groupNodes.forEach((node, idx) => {
          const yPos = yOffset + (idx - (totalInRank - 1) / 2) * ySpacing + 150;
          const xPos = xOffset + rank * xSpacing;

          elements.push({
            group: 'nodes',
            data: { id: node, label: node },
            position: { x: xPos, y: yPos }
          });
        });
      }

      for (const edge of this.edges) {
        elements.push({
          group: 'edges',
          data: {
            id: edge.id,
            source: edge.from,
            target: edge.to,
            weight: edge.weight,
            label: String(edge.weight)
          }
        });
      }

      return elements;
    }

    generateRandomDAG(density = 'media') {
      if (this.nodes.length < 2) return;
      this.edges = [];
      const n = this.nodes.length;

      const pathNodes = [0];
      let currentIdx = 0;
      while (currentIdx < n - 1) {
        const step = Math.min(n - 1, currentIdx + Math.floor(Math.random() * 2) + 1);
        pathNodes.push(step);
        currentIdx = step;
      }
      if (pathNodes[pathNodes.length - 1] !== n - 1) {
        pathNodes.push(n - 1);
      }

      for (let k = 0; k < pathNodes.length - 1; k++) {
        const from = this.nodes[pathNodes[k]];
        const to = this.nodes[pathNodes[k + 1]];
        if (!this.hasEdge(from, to)) {
          const weight = Math.floor(Math.random() * 15) + 1;
          this.addEdge(from, to, weight);
        }
      }

      let edgeTargetFactor = 2.0;
      if (density === 'baja') edgeTargetFactor = 1.3;
      if (density === 'alta') edgeTargetFactor = 2.8;

      const totalEdgesTarget = Math.min(
        Math.floor(n * edgeTargetFactor),
        Math.floor((n * (n - 1)) / 2)
      );

      let attempts = 0;
      const maxAttempts = 500;
      while (this.edges.length < totalEdgesTarget && attempts < maxAttempts) {
        attempts++;
        const i = Math.floor(Math.random() * (n - 1));
        const j = Math.floor(Math.random() * (n - 1 - i)) + i + 1;

        const from = this.nodes[i];
        const to = this.nodes[j];

        if (!this.hasEdge(from, to)) {
          const weight = Math.floor(Math.random() * 20) + 1;
          this.addEdge(from, to, weight);
        }
      }
    }

    loadDemonstrationExample() {
      this.setNodes(8);
      const demoEdges = [
        { from: 'A', to: 'B', weight: 4 },
        { from: 'A', to: 'C', weight: 4 },
        { from: 'A', to: 'D', weight: 9 },
        { from: 'B', to: 'D', weight: 3 },
        { from: 'C', to: 'D', weight: 3 },
        { from: 'B', to: 'E', weight: 6 },
        { from: 'C', to: 'F', weight: 6 },
        { from: 'B', to: 'F', weight: 8 },
        { from: 'D', to: 'G', weight: 5 },
        { from: 'E', to: 'G', weight: 2 },
        { from: 'F', to: 'G', weight: 2 },
        { from: 'D', to: 'H', weight: 12 },
        { from: 'G', to: 'H', weight: 3 }
      ];

      for (const e of demoEdges) {
        this.addEdge(e.from, e.to, e.weight);
      }
    }
  }

  // ==========================================
  // 2. VALIDACIONES Y DFS DE CICLOS (validation.js)
  // ==========================================
  function validateNodeCount(rawValue) {
    if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
      return { isValid: false, error: 'Debe ingresar un número de nodos.' };
    }
    const trimmed = String(rawValue).trim();
    if (!/^\d+$/.test(trimmed)) {
      return { isValid: false, error: 'La cantidad de nodos debe ser un número entero sin decimales ni letras.' };
    }
    const num = Number(trimmed);
    if (num < 7) {
      return { isValid: false, error: `La cantidad mínima requerida es 7 nodos (ingresó ${num}).` };
    }
    if (num > 16) {
      return { isValid: false, error: `La cantidad máxima permitida es 16 nodos (ingresó ${num}).` };
    }
    return { isValid: true, error: null, value: num };
  }

  function validateEdgeWeight(rawWeight) {
    if (rawWeight === undefined || rawWeight === null || String(rawWeight).trim() === '') {
      return { isValid: false, error: 'Debe ingresar el peso de la arista.' };
    }
    const trimmed = String(rawWeight).trim();
    if (!/^\d+$/.test(trimmed)) {
      return { isValid: false, error: 'El peso debe ser un número entero positivo (sin decimales ni signos negativos).' };
    }
    const weight = Number(trimmed);
    if (weight <= 0) {
      return { isValid: false, error: 'El peso debe ser un número entero estrictamente mayor que cero (w ≥ 1).' };
    }
    return { isValid: true, error: null, value: weight };
  }

  function findDirectedPathDFS(adjacencyList, startNode, targetNode) {
    const visited = new Set();
    const parentMap = new Map();
    const stack = [startNode];
    visited.add(startNode);

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === targetNode) {
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

  function validateNewEdge(graph, from, to, rawWeight) {
    if (!from || !to) {
      return { isValid: false, error: 'Debe seleccionar un nodo de origen y un nodo de destino.' };
    }
    const nodes = graph.getNodes();
    if (!nodes.includes(from) || !nodes.includes(to)) {
      return { isValid: false, error: 'Los nodos seleccionados no existen en el grafo actual.' };
    }
    if (from === to) {
      return { isValid: false, error: `No se permiten autoaristas (un vértice no puede conectarse consigo mismo: ${from} → ${to}).` };
    }
    if (graph.hasEdge(from, to)) {
      return { isValid: false, error: `Ya existe una arista dirigida de ${from} hacia ${to}.` };
    }
    const weightVal = validateEdgeWeight(rawWeight);
    if (!weightVal.isValid) {
      return { isValid: false, error: weightVal.error };
    }

    const currentAdj = graph.getAdjacencyList();
    const existingPath = findDirectedPathDFS(currentAdj, to, from);
    if (existingPath) {
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

  function validateDijkstraStart(graph, origin, destination) {
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
      return { isValid: false, error: 'El vértice origen y el vértice destino deben ser diferentes para calcular el camino.' };
    }
    return { isValid: true, error: null };
  }

  // ==========================================
  // 3. CAMINOS MÍNIMOS (paths.js)
  // ==========================================
  function findAllShortestPaths(predecessors, origin, destination, distances) {
    if (!distances || distances[destination] === Infinity || distances[destination] === undefined) {
      return [];
    }
    if (origin === destination) {
      return [[origin]];
    }
    if (!predecessors[destination] || predecessors[destination].length === 0) {
      return [];
    }

    const allPaths = [];
    const visitedOnBranch = new Set();

    function backtrack(current, accumulatedPath) {
      if (current === origin) {
        allPaths.push([origin, ...accumulatedPath]);
        return;
      }
      const parents = predecessors[current] || [];
      for (const parent of parents) {
        const branchKey = `${parent}->${current}`;
        if (!visitedOnBranch.has(branchKey)) {
          visitedOnBranch.add(branchKey);
          backtrack(parent, [current, ...accumulatedPath]);
          visitedOnBranch.delete(branchKey);
        }
      }
    }

    backtrack(destination, []);
    const uniqueMap = new Map();
    for (const path of allPaths) {
      const key = path.join('→');
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, path);
      }
    }
    return Array.from(uniqueMap.values());
  }

  function getShortestPathEdges(paths) {
    const edgeSet = new Set();
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        edgeSet.add(`${path[i]}-${path[i + 1]}`);
      }
    }
    return edgeSet;
  }

  // ==========================================
  // 4. ALGORITMO DE DIJKSTRA (dijkstra.js)
  // ==========================================
  function clonePredecessors(preds) {
    const copy = {};
    for (const [k, v] of Object.entries(preds)) {
      copy[k] = [...v];
    }
    return copy;
  }

  function runDijkstra(graph, origin, destination) {
    const nodes = graph.getNodes();
    const steps = [];

    const distances = {};
    const predecessors = {};
    const visited = [];

    for (const node of nodes) {
      distances[node] = Infinity;
      predecessors[node] = [];
    }
    distances[origin] = 0;

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
    const unvisitedSet = new Set(nodes);

    while (unvisitedSet.size > 0) {
      let minNode = null;
      let minDistance = Infinity;

      for (const node of unvisitedSet) {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          minNode = node;
        }
      }

      if (minNode === null || minDistance === Infinity) {
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
              explanation: `Se examina la arista ${current} → ${neighbor} (peso ${weight}). El vértice ${neighbor} ya fue visitado previamente y su distancia mínima definitiva ya está fijada.`,
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
            distances[neighbor] = newDist;
            predecessors[neighbor] = [current];

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

  // ==========================================
  // 5. GESTOR DE PASOS (step-manager.js)
  // ==========================================
  class StepManager {
    constructor() {
      this.steps = [];
      this.currentIndex = 0;
    }

    setSteps(stepsList) {
      this.steps = Array.isArray(stepsList) ? stepsList : [];
      this.currentIndex = 0;
    }

    getCurrentStep() {
      if (this.steps.length === 0) return null;
      return this.steps[this.currentIndex];
    }

    getCurrentIndex() {
      return this.currentIndex;
    }

    getTotalSteps() {
      return this.steps.length;
    }

    nextStep() {
      if (this.hasNext()) {
        this.currentIndex++;
      }
      return this.getCurrentStep();
    }

    prevStep() {
      if (this.hasPrev()) {
        this.currentIndex--;
      }
      return this.getCurrentStep();
    }

    goToStart() {
      if (this.steps.length > 0) {
        this.currentIndex = 0;
      }
      return this.getCurrentStep();
    }

    goToEnd() {
      if (this.steps.length > 0) {
        this.currentIndex = this.steps.length - 1;
      }
      return this.getCurrentStep();
    }

    goToStep(index) {
      if (this.steps.length === 0) return null;
      this.currentIndex = Math.max(0, Math.min(this.steps.length - 1, Number(index)));
      return this.getCurrentStep();
    }

    hasNext() {
      return this.currentIndex < this.steps.length - 1;
    }

    hasPrev() {
      return this.currentIndex > 0;
    }

    isAtEnd() {
      return this.steps.length > 0 && this.currentIndex === this.steps.length - 1;
    }

    isAtStart() {
      return this.currentIndex === 0;
    }

    getProgress() {
      if (this.steps.length === 0) {
        return { current: 0, total: 0, percentage: 0 };
      }
      const current = this.currentIndex + 1;
      const total = this.steps.length;
      return { current, total, percentage: Math.round((current / total) * 100) };
    }

    reset() {
      this.steps = [];
      this.currentIndex = 0;
    }
  }

  // ==========================================
  // 6. CONTROLADOR DE INTERFAZ (ui.js)
  // ==========================================
  class UIManager {
    constructor() {
      this.cy = null;
      this.toastTimeout = null;
    }

    initCytoscape(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      if (typeof cytoscape === 'undefined') {
        this.showMessage('Aviso: Cytoscape.js está cargando desde el CDN. Si no visualiza el grafo, verifique su conexión.', 'warning');
        return;
      }

      this.cy = cytoscape({
        container,
        elements: [],
        boxSelectionEnabled: false,
        autounselectify: true,
        wheelSensitivity: 0.25,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'font-family': 'Inter, system-ui, sans-serif',
              'font-size': '15px',
              'font-weight': 'bold',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#0f172a',
              'background-color': '#f8fafc',
              'border-width': 3,
              'border-color': '#64748b',
              'width': 44,
              'height': 44,
              'transition-property': 'background-color, border-color, border-width, width, height, line-color',
              'transition-duration': '0.25s'
            }
          },
          {
            selector: 'node.origin',
            style: {
              'background-color': '#d1fae5',
              'border-color': '#059669',
              'border-width': 4,
              'color': '#064e3b'
            }
          },
          {
            selector: 'node.destination',
            style: {
              'background-color': '#ede9fe',
              'border-color': '#7c3aed',
              'border-width': 4,
              'color': '#4c1d95'
            }
          },
          {
            selector: 'node.current',
            style: {
              'background-color': '#fef3c7',
              'border-color': '#d97706',
              'border-width': 5,
              'color': '#78350f',
              'width': 50,
              'height': 50,
              'underlay-color': '#d97706',
              'underlay-padding': 4,
              'underlay-opacity': 0.35
            }
          },
          {
            selector: 'node.target-evaluating',
            style: {
              'background-color': '#fed7aa',
              'border-color': '#ea580c',
              'border-width': 4,
              'color': '#7c2d12'
            }
          },
          {
            selector: 'node.visited',
            style: {
              'background-color': '#e0f2fe',
              'border-color': '#0284c7',
              'border-width': 3,
              'color': '#0369a1'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2.5,
              'line-color': '#94a3b8',
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'arrow-scale': 1.25,
              'curve-style': 'bezier',
              'label': 'data(weight)',
              'font-family': 'Inter, system-ui, sans-serif',
              'font-size': '13px',
              'font-weight': 'bold',
              'color': '#1e293b',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.95,
              'text-background-padding': '3px',
              'text-background-shape': 'roundrectangle',
              'text-border-color': '#cbd5e1',
              'text-border-width': 1,
              'text-border-opacity': 0.9,
              'text-margin-y': -8
            }
          },
          {
            selector: 'edge.evaluating',
            style: {
              'line-color': '#f59e0b',
              'target-arrow-color': '#f59e0b',
              'width': 4.5,
              'line-style': 'dashed'
            }
          },
          {
            selector: 'edge.improved',
            style: {
              'line-color': '#10b981',
              'target-arrow-color': '#10b981',
              'width': 5,
              'line-style': 'solid'
            }
          },
          {
            selector: 'edge.tied',
            style: {
              'line-color': '#3b82f6',
              'target-arrow-color': '#3b82f6',
              'width': 4.5,
              'line-style': 'solid'
            }
          },
          {
            selector: 'edge.shortest-path',
            style: {
              'line-color': '#e11d48',
              'target-arrow-color': '#e11d48',
              'width': 5.5,
              'line-style': 'solid',
              'z-index': 99
            }
          }
        ]
      });
    }

    renderGraph(elements) {
      if (!this.cy) return;
      this.cy.batch(() => {
        this.cy.elements().remove();
        this.cy.add(elements);
      });
      this.cy.fit(undefined, 35);
    }

    fitGraph() {
      if (!this.cy) return;
      this.cy.fit(undefined, 35);
    }

    applyStepVisualization(step, origin, destination) {
      if (!this.cy || !step) return;

      this.cy.batch(() => {
        this.cy.nodes().removeClass('origin destination current target-evaluating visited unreachable');
        this.cy.edges().removeClass('evaluating improved tied shortest-path');

        if (origin) {
          const originNode = this.cy.getElementById(origin);
          if (originNode.length > 0) originNode.addClass('origin');
        }
        if (destination) {
          const destNode = this.cy.getElementById(destination);
          if (destNode.length > 0) destNode.addClass('destination');
        }

        if (Array.isArray(step.visited)) {
          for (const v of step.visited) {
            const vNode = this.cy.getElementById(v);
            if (vNode.length > 0 && v !== origin && v !== destination) {
              vNode.addClass('visited');
            }
          }
        }

        if (step.currentNode) {
          const cNode = this.cy.getElementById(step.currentNode);
          if (cNode.length > 0) cNode.addClass('current');
        }

        if (step.highlight && step.highlight.targetNode) {
          const tNode = this.cy.getElementById(step.highlight.targetNode);
          if (tNode.length > 0) tNode.addClass('target-evaluating');
        }

        if (step.highlight && step.highlight.evaluatingEdge) {
          const edgeId = step.highlight.evaluatingEdge;
          const edgeElem = this.cy.getElementById(edgeId);
          if (edgeElem.length > 0) {
            if (step.highlight.improvedEdge) {
              edgeElem.addClass('improved');
            } else if (step.highlight.tiedEdge) {
              edgeElem.addClass('tied');
            } else {
              edgeElem.addClass('evaluating');
            }
          }
        }

        if (step.isFinal && step.highlight && Array.isArray(step.highlight.pathEdges)) {
          for (const edgeId of step.highlight.pathEdges) {
            const pathEdge = this.cy.getElementById(edgeId);
            if (pathEdge.length > 0) pathEdge.addClass('shortest-path');
          }
        }
      });
    }

    updateNodeSelectors(nodes) {
      const selectors = [
        { id: 'edge-from', placeholder: 'Origen...' },
        { id: 'edge-to', placeholder: 'Destino...' },
        { id: 'dijkstra-origin', placeholder: 'Seleccionar origen...' },
        { id: 'dijkstra-destination', placeholder: 'Seleccionar destino...' }
      ];

      for (const { id, placeholder } of selectors) {
        const select = document.getElementById(id);
        if (!select) continue;

        const currentVal = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>`;

        for (const node of nodes) {
          const opt = document.createElement('option');
          opt.value = node;
          opt.textContent = `Vértice ${node}`;
          select.appendChild(opt);
        }

        if (nodes.includes(currentVal)) {
          select.value = currentVal;
        }
      }
    }

    updateEdgeTable(edges, onDeleteEdge) {
      const tbody = document.getElementById('edges-table-body');
      const countBadge = document.getElementById('edges-count-badge');
      if (!tbody) return;

      if (countBadge) {
        countBadge.textContent = `${edges.length} arista(s)`;
      }

      if (edges.length === 0) {
        tbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="4" class="text-center text-muted py-3">
              No hay aristas agregadas. Use el formulario superior o la generación aleatoria.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = '';
      edges.forEach(edge => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="badge badge-node">${edge.from}</span></td>
          <td><span class="badge badge-node">${edge.to}</span></td>
          <td><strong>${edge.weight}</strong></td>
          <td>
            <button class="btn btn-sm btn-outline-danger delete-edge-btn" data-from="${edge.from}" data-to="${edge.to}" title="Eliminar arista">
              ✕
            </button>
          </td>
        `;

        const deleteBtn = tr.querySelector('.delete-edge-btn');
        if (deleteBtn && onDeleteEdge) {
          deleteBtn.addEventListener('click', () => {
            onDeleteEdge(edge.from, edge.to);
          });
        }
        tbody.appendChild(tr);
      });
    }

    updateAdjacencyList(adjList) {
      const container = document.getElementById('adjacency-list-content');
      if (!container) return;

      const nodes = Object.keys(adjList);
      if (nodes.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0">Grafo vacío. Configure los nodos.</p>';
        return;
      }

      let html = '<div class="adj-list-grid">';
      for (const node of nodes) {
        const neighbors = adjList[node] || [];
        const connectionsStr = neighbors.length > 0
          ? neighbors.map(n => `<span class="adj-item">→ <strong>${n.to}</strong> <small>(peso: ${n.weight})</small></span>`).join(' ')
          : '<span class="text-muted"><small>sin conexiones salientes</small></span>';

        html += `
          <div class="adj-list-row">
            <span class="badge badge-node mr-2">${node}</span>
            <div class="adj-items-wrapper">${connectionsStr}</div>
          </div>
        `;
      }
      html += '</div>';
      container.innerHTML = html;
    }

    updateAdjacencyMatrix(adjMatrixData) {
      const container = document.getElementById('adjacency-matrix-content');
      if (!container) return;

      const { nodes, matrix } = adjMatrixData;
      if (nodes.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0">Grafo vacío. Configure los nodos.</p>';
        return;
      }

      let html = '<div class="table-responsive"><table class="matrix-table">';
      html += '<thead><tr><th class="matrix-corner">V\\V</th>';
      for (const node of nodes) {
        html += `<th>${node}</th>`;
      }
      html += '</tr></thead><tbody>';

      for (let i = 0; i < nodes.length; i++) {
        html += `<tr><th>${nodes[i]}</th>`;
        for (let j = 0; j < nodes.length; j++) {
          const val = matrix[i][j];
          if (i === j) {
            html += '<td class="matrix-diag">0</td>';
          } else if (val === null || val === undefined) {
            html += '<td class="matrix-inf">∞</td>';
          } else {
            html += `<td class="matrix-val">${val}</td>`;
          }
        }
        html += '</tr>';
      }

      html += '</tbody></table></div>';
      container.innerHTML = html;
    }

    updateDijkstraStepView(step, progress, origin, destination) {
      if (!step) return;

      const stepBadge = document.getElementById('step-counter-badge');
      const progressBar = document.getElementById('step-progress-bar');
      if (stepBadge) {
        stepBadge.textContent = `Paso ${progress.current} de ${progress.total}`;
      }
      if (progressBar) {
        progressBar.style.width = `${progress.percentage}%`;
      }

      const iterTitle = document.getElementById('step-iteration-title');
      const currentNodeBadge = document.getElementById('step-current-node-badge');
      if (iterTitle) {
        iterTitle.textContent = step.title;
      }
      if (currentNodeBadge) {
        if (step.currentNode) {
          currentNodeBadge.textContent = `Vértice actual: ${step.currentNode}`;
          currentNodeBadge.style.display = 'inline-block';
        } else {
          currentNodeBadge.style.display = 'none';
        }
      }

      const explanationEl = document.getElementById('step-explanation-text');
      const mathEl = document.getElementById('step-math-operation');
      if (explanationEl) {
        explanationEl.textContent = step.explanation;
      }
      if (mathEl) {
        mathEl.textContent = step.mathOperation || '';
      }

      this.updateDijkstraLabelsTable(step, origin, destination);
      this.updateResultsSummary(step);
    }

    updateDijkstraLabelsTable(step, origin, destination) {
      const tbody = document.getElementById('dijkstra-labels-body');
      if (!tbody) return;

      const nodes = Object.keys(step.distances);
      tbody.innerHTML = '';

      for (const node of nodes) {
        const dist = step.distances[node];
        const distStr = dist === Infinity ? '∞' : String(dist);
        const preds = step.predecessors[node] || [];
        const predsStr = preds.length > 0 ? preds.join(', ') : '—';

        let estado = '';
        let badgeClass = '';
        let rowHighlightClass = '';

        if (node === origin) {
          estado = 'Origen';
          badgeClass = 'badge-origin';
        } else if (step.visited.includes(node)) {
          estado = 'Visitado';
          badgeClass = 'badge-visited';
        } else if (dist === Infinity) {
          estado = 'Inalcanzable';
          badgeClass = 'badge-unreachable';
        } else {
          estado = 'Pendiente';
          badgeClass = 'badge-pending';
        }

        if (node === step.currentNode) {
          rowHighlightClass = 'table-row-current';
        } else if (step.highlight && step.highlight.targetNode === node) {
          rowHighlightClass = 'table-row-target';
        }

        const tr = document.createElement('tr');
        if (rowHighlightClass) tr.className = rowHighlightClass;

        tr.innerHTML = `
          <td><strong class="node-letter">${node}</strong></td>
          <td><span class="dist-val">${distStr}</span></td>
          <td><span class="pred-val">${predsStr}</span></td>
          <td><span class="badge ${badgeClass}">${estado}</span></td>
        `;
        tbody.appendChild(tr);
      }
    }

    updateResultsSummary(step) {
      const resultsContainer = document.getElementById('dijkstra-final-results');
      if (!resultsContainer) return;

      if (!step.isFinal || !step.finalData) {
        resultsContainer.style.display = 'none';
        return;
      }

      resultsContainer.style.display = 'block';
      const { reachable, distance, paths, pathCount, origin, destination } = step.finalData;

      if (!reachable) {
        resultsContainer.innerHTML = `
          <div class="alert alert-warning mb-0">
            <h5 class="alert-heading">⚠️ Destino Inalcanzable</h5>
            <p class="mb-0">
              No existe una ruta dirigida desde el vértice origen <strong>${origin}</strong>
              hasta el vértice destino <strong>${destination}</strong>.
              La distancia calculada es <strong>∞</strong>.
            </p>
          </div>
        `;
        return;
      }

      let pathsHtml = '<ol class="paths-list mb-0">';
      for (const p of paths) {
        pathsHtml += `<li><strong class="path-sequence">${p.join(' → ')}</strong> <span class="badge badge-cost">Costo: ${distance}</span></li>`;
      }
      pathsHtml += '</ol>';

      const multipleBadge = pathCount > 1
        ? `<div class="badge badge-multi-solution mb-2">✨ ¡Existen ${pathCount} caminos mínimos óptimos de igual distancia!</div>`
        : `<div class="badge badge-unique-solution mb-2">✓ Camino mínimo único encontrado</div>`;

      resultsContainer.innerHTML = `
        <div class="card result-card">
          <div class="result-header">
            <h4 class="mb-1">🎉 Resultado Óptimo del Algoritmo</h4>
            ${multipleBadge}
          </div>
          <div class="result-metrics-grid">
            <div class="metric-box">
              <span class="metric-label">Distancia Mínima</span>
              <span class="metric-number">${distance}</span>
            </div>
            <div class="metric-box">
              <span class="metric-label">Caminos Mínimos</span>
              <span class="metric-number">${pathCount}</span>
            </div>
            <div class="metric-box">
              <span class="metric-label">Recorrido</span>
              <span class="metric-number">${origin} → ${destination}</span>
            </div>
          </div>
          <div class="result-paths-detail">
            <h6 class="text-uppercase text-muted font-weight-bold mb-2">Secuencia(s) de Vértices:</h6>
            ${pathsHtml}
          </div>
          <div class="result-footer-note">
            <small class="text-muted">Las aristas que componen todas las rutas óptimas han sido resaltadas en rojo carmesí sobre el grafo visual.</small>
          </div>
        </div>
      `;
    }

    showMessage(message, type = 'info') {
      const alertBox = document.getElementById('global-alert-box');
      if (!alertBox) return;

      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }

      alertBox.className = `alert alert-${type} show`;
      alertBox.innerHTML = `
        <span>${message}</span>
        <button type="button" class="alert-close-btn" onclick="this.parentElement.className='alert alert-hidden'">✕</button>
      `;

      if (type === 'success' || type === 'info') {
        this.toastTimeout = setTimeout(() => {
          alertBox.className = 'alert alert-hidden';
        }, 6000);
      }
    }
  }

  // ==========================================
  // 7. APLICACIÓN PRINCIPAL (app.js)
  // ==========================================
  class App {
    constructor() {
      this.graph = new Graph();
      this.ui = new UIManager();
      this.stepManager = new StepManager();
      this.currentOrigin = null;
      this.currentDestination = null;
      this.isDijkstraActive = false;
    }

    init() {
      this.ui.initCytoscape('cy-container');
      this.setupEventListeners();
      this.loadInitialDemo();
    }

    setupEventListeners() {
      const btnCreateNodes = document.getElementById('btn-create-nodes');
      if (btnCreateNodes) {
        btnCreateNodes.addEventListener('click', () => this.handleCreateNodes());
      }

      const btnResetProject = document.getElementById('btn-reset-project');
      if (btnResetProject) {
        btnResetProject.addEventListener('click', () => this.handleResetProject());
      }

      const tabManualBtn = document.getElementById('tab-btn-manual');
      const tabRandomBtn = document.getElementById('tab-btn-random');
      const paneManual = document.getElementById('pane-manual');
      const paneRandom = document.getElementById('pane-random');

      if (tabManualBtn && tabRandomBtn && paneManual && paneRandom) {
        tabManualBtn.addEventListener('click', () => {
          tabManualBtn.classList.add('active');
          tabRandomBtn.classList.remove('active');
          paneManual.classList.remove('d-none');
          paneRandom.classList.add('d-none');
        });

        tabRandomBtn.addEventListener('click', () => {
          tabRandomBtn.classList.add('active');
          tabManualBtn.classList.remove('active');
          paneRandom.classList.remove('d-none');
          paneManual.classList.add('d-none');
        });
      }

      const btnAddEdge = document.getElementById('btn-add-edge');
      if (btnAddEdge) {
        btnAddEdge.addEventListener('click', () => this.handleAddEdge());
      }

      const btnClearEdges = document.getElementById('btn-clear-edges');
      if (btnClearEdges) {
        btnClearEdges.addEventListener('click', () => this.handleClearEdges());
      }

      const btnGenerateRandom = document.getElementById('btn-generate-random');
      if (btnGenerateRandom) {
        btnGenerateRandom.addEventListener('click', () => this.handleGenerateRandomDAG());
      }

      const btnLoadExample = document.getElementById('btn-load-example');
      if (btnLoadExample) {
        btnLoadExample.addEventListener('click', () => this.handleLoadDemoExample());
      }

      const btnFitGraph = document.getElementById('btn-fit-graph');
      if (btnFitGraph) {
        btnFitGraph.addEventListener('click', () => this.ui.fitGraph());
      }

      const btnStartDijkstra = document.getElementById('btn-start-dijkstra');
      if (btnStartDijkstra) {
        btnStartDijkstra.addEventListener('click', () => this.handleStartDijkstra());
      }

      const btnPrevStep = document.getElementById('btn-prev-step');
      if (btnPrevStep) {
        btnPrevStep.addEventListener('click', () => this.handlePrevStep());
      }

      const btnNextStep = document.getElementById('btn-next-step');
      if (btnNextStep) {
        btnNextStep.addEventListener('click', () => this.handleNextStep());
      }

      const btnFinalStep = document.getElementById('btn-final-step');
      if (btnFinalStep) {
        btnFinalStep.addEventListener('click', () => this.handleFinalStep());
      }

      const btnResetDijkstra = document.getElementById('btn-reset-dijkstra');
      if (btnResetDijkstra) {
        btnResetDijkstra.addEventListener('click', () => this.handleResetDijkstra());
      }

      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (this.isDijkstraActive) {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.handleNextStep();
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.handlePrevStep();
          } else if (e.key === 'End') {
            e.preventDefault();
            this.handleFinalStep();
          } else if (e.key === 'Home') {
            e.preventDefault();
            this.handleResetDijkstra();
          }
        }
      });
    }

    loadInitialDemo() {
      this.handleLoadDemoExample(false);
    }

    handleCreateNodes() {
      const input = document.getElementById('node-count-input');
      if (!input) return;

      const validation = validateNodeCount(input.value);
      if (!validation.isValid) {
        this.ui.showMessage(validation.error, 'error');
        return;
      }

      const count = validation.value;
      this.graph.setNodes(count);
      this.resetDijkstraExecutionState();
      this.refreshAllGraphViews();
      this.ui.showMessage(`Se han generado con éxito ${count} nodos: [${this.graph.getNodes().join(', ')}].`, 'success');
    }

    handleResetProject() {
      this.graph.reset();
      this.resetDijkstraExecutionState();
      const input = document.getElementById('node-count-input');
      if (input) input.value = '';
      this.refreshAllGraphViews();
      this.ui.showMessage('El proyecto ha sido reiniciado. Ingrese una cantidad de nodos para comenzar.', 'info');
    }

    handleAddEdge() {
      const fromSelect = document.getElementById('edge-from');
      const toSelect = document.getElementById('edge-to');
      const weightInput = document.getElementById('edge-weight');
      if (!fromSelect || !toSelect || !weightInput) return;

      const from = fromSelect.value;
      const to = toSelect.value;
      const weight = weightInput.value;

      const validation = validateNewEdge(this.graph, from, to, weight);
      if (!validation.isValid) {
        this.ui.showMessage(validation.error, 'error');
        return;
      }

      this.graph.addEdge(from, to, validation.weight);
      this.resetDijkstraExecutionState();
      weightInput.value = '';
      this.refreshAllGraphViews();
      this.ui.showMessage(`Arista dirigida ${from} → ${to} (peso ${validation.weight}) agregada correctamente.`, 'success');
    }

    handleDeleteEdge(from, to) {
      const removed = this.graph.removeEdge(from, to);
      if (removed) {
        this.resetDijkstraExecutionState();
        this.refreshAllGraphViews();
        this.ui.showMessage(`Arista ${from} → ${to} eliminada.`, 'info');
      }
    }

    handleClearEdges() {
      if (this.graph.getEdges().length === 0) {
        this.ui.showMessage('No hay aristas para limpiar.', 'warning');
        return;
      }
      this.graph.clearEdges();
      this.resetDijkstraExecutionState();
      this.refreshAllGraphViews();
      this.ui.showMessage('Todas las aristas han sido eliminadas.', 'info');
    }

    handleGenerateRandomDAG() {
      const nodes = this.graph.getNodes();
      if (nodes.length === 0) {
        this.graph.setNodes(8);
        const input = document.getElementById('node-count-input');
        if (input) input.value = 8;
      }

      const densitySelect = document.getElementById('random-density');
      const density = densitySelect ? densitySelect.value : 'media';

      this.graph.generateRandomDAG(density);
      this.resetDijkstraExecutionState();

      const currentNodes = this.graph.getNodes();
      const origSelect = document.getElementById('dijkstra-origin');
      const destSelect = document.getElementById('dijkstra-destination');
      if (origSelect && destSelect && currentNodes.length >= 2) {
        origSelect.value = currentNodes[0];
        destSelect.value = currentNodes[currentNodes.length - 1];
      }

      this.refreshAllGraphViews();
      this.ui.showMessage(`Grafo acíclico aleatorio generado con éxito (${this.graph.getEdges().length} aristas).`, 'success');
    }

    handleLoadDemoExample(showToast = true) {
      this.graph.loadDemonstrationExample();
      this.resetDijkstraExecutionState();

      const origSelect = document.getElementById('dijkstra-origin');
      const destSelect = document.getElementById('dijkstra-destination');
      const nodeInput = document.getElementById('node-count-input');

      if (nodeInput) nodeInput.value = 8;
      this.refreshAllGraphViews();

      if (origSelect) origSelect.value = 'A';
      if (destSelect) destSelect.value = 'H';

      if (showToast) {
        this.ui.showMessage('Caso de prueba cargado: 8 nodos (A-H), conectividad múltiple con 4 caminos mínimos de igual distancia (15).', 'success');
      }
    }

    handleStartDijkstra() {
      const origSelect = document.getElementById('dijkstra-origin');
      const destSelect = document.getElementById('dijkstra-destination');
      if (!origSelect || !destSelect) return;

      const origin = origSelect.value;
      const destination = destSelect.value;

      const validation = validateDijkstraStart(this.graph, origin, destination);
      if (!validation.isValid) {
        this.ui.showMessage(validation.error, 'error');
        return;
      }

      this.currentOrigin = origin;
      this.currentDestination = destination;

      const steps = runDijkstra(this.graph, origin, destination);
      this.stepManager.setSteps(steps);
      this.isDijkstraActive = true;

      this.updateNavigationButtonsState();
      this.renderCurrentStep();

      this.ui.showMessage(`Simulación iniciada: buscando camino(s) mínimo(s) de ${origin} a ${destination}.`, 'success');

      const execSection = document.getElementById('section-step-execution');
      if (execSection) {
        execSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    handleNextStep() {
      if (!this.isDijkstraActive || !this.stepManager.hasNext()) return;
      this.stepManager.nextStep();
      this.renderCurrentStep();
    }

    handlePrevStep() {
      if (!this.isDijkstraActive || !this.stepManager.hasPrev()) return;
      this.stepManager.prevStep();
      this.renderCurrentStep();
    }

    handleFinalStep() {
      if (!this.isDijkstraActive) return;
      this.stepManager.goToEnd();
      this.renderCurrentStep();
    }

    handleResetDijkstra() {
      if (!this.isDijkstraActive) return;
      this.stepManager.goToStart();
      this.renderCurrentStep();
    }

    renderCurrentStep() {
      const currentStep = this.stepManager.getCurrentStep();
      if (!currentStep) return;

      const progress = this.stepManager.getProgress();
      this.ui.applyStepVisualization(currentStep, this.currentOrigin, this.currentDestination);
      this.ui.updateDijkstraStepView(currentStep, progress, this.currentOrigin, this.currentDestination);
      this.updateNavigationButtonsState();
    }

    updateNavigationButtonsState() {
      const btnPrev = document.getElementById('btn-prev-step');
      const btnNext = document.getElementById('btn-next-step');
      const btnFinal = document.getElementById('btn-final-step');
      const btnReset = document.getElementById('btn-reset-dijkstra');

      if (!this.isDijkstraActive) {
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        if (btnFinal) btnFinal.disabled = true;
        if (btnReset) btnReset.disabled = true;
        return;
      }

      if (btnPrev) btnPrev.disabled = !this.stepManager.hasPrev();
      if (btnNext) btnNext.disabled = !this.stepManager.hasNext();
      if (btnFinal) btnFinal.disabled = this.stepManager.isAtEnd();
      if (btnReset) btnReset.disabled = this.stepManager.isAtStart();
    }

    resetDijkstraExecutionState() {
      this.isDijkstraActive = false;
      this.stepManager.reset();
      this.updateNavigationButtonsState();

      const resultsContainer = document.getElementById('dijkstra-final-results');
      if (resultsContainer) resultsContainer.style.display = 'none';

      const stepBadge = document.getElementById('step-counter-badge');
      const progressBar = document.getElementById('step-progress-bar');
      const iterTitle = document.getElementById('step-iteration-title');
      const currentNodeBadge = document.getElementById('step-current-node-badge');
      const explanationEl = document.getElementById('step-explanation-text');
      const mathEl = document.getElementById('step-math-operation');
      const tbody = document.getElementById('dijkstra-labels-body');

      if (stepBadge) stepBadge.textContent = 'Paso 0 de 0';
      if (progressBar) progressBar.style.width = '0%';
      if (iterTitle) iterTitle.textContent = 'Algoritmo no iniciado';
      if (currentNodeBadge) currentNodeBadge.style.display = 'none';
      if (explanationEl) explanationEl.textContent = 'Configure el origen y destino en la sección 4 y presione "Iniciar Dijkstra" para comenzar la simulación interactiva.';
      if (mathEl) mathEl.textContent = '';
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Inicie el algoritmo para observar el etiquetado de vértices.</td></tr>';
    }

    refreshAllGraphViews() {
      const nodes = this.graph.getNodes();
      const edges = this.graph.getEdges();
      const elements = this.graph.toCytoscapeElements();

      this.ui.renderGraph(elements);
      this.ui.updateNodeSelectors(nodes);
      this.ui.updateEdgeTable(edges, (from, to) => this.handleDeleteEdge(from, to));
      this.ui.updateAdjacencyList(this.graph.getAdjacencyList());
      this.ui.updateAdjacencyMatrix(this.graph.getAdjacencyMatrix());
    }
  }

  // Marcar como inicializado
  window.__APP_INITIALIZED__ = true;

  function start() {
    const app = new App();
    app.init();
    window.__appInstance = app;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
