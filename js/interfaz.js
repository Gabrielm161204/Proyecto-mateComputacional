/**
 * interfaz.js
 * Módulo para la manipulación del DOM, renderizado de Cytoscape.js,
 * actualización de tablas, matrices, listas de adyacencia y control visual
 * de las etapas pedagógicas del algoritmo de Dijkstra.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

export class GestorInterfaz {
  constructor() {
    this.cy = null;
    this.temporizadorMensaje = null;
  }

  /**
   * Inicializa la instancia de Cytoscape.js en el contenedor designado.
   * Configura estilos visuales con soporte para DAGs,
   * etiquetas centradas, flechas dirigidas y estilos de resaltado de estados.
   * @param {string} idContenedor - ID del elemento contenedor en el DOM
   */
  inicializarCytoscape(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) {
      console.error(`Contenedor #${idContenedor} no encontrado para Cytoscape.`);
      return;
    }

    if (typeof cytoscape === 'undefined') {
      console.error('Cytoscape.js no está cargado. Verifique la conexión a Internet o el CDN.');
      this.mostrarMensaje('Error: No se pudo cargar Cytoscape.js desde el CDN.', 'error');
      return;
    }

    this.cy = cytoscape({
      container: contenedor,
      elements: [],
      boxSelectionEnabled: false,
      autounselectify: true,
      wheelSensitivity: 0.25,
      style: [
        // --- Estilo Base de Nodos ---
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-family': 'Inter, system-ui, -apple-system, sans-serif',
            'font-size': '15px',
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#0f172a',
            'background-color': '#f8fafc',
            'border-width': 3,
            'border-color': '#64748b',
            'width': 44,
            'height': 44
          }
        },

        // --- Nodo Origen ---
        {
          selector: 'node.origin',
          style: {
            'background-color': '#d1fae5',
            'border-color': '#059669',
            'border-width': 4,
            'color': '#064e3b'
          }
        },

        // --- Nodo Destino ---
        {
          selector: 'node.destination',
          style: {
            'background-color': '#ede9fe',
            'border-color': '#7c3aed',
            'border-width': 4,
            'color': '#4c1d95'
          }
        },

        // --- Nodo Actual (Examinado en la iteración) ---
        {
          selector: 'node.current',
          style: {
            'background-color': '#fef3c7',
            'border-color': '#d97706',
            'border-width': 5,
            'color': '#78350f',
            'width': 50,
            'height': 50
          }
        },

        // --- Nodo Vecino Evaluado ---
        {
          selector: 'node.target-evaluating',
          style: {
            'background-color': '#fed7aa',
            'border-color': '#ea580c',
            'border-width': 4,
            'color': '#7c2d12'
          }
        },

        // --- Nodo Visitado ---
        {
          selector: 'node.visited',
          style: {
            'background-color': '#e0f2fe',
            'border-color': '#0284c7',
            'border-width': 3,
            'color': '#0369a1'
          }
        },

        // --- Estilo Base de Aristas ---
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

        // --- Arista en Evaluación ---
        {
          selector: 'edge.evaluating',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'width': 4.5,
            'line-style': 'dashed'
          }
        },

        // --- Arista que Mejora la Distancia (Relajación) ---
        {
          selector: 'edge.improved',
          style: {
            'line-color': '#10b981',
            'target-arrow-color': '#10b981',
            'width': 5,
            'line-style': 'solid'
          }
        },

        // --- Arista que Pertenece a una Ruta Mínima Final ---
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

  /**
   * Renderiza los elementos del grafo en Cytoscape y ajusta el zoom al contenido.
   * @param {Array<object>} elementos - Elementos generados por grafo.aElementosCytoscape()
   */
  renderizarGrafo(elementos) {
    if (!this.cy) return;

    this.cy.batch(() => {
      this.cy.elements().remove();
      this.cy.add(elementos);
    });

    this.cy.fit(undefined, 35);
  }

  /**
   * Restablece el centrado y zoom del grafo en Cytoscape.
   */
  ajustarVistaGrafo() {
    if (!this.cy) return;
    this.cy.fit(undefined, 35);
  }

  /**
   * Actualiza visualmente el grafo reflejando el estado de un paso de Dijkstra.
   * @param {object} paso - Objeto de paso con datos de resaltado
   * @param {string} origen - Vértice origen
   * @param {string} destino - Vértice destino
   */
  aplicarVisualizacionPaso(paso, origen, destino) {
    if (!this.cy || !paso) return;

    this.cy.batch(() => {
      // 1. Limpiar clases dinámicas previas
      this.cy.nodes().removeClass('origin destination current target-evaluating visited');
      this.cy.edges().removeClass('evaluating improved shortest-path');

      // 2. Resaltar origen y destino estructurales
      if (origen) {
        const nodoOrigen = this.cy.getElementById(origen);
        if (nodoOrigen.length > 0) nodoOrigen.addClass('origin');
      }
      if (destino) {
        const nodoDestino = this.cy.getElementById(destino);
        if (nodoDestino.length > 0) nodoDestino.addClass('destination');
      }

      // 3. Marcar nodos visitados
      const visitados = paso.visitados || paso.visited || [];
      if (Array.isArray(visitados)) {
        for (const v of visitados) {
          const nodoV = this.cy.getElementById(v);
          if (nodoV.length > 0 && v !== origen && v !== destino) {
            nodoV.addClass('visited');
          }
        }
      }

      // 4. Marcar nodo actual
      const nodoActual = paso.nodoActual || paso.currentNode;
      if (nodoActual) {
        const nodoActualElem = this.cy.getElementById(nodoActual);
        if (nodoActualElem.length > 0) {
          nodoActualElem.addClass('current');
        }
      }

      // 5. Marcar vecino en evaluación
      const resaltado = paso.resaltado || paso.highlight || {};
      const nodoObjetivo = resaltado.nodoObjetivo || resaltado.targetNode;
      if (nodoObjetivo) {
        const nodoObjElem = this.cy.getElementById(nodoObjetivo);
        if (nodoObjElem.length > 0) {
          nodoObjElem.addClass('target-evaluating');
        }
      }

      // 6. Resaltar arista en evaluación
      const aristaEvaluada = resaltado.aristaEvaluada || resaltado.evaluatingEdge;
      if (aristaEvaluada) {
        const aristaElem = this.cy.getElementById(aristaEvaluada);
        if (aristaElem.length > 0) {
          if (resaltado.aristaMejorada || resaltado.improvedEdge) {
            aristaElem.addClass('improved');
          } else {
            aristaElem.addClass('evaluating');
          }
        }
      }

      // 7. Resaltar el camino mínimo final si es el paso final
      const esFinal = paso.esFinal || paso.isFinal;
      const aristasCamino = resaltado.aristasDelCamino || resaltado.pathEdges || [];
      if (esFinal && Array.isArray(aristasCamino)) {
        for (const idArista of aristasCamino) {
          const aristaCaminoElem = this.cy.getElementById(idArista);
          if (aristaCaminoElem.length > 0) {
            aristaCaminoElem.addClass('shortest-path');
          }
        }
      }
    });
  }

  /**
   * Actualiza las opciones de todos los selectores de nodos en el DOM.
   * @param {string[]} nodos - Lista de etiquetas de nodos
   */
  actualizarSelectoresNodos(nodos) {
    const selectores = [
      { id: 'edge-from', marcador: 'Origen...' },
      { id: 'edge-to', marcador: 'Destino...' },
      { id: 'dijkstra-origin', marcador: 'Seleccionar origen...' },
      { id: 'dijkstra-destination', marcador: 'Seleccionar destino...' }
    ];

    for (const { id, marcador } of selectores) {
      const select = document.getElementById(id);
      if (!select) continue;

      const valorActual = select.value;
      select.innerHTML = `<option value="">${marcador}</option>`;

      for (const nodo of nodos) {
        const opcion = document.createElement('option');
        opcion.value = nodo;
        opcion.textContent = `Vértice ${nodo}`;
        select.appendChild(opcion);
      }

      // Preservar selección previa si aún existe
      if (nodos.includes(valorActual)) {
        select.value = valorActual;
      }
    }
  }

  /**
   * Actualiza la tabla visual de aristas agregadas en la sección manual.
   * @param {Array<{ id: string, origen: string, destino: string, peso: number }>} aristas 
   * @param {Function} alEliminarArista - Callback para eliminar arista
   */
  actualizarTablaAristas(aristas, alEliminarArista) {
    const cuerpoTabla = document.getElementById('edges-table-body');
    const placaContador = document.getElementById('edges-count-badge');
    if (!cuerpoTabla) return;

    if (placaContador) {
      placaContador.textContent = `${aristas.length} arista(s)`;
    }

    if (aristas.length === 0) {
      cuerpoTabla.innerHTML = `
        <tr class="empty-row">
          <td colspan="4" class="text-center text-muted py-3">
            No hay aristas agregadas. Use el formulario superior para agregar aristas.
          </td>
        </tr>
      `;
      return;
    }

    cuerpoTabla.innerHTML = '';
    aristas.forEach((arista) => {
      const origen = arista.origen !== undefined ? arista.origen : arista.from;
      const destino = arista.destino !== undefined ? arista.destino : arista.to;
      const peso = arista.peso !== undefined ? arista.peso : arista.weight;

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><span class="badge badge-node">${origen}</span></td>
        <td><span class="badge badge-node">${destino}</span></td>
        <td><strong>${peso}</strong></td>
        <td>
          <button class="btn btn-sm btn-outline-danger delete-edge-btn" data-origen="${origen}" data-destino="${destino}" title="Eliminar arista">
            ✕
          </button>
        </td>
      `;

      const botonEliminar = fila.querySelector('.delete-edge-btn');
      if (botonEliminar && alEliminarArista) {
        botonEliminar.addEventListener('click', () => {
          alEliminarArista(origen, destino);
        });
      }

      cuerpoTabla.appendChild(fila);
    });
  }

  /**
   * Actualiza la representación textual de la Lista de Adyacencia.
   * @param {Record<string, Array<{ destino: string, peso: number }>>} listaAdyacencia 
   */
  actualizarListaAdyacencia(listaAdyacencia) {
    const contenedor = document.getElementById('adjacency-list-content');
    if (!contenedor) return;

    const nodos = Object.keys(listaAdyacencia);
    if (nodos.length === 0) {
      contenedor.innerHTML = '<p class="text-muted mb-0">Grafo vacío. Configure los nodos.</p>';
      return;
    }

    let html = '<div class="adj-list-grid">';
    for (const nodo of nodos) {
      const vecinos = listaAdyacencia[nodo] || [];
      const conexionesTexto = vecinos.length > 0
        ? vecinos.map(n => {
            const dest = n.destino !== undefined ? n.destino : n.to;
            const p = n.peso !== undefined ? n.peso : n.weight;
            return `<span class="adj-item">→ <strong>${dest}</strong> <small>(peso: ${p})</small></span>`;
          }).join(' ')
        : '<span class="text-muted"><small>sin conexiones salientes</small></span>';

      html += `
        <div class="adj-list-row">
          <span class="badge badge-node mr-2">${nodo}</span>
          <div class="adj-items-wrapper">${conexionesTexto}</div>
        </div>
      `;
    }
    html += '</div>';
    contenedor.innerHTML = html;
  }

  /**
   * Actualiza la Matriz de Pesos o Matriz de Adyacencia Ponderada.
   * Representa valores sin conexión como "∞".
   * @param {{ nodos: string[], matriz: Array<Array<number|null>> }} datosMatriz 
   */
  actualizarMatrizAdyacencia(datosMatriz) {
    const contenedor = document.getElementById('adjacency-matrix-content');
    if (!contenedor) return;

    const nodos = datosMatriz.nodos || datosMatriz.nodes || [];
    const matriz = datosMatriz.matriz || datosMatriz.matrix || [];
    if (nodos.length === 0) {
      contenedor.innerHTML = '<p class="text-muted mb-0">Grafo vacío. Configure los nodos.</p>';
      return;
    }

    let html = '<div class="table-responsive"><table class="matrix-table">';
    html += '<thead><tr><th class="matrix-corner">V\\V</th>';
    for (const nodo of nodos) {
      html += `<th>${nodo}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < nodos.length; i++) {
      html += `<tr><th>${nodos[i]}</th>`;
      for (let j = 0; j < nodos.length; j++) {
        const valor = matriz[i][j];
        if (i === j) {
          html += '<td class="matrix-diag">0</td>';
        } else if (valor === null || valor === undefined) {
          html += '<td class="matrix-inf">∞</td>';
        } else {
          html += `<td class="matrix-val">${valor}</td>`;
        }
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    contenedor.innerHTML = html;
  }

  /**
   * Actualiza el panel de información didáctica y la tabla de etiquetas para el paso actual.
   * @param {object} paso - Objeto de paso generado por dijkstra.js
   * @param {object} progreso - Progreso del gestor de pasos: { actual, total, porcentaje }
   * @param {string} origen - Vértice origen
   */
  actualizarVistaPasoDijkstra(paso, progreso, origen) {
    if (!paso) return;

    const actual = progreso.actual !== undefined ? progreso.actual : progreso.current;
    const total = progreso.total;
    const porcentaje = progreso.porcentaje !== undefined ? progreso.porcentaje : progreso.percentage;

    // 1. Contador de pasos y barra de progreso
    const placaPaso = document.getElementById('step-counter-badge');
    const barraProgreso = document.getElementById('step-progress-bar');
    if (placaPaso) {
      placaPaso.textContent = `Paso ${actual} de ${total}`;
    }
    if (barraProgreso) {
      barraProgreso.style.width = `${porcentaje}%`;
    }

    // 2. Título de iteración y nodo actual
    const tituloIteracion = document.getElementById('step-iteration-title');
    const placaNodoActual = document.getElementById('step-current-node-badge');
    if (tituloIteracion) {
      tituloIteracion.textContent = paso.titulo || paso.title;
    }
    const nodoActual = paso.nodoActual || paso.currentNode;
    if (placaNodoActual) {
      if (nodoActual) {
        placaNodoActual.textContent = `Vértice actual: ${nodoActual}`;
        placaNodoActual.style.display = 'inline-block';
      } else {
        placaNodoActual.style.display = 'none';
      }
    }

    // 3. Explicación didáctica y operación matemática
    const textoExplicacion = document.getElementById('step-explanation-text');
    const operacionMatematica = document.getElementById('step-math-operation');
    if (textoExplicacion) {
      textoExplicacion.textContent = paso.explicacion || paso.explanation;
    }
    if (operacionMatematica) {
      operacionMatematica.textContent = paso.operacionMatematica || paso.mathOperation || '';
    }

    // 4. Tabla de etiquetas de Dijkstra
    this.actualizarTablaEtiquetasDijkstra(paso, origen);

    // 5. Panel de resultados finales
    this.actualizarResumenResultados(paso);
  }

  /**
   * Actualiza la tabla de etiquetas (Vértice, Distancia acumulada, Predecesor, Estado).
   * @param {object} paso 
   * @param {string} origen 
   */
  actualizarTablaEtiquetasDijkstra(paso, origen) {
    const cuerpoTabla = document.getElementById('dijkstra-labels-body');
    if (!cuerpoTabla) return;

    const distancias = paso.distancias || paso.distances || {};
    const predecesores = paso.predecesores || paso.predecessors || {};
    const visitados = paso.visitados || paso.visited || [];
    const nodoActual = paso.nodoActual || paso.currentNode;
    const resaltado = paso.resaltado || paso.highlight || {};
    const nodoObjetivo = resaltado.nodoObjetivo || resaltado.targetNode;

    const nodos = Object.keys(distancias);
    cuerpoTabla.innerHTML = '';

    for (const nodo of nodos) {
      const dist = distancias[nodo];
      const distTexto = dist === Infinity ? '∞' : String(dist);
      const predTexto = predecesores[nodo] || '—';

      // Determinar estado semántico del nodo
      let estado = '';
      let claseBadge = '';
      let claseFila = '';

      if (nodo === origen) {
        estado = 'Origen';
        claseBadge = 'badge-origin';
      } else if (visitados.includes(nodo)) {
        estado = 'Visitado';
        claseBadge = 'badge-visited';
      } else if (dist === Infinity) {
        estado = 'Inalcanzable';
        claseBadge = 'badge-unreachable';
      } else {
        estado = 'Pendiente';
        claseBadge = 'badge-pending';
      }

      if (nodo === nodoActual) {
        claseFila = 'table-row-current';
      } else if (nodoObjetivo === nodo) {
        claseFila = 'table-row-target';
      }

      const fila = document.createElement('tr');
      if (claseFila) fila.className = claseFila;

      fila.innerHTML = `
        <td><strong class="node-letter">${nodo}</strong></td>
        <td><span class="dist-val">${distTexto}</span></td>
        <td><span class="pred-val">${predTexto}</span></td>
        <td><span class="badge ${claseBadge}">${estado}</span></td>
      `;

      cuerpoTabla.appendChild(fila);
    }
  }

  /**
   * Actualiza el panel de resultado final (distancia y camino mínimo).
   * @param {object} paso
   */
  actualizarResumenResultados(paso) {
    const contenedorResultados = document.getElementById('dijkstra-final-results');
    if (!contenedorResultados) return;

    const esFinal = paso.esFinal || paso.isFinal;
    const datosFinales = paso.datosFinales || paso.finalData;

    if (!esFinal || !datosFinales) {
      contenedorResultados.style.display = 'none';
      return;
    }

    contenedorResultados.style.display = 'block';
    const alcanzable = datosFinales.alcanzable !== undefined ? datosFinales.alcanzable : datosFinales.reachable;
    const distancia = datosFinales.distancia !== undefined ? datosFinales.distancia : datosFinales.distance;
    const camino = datosFinales.camino || datosFinales.path || [];
    const origen = datosFinales.origen || datosFinales.origin;
    const destino = datosFinales.destino || datosFinales.destination;

    if (!alcanzable) {
      contenedorResultados.innerHTML = `
        <div class="alert alert-warning">
          <span>⚠️ <strong>Destino inalcanzable:</strong> no existe una ruta dirigida de
          <strong>${origen}</strong> a <strong>${destino}</strong> (distancia = ∞).</span>
        </div>
      `;
      return;
    }

    contenedorResultados.innerHTML = `
      <div class="card result-card">
        <div class="result-header">
          <h4>Resultado del algoritmo</h4>
        </div>
        <div class="result-metrics-grid">
          <div class="metric-box">
            <span class="metric-label">Distancia mínima</span>
            <span class="metric-number">${distancia}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Camino mínimo</span>
            <span class="metric-number path-sequence">${camino.join(' → ')}</span>
          </div>
        </div>
        <div class="result-footer-note">
          <small class="text-muted">Las aristas del camino mínimo se resaltan en rojo sobre el grafo.</small>
        </div>
      </div>
    `;
  }

  /** Restablece el panel de ejecución al estado "no iniciado". */
  reiniciarVistaPasos() {
    const aplicarSiExiste = (id, accion) => {
      const elemento = document.getElementById(id);
      if (elemento) accion(elemento);
    };

    aplicarSiExiste('dijkstra-final-results', el => { el.style.display = 'none'; });
    aplicarSiExiste('step-counter-badge', el => { el.textContent = 'Paso 0 de 0'; });
    aplicarSiExiste('step-progress-bar', el => { el.style.width = '0%'; });
    aplicarSiExiste('step-iteration-title', el => { el.textContent = 'Algoritmo no iniciado'; });
    aplicarSiExiste('step-current-node-badge', el => { el.style.display = 'none'; });
    aplicarSiExiste('step-explanation-text', el => {
      el.textContent = 'Seleccione el origen y destino y presione "Iniciar Dijkstra" para comenzar la simulación paso a paso.';
    });
    aplicarSiExiste('step-math-operation', el => { el.textContent = ''; });
    aplicarSiExiste('dijkstra-labels-body', el => {
      el.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Inicie el algoritmo para observar el etiquetado de vértices.</td></tr>';
    });
  }

  /** Quita los resaltados de ejecución del grafo. */
  limpiarVisualizacionPasos() {
    if (!this.cy) return;
    this.cy.nodes().removeClass('origin destination current target-evaluating visited');
    this.cy.edges().removeClass('evaluating improved shortest-path');
  }

  /**
   * Muestra un mensaje flotante (toast) o banner no bloqueante en la interfaz.
   * @param {string} mensaje - Texto del mensaje
   * @param {'success' | 'warning' | 'error' | 'info'} tipo - Tipo semántico
   */
  mostrarMensaje(mensaje, tipo = 'info') {
    const cajaAlerta = document.getElementById('global-alert-box');
    if (!cajaAlerta) return;

    if (this.temporizadorMensaje) {
      clearTimeout(this.temporizadorMensaje);
    }

    cajaAlerta.className = `alert alert-${tipo} show`;
    cajaAlerta.innerHTML = `
      <span>${mensaje}</span>
      <button type="button" class="alert-close-btn" onclick="this.parentElement.className='alert alert-hidden'">✕</button>
    `;

    // Autoocultar luego de 6 segundos si es éxito o info
    if (tipo === 'success' || tipo === 'info') {
      this.temporizadorMensaje = setTimeout(() => {
        cajaAlerta.className = 'alert alert-hidden';
      }, 6000);
    }
  }

  // --- Métodos de compatibilidad hacia atrás ---
  initCytoscape(id) { this.inicializarCytoscape(id); }
  renderGraph(elem) { this.renderizarGrafo(elem); }
  fitGraph() { this.ajustarVistaGrafo(); }
  applyStepVisualization(paso, orig, dest) { this.aplicarVisualizacionPaso(paso, orig, dest); }
  updateNodeSelectors(nodos) { this.actualizarSelectoresNodos(nodos); }
  updateEdgeTable(aristas, cb) { this.actualizarTablaAristas(aristas, cb); }
  updateAdjacencyList(adj) { this.actualizarListaAdyacencia(adj); }
  updateAdjacencyMatrix(mat) { this.actualizarMatrizAdyacencia(mat); }
  updateDijkstraStepView(paso, prog, orig) { this.actualizarVistaPasoDijkstra(paso, prog, orig); }
  resetStepView() { this.reiniciarVistaPasos(); }
  clearStepVisualization() { this.limpiarVisualizacionPasos(); }
  showMessage(msg, tipo) { this.mostrarMensaje(msg, tipo); }
}
