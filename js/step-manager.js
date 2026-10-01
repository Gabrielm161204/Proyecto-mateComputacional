/**
 * step-manager.js
 * Gestiona el historial de pasos generado por el algoritmo de Dijkstra
 * y permite avanzar o volver al paso inicial.
 *
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

export class StepManager {
  constructor() {
    this.steps = [];
    this.currentIndex = 0;
  }

  /** Carga el historial de pasos y se ubica en el paso 0. */
  setSteps(stepsList) {
    this.steps = Array.isArray(stepsList) ? stepsList : [];
    this.currentIndex = 0;
  }

  getCurrentStep() {
    return this.steps.length === 0 ? null : this.steps[this.currentIndex];
  }

  /** Avanza un paso si es posible. */
  nextStep() {
    if (this.hasNext()) this.currentIndex++;
    return this.getCurrentStep();
  }

  /** Vuelve al paso inicial. */
  goToStart() {
    this.currentIndex = 0;
    return this.getCurrentStep();
  }

  hasNext() {
    return this.currentIndex < this.steps.length - 1;
  }

  isAtStart() {
    return this.currentIndex === 0;
  }

  /** @returns {{ current: number, total: number, percentage: number }} */
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
