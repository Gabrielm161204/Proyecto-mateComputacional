/**
 * gestor-pasos.js
 * Gestiona el historial de pasos generado por el algoritmo de Dijkstra
 * y permite avanzar o volver al paso inicial.
 *
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

export class GestorPasos {
  constructor() {
    this.pasos = [];
    this.indiceActual = 0;
  }

  /** Carga el historial de pasos y se ubica en el paso 0. */
  establecerPasos(listaPasos) {
    this.pasos = Array.isArray(listaPasos) ? listaPasos : [];
    this.indiceActual = 0;
  }

  obtenerPasoActual() {
    return this.pasos.length === 0 ? null : this.pasos[this.indiceActual];
  }

  /** Avanza un paso si es posible. */
  siguientePaso() {
    if (this.tieneSiguiente()) this.indiceActual++;
    return this.obtenerPasoActual();
  }

  /** Vuelve al paso inicial. */
  irAlInicio() {
    this.indiceActual = 0;
    return this.obtenerPasoActual();
  }

  tieneSiguiente() {
    return this.indiceActual < this.pasos.length - 1;
  }

  estaAlInicio() {
    return this.indiceActual === 0;
  }

  /** @returns {{ actual: number, total: number, porcentaje: number }} */
  obtenerProgreso() {
    if (this.pasos.length === 0) {
      return { actual: 0, total: 0, porcentaje: 0 };
    }
    const actual = this.indiceActual + 1;
    const total = this.pasos.length;
    return { actual, total, porcentaje: Math.round((actual / total) * 100) };
  }

  reiniciar() {
    this.pasos = [];
    this.indiceActual = 0;
  }
}
