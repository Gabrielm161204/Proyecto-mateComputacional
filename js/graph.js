/**
 * graph.js
 * Módulo para la representación interna del grafo dirigido y ponderado.
 * Gestiona nodos, aristas, lista de adyacencia, matriz de pesos y conversión a formato Cytoscape.js.
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
   * Carga un ejemplo de 8 nodos (A a H) con un único camino mínimo de A a H.
   * Camino mínimo: A -> B -> E -> G -> H (costo 15).
   * Incluye una relajación (A->D = 9 mejora a 7 por B->D, G = 14 mejora a 12
   * por E->G) y varias aristas descartadas, para mostrar cada caso del algoritmo.
   */
  loadDemonstrationExample() {
    this.setNodes(8);

    const demoEdges = [
      { from: 'A', to: 'B', weight: 4 },
      { from: 'A', to: 'C', weight: 5 },
      { from: 'A', to: 'D', weight: 9 },
      { from: 'B', to: 'D', weight: 3 },
      { from: 'C', to: 'D', weight: 3 },
      { from: 'B', to: 'E', weight: 6 },
      { from: 'B', to: 'F', weight: 8 },
      { from: 'C', to: 'F', weight: 6 },
      { from: 'D', to: 'G', weight: 7 },
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
