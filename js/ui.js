/**
 * ui.js
 * Módulo para la manipulación del DOM, renderizado de Cytoscape.js,
 * actualización de tablas, matrices, listas de adyacencia y control visual
 * de las etapas pedagógicas del algoritmo de Dijkstra.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

export class UIManager {
  constructor() {
    this.cy = null;
    this.toastTimeout = null;
  }

  /**
   * Inicializa la instancia de Cytoscape.js en el contenedor designado.
   * Configura estilos visuales profesionales con soporte para DAGs,
   * etiquetas centradas, flechas dirigidas y estilos de resaltado de estados.
   * @param {string} containerId - ID del elemento contenedor en el DOM
   */
  initCytoscape(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Contenedor #${containerId} no encontrado para Cytoscape.`);
      return;
    }

    if (typeof cytoscape === 'undefined') {
      console.error('Cytoscape.js no está cargado. Verifique la conexión a Internet o el CDN.');
      this.showMessage('Error: No se pudo cargar Cytoscape.js desde el CDN.', 'error');
      return;
    }

    this.cy = cytoscape({
      container,
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
   * @param {Array<object>} elements - Elementos generados por graph.toCytoscapeElements()
   */
  renderGraph(elements) {
    if (!this.cy) return;

    this.cy.batch(() => {
      this.cy.elements().remove();
      this.cy.add(elements);
    });

    // Ajustar vista respetando márgenes
    this.cy.fit(undefined, 35);
  }

  /**
   * Restablece el centrado y zoom del grafo en Cytoscape.
   */
  fitGraph() {
    if (!this.cy) return;
    this.cy.fit(undefined, 35);
  }

  /**
   * Actualiza visualmente el grafo de Cytoscape reflejando el estado de un paso de Dijkstra.
   * @param {object} step - Objeto de paso con datos de resaltado
   * @param {string} origin - Vértice origen
   * @param {string} destination - Vértice destino
   */
  applyStepVisualization(step, origin, destination) {
    if (!this.cy || !step) return;

    this.cy.batch(() => {
      // 1. Limpiar clases dinámicas previas
      this.cy.nodes().removeClass('origin destination current target-evaluating visited');
      this.cy.edges().removeClass('evaluating improved shortest-path');

      // 2. Resaltar origen y destino estructurales
      if (origin) {
        const originNode = this.cy.getElementById(origin);
        if (originNode.length > 0) originNode.addClass('origin');
      }
      if (destination) {
        const destNode = this.cy.getElementById(destination);
        if (destNode.length > 0) destNode.addClass('destination');
      }

      // 3. Marcar nodos visitados
      if (Array.isArray(step.visited)) {
        for (const v of step.visited) {
          const vNode = this.cy.getElementById(v);
          if (vNode.length > 0 && v !== origin && v !== destination) {
            vNode.addClass('visited');
          }
        }
      }

      // 4. Marcar nodo actual
      if (step.currentNode) {
        const cNode = this.cy.getElementById(step.currentNode);
        if (cNode.length > 0) {
          cNode.addClass('current');
        }
      }

      // 5. Marcar vecino en evaluación
      if (step.highlight && step.highlight.targetNode) {
        const tNode = this.cy.getElementById(step.highlight.targetNode);
        if (tNode.length > 0) {
          tNode.addClass('target-evaluating');
        }
      }

      // 6. Resaltar arista en evaluación
      if (step.highlight && step.highlight.evaluatingEdge) {
        const edgeId = step.highlight.evaluatingEdge;
        const edgeElem = this.cy.getElementById(edgeId);
        if (edgeElem.length > 0) {
          if (step.highlight.improvedEdge) {
            edgeElem.addClass('improved');
          } else {
            edgeElem.addClass('evaluating');
          }
        }
      }

      // 7. Resaltar el camino mínimo final si es el paso final
      if (step.isFinal && step.highlight && Array.isArray(step.highlight.pathEdges)) {
        for (const edgeId of step.highlight.pathEdges) {
          const pathEdge = this.cy.getElementById(edgeId);
          if (pathEdge.length > 0) {
            pathEdge.addClass('shortest-path');
          }
        }
      }
    });
  }

  /**
   * Actualiza las opciones de todos los selectores de nodos en el DOM.
   * @param {string[]} nodes - Lista de etiquetas de nodos
   */
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

      // Preservar selección previa si aún existe
      if (nodes.includes(currentVal)) {
        select.value = currentVal;
      }
    }
  }

  /**
   * Actualiza la tabla visual de aristas agregadas en la sección manual.
   * @param {Array<{ id: string, from: string, to: string, weight: number }>} edges 
   * @param {Function} onDeleteEdge - Callback para eliminar arista
   */
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
    edges.forEach((edge, index) => {
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

  /**
   * Actualiza la representación textual de la Lista de Adyacencia.
   * @param {Record<string, Array<{ to: string, weight: number }>>} adjList 
   */
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

  /**
   * Actualiza la Matriz de Pesos o Matriz de Adyacencia Ponderada.
   * Representa valores sin conexión como "∞" o "—".
   * @param {{ nodes: string[], matrix: Array<Array<number|null>> }} adjMatrixData 
   */
  updateAdjacencyMatrix(adjMatrixData) {
    const container = document.getElementById('adjacency-matrix-content');
    if (!container) return;

    const { nodes, matrix } = adjMatrixData;
    if (nodes.length === 0) {
      container.innerHTML = '<p class="text-muted mb-0">Grafo vacío. Configure los nodos.</p>';
      return;
    }

    let html = '<div class="table-responsive"><table class="matrix-table">';
    // Fila de encabezado
    html += '<thead><tr><th class="matrix-corner">V\\V</th>';
    for (const node of nodes) {
      html += `<th>${node}</th>`;
    }
    html += '</tr></thead><tbody>';

    // Filas de la matriz
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

  /**
   * Actualiza el panel de información didáctica y la tabla de etiquetas para el paso actual.
   * @param {object} step - Objeto de paso generado por dijkstra.js
   * @param {object} progress - Progreso del step manager: { current, total, percentage }
   * @param {string} origin - Vértice origen
   * @param {string} destination - Vértice destino
   */
  updateDijkstraStepView(step, progress, origin) {
    if (!step) return;

    // 1. Contador de pasos y barra de progreso
    const stepBadge = document.getElementById('step-counter-badge');
    const progressBar = document.getElementById('step-progress-bar');
    if (stepBadge) {
      stepBadge.textContent = `Paso ${progress.current} de ${progress.total}`;
    }
    if (progressBar) {
      progressBar.style.width = `${progress.percentage}%`;
    }

    // 2. Título de iteración y nodo actual
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

    // 3. Explicación didáctica y operación matemática
    const explanationEl = document.getElementById('step-explanation-text');
    const mathEl = document.getElementById('step-math-operation');
    if (explanationEl) {
      explanationEl.textContent = step.explanation;
    }
    if (mathEl) {
      mathEl.textContent = step.mathOperation || '';
    }

    // 4. Tabla de etiquetas de Dijkstra
    this.updateDijkstraLabelsTable(step, origin);

    // 5. Panel de resultados finales
    this.updateResultsSummary(step);
  }

  /**
   * Actualiza la tabla de etiquetas (Vértice, Distancia acumulada, Predecesor, Estado).
   * @param {object} step 
   * @param {string} origin 
   */
  updateDijkstraLabelsTable(step, origin) {
    const tbody = document.getElementById('dijkstra-labels-body');
    if (!tbody) return;

    const nodes = Object.keys(step.distances);
    tbody.innerHTML = '';

    for (const node of nodes) {
      const dist = step.distances[node];
      const distStr = dist === Infinity ? '∞' : String(dist);
      const predsStr = step.predecessors[node] || '—';

      // Determinar estado semántico del nodo
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

  /**
   * Actualiza el panel de resultado final (distancia y camino mínimo).
   * @param {object} step
   */
  updateResultsSummary(step) {
    const resultsContainer = document.getElementById('dijkstra-final-results');
    if (!resultsContainer) return;

    if (!step.isFinal || !step.finalData) {
      resultsContainer.style.display = 'none';
      return;
    }

    resultsContainer.style.display = 'block';
    const { reachable, distance, path, origin, destination } = step.finalData;

    if (!reachable) {
      resultsContainer.innerHTML = `
        <div class="alert alert-warning">
          <span>⚠️ <strong>Destino inalcanzable:</strong> no existe una ruta dirigida de
          <strong>${origin}</strong> a <strong>${destination}</strong> (distancia = ∞).</span>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div class="card result-card">
        <div class="result-header">
          <h4>Resultado del algoritmo</h4>
        </div>
        <div class="result-metrics-grid">
          <div class="metric-box">
            <span class="metric-label">Distancia mínima</span>
            <span class="metric-number">${distance}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Camino mínimo</span>
            <span class="metric-number path-sequence">${path.join(' → ')}</span>
          </div>
        </div>
        <div class="result-footer-note">
          <small class="text-muted">Las aristas del camino mínimo se resaltan en rojo sobre el grafo.</small>
        </div>
      </div>
    `;
  }

  /** Restablece el panel de ejecución al estado "no iniciado". */
  resetStepView() {
    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };

    set('dijkstra-final-results', el => { el.style.display = 'none'; });
    set('step-counter-badge', el => { el.textContent = 'Paso 0 de 0'; });
    set('step-progress-bar', el => { el.style.width = '0%'; });
    set('step-iteration-title', el => { el.textContent = 'Algoritmo no iniciado'; });
    set('step-current-node-badge', el => { el.style.display = 'none'; });
    set('step-explanation-text', el => {
      el.textContent = 'Seleccione el origen y destino y presione "Iniciar Dijkstra" para comenzar la simulación paso a paso.';
    });
    set('step-math-operation', el => { el.textContent = ''; });
    set('dijkstra-labels-body', el => {
      el.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Inicie el algoritmo para observar el etiquetado de vértices.</td></tr>';
    });
  }

  /** Quita los resaltados de ejecución del grafo. */
  clearStepVisualization() {
    if (!this.cy) return;
    this.cy.nodes().removeClass('origin destination current target-evaluating visited');
    this.cy.edges().removeClass('evaluating improved shortest-path');
  }

  /**
   * Muestra un mensaje flotante (toast) o banner no bloqueante en la interfaz.
   * @param {string} message - Texto del mensaje
   * @param {'success' | 'warning' | 'error' | 'info'} type - Tipo semántico
   */
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

    // Autoocultar luego de 6 segundos si es éxito o info
    if (type === 'success' || type === 'info') {
      this.toastTimeout = setTimeout(() => {
        alertBox.className = 'alert alert-hidden';
      }, 6000);
    }
  }

}
