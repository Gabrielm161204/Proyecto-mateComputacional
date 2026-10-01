/**
 * aplicacion.js
 * Controlador principal y punto de entrada de la aplicación.
 * Coordina el grafo, las validaciones, el algoritmo de Dijkstra,
 * el gestor de pasos y la interfaz de usuario.
 *
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

import { Grafo } from './grafo.js';
import { validarCantidadNodos, validarNuevaArista, validarInicioDijkstra } from './validacion.js';
import { ejecutarDijkstra } from './dijkstra.js';
import { GestorPasos } from './gestor-pasos.js';
import { GestorInterfaz } from './interfaz.js';

export class Aplicacion {
  constructor() {
    this.grafo = new Grafo();
    this.interfaz = new GestorInterfaz();
    this.gestorPasos = new GestorPasos();

    this.origenActual = null;
    this.destinoActual = null;
    this.dijkstraActivo = false;
  }

  /** Inicializa la aplicación y carga el ejemplo inicial. */
  inicializar() {
    this.interfaz.inicializarCytoscape('cy-container');
    this.configurarEventos();
    this.manejarCargarEjemploDemostracion(false);
  }

  /** Asocia un manejador al clic de un botón (si existe). */
  asociarEvento(id, manejador) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.addEventListener('click', manejador);
  }

  configurarEventos() {
    this.asociarEvento('btn-create-nodes', () => this.manejarCrearNodos());
    this.asociarEvento('btn-reset-project', () => this.manejarReiniciarProyecto());
    this.asociarEvento('btn-add-edge', () => this.manejarAgregarArista());
    this.asociarEvento('btn-clear-edges', () => this.manejarLimpiarAristas());
    this.asociarEvento('btn-load-example', () => this.manejarCargarEjemploDemostracion());
    this.asociarEvento('btn-fit-graph', () => this.interfaz.ajustarVistaGrafo());
    this.asociarEvento('btn-start-dijkstra', () => this.manejarIniciarDijkstra());
    this.asociarEvento('btn-next-step', () => this.manejarSiguientePaso());
    this.asociarEvento('btn-reset-dijkstra', () => this.manejarReiniciarDijkstra());
  }

  /** Crea los nodos A, B, C... según la cantidad ingresada (7 a 16). */
  manejarCrearNodos() {
    const input = document.getElementById('node-count-input');
    if (!input) return;

    const validacion = validarCantidadNodos(input.value);
    if (!validacion.esValido) {
      this.interfaz.mostrarMensaje(validacion.error, 'error');
      return;
    }

    this.grafo.establecerNodos(validacion.valor);
    this.reiniciarEstadoEjecucionDijkstra();
    this.refrescarTodasLasVistasGrafo();
    this.interfaz.mostrarMensaje(`Se generaron ${validacion.valor} nodos: [${this.grafo.obtenerNodos().join(', ')}].`, 'success');
  }

  /** Reinicia el proyecto completo (nodos, aristas y ejecución). */
  manejarReiniciarProyecto() {
    this.grafo.reiniciar();
    this.reiniciarEstadoEjecucionDijkstra();

    const input = document.getElementById('node-count-input');
    if (input) input.value = '';

    this.refrescarTodasLasVistasGrafo();
    this.interfaz.mostrarMensaje('Proyecto reiniciado. Ingrese una cantidad de nodos para comenzar.', 'info');
  }

  /** Agrega una arista dirigida validando duplicados, peso y ciclos. */
  manejarAgregarArista() {
    const origen = document.getElementById('edge-from').value;
    const destino = document.getElementById('edge-to').value;
    const inputPeso = document.getElementById('edge-weight');

    const validacion = validarNuevaArista(this.grafo, origen, destino, inputPeso.value);
    if (!validacion.esValido) {
      this.interfaz.mostrarMensaje(validacion.error, 'error');
      return;
    }

    this.grafo.agregarArista(origen, destino, validacion.peso);
    this.reiniciarEstadoEjecucionDijkstra();
    inputPeso.value = '';

    this.refrescarTodasLasVistasGrafo();
    this.interfaz.mostrarMensaje(`Arista ${origen} → ${destino} (peso ${validacion.peso}) agregada.`, 'success');
  }

  manejarEliminarArista(origen, destino) {
    if (this.grafo.eliminarArista(origen, destino)) {
      this.reiniciarEstadoEjecucionDijkstra();
      this.refrescarTodasLasVistasGrafo();
      this.interfaz.mostrarMensaje(`Arista ${origen} → ${destino} eliminada.`, 'info');
    }
  }

  manejarLimpiarAristas() {
    if (this.grafo.obtenerAristas().length === 0) {
      this.interfaz.mostrarMensaje('No hay aristas para limpiar.', 'warning');
      return;
    }

    this.grafo.limpiarAristas();
    this.reiniciarEstadoEjecucionDijkstra();
    this.refrescarTodasLasVistasGrafo();
    this.interfaz.mostrarMensaje('Todas las aristas fueron eliminadas.', 'info');
  }

  /** Carga el grafo de ejemplo (A–H) con origen A y destino H. */
  manejarCargarEjemploDemostracion(mostrarAviso = true) {
    this.grafo.cargarEjemploDemostracion();
    this.reiniciarEstadoEjecucionDijkstra();

    const inputNodos = document.getElementById('node-count-input');
    if (inputNodos) inputNodos.value = 8;

    this.refrescarTodasLasVistasGrafo();

    const selectOrigen = document.getElementById('dijkstra-origin');
    const selectDestino = document.getElementById('dijkstra-destination');
    if (selectOrigen) selectOrigen.value = 'A';
    if (selectDestino) selectDestino.value = 'H';

    if (mostrarAviso) {
      this.interfaz.mostrarMensaje('Ejemplo cargado: 8 nodos (A–H). Camino mínimo de A a H con costo 15.', 'success');
    }
  }

  /** Valida origen/destino, ejecuta Dijkstra y muestra el paso 0. */
  manejarIniciarDijkstra() {
    const origen = document.getElementById('dijkstra-origin').value;
    const destino = document.getElementById('dijkstra-destination').value;

    const validacion = validarInicioDijkstra(this.grafo, origen, destino);
    if (!validacion.esValido) {
      this.interfaz.mostrarMensaje(validacion.error, 'error');
      return;
    }

    this.origenActual = origen;
    this.destinoActual = destino;

    this.gestorPasos.establecerPasos(ejecutarDijkstra(this.grafo, origen, destino));
    this.dijkstraActivo = true;
    this.renderizarPasoActual();

    this.interfaz.mostrarMensaje(`Simulación iniciada: camino mínimo de ${origen} a ${destino}.`, 'success');

    const seccionEjecucion = document.getElementById('section-step-execution');
    if (seccionEjecucion) seccionEjecucion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  manejarSiguientePaso() {
    if (!this.dijkstraActivo || !this.gestorPasos.tieneSiguiente()) return;
    this.gestorPasos.siguientePaso();
    this.renderizarPasoActual();
  }

  manejarReiniciarDijkstra() {
    if (!this.dijkstraActivo) return;
    this.gestorPasos.irAlInicio();
    this.renderizarPasoActual();
  }

  /** Dibuja el paso actual en el grafo, las tablas y los paneles. */
  renderizarPasoActual() {
    const paso = this.gestorPasos.obtenerPasoActual();
    if (!paso) return;

    this.interfaz.aplicarVisualizacionPaso(paso, this.origenActual, this.destinoActual);
    this.interfaz.actualizarVistaPasoDijkstra(paso, this.gestorPasos.obtenerProgreso(), this.origenActual);
    this.actualizarEstadoBotonesNavegacion();
  }

  actualizarEstadoBotonesNavegacion() {
    const btnSiguiente = document.getElementById('btn-next-step');
    const btnReiniciar = document.getElementById('btn-reset-dijkstra');

    const activo = this.dijkstraActivo;
    if (btnSiguiente) btnSiguiente.disabled = !activo || !this.gestorPasos.tieneSiguiente();
    if (btnReiniciar) btnReiniciar.disabled = !activo || this.gestorPasos.estaAlInicio();
  }

  /** Limpia la ejecución cuando cambia la estructura del grafo. */
  reiniciarEstadoEjecucionDijkstra() {
    this.dijkstraActivo = false;
    this.gestorPasos.reiniciar();
    this.actualizarEstadoBotonesNavegacion();
    this.interfaz.reiniciarVistaPasos();
    if (this.interfaz.cy) this.interfaz.limpiarVisualizacionPasos();
  }

  /** Refresca el grafo, selectores, tabla de aristas, lista y matriz de adyacencia. */
  refrescarTodasLasVistasGrafo() {
    this.interfaz.renderizarGrafo(this.grafo.aElementosCytoscape());
    this.interfaz.actualizarSelectoresNodos(this.grafo.obtenerNodos());
    this.interfaz.actualizarTablaAristas(this.grafo.obtenerAristas(), (origen, destino) => this.manejarEliminarArista(origen, destino));
    this.interfaz.actualizarListaAdyacencia(this.grafo.obtenerListaAdyacencia());
    this.interfaz.actualizarMatrizAdyacencia(this.grafo.obtenerMatrizAdyacencia());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new Aplicacion();
  app.inicializar();
  window.__instanciaApp = app;
});
