# Simulador del Algoritmo de Dijkstra — Problema del Camino Mínimo

**Asignatura:** Matemática Computacional · **Institución:** UPC
**Tema 2:** Problema del camino mínimo en grafos dirigidos acíclicos ponderados (DAGs)

> **Estado: primera entrega (semana 6) — avance del 50 %.**
> La versión completa se conserva en la rama `main`.

## 1. Qué incluye esta versión

- **Cantidad de nodos** n ∈ [7, 16], con etiquetas alfabéticas A, B, C, …
- **Construcción manual** del grafo: origen, destino y peso entero w ≥ 1.
  - No permite autoaristas ni aristas duplicadas.
  - **Detecta ciclos con DFS** antes de insertar cada arista y muestra el ciclo que se formaría.
- **Ejemplo cargable** de 8 nodos (A–H) con camino mínimo A → H de costo 15.
- **Grafo dibujado y etiquetado** con Cytoscape.js.
- **Representaciones matemáticas:** lista de adyacencia y matriz de pesos (ceros en la diagonal y ∞ para pares sin arista), actualizadas en vivo.
- **Selección de origen y destino.**
- **Dijkstra paso a paso** (botones *Siguiente paso* y *Reiniciar*):
  - Etiquetado de vértices y tabla de distancias, predecesor y estado.
  - Selección del nodo no visitado de menor distancia.
  - Relajación de aristas (`dist(u) + w < dist(v)`) o descarte.
  - Explicación y operación matemática en cada paso.
- **Resultado final:** distancia mínima y secuencia de vértices del camino, resaltado en rojo sobre el grafo. Si el destino no es alcanzable, lo informa.

## 2. Pendiente para la entrega final (semana 11)

- Generación aleatoria de DAGs.
- Detección y listado de **todos los caminos mínimos** (empates de distancia y backtracking de predecesores) y su conteo.
- Navegación hacia atrás y salto al resultado final.
- Diagrama de flujo, resultados y conclusiones.

## 3. Tecnologías

HTML5, CSS3 y JavaScript ES6 modular. **Cytoscape.js** (CDN) se usa solo para dibujar el grafo; la representación del grafo, la detección de ciclos, Dijkstra y la reconstrucción del camino son código propio.

> Los módulos ES6 requieren un servidor: abrir con **Live Server** o publicar en **GitHub Pages**. No funciona con doble clic (`file:///`).

## 4. Estructura

```
index.html          Interfaz (secciones 1 a 5)
styles/main.css     Estilos
js/app.js           Controlador y eventos
js/graph.js         Modelo del grafo, lista y matriz de adyacencia, ejemplo
js/validation.js    Validaciones y detección de ciclos (DFS)
js/dijkstra.js      Algoritmo de Dijkstra e historial de pasos
js/paths.js         Reconstrucción del camino mínimo
js/step-manager.js  Navegación del historial de pasos
js/ui.js            Cytoscape, tablas, matriz y mensajes
```

## 5. Pruebas manuales

| Caso | Acción | Resultado esperado |
|---|---|---|
| CP-01 | n = 6 | Error: mínimo 7 nodos |
| CP-02 | n = 17 | Error: máximo 16 nodos |
| CP-03 | n = `8.5` o `abc` | Error: debe ser entero |
| CP-04 | Arista A → A | Error: no se permiten autoaristas |
| CP-05 | Agregar A → B dos veces | Error: arista ya existe |
| CP-06 | Peso 0 o negativo | Error: peso ≥ 1 |
| CP-07 | A → B, B → C y luego C → A | Rechazada, muestra el ciclo |
| CP-08 | Cargar ejemplo, A → H | Distancia 15, camino A → B → E → G → H |
| CP-09 | Nodos A–G, solo A → B → C; A → G | Informa destino inalcanzable (∞) |
| CP-10 | Origen = destino | Error: deben ser distintos |

## 6. Algoritmo

Dijkstra mantiene `dist(v)` y `pred(v)` para cada vértice. En cada iteración elige el no visitado con menor `dist(u)`, relaja sus aristas salientes y lo marca como visitado. Relajar `(u, v)` con peso `w` significa:

```
si dist(u) + w < dist(v):  dist(v) ← dist(u) + w;  pred(v) ← u
```

El camino se reconstruye siguiendo `pred` desde el destino hasta el origen. Requiere pesos no negativos, por eso se exige w ≥ 1.
