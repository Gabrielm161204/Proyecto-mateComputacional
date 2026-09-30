/**
 * graph.js
 * Módulo para la representación interna del grafo dirigido y ponderado.
 * Gestiona nodos, aristas, lista de adyacencia, matriz de pesos,
 * generación de DAGs aleatorios y conversión a formato Cytoscape.js.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

export class Graph {
  constructor() {
    this.nodes = []; // Array de etiquetas: ['A', 'B', ...]
    this.edges = []; // Array de objetos: [{ id, from, to, weight }]
  }

  /**
   * Genera los nodos con etiquetas alfabéticas consecutivas (A, B, C, ...).
   * @param {number} count - Cantidad de nodos (7 a 16).
   */
  setNodes(count) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.nodes = [];
    for (let i = 0; i < count; i++) {
      this.nodes.push(letters[i]);
    }
    this.edges = [];
  }

  /**
   * Obtiene la lista actual de nodos.
   * @returns {string[]}
   */
  getNodes() {
    return [...this.nodes];
  }

  /**
   * Obtiene la lista actual de aristas.
   * @returns {Array<{ id: string, from: string, to: string, weight: number }>}
   */
  getEdges() {
    return this.edges.map(e => ({ ...e }));
  }

  /**
   * Agrega una arista dirigida ponderada al grafo.
   * @param {string} from - Vértice origen.
   * @param {string} to - Vértice destino.
   * @param {number} weight - Peso entero positivo.
   * @returns {{ success: boolean, edge?: object }}
   */
  addEdge(from, to, weight) {
    const id = `${from}-${to}`;
    const edge = { id, from, to, weight: Number(weight) };
    this.edges.push(edge);
    return { success: true, edge };
  }

  /**
   * Elimina una arista dirigida.
   * @param {string} from - Vértice origen.
   * @param {string} to - Vértice destino.
   * @returns {boolean}
   */
  removeEdge(from, to) {
    const initialLength = this.edges.length;
    this.edges = this.edges.filter(e => !(e.from === from && e.to === to));
    return this.edges.length < initialLength;
  }

  /**
   * Elimina todas las aristas del grafo manteniendo los nodos.
   */
  clearEdges() {
    this.edges = [];
  }

  /**
   * Reinicia completamente el grafo (sin nodos ni aristas).
   */
  reset() {
    this.nodes = [];
    this.edges = [];
  }

  /**
   * Verifica si ya existe una arista en esa dirección.
   * @param {string} from 
   * @param {string} to 
   * @returns {boolean}
   */
  hasEdge(from, to) {
    return this.edges.some(e => e.from === from && e.to === to);
  }

  /**
   * Obtiene las aristas salientes de un nodo dado.
   * @param {string} node 
   * @returns {Array<{ id: string, from: string, to: string, weight: number }>}
   */
  getOutgoingEdges(node) {
    return this.edges.filter(e => e.from === node);
  }

  /**
   * Construye la lista de adyacencia del grafo.
   * @returns {Record<string, Array<{ to: string, weight: number }>>}
   */
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

  /**
   * Construye la matriz de adyacencia ponderada.
   * @returns {{ nodes: string[], matrix: Array<Array<number|null>> }}
   */
  getAdjacencyMatrix() {
    const n = this.nodes.length;
    const nodeIndex = new Map(this.nodes.map((node, i) => [node, i]));
    const matrix = Array.from({ length: n }, () => Array(n).fill(null));

    // Diagonal en 0
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 0;
    }

    // Pesos de las aristas
    for (const edge of this.edges) {
      const u = nodeIndex.get(edge.from);
      const v = nodeIndex.get(edge.to);
      if (u !== undefined && v !== undefined) {
        matrix[u][v] = edge.weight;
      }
    }

    return { nodes: [...this.nodes], matrix };
  }

  /**
   * Convierte los nodos y aristas a formato de elementos para Cytoscape.js,
   * asignando posiciones calculadas por niveles topológicos para un DAG perfecto.
   * @returns {Array<object>}
   */
  toCytoscapeElements() {
    const ranks = this.computeTopologicalRanks();
    const rankGroups = new Map();
    for (const node of this.nodes) {
      const r = ranks.get(node) || 0;
      if (!rankGroups.has(r)) rankGroups.set(r, []);
      rankGroups.get(r).push(node);
    }

    const elements = [];

    // Dimensiones para distribución visual de izquierda a derecha
    const xSpacing = 160;
    const ySpacing = 110;
    const xOffset = 80;
    const yOffset = 80;

    for (const [rank, groupNodes] of rankGroups.entries()) {
      const totalInRank = groupNodes.length;
      groupNodes.forEach((node, idx) => {
        // Centrar verticalmente cada columna
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

  /**
   * Calcula el rango o nivel topológico de cada nodo en el DAG.
   * Permite ordenar visualmente los nodos en capas de izquierda a derecha.
   * @returns {Map<string, number>}
   */
  computeTopologicalRanks() {
    const ranks = new Map(this.nodes.map(n => [n, 0]));
    const inDegree = new Map(this.nodes.map(n => [n, 0]));
    const adj = this.getAdjacencyList();

    for (const edge of this.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    // Cola de nodos con inDegree 0
    const queue = [];
    for (const node of this.nodes) {
      if (inDegree.get(node) === 0) {
        queue.push(node);
        ranks.set(node, 0);
      }
    }

    // Recorrido topológico para calcular distancias máximas en niveles
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

    // Si algún nodo quedó aislado o con inDegree distinto, asignar índice basado en su posición
    this.nodes.forEach((node, idx) => {
      if (!ranks.has(node) || Number.isNaN(ranks.get(node))) {
        ranks.set(node, Math.floor(idx / 2));
      }
    });

    return ranks;
  }

  /**
   * Genera un Grafo Dirigido Acíclico (DAG) ponderado aleatorio.
   * Garantiza:
   * 1. Aciclicidad estricta (aristas u_i -> u_j solo si i < j).
   * 2. Conectividad asegurada: al menos una ruta desde el primer nodo al último nodo.
   * 3. Pesos enteros positivos entre 1 y 20.
   * 4. Densidad ajustable ('baja', 'media', 'alta').
   * @param {'baja' | 'media' | 'alta'} density
   */
  generateRandomDAG(density = 'media') {
    if (this.nodes.length < 2) return;
    this.edges = [];

    const n = this.nodes.length;

    // 1. Garantizar una ruta conexa desde el primer nodo (índice 0) hasta el último (índice n - 1)
    // Seleccionamos nodos intermedios crecientes para formar una columna vertebral conexa
    const pathNodes = [0];
    let currentIdx = 0;
    while (currentIdx < n - 1) {
      const step = Math.min(n - 1, currentIdx + Math.floor(Math.random() * 2) + 1);
      pathNodes.push(step);
      currentIdx = step;
    }
    // Aseguramos que termine en n - 1
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

    // 2. Determinar número de aristas adicionales según la densidad elegida
    // Densidades relativas sobre el número de nodos
    let edgeTargetFactor;
    switch (density) {
      case 'baja':
        edgeTargetFactor = 1.3;
        break;
      case 'alta':
        edgeTargetFactor = 2.8;
        break;
      case 'media':
      default:
        edgeTargetFactor = 2.0;
        break;
    }

    const totalEdgesTarget = Math.min(
      Math.floor(n * edgeTargetFactor),
      Math.floor((n * (n - 1)) / 2) // Máximo teórico para un DAG
    );

    // Intentar agregar aristas respetando siempre i < j (garantía matemática de DAG sin ciclos)
    let attempts = 0;
    const maxAttempts = 500;
    while (this.edges.length < totalEdgesTarget && attempts < maxAttempts) {
      attempts++;
      const i = Math.floor(Math.random() * (n - 1));
      const j = Math.floor(Math.random() * (n - 1 - i)) + i + 1; // j > i

      const from = this.nodes[i];
      const to = this.nodes[j];

      if (!this.hasEdge(from, to)) {
        const weight = Math.floor(Math.random() * 20) + 1; // 1 a 20
        this.addEdge(from, to, weight);
      }
    }
  }

  /**
   * Carga un ejemplo académico estructurado con 8 nodos (A a H)
   * que contiene múltiples caminos mínimos de igual distancia entre A y H.
   * Diseñado específicamente para demostraciones académicas y sustentación.
   */
  loadDemonstrationExample() {
    // 8 nodos: A, B, C, D, E, F, G, H
    this.setNodes(8);

    // Conjunto de aristas con empates matemáticos exactos:
    // Camino 1: A -> B -> D -> G -> H: 4 + 3 + 5 + 3 = 15
    // Camino 2: A -> C -> D -> G -> H: 4 + 3 + 5 + 3 = 15
    // Camino 3: A -> B -> E -> G -> H: 4 + 6 + 2 + 3 = 15
    // Camino 4: A -> C -> F -> G -> H: 4 + 6 + 2 + 3 = 15
    // Aristas secundarias que se evalúan y descartan o mejoran:
    // A -> D (peso 9, mejorado a 7 por B->D y C->D)
    // D -> H (peso 12, descartado frente al camino por G)
    // B -> F (peso 8, descartado)

    const demoEdges = [
      { from: 'A', to: 'B', weight: 4 },
      { from: 'A', to: 'C', weight: 4 },
      { from: 'A', to: 'D', weight: 9 }, // Inicialmente pone dist(D)=9, luego se relaja a 7
      { from: 'B', to: 'D', weight: 3 }, // dist(D)=7, predecesor [B]
      { from: 'C', to: 'D', weight: 3 }, // dist(D)=7, empate -> predecesor [B, C]
      { from: 'B', to: 'E', weight: 6 }, // dist(E)=10
      { from: 'C', to: 'F', weight: 6 }, // dist(F)=10
      { from: 'B', to: 'F', weight: 8 }, // dist=12 > 10 (descartada)
      { from: 'D', to: 'G', weight: 5 }, // dist(G)=12, predecesor [D]
      { from: 'E', to: 'G', weight: 2 }, // dist(G)=12, empate -> predecesor [D, E]
      { from: 'F', to: 'G', weight: 2 }, // dist(G)=12, empate -> predecesor [D, E, F]
      { from: 'D', to: 'H', weight: 12 },// dist=19 > 15 (descartada)
      { from: 'G', to: 'H', weight: 3 }  // dist(H)=15, óptimo final
    ];

    for (const e of demoEdges) {
      this.addEdge(e.from, e.to, e.weight);
    }
  }
}
