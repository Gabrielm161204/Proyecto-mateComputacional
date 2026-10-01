/**
 * app.js
 * Controlador principal y punto de entrada de la aplicación.
 * Coordina el grafo, las validaciones, el algoritmo de Dijkstra,
 * el gestor de pasos y la interfaz de usuario.
 *
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

import { Graph } from './graph.js';
import { validateNodeCount, validateNewEdge, validateDijkstraStart } from './validation.js';
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

  /** Inicializa la aplicación y carga el ejemplo inicial. */
  init() {
    this.ui.initCytoscape('cy-container');
    this.setupEventListeners();
    this.handleLoadDemoExample(false);
  }

  /** Asocia un manejador al clic de un botón (si existe). */
  on(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  setupEventListeners() {
    this.on('btn-create-nodes', () => this.handleCreateNodes());
    this.on('btn-reset-project', () => this.handleResetProject());
    this.on('btn-add-edge', () => this.handleAddEdge());
    this.on('btn-clear-edges', () => this.handleClearEdges());
    this.on('btn-load-example', () => this.handleLoadDemoExample());
    this.on('btn-fit-graph', () => this.ui.fitGraph());
    this.on('btn-start-dijkstra', () => this.handleStartDijkstra());
    this.on('btn-next-step', () => this.handleNextStep());
    this.on('btn-reset-dijkstra', () => this.handleResetDijkstra());
  }

  /** Crea los nodos A, B, C... según la cantidad ingresada (7 a 16). */
  handleCreateNodes() {
    const input = document.getElementById('node-count-input');
    if (!input) return;

    const validation = validateNodeCount(input.value);
    if (!validation.isValid) {
      this.ui.showMessage(validation.error, 'error');
      return;
    }

    this.graph.setNodes(validation.value);
    this.resetDijkstraExecutionState();
    this.refreshAllGraphViews();
    this.ui.showMessage(`Se generaron ${validation.value} nodos: [${this.graph.getNodes().join(', ')}].`, 'success');
  }

  /** Reinicia el proyecto completo (nodos, aristas y ejecución). */
  handleResetProject() {
    this.graph.reset();
    this.resetDijkstraExecutionState();

    const input = document.getElementById('node-count-input');
    if (input) input.value = '';

    this.refreshAllGraphViews();
    this.ui.showMessage('Proyecto reiniciado. Ingrese una cantidad de nodos para comenzar.', 'info');
  }

  /** Agrega una arista dirigida validando duplicados, peso y ciclos. */
  handleAddEdge() {
    const from = document.getElementById('edge-from').value;
    const to = document.getElementById('edge-to').value;
    const weightInput = document.getElementById('edge-weight');

    const validation = validateNewEdge(this.graph, from, to, weightInput.value);
    if (!validation.isValid) {
      this.ui.showMessage(validation.error, 'error');
      return;
    }

    this.graph.addEdge(from, to, validation.weight);
    this.resetDijkstraExecutionState();
    weightInput.value = '';

    this.refreshAllGraphViews();
    this.ui.showMessage(`Arista ${from} → ${to} (peso ${validation.weight}) agregada.`, 'success');
  }

  handleDeleteEdge(from, to) {
    if (this.graph.removeEdge(from, to)) {
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
    this.ui.showMessage('Todas las aristas fueron eliminadas.', 'info');
  }

  /** Carga el grafo de ejemplo (A–H) con origen A y destino H. */
  handleLoadDemoExample(showToast = true) {
    this.graph.loadDemonstrationExample();
    this.resetDijkstraExecutionState();

    const nodeInput = document.getElementById('node-count-input');
    if (nodeInput) nodeInput.value = 8;

    this.refreshAllGraphViews();

    const origSelect = document.getElementById('dijkstra-origin');
    const destSelect = document.getElementById('dijkstra-destination');
    if (origSelect) origSelect.value = 'A';
    if (destSelect) destSelect.value = 'H';

    if (showToast) {
      this.ui.showMessage('Ejemplo cargado: 8 nodos (A–H). Camino mínimo de A a H con costo 15.', 'success');
    }
  }

  /** Valida origen/destino, ejecuta Dijkstra y muestra el paso 0. */
  handleStartDijkstra() {
    const origin = document.getElementById('dijkstra-origin').value;
    const destination = document.getElementById('dijkstra-destination').value;

    const validation = validateDijkstraStart(this.graph, origin, destination);
    if (!validation.isValid) {
      this.ui.showMessage(validation.error, 'error');
      return;
    }

    this.currentOrigin = origin;
    this.currentDestination = destination;

    this.stepManager.setSteps(runDijkstra(this.graph, origin, destination));
    this.isDijkstraActive = true;
    this.renderCurrentStep();

    this.ui.showMessage(`Simulación iniciada: camino mínimo de ${origin} a ${destination}.`, 'success');

    const execSection = document.getElementById('section-step-execution');
    if (execSection) execSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  handleNextStep() {
    if (!this.isDijkstraActive || !this.stepManager.hasNext()) return;
    this.stepManager.nextStep();
    this.renderCurrentStep();
  }

  handleResetDijkstra() {
    if (!this.isDijkstraActive) return;
    this.stepManager.goToStart();
    this.renderCurrentStep();
  }

  /** Dibuja el paso actual en el grafo, las tablas y los paneles. */
  renderCurrentStep() {
    const step = this.stepManager.getCurrentStep();
    if (!step) return;

    this.ui.applyStepVisualization(step, this.currentOrigin, this.currentDestination);
    this.ui.updateDijkstraStepView(step, this.stepManager.getProgress(), this.currentOrigin);
    this.updateNavigationButtonsState();
  }

  updateNavigationButtonsState() {
    const btnNext = document.getElementById('btn-next-step');
    const btnReset = document.getElementById('btn-reset-dijkstra');

    const active = this.isDijkstraActive;
    if (btnNext) btnNext.disabled = !active || !this.stepManager.hasNext();
    if (btnReset) btnReset.disabled = !active || this.stepManager.isAtStart();
  }

  /** Limpia la ejecución cuando cambia la estructura del grafo. */
  resetDijkstraExecutionState() {
    this.isDijkstraActive = false;
    this.stepManager.reset();
    this.updateNavigationButtonsState();
    this.ui.resetStepView();
    if (this.ui.cy) this.ui.clearStepVisualization();
  }

  /** Refresca el grafo, selectores, tabla de aristas, lista y matriz de adyacencia. */
  refreshAllGraphViews() {
    this.ui.renderGraph(this.graph.toCytoscapeElements());
    this.ui.updateNodeSelectors(this.graph.getNodes());
    this.ui.updateEdgeTable(this.graph.getEdges(), (from, to) => this.handleDeleteEdge(from, to));
    this.ui.updateAdjacencyList(this.graph.getAdjacencyList());
    this.ui.updateAdjacencyMatrix(this.graph.getAdjacencyMatrix());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.__appInstance = app;
});
