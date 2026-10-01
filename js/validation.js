/**
 * validacion.js
 * Módulo de validación de entradas, pesos, nodos, aristas duplicadas
 * y detección manual de ciclos en grafos dirigidos usando DFS.
 * 
 * Proyecto: Simulador interactivo del algoritmo de Dijkstra
 */

/**
 * Valida la cantidad de nodos ingresada por el usuario.
 * Restricciones académicas: 7 <= n <= 16, entero positivo.
 * @param {any} valorCrudo 
 * @returns {{ esValido: boolean, error: string | null, valor?: number }}
 */
export function validarCantidadNodos(valorCrudo) {
  if (valorCrudo === undefined || valorCrudo === null || String(valorCrudo).trim() === '') {
    return { esValido: false, error: 'Debe ingresar un número de nodos.' };
  }

  const limpio = String(valorCrudo).trim();

  // Comprobar que solo contenga dígitos enteros
  if (!/^\d+$/.test(limpio)) {
    return {
      esValido: false,
      error: 'La cantidad de nodos debe ser un número entero sin decimales ni caracteres extraños.'
    };
  }

  const numero = Number(limpio);

  if (numero < 7) {
    return {
      esValido: false,
      error: `La cantidad mínima requerida es 7 nodos (ingresó ${numero}).`
    };
  }

  if (numero > 16) {
    return {
      esValido: false,
      error: `La cantidad máxima permitida es 16 nodos (ingresó ${numero}).`
    };
  }

  return { esValido: true, error: null, valor: numero };
}

/**
 * Valida el peso de una arista.
 * Restricciones: entero positivo mayor a cero (w >= 1).
 * @param {any} pesoCrudo 
 * @returns {{ esValido: boolean, error: string | null, valor?: number }}
 */
export function validarPesoArista(pesoCrudo) {
  if (pesoCrudo === undefined || pesoCrudo === null || String(pesoCrudo).trim() === '') {
    return { esValido: false, error: 'Debe ingresar el peso de la arista.' };
  }

  const limpio = String(pesoCrudo).trim();

  // Comprobar que sea un número entero
  if (!/^\d+$/.test(limpio)) {
    return {
      esValido: false,
      error: 'El peso debe ser un número entero positivo (sin decimales ni signos negativos).'
    };
  }

  const peso = Number(limpio);

  if (peso <= 0) {
    return {
      esValido: false,
      error: 'El peso debe ser un número entero estrictamente mayor que cero (w ≥ 1).'
    };
  }

  return { esValido: true, error: null, valor: peso };
}

/**
 * Encuentra un camino dirigido entre dos nodos usando búsqueda en profundidad (DFS) manual.
 * Retorna la secuencia de nodos si existe un camino, o null si no existe.
 * @param {Record<string, Array<{ destino: string, peso: number }>>} listaAdyacencia 
 * @param {string} nodoInicio 
 * @param {string} nodoObjetivo 
 * @returns {string[] | null}
 */
export function buscarCaminoDirigidoDFS(listaAdyacencia, nodoInicio, nodoObjetivo) {
  const visitados = new Set();
  const mapaPadres = new Map();
  const pila = [nodoInicio];
  visitados.add(nodoInicio);

  while (pila.length > 0) {
    const actual = pila.pop();

    if (actual === nodoObjetivo) {
      // Reconstruir el camino desde nodoObjetivo hasta nodoInicio
      const camino = [];
      let pasoActual = nodoObjetivo;
      while (pasoActual !== undefined) {
        camino.push(pasoActual);
        pasoActual = mapaPadres.get(pasoActual);
      }
      return camino.reverse();
    }

    const vecinos = listaAdyacencia[actual] || [];
    for (const vecino of vecinos) {
      const destinoVecino = vecino.destino !== undefined ? vecino.destino : vecino.to;
      if (!visitados.has(destinoVecino)) {
        visitados.add(destinoVecino);
        mapaPadres.set(destinoVecino, actual);
        pila.push(destinoVecino);
      }
    }
  }

  return null;
}

/**
 * Valida si una nueva arista puede ser agregada al grafo.
 * Verifica:
 * 1. Existencia de nodos origen y destino.
 * 2. Que no sea una autoarista (origen !== destino).
 * 3. Que la arista no exista ya en la misma dirección.
 * 4. Que el peso sea válido.
 * 5. Que la arista NO produzca un ciclo dirigido (usando DFS manual).
 * 
 * @param {object} grafo - Instancia de Grafo
 * @param {string} origen - Nodo origen
 * @param {string} destino - Nodo destino
 * @param {any} pesoCrudo - Peso sin validar
 * @returns {{ esValido: boolean, error: string | null, peso?: number, caminoCiclo?: string[] }}
 */
export function validarNuevaArista(grafo, origen, destino, pesoCrudo) {
  if (!origen || !destino) {
    return { esValido: false, error: 'Debe seleccionar un nodo de origen y un nodo de destino.' };
  }

  const nodos = grafo.obtenerNodos();
  if (!nodos.includes(origen) || !nodos.includes(destino)) {
    return { esValido: false, error: 'Los nodos seleccionados no existen en el grafo actual.' };
  }

  // 1. No autoaristas (u === v)
  if (origen === destino) {
    return {
      esValido: false,
      error: `No se permiten autoaristas (un vértice no puede conectarse consigo mismo: ${origen} → ${destino}).`
    };
  }

  // 2. No aristas duplicadas en la misma dirección
  if (grafo.existeArista(origen, destino)) {
    return {
      esValido: false,
      error: `Ya existe una arista dirigida de ${origen} hacia ${destino}.`
    };
  }

  // 3. Validar peso
  const validacionPeso = validarPesoArista(pesoCrudo);
  if (!validacionPeso.esValido) {
    return { esValido: false, error: validacionPeso.error };
  }

  // 4. Detección manual de ciclos mediante DFS
  // Si agregamos la arista origen -> destino, se creará un ciclo si y solo si ya existe
  // un camino dirigido previo desde 'destino' hacia 'origen'.
  const adyacenciaActual = grafo.obtenerListaAdyacencia();
  const caminoExistente = buscarCaminoDirigidoDFS(adyacenciaActual, destino, origen);

  if (caminoExistente) {
    const nodosCiclo = [...caminoExistente, destino];
    const cicloFormateado = nodosCiclo.join(' → ');
    return {
      esValido: false,
      error: `No se puede agregar ${origen} → ${destino} porque formaría un ciclo dirigido: ${cicloFormateado}.`,
      caminoCiclo: nodosCiclo
    };
  }

  return { esValido: true, error: null, peso: validacionPeso.valor };
}

/**
 * Valida los parámetros necesarios para ejecutar el algoritmo de Dijkstra.
 * @param {object} grafo 
 * @param {string} origen 
 * @param {string} destino 
 * @returns {{ esValido: boolean, error: string | null }}
 */
export function validarInicioDijkstra(grafo, origen, destino) {
  const nodos = grafo.obtenerNodos();
  const aristas = grafo.obtenerAristas();

  if (nodos.length === 0) {
    return { esValido: false, error: 'Primero debe configurar y crear los nodos del grafo.' };
  }

  if (aristas.length === 0) {
    return { esValido: false, error: 'El grafo debe tener al menos una arista para ejecutar Dijkstra.' };
  }

  if (!origen || !destino) {
    return { esValido: false, error: 'Debe seleccionar tanto el nodo origen como el nodo destino.' };
  }

  if (!nodos.includes(origen) || !nodos.includes(destino)) {
    return { esValido: false, error: 'El nodo origen o destino seleccionado no pertenece al grafo.' };
  }

  if (origen === destino) {
    return {
      esValido: false,
      error: 'El vértice origen y el vértice destino deben ser diferentes para calcular el camino.'
    };
  }

  return { esValido: true, error: null };
}
