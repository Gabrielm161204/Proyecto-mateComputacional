# Simulador del Algoritmo de Dijkstra — Problema del Camino Mínimo

**Asignatura:** Matemática Computacional · **Institución:** UPC  
**Tema 2:** Problema del camino mínimo en grafos dirigidos acíclicos ponderados (DAGs)

> **Estado: primera entrega (semana 6) — avance del 50 %.**

---

## 1. ¿De qué trata el proyecto?

Este proyecto es un **simulador interactivo y pedagógico** del algoritmo de Dijkstra aplicado al problema del camino mínimo en grafos dirigidos acíclicos ponderados (DAG, por sus siglas en inglés: *Directed Acyclic Graph*).

El objetivo es permitir al usuario **construir su propio grafo** paso a paso —definiendo la cantidad de vértices, las aristas y sus pesos— y luego **ejecutar el algoritmo de Dijkstra de forma visual**, observando en tiempo real cómo se evalúan, relajan o descartan las aristas, cómo se actualizan las distancias tentativas y cómo se reconstruye el camino mínimo al finalizar.

El proyecto tiene dos propósitos fundamentales:

1. **Académico:** demostrar la comprensión del algoritmo de Dijkstra, incluyendo su funcionamiento interno (inicialización, selección del mínimo, relajación de aristas, marcado de visitados y reconstrucción del camino), así como las representaciones matemáticas formales del grafo (lista de adyacencia y matriz de pesos).
2. **Didáctico:** presentar cada iteración del algoritmo con su explicación textual y su operación matemática correspondiente, de modo que cualquier persona pueda seguir el proceso sin conocimiento previo del algoritmo.

El grafo se renderiza visualmente con colores diferenciados para cada estado del nodo o arista (origen, destino, actual, visitado, en evaluación, relajado, camino mínimo), y al finalizar el algoritmo el camino óptimo se resalta en rojo sobre el grafo.

---

## 2. ¿Qué incluye esta versión?

- **Cantidad de nodos** configurable: n ∈ [7, 16], con etiquetas alfabéticas A, B, C, …
- **Construcción manual** del grafo: origen, destino y peso entero w ≥ 1.
  - No permite autoaristas ni aristas duplicadas.
  - **Detecta ciclos dirigidos con DFS** antes de insertar cada arista y muestra exactamente el ciclo que se formaría.
- **Ejemplo cargable** de 8 nodos (A–H) con camino mínimo A → H de costo 15, diseñado para mostrar relajaciones, descartes y un resultado final claro.
- **Grafo dibujado y etiquetado** con Cytoscape.js, con posicionamiento automático por capas topológicas.
- **Representaciones matemáticas formales:**
  - Lista de adyacencia actualizada en vivo.
  - Matriz de pesos ponderada (0 en la diagonal, ∞ para pares sin arista).
- **Selección libre de origen y destino** para ejecutar el algoritmo en cualquier par de vértices.
- **Dijkstra paso a paso** (botones *Siguiente paso* y *Reiniciar*):
  - Tabla de etiquetas con distancia acumulada, predecesor y estado de cada vértice.
  - Selección del nodo no visitado con menor distancia tentativa.
  - Relajación de aristas (`dist(u) + w < dist(v)`) o descarte explicado.
  - Barra de progreso y contador de pasos.
  - Explicación textual y operación matemática en cada paso.
- **Resultado final:** distancia mínima y secuencia de vértices del camino óptimo, resaltado en rojo sobre el grafo. Si el destino no es alcanzable, lo informa con la distancia ∞.

---

## 3. Pendiente para la entrega final (semana 11)

- Generación aleatoria de DAGs válidos.
- Detección y listado de **todos los caminos mínimos** (empates de distancia y backtracking de predecesores) y su conteo.
- Navegación hacia atrás en los pasos y salto directo al resultado final.
- Diagrama de flujo del algoritmo, resultados y conclusiones del análisis.

---

## 4. Tecnologías

El proyecto está desarrollado únicamente con tecnologías web estándar, sin frameworks ni gestores de paquetes:

| Tecnología | Versión | Uso |
|---|---|---|
| HTML5 | — | Estructura de la interfaz (5 secciones funcionales) |
| CSS3 | — | Estilos, variables CSS, diseño editorial responsive |
| JavaScript ES6 | Módulos nativos | Lógica completa del algoritmo y la interfaz |
| Cytoscape.js | 3.30.2 (CDN) | Renderizado gráfico del grafo |
| Google Fonts (Inter) | — | Tipografía de la interfaz |

> Los módulos ES6 requieren un servidor HTTP: abrir con **Live Server** en VSCode o publicar en **GitHub Pages**. No funciona con doble clic (`file:///`).

---

## 5. Bibliotecas utilizadas

### Cytoscape.js (única dependencia externa)

**Versión:** 3.30.2 — cargada desde CDN oficial de cdnjs.

**URL:** `https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.2/cytoscape.min.js`

**Para qué se usa exclusivamente:**
- Renderizar el grafo como un lienzo interactivo (nodos y aristas con flechas dirigidas).
- Aplicar estilos visuales por clase CSS a nodos y aristas según su estado en el algoritmo (origen, destino, actual, visitado, evaluando, mejorado, camino mínimo).
- Ajustar y centrar la vista del grafo (`fit`).
- Controlar el zoom con sensibilidad reducida.

**Qué NO hace Cytoscape.js en este proyecto:**
- No gestiona la estructura de datos del grafo (eso lo hace `grafo.js`).
- No ejecuta el algoritmo de Dijkstra.
- No detecta ciclos ni valida aristas.
- No construye la lista de adyacencia ni la matriz de pesos.
- No reconstruye el camino mínimo.

Todo el algoritmo, las validaciones y las representaciones matemáticas son **código propio, implementado desde cero**.

### Google Fonts — Inter

**Uso:** Tipografía `Inter` en pesos 400, 500, 600 y 700 para toda la interfaz. Se carga desde `fonts.googleapis.com` mediante `<link>` en el `<head>`.

---

## 6. Estructura del proyecto

```
copiaProyectoMate/
│
├── index.html              Interfaz completa (secciones 1 a 5)
├── README.md               Este archivo
├── .gitignore              Archivos excluidos del repositorio
│
├── styles/
│   └── main.css            Hoja de estilos con diseño editorial
│
└── js/
    ├── aplicacion.js       Controlador principal y manejadores de eventos
    ├── grafo.js            Modelo del grafo: nodos, aristas, lista y matriz de adyacencia
    ├── validacion.js       Validaciones y detección de ciclos dirigidos (DFS)
    ├── dijkstra.js         Algoritmo de Dijkstra e historial de pasos pedagógicos
    ├── caminos.js          Reconstrucción del camino mínimo a partir de predecesores
    ├── gestor-pasos.js     Navegación y control del historial de pasos
    └── interfaz.js         Manipulación del DOM, Cytoscape, tablas y mensajes
```

**Flujo de dependencias entre módulos:**

```
index.html
    └── aplicacion.js
            ├── grafo.js
            ├── validacion.js
            ├── gestor-pasos.js
            ├── interfaz.js
            └── dijkstra.js
                    └── caminos.js
```

---

## 7. Algoritmo de Dijkstra

El algoritmo de Dijkstra resuelve el problema del **camino mínimo de fuente única** en grafos con pesos no negativos.

### Pseudocódigo

```
Inicializar: dist(origen) = 0,  dist(v) = ∞ para todo v ≠ origen
             pred(v) = null para todo v
             NoVisitados = { todos los vértices }

Mientras NoVisitados no esté vacío:
    u ← vértice en NoVisitados con menor dist(u)
    Si dist(u) = ∞: break  (restantes inalcanzables)

    Para cada arista (u → v) con peso w:
        Si dist(u) + w < dist(v):
            dist(v) ← dist(u) + w
            pred(v) ← u

    Marcar u como visitado (eliminar de NoVisitados)

Reconstruir camino: seguir pred[] desde destino hasta origen e invertir
```

### Relajación de aristas

La condición clave del algoritmo es la **relajación**:

```
si dist(u) + w < dist(v):   dist(v) ← dist(u) + w;   pred(v) ← u
```

Si la nueva distancia calculada es estrictamente menor que la conocida, se actualiza. Si no mejora, la arista se descarta para ese paso.

### Complejidad

| Implementación | Tiempo |
|---|---|
| Lista simple (esta implementación) | O(V²) |
| Con cola de prioridad (min-heap) | O((V + E) log V) |

Esta implementación usa búsqueda lineal del mínimo (O(V²)), apropiada para grafos de tamaño académico (hasta 16 vértices).

**Nota:** el algoritmo requiere pesos estrictamente no negativos, por eso se exige w ≥ 1. Con pesos negativos el algoritmo no garantiza resultados correctos.

El camino se reconstruye siguiendo `pred[]` desde el destino hasta el origen. Requiere pesos no negativos, por eso se exige w ≥ 1.

---

## 8. Pruebas manuales

| Caso | Acción | Resultado esperado |
|---|---|---|
| CP-01 | n = 6 | Error: mínimo 7 nodos |
| CP-02 | n = 17 | Error: máximo 16 nodos |
| CP-03 | n = `8.5` o `abc` | Error: debe ser entero |
| CP-04 | Arista A → A | Error: no se permiten autoaristas |
| CP-05 | Agregar A → B dos veces | Error: arista ya existe |
| CP-06 | Peso 0 o negativo | Error: peso ≥ 1 |
| CP-07 | A → B, B → C y luego C → A | Rechazada, muestra el ciclo que se formaría |
| CP-08 | Cargar ejemplo, A → H | Distancia 15, camino A → B → E → G → H |
| CP-09 | Nodos A–G, solo A → B → C; A → G | Informa destino inalcanzable (∞) |
| CP-10 | Origen = destino | Error: deben ser distintos |

---

## 9. Despliegue

### GitHub Pages

1. Subir el repositorio a GitHub.
2. Ir a **Settings → Pages → Source → main / (root)**.
3. El proyecto queda disponible en `https://usuario.github.io/repositorio/`.

### Live Server (desarrollo local)

1. Instalar la extensión **Live Server** en VSCode.
2. Clic derecho sobre `index.html` → **Open with Live Server**.
3. El navegador abre automáticamente en `http://127.0.0.1:5500`.

> **Importante:** No abrir con doble clic (`file:///`). Los módulos ES6 requieren protocolo HTTP o HTTPS.

---

*Proyecto académico — Matemática Computacional — UPC*
