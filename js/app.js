/**
 * app.js
 * Controlador principal y punto de entrada de la aplicación.
 * Coordina los módulos de grafo, validación, algoritmo de Dijkstra,
 * navegación de pasos e interfaz de usuario.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 * Asignatura: Matemática Computacional
 */

import { Graph } from './graph.js';
import {
  validateNodeCount,
  validateNewEdge,
  validateDijkstraStart
} from './validation.js';
import { runDijkstra } from './dijkstra.js';
import { StepManager } from './step-manager.js';
import { UIManager } from './ui.js';

class App {
  constructor() {
    this.graph = new Graph();
    this.ui = new UIManager();
    this.stepManager = new StepManager();

    this.currentOrigin = null;
    this.currentDestination = null;
    this.isDijkstraActive = false;
  }

  /**
   * Inicializa la aplicación al cargar el DOM.
   */
  init() {
    this.ui.initCytoscape('cy-container');
    this.setupEventListeners();

    // Cargar automáticamente un estado inicial didáctico de 8 nodos con ejemplo demostrativo
    this.loadInitialDemo();
  }

  /**
   * Configura los listeners de eventos para todos los botones, formularios y controles.
   */
  setupEventListeners() {
    // 1. Configuración de Nodos
    const btnCreateNodes = document.getElementById('btn-create-nodes');
    if (btnCreateNodes) {
      btnCreateNodes.addEventListener('click', () => this.handleCreateNodes());
    }

    const btnResetProject = document.getElementById('btn-reset-project');
    if (btnResetProject) {
      btnResetProject.addEventListener('click', () => this.handleResetProject());
    }

    // 2. Tabs de Construcción
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

    // 3. Agregar Arista Manual
    const btnAddEdge = document.getElementById('btn-add-edge');
    if (btnAddEdge) {
      btnAddEdge.addEventListener('click', () => this.handleAddEdge());
    }

    const btnClearEdges = document.getElementById('btn-clear-edges');
    if (btnClearEdges) {
      btnClearEdges.addEventListener('click', () => this.handleClearEdges());
    }

    // 4. Generación Aleatoria
    const btnGenerateRandom = document.getElementById('btn-generate-random');
    if (btnGenerateRandom) {
      btnGenerateRandom.addEventListener('click', () => this.handleGenerateRandomDAG());
    }

    // 5. Botón Cargar Ejemplo Demostrativo (Múltiples Caminos)
    const btnLoadExample = document.getElementById('btn-load-example');
    if (btnLoadExample) {
      btnLoadExample.addEventListener('click', () => this.handleLoadDemoExample());
    }

    // 6. Controles de Cytoscape
    const btnFitGraph = document.getElementById('btn-fit-graph');
    if (btnFitGraph) {
      btnFitGraph.addEventListener('click', () => this.ui.fitGraph());
    }

    // 7. Preparar e Iniciar Dijkstra
    const btnStartDijkstra = document.getElementById('btn-start-dijkstra');
    if (btnStartDijkstra) {
      btnStartDijkstra.addEventListener('click', () => this.handleStartDijkstra());
    }

    // 8. Navegación de Pasos
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

    // 9. Atajos de teclado para navegación fluida durante la sustentación
    window.addEventListener('keydown', (e) => {
      // Evitar interceptar flechas si el usuario está escribiendo en un input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

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

  /**
   * Carga el caso demostrativo al inicio para ofrecer una experiencia lista e interactiva.
   */
  loadInitialDemo() {
    this.handleLoadDemoExample(false);
  }

  /**
   * Manejador para la creación de nodos configurados por el usuario.
   */
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

  /**
   * Reinicia por completo el proyecto (nodos, aristas y resultados).
   */
  handleResetProject() {
    this.graph.reset();
    this.resetDijkstraExecutionState();

    const input = document.getElementById('node-count-input');
    if (input) input.value = '';

    this.refreshAllGraphViews();
    this.ui.showMessage('El proyecto ha sido reiniciado. Ingrese una cantidad de nodos para comenzar.', 'info');
  }

  /**
   * Agrega una arista dirigida de forma manual con validaciones y detección de ciclos.
   */
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

    // Limpiar input de peso y mantener origen para comodidad
    weightInput.value = '';

    this.refreshAllGraphViews();
    this.ui.showMessage(`Arista dirigida ${from} → ${to} (peso ${validation.weight}) agregada correctamente.`, 'success');
  }

  /**
   * Elimina una arista específica seleccionada de la tabla.
   * @param {string} from 
   * @param {string} to 
   */
  handleDeleteEdge(from, to) {
    const removed = this.graph.removeEdge(from, to);
    if (removed) {
      this.resetDijkstraExecutionState();
      this.refreshAllGraphViews();
      this.ui.showMessage(`Arista ${from} → ${to} eliminada.`, 'info');
    }
  }

  /**
   * Elimina todas las aristas del grafo.
   */
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

  /**
   * Genera un grafo acíclico dirigido (DAG) aleatorio ponderado.
   */
  handleGenerateRandomDAG() {
    const nodes = this.graph.getNodes();
    if (nodes.length === 0) {
      // Si aún no hay nodos creados, inicializar 8 nodos por defecto
      this.graph.setNodes(8);
      const input = document.getElementById('node-count-input');
      if (input) input.value = 8;
    }

    const densitySelect = document.getElementById('random-density');
    const density = densitySelect ? densitySelect.value : 'media';

    this.graph.generateRandomDAG(density);
    this.resetDijkstraExecutionState();

    // Auto-seleccionar primer nodo como origen y último como destino
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

  /**
   * Carga el caso estructurado con múltiples caminos mínimos de igual distancia.
   * @param {boolean} showToast 
   */
  handleLoadDemoExample(showToast = true) {
    this.graph.loadDemonstrationExample();
    this.resetDijkstraExecutionState();

    // Configurar automáticamente origen A y destino H
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

  /**
   * Prepara y arranca la simulación de Dijkstra.
   */
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

    // Ejecutar el algoritmo y compilar el historial completo de pasos
    const steps = runDijkstra(this.graph, origin, destination);
    this.stepManager.setSteps(steps);
    this.isDijkstraActive = true;

    // Habilitar controles de navegación
    this.updateNavigationButtonsState();

    // Renderizar el paso 0
    this.renderCurrentStep();

    this.ui.showMessage(`Simulación iniciada: buscando camino(s) mínimo(s) de ${origin} a ${destination}.`, 'success');

    // Desplazar suavemente hacia el visor del paso a paso
    const execSection = document.getElementById('section-step-execution');
    if (execSection) {
      execSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Avanza un paso en la simulación interactiva.
   */
  handleNextStep() {
    if (!this.isDijkstraActive || !this.stepManager.hasNext()) return;
    this.stepManager.nextStep();
    this.renderCurrentStep();
  }

  /**
   * Retrocede un paso en la simulación interactiva usando el historial almacenado.
   */
  handlePrevStep() {
    if (!this.isDijkstraActive || !this.stepManager.hasPrev()) return;
    this.stepManager.prevStep();
    this.renderCurrentStep();
  }

  /**
   * Salta inmediatamente al paso final con los caminos mínimos resueltos.
   */
  handleFinalStep() {
    if (!this.isDijkstraActive) return;
    this.stepManager.goToEnd();
    this.renderCurrentStep();
  }

  /**
   * Reinicia la ejecución volviendo al paso inicial (Paso 0).
   */
  handleResetDijkstra() {
    if (!this.isDijkstraActive) return;
    this.stepManager.goToStart();
    this.renderCurrentStep();
  }

  /**
   * Renderiza visualmente el paso actual tanto en Cytoscape como en las tablas y paneles.
   */
  renderCurrentStep() {
    const currentStep = this.stepManager.getCurrentStep();
    if (!currentStep) return;

    const progress = this.stepManager.getProgress();

    // 1. Actualizar visualización en Cytoscape
    this.ui.applyStepVisualization(currentStep, this.currentOrigin, this.currentDestination);

    // 2. Actualizar paneles de texto, tablas de etiquetas y métricas
    this.ui.updateDijkstraStepView(currentStep, progress, this.currentOrigin, this.currentDestination);

    // 3. Actualizar estado de los botones de navegación
    this.updateNavigationButtonsState();
  }

  /**
   * Actualiza el estado habilitado/deshabilitado de los botones de navegación.
   */
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

  /**
   * Restablece el estado de ejecución del algoritmo si se modifica la estructura del grafo.
   */
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

  /**
   * Refresca todas las vistas del grafo (Cytoscape, selectores, tablas y matrices).
   */
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

// Inicializar la aplicación cuando el documento esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.__APP_INITIALIZED__ = true;
  window.__appInstance = app;
});
