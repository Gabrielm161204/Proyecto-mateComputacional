/**
 * grafo.js
 * Módulo para la representación interna del grafo dirigido y ponderado.
 * Gestiona nodos, aristas, lista de adyacencia, matriz de pesos y conversión a formato Cytoscape.js.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

export class Grafo {
  constructor() {
    this.nodos = []; // Array de etiquetas: ['A', 'B', ...]
    this.aristas = []; // Array de objetos: [{ id, origen, destino, peso }]
  }

  /**
   * Genera los nodos con etiquetas alfabéticas consecutivas (A, B, C, ...).
   * @param {number} cantidad - Cantidad de nodos (7 a 16).
   */
  establecerNodos(cantidad) {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.nodos = [];
    for (let i = 0; i < cantidad; i++) {
      this.nodos.push(letras[i]);
    }
    this.aristas = [];
  }

  /**
   * Obtiene la lista actual de nodos.
   * @returns {string[]}
   */
  obtenerNodos() {
    return [...this.nodos];
  }

  /**
   * Obtiene la lista actual de aristas.
   * @returns {Array<{ id: string, origen: string, destino: string, peso: number }>}
   */
  obtenerAristas() {
    return this.aristas.map(a => ({ ...a }));
  }

  /**
   * Agrega una arista dirigida ponderada al grafo.
   * @param {string} origen - Vértice origen.
   * @param {string} destino - Vértice destino.
   * @param {number} peso - Peso entero positivo.
   * @returns {{ exito: boolean, arista?: object }}
   */
  agregarArista(origen, destino, peso) {
    const id = `${origen}-${destino}`;
    const arista = {
      id,
      origen,
      destino,
      peso: Number(peso),
      from: origen,
      to: destino,
      weight: Number(peso)
    };
    this.aristas.push(arista);
    return { exito: true, arista };
  }

  /**
   * Elimina una arista dirigida.
   * @param {string} origen - Vértice origen.
   * @param {string} destino - Vértice destino.
   * @returns {boolean}
   */
  eliminarArista(origen, destino) {
    const longitudInicial = this.aristas.length;
    this.aristas = this.aristas.filter(a => !(a.origen === origen && a.destino === destino));
    return this.aristas.length < longitudInicial;
  }

  /**
   * Elimina todas las aristas del grafo manteniendo los nodos.
   */
  limpiarAristas() {
    this.aristas = [];
  }

  /**
   * Reinicia completamente el grafo (sin nodos ni aristas).
   */
  reiniciar() {
    this.nodos = [];
    this.aristas = [];
  }

  /**
   * Verifica si ya existe una arista en esa dirección.
   * @param {string} origen 
   * @param {string} destino 
   * @returns {boolean}
   */
  existeArista(origen, destino) {
    return this.aristas.some(a => a.origen === origen && a.destino === destino);
  }

  /**
   * Obtiene las aristas salientes de un nodo dado.
   * @param {string} nodo 
   * @returns {Array<{ id: string, origen: string, destino: string, peso: number }>}
   */
  obtenerAristasSalientes(nodo) {
    return this.aristas.filter(a => a.origen === nodo);
  }

  /**
   * Construye la lista de adyacencia del grafo.
   * @returns {Record<string, Array<{ destino: string, peso: number, to: string, weight: number }>>}
   */
  obtenerListaAdyacencia() {
    const adyacencia = {};
    for (const nodo of this.nodos) {
      adyacencia[nodo] = [];
    }
    for (const arista of this.aristas) {
      if (adyacencia[arista.origen]) {
        adyacencia[arista.origen].push({
          destino: arista.destino,
          peso: arista.peso,
          to: arista.destino,
          weight: arista.peso
        });
      }
    }
    return adyacencia;
  }

  /**
   * Construye la matriz de adyacencia ponderada.
   * @returns {{ nodos: string[], matriz: Array<Array<number|null>> }}
   */
  obtenerMatrizAdyacencia() {
    const n = this.nodos.length;
    const indiceNodo = new Map(this.nodos.map((nodo, i) => [nodo, i]));
    const matriz = Array.from({ length: n }, () => Array(n).fill(null));

    // Diagonal en 0
    for (let i = 0; i < n; i++) {
      matriz[i][i] = 0;
    }

    // Pesos de las aristas
    for (const arista of this.aristas) {
      const u = indiceNodo.get(arista.origen);
      const v = indiceNodo.get(arista.destino);
      if (u !== undefined && v !== undefined) {
        matriz[u][v] = arista.peso;
      }
    }

    return { nodos: [...this.nodos], matriz };
  }

  /**
   * Convierte los nodos y aristas a formato de elementos para Cytoscape.js,
   * asignando posiciones calculadas por niveles topológicos para un DAG.
   * @returns {Array<object>}
   */
  aElementosCytoscape() {
    const rangos = this.calcularRangosTopologicos();
    const gruposRango = new Map();
    for (const nodo of this.nodos) {
      const r = rangos.get(nodo) || 0;
      if (!gruposRango.has(r)) gruposRango.set(r, []);
      gruposRango.get(r).push(nodo);
    }

    const elementos = [];

    // Dimensiones para distribución visual de izquierda a derecha
    const espaciadoX = 160;
    const espaciadoY = 110;
    const desplazamientoX = 80;
    const desplazamientoY = 80;

    for (const [rango, nodosGrupo] of gruposRango.entries()) {
      const totalEnRango = nodosGrupo.length;
      nodosGrupo.forEach((nodo, indice) => {
        // Centrar verticalmente cada columna
        const posPosY = desplazamientoY + (indice - (totalEnRango - 1) / 2) * espaciadoY + 150;
        const posPosX = desplazamientoX + rango * espaciadoX;

        elementos.push({
          group: 'nodes',
          data: { id: nodo, label: nodo },
          position: { x: posPosX, y: posPosY }
        });
      });
    }

    for (const arista of this.aristas) {
      elementos.push({
        group: 'edges',
        data: {
          id: arista.id,
          source: arista.origen,
          target: arista.destino,
          weight: arista.peso,
          label: String(arista.peso)
        }
      });
    }

    return elementos;
  }

  /**
   * Calcula el rango o nivel topológico de cada nodo en el DAG.
   * Permite ordenar visualmente los nodos en capas de izquierda a derecha.
   * @returns {Map<string, number>}
   */
  calcularRangosTopologicos() {
    const rangos = new Map(this.nodos.map(n => [n, 0]));
    const gradoEntrada = new Map(this.nodos.map(n => [n, 0]));
    const adyacencia = this.obtenerListaAdyacencia();

    for (const arista of this.aristas) {
      gradoEntrada.set(arista.destino, (gradoEntrada.get(arista.destino) || 0) + 1);
    }

    // Cola de nodos con grado de entrada 0
    const cola = [];
    for (const nodo of this.nodos) {
      if (gradoEntrada.get(nodo) === 0) {
        cola.push(nodo);
        rangos.set(nodo, 0);
      }
    }

    // Recorrido topológico para calcular distancias máximas en niveles
    while (cola.length > 0) {
      const actual = cola.shift();
      const rangoActual = rangos.get(actual);
      const vecinos = adyacencia[actual] || [];

      for (const vecino of vecinos) {
        const destino = vecino.destino !== undefined ? vecino.destino : vecino.to;
        const siguienteRango = Math.max(rangos.get(destino) || 0, rangoActual + 1);
        rangos.set(destino, siguienteRango);
        gradoEntrada.set(destino, gradoEntrada.get(destino) - 1);
        if (gradoEntrada.get(destino) === 0) {
          cola.push(destino);
        }
      }
    }

    this.nodos.forEach((nodo, indice) => {
      if (!rangos.has(nodo) || Number.isNaN(rangos.get(nodo))) {
        rangos.set(nodo, Math.floor(indice / 2));
      }
    });

    return rangos;
  }

  /**
   * Carga un ejemplo de 8 nodos (A a H) con un único camino mínimo de A a H.
   * Camino mínimo: A -> B -> E -> G -> H (costo 15).
   */
  cargarEjemploDemostracion() {
    this.establecerNodos(8);

    const aristasDemo = [
      { origen: 'A', destino: 'B', peso: 4 },
      { origen: 'A', destino: 'C', peso: 5 },
      { origen: 'A', destino: 'D', peso: 9 },
      { origen: 'B', destino: 'D', peso: 3 },
      { origen: 'C', destino: 'D', peso: 3 },
      { origen: 'B', destino: 'E', peso: 6 },
      { origen: 'B', destino: 'F', peso: 8 },
      { origen: 'C', destino: 'F', peso: 6 },
      { origen: 'D', destino: 'G', peso: 7 },
      { origen: 'E', destino: 'G', peso: 2 },
      { origen: 'F', destino: 'G', peso: 2 },
      { origen: 'D', destino: 'H', peso: 12 },
      { origen: 'G', destino: 'H', peso: 3 }
    ];

    for (const a of aristasDemo) {
      this.agregarArista(a.origen, a.destino, a.peso);
    }
  }
}
