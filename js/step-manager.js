/**
 * step-manager.js
 * Módulo para gestionar el estado y la navegación temporal del historial de pasos
 * generado por el algoritmo de Dijkstra.
 * 
 * Permite avanzar, retroceder (sin recalcular), ir al paso final y reiniciar la ejecución.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 * Asignatura: Matemática Computacional
 */

export class StepManager {
  constructor() {
    this.steps = [];
    this.currentIndex = 0;
  }

  /**
   * Carga una nueva lista de pasos producida por el algoritmo de Dijkstra.
   * @param {Array<object>} stepsList 
   */
  setSteps(stepsList) {
    this.steps = Array.isArray(stepsList) ? stepsList : [];
    this.currentIndex = 0;
  }

  /**
   * Obtiene el objeto del paso actual.
   * @returns {object | null}
   */
  getCurrentStep() {
    if (this.steps.length === 0) return null;
    return this.steps[this.currentIndex];
  }

  /**
   * Obtiene el índice actual (base 0).
   * @returns {number}
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * Obtiene el número total de pasos en el historial.
   * @returns {number}
   */
  getTotalSteps() {
    return this.steps.length;
  }

  /**
   * Avanza un paso en el historial si es posible.
   * @returns {object | null} El nuevo paso actual o null si no cambió
   */
  nextStep() {
    if (this.hasNext()) {
      this.currentIndex++;
      return this.getCurrentStep();
    }
    return this.getCurrentStep();
  }

  /**
   * Retrocede un paso en el historial si es posible, utilizando el historial existente sin recalcular.
   * @returns {object | null} El nuevo paso actual o null si no cambió
   */
  prevStep() {
    if (this.hasPrev()) {
      this.currentIndex--;
      return this.getCurrentStep();
    }
    return this.getCurrentStep();
  }

  /**
   * Salta al primer paso (inicialización).
   * @returns {object | null}
   */
  goToStart() {
    if (this.steps.length > 0) {
      this.currentIndex = 0;
      return this.getCurrentStep();
    }
    return null;
  }

  /**
   * Salta directamente al paso final con los resultados concluidos.
   * @returns {object | null}
   */
  goToEnd() {
    if (this.steps.length > 0) {
      this.currentIndex = this.steps.length - 1;
      return this.getCurrentStep();
    }
    return null;
  }

  /**
   * Salta a un índice de paso específico.
   * @param {number} index 
   * @returns {object | null}
   */
  goToStep(index) {
    if (this.steps.length === 0) return null;
    const clamped = Math.max(0, Math.min(this.steps.length - 1, Number(index)));
    this.currentIndex = clamped;
    return this.getCurrentStep();
  }

  /**
   * Indica si hay un paso posterior disponible.
   * @returns {boolean}
   */
  hasNext() {
    return this.currentIndex < this.steps.length - 1;
  }

  /**
   * Indica si hay un paso anterior disponible.
   * @returns {boolean}
   */
  hasPrev() {
    return this.currentIndex > 0;
  }

  /**
   * Indica si el cursor está en el paso final.
   * @returns {boolean}
   */
  isAtEnd() {
    return this.steps.length > 0 && this.currentIndex === this.steps.length - 1;
  }

  /**
   * Indica si el cursor está en el paso inicial.
   * @returns {boolean}
   */
  isAtStart() {
    return this.currentIndex === 0;
  }

  /**
   * Devuelve un objeto informativo con el progreso del recorrido.
   * @returns {{ current: number, total: number, percentage: number }}
   */
  getProgress() {
    if (this.steps.length === 0) {
      return { current: 0, total: 0, percentage: 0 };
    }
    const current = this.currentIndex + 1;
    const total = this.steps.length;
    const percentage = Math.round((current / total) * 100);
    return { current, total, percentage };
  }

  /**
   * Limpia el gestor de pasos.
   */
  reset() {
    this.steps = [];
    this.currentIndex = 0;
  }
}
