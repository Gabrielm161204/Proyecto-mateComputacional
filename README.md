# Simulador Interactivo del Algoritmo de Dijkstra para el Problema del Camino Mínimo

**Asignatura:** Matemática Computacional  
**Institución:** Universidad Peruana de Ciencias Aplicadas (UPC)  
**Tema:** Problema del camino mínimo en Grafos Dirigidos Acíclicos Ponderados (DAGs) mediante el Algoritmo de Dijkstra  

---

## 1. Descripción del Proyecto

Este proyecto consiste en una aplicación web interactiva de nivel universitario que modela, visualiza y resuelve el **Problema del Camino Mínimo** aplicando el **Algoritmo de Dijkstra** sobre grafos dirigidos, ponderados y acíclicos (DAGs).

La herramienta está diseñada con fines didácticos para exposiciones y sustentaciones académicas, permitiendo a los estudiantes y docentes observar paso a paso la evolución de las distancias tentativas, el etiquetado de vértices, la relajación de aristas y la detección simultánea de **múltiples caminos mínimos alternativos de igual costo óptimo**.

### 🌟 Características Principales

- **Configuración de nodos alfabéticos:** Admite $n \in [7, 16]$ generando etiquetas consecutivas $A, B, C, \dots, P$.
- **Doble modo de construcción:**
  - **Construcción manual:** Definición vértice a vértice con validaciones estrictas y detección inmediata de ciclos dirigidos usando DFS manual.
  - **Generación aleatoria:** Creación automática de DAGs ponderados con densidad graduable (baja, media, alta) y conectividad asegurada entre el primer y último vértice.
- **Caso de prueba demostrativo integrado:** Botón especial que carga una configuración de 8 nodos ($A$ a $H$) con **4 caminos mínimos simultáneos** de igual coste ($15$), ideal para sustentar empates en vivo.
- **Visualización en Cytoscape.js:** Renderizado nítido de nodos, flechas dirigidas, etiquetas de peso y distribución por capas topológicas de izquierda a derecha.
- **Ejecución pedagógica paso a paso:**
  - Desglose detallado por fases: selección del nodo mínimo no visitado, examen arista por arista, relajación de distancias, empates y cierre de visitados.
  - Explicación narrativa en español con operaciones matemáticas explícitas ($dist(u) + peso(u \to v)$).
  - Tabla de distancias acumuladas, predecesores y estados ($Origen, Visitado, Pendiente, Inalcanzable$).
- **Múltiples caminos mínimos:** Reconstrucción exhaustiva por backtracking de predecesores múltiples, formateo de secuencias de vértices y resaltado en carmesí sobre el grafo.
- **Representaciones matemáticas formales:** Visualización en vivo de la **Lista de Adyacencia** y de la **Matriz de Pesos** (adyacencia ponderada con ceros en la diagonal y $\infty$ para pares no conectados).
- **Navegación temporal completa:** Avanzar, retroceder (utilizando el historial sin recalcular), saltar al resultado final y reiniciar, con atajos de teclado (flechas $\leftarrow$ y $\rightarrow$, Inicio, Fin).

---

## 2. Tecnologías Empleadas

El proyecto cumple estrictamente las restricciones técnicas solicitadas:

- **HTML5:** Semántica limpia, accesible y estructurada.
- **CSS3:** Variables CSS (custom properties), diseño responsivo mediante CSS Grid y Flexbox, tarjetas con sombras suaves y estética académica contemporánea.
- **JavaScript Moderno (ES6+):** Código modular organizado con `import` / `export`.
- **Cytoscape.js (v3.30.2 CDN):** Utilizado **exclusivamente** como motor de dibujo, posicionamiento visual y estilización de nodos/aristas.
- **100% Código Propio para Algoritmos:**
  - Representación interna del grafo ($graph.js$).
  - Detección de ciclos con DFS ($validation.js$).
  - Algoritmo de Dijkstra paso a paso ($dijkstra.js$).
  - Reconstrucción de múltiples caminos óptimos con backtracking ($paths.js$).
  - Matriz y lista de adyacencia manuales ($graph.js$ / $ui.js$).
- **Sin backend ni bases de datos.**
- **Sin Node.js obligatorio ni frameworks.**

---

## 3. Estructura de Archivos

```
/
├── index.html              # Interfaz de usuario estructurada en secciones 1 a 8
├── README.md               # Documentación académica completa y guía de sustentación
├── styles/
│   └── main.css            # Hoja de estilos responsiva, temas y tipografías
└── js/
    ├── app.js              # Controlador principal, ciclo de vida y eventos del DOM
    ├── graph.js            # Modelo de datos del grafo, DAG aleatorio y matriz de adyacencia
    ├── validation.js       # Validaciones numéricas y detección de ciclos vía DFS
    ├── dijkstra.js         # Algoritmo de Dijkstra paso a paso e historial pedagógico
    ├── paths.js            # Reconstrucción de rutas mínimas múltiples y cálculo de costes
    ├── step-manager.js     # Gestor de navegación temporal (adelante, atrás, fin, reinicio)
    └── ui.js               # Renderizado Cytoscape.js, tablas, matrices y alertas
```

### Responsabilidades por Módulo

| Módulo | Responsabilidad |
|---|---|
| [graph.js](file:///c:/Users/gmora/Documents/js/graph.js) | Gestiona los arreglos de nodos y aristas, niveles topológicos para el layout horizontal, construcción de la lista y matriz de adyacencia, y generación de DAGs. |
| [validation.js](file:///c:/Users/gmora/Documents/js/validation.js) | Valida que $7 \le n \le 16$, pesos enteros $w \ge 1$, previene autoaristas y aristas duplicadas. Implementa DFS para detectar si agregar $u \to v$ crea un ciclo. |
| [dijkstra.js](file:///c:/Users/gmora/Documents/js/dijkstra.js) | Ejecuta Dijkstra registrando un objeto de estado en cada acción (inicio, selección de nodo, evaluación de arista con casos mejor/empate/peor, visitado y fin). |
| [paths.js](file:///c:/Users/gmora/Documents/js/paths.js) | Algoritmo de backtracking inverso desde el destino hacia el origen a través de `predecessors[v]`, extrayendo todas las ramas óptimas sin duplicados. |
| [step-manager.js](file:///c:/Users/gmora/Documents/js/step-manager.js) | Administra el índice actual del historial, permitiendo retroceder sin volver a computar el algoritmo. |
| [ui.js](file:///c:/Users/gmora/Documents/js/ui.js) | Configura la instancia de Cytoscape.js, actualiza los selectores del DOM, las tablas dinámicas, la matriz y la lista de adyacencia. |
| [app.js](file:///c:/Users/gmora/Documents/js/app.js) | Conecta los botones, atajos de teclado y coordina la sincronización reactiva entre los datos y la interfaz. |

---



## 4. Instrucciones de Despliegue en GitHub Pages

Para publicar el simulador como un sitio estático gratuito en la web:

1. **Crear repositorio en GitHub:**
   - Inicie sesión en [GitHub](https://github.com/) y cree un nuevo repositorio público (por ejemplo, `simulador-dijkstra-dag`).
2. **Subir los archivos:**
   En la raíz del proyecto local, inicialice git y envíe los cambios:
   ```bash
   git init
   git add .
   git commit -m "feat: Simulador interactivo de Dijkstra para Matemática Computacional"
   git branch -M main
   git remote add origin https://github.com/SU_USUARIO/simulador-dijkstra-dag.git
   git push -u origin main
   ```
3. **Activar GitHub Pages:**
   - En la página de su repositorio en GitHub, vaya a **Settings** > **Pages** (en el menú lateral izquierdo).
   - En **Build and deployment > Branch**, seleccione la rama `main` y la carpeta `/ (root)`.
   - Haga clic en **Save**.
4. En 1 a 2 minutos, GitHub Pages generará la URL pública:
   `https://SU_USUARIO.github.io/simulador-dijkstra-dag/`

---

## 5. Lista de Pruebas Manuales (Casos de Prueba)

| Caso de Prueba | Entrada / Acción | Resultado Esperado |
|---|---|---|
| **CP-01: Rango inferior de nodos** | Ingresar `6` en cantidad de nodos y pulsar "Crear nodos". | Mensaje de error: *"La cantidad mínima requerida es 7 nodos"*. No altera el grafo. |
| **CP-02: Rango superior de nodos** | Ingresar `17` en cantidad de nodos y pulsar "Crear nodos". | Mensaje de error: *"La cantidad máxima permitida es 16 nodos"*. |
| **CP-03: Entrada no entera o texto** | Ingresar `8.5` o `abc`. | Mensaje de error rechazando valores no enteros. |
| **CP-04: Autoarista (Bucle)** | Seleccionar Origen: `A`, Destino: `A`, Peso: `5`. | Mensaje de error: *"No se permiten autoaristas (un vértice no puede conectarse consigo mismo: A → A)"*. |
| **CP-05: Arista duplicada** | Agregar `A → B` (peso 4) y luego intentar agregar `A → B` (peso 6). | Rechazado con mensaje: *"Ya existe una arista dirigida de A hacia B"*. |
| **CP-06: Peso no positivo** | Ingresar peso `0` o `-3`. | Rechazado con mensaje: *"El peso debe ser un número entero estrictamente mayor que cero (w ≥ 1)"*. |
| **CP-07: Detección manual de ciclos (DFS)** | Teniendo aristas `A → B` y `B → C`, intentar agregar `C → A`. | **Rechazado inmediatamente**. Muestra el mensaje exacto: *"No se puede agregar C → A porque formaría un ciclo dirigido: C → A → B → C"*. |
| **CP-08: Grafo aleatorio acíclico** | Seleccionar densidad "Media" y pulsar "Generar grafo aleatorio". | Genera aristas dirigidas sin ciclos, conecta desde el primer vértice al último, actualiza la matriz y Cytoscape. |
| **CP-09: Ejemplo demostrativo con empates** | Pulsar "⭐ Cargar ejemplo (Múltiples caminos mínimos)". | Carga 8 nodos ($A$ a $H$) con 13 aristas. Al correr de $A$ a $H$, encuentra **4 caminos mínimos** de coste 15: $A \to B \to D \to G \to H$, $A \to C \to D \to G \to H$, $A \to B \to E \to G \to H$, $A \to C \to F \to G \to H$. |
| **CP-10: Vértice inalcanzable** | Crear nodos $A$ a $G$, aristas solo entre $A \to B \to C$. Elegir Origen: $A$, Destino: $G$. | Dijkstra corre los nodos alcanzables y al final informa claramente: *"No existe una ruta dirigida desde A hasta G (distancia = ∞)"*. |
| **CP-11: Navegación bidireccional de pasos** | Pulsar "Siguiente paso" varias veces y luego "Paso anterior". | El visor retrocede de forma instantánea al estado previo utilizando el historial sin recalcular Dijkstra. |
| **CP-12: Origen igual a destino** | Seleccionar Origen: `B`, Destino: `B` y pulsar "Iniciar Dijkstra". | Rechazado: *"El vértice origen y el vértice destino deben ser diferentes"*. |

---

## 6. Puntos Clave para la Sustentación Académica

Respuestas directas y fundamentadas a las preguntas teóricas del docente:

### 1. ¿Qué representa un grafo dirigido y ponderado?
Un grafo dirigido $G = (V, E)$ es un conjunto de vértices $V$ y aristas orientadas $E \subseteq V \times V$, donde cada arista $(u, v)$ posee una dirección fija desde el nodo de partida $u$ hacia el nodo de llegada $v$ (es decir, el tránsito solo es posible en el sentido de la flecha). Que sea **ponderado** significa que a cada arista $(u, v) \in E$ se le asocia una función de peso $w(u, v) \in \mathbb{R}^+$ (en nuestro caso, enteros positivos), representando el costo, distancia, consumo energético o latencia de desplazarse de $u$ a $v$.

### 2. ¿Por qué no se permiten pesos negativos en el algoritmo de Dijkstra?
Dijkstra es un algoritmo voraz (*greedy*) que asume que una vez que un vértice $u$ es extraído del conjunto de no visitados con la menor distancia tentativa, su distancia es **definitiva y óptima**. Si existieran pesos negativos, un camino que pase por aristas posteriores de peso negativo podría reducir la distancia hacia un vértice ya marcado como visitado, invalidando la propiedad de optimalidad y requiriendo reevaluar nodos ya cerrados (lo cual sí maneja el algoritmo de Bellman-Ford, pero no Dijkstra).

### 3. ¿Por qué el nodo seleccionado en cada iteración tiene la menor distancia tentativa?
Porque bajo la hipótesis de pesos no negativos ($w(e) \ge 0$), cualquier camino alternativo no explorado hacia ese vértice $u$ tendría que pasar por algún otro vértice no visitado $v'$ que ya posee una distancia mayor o igual ($dist(v') \ge dist(u)$). Dado que sumar pesos positivos solo puede incrementar o mantener el costo ($dist(v') + w \ge dist(u)$), es matemáticamente imposible encontrar un camino más corto hacia $u$ en etapas posteriores. Por ende, la distancia de $u$ queda formalmente consolidada.

### 4. ¿Qué significa relajar una arista?
Relajar una arista $(u, v)$ con peso $w(u, v)$ consiste en comprobar si la ruta que llega a $v$ pasando a través de $u$ es más corta que la mejor distancia conocida hasta el momento para $v$:
$$\text{Si } dist(u) + w(u, v) < dist(v) \implies dist(v) \leftarrow dist(u) + w(u, v), \quad pred(v) \leftarrow [u]$$
Si la condición se cumple, se actualiza la etiqueta de distancia de $v$ y se reemplaza su predecesor.

### 5. ¿Qué es un predecesor?
El predecesor de un vértice $v$ es el vértice inmediato anterior $u$ a través del cual se alcanza $v$ en el camino óptimo desde el origen. Guardar los predecesores permite, al finalizar el algoritmo, reconstruir la secuencia completa del camino mínimo retrocediendo desde el destino hacia el origen ($destino \to \dots \to origen$) e invirtiendo la lista.

### 6. ¿Cómo se encuentran varias rutas mínimas alternativas?
Modificando el paso de relajación tradicional:
- Si $dist(u) + w(u, v) < dist(v)$: se actualiza la distancia y se define la lista de predecesores con un único elemento: $pred[v] = [u]$.
- Si $dist(u) + w(u, v) == dist(v)$: significa que existe **otra forma igualmente óptima** de llegar a $v$ con el mismo costo. En este caso, no se modifica la distancia, pero se añade $u$ a la lista de predecesores: $pred[v].\text{push}(u)$.
Al concluir, un recorrido recursivo con *backtracking* explora todas las combinaciones de predecesores ramificados desde el destino hasta el origen, descubriendo todos los caminos mínimos existentes sin duplicados.

### 7. ¿Cómo se evita que el grafo tenga ciclos?
En nuestro proyecto se implementan dos mecanismos:
1. **Modo Manual:** Antes de insertar la arista $u \to v$, ejecutamos una búsqueda en profundidad (**DFS manual**) buscando si existe un camino previo desde $v$ hasta $u$. Si $u$ es alcanzable desde $v$, agregar $u \to v$ cerraría el ciclo $u \to v \to \dots \to u$. El sistema detecta esto, cancela la inserción y notifica al usuario con la ruta exacta del ciclo.
2. **Modo Aleatorio:** Se asigna un orden topológico estricto a los nodos ($index(A) = 0 < index(B) = 1 < \dots < index(N) = n - 1$). Solo se generan aristas dirigidas desde un índice menor $i$ hacia un índice estrictamente mayor $j$ ($i < j$). Matemáticamente, un grafo con aristas dirigidas únicamente hacia índices crecientes es **intrínsecamente acíclico (DAG)**.

### 8. ¿Qué parte realiza Cytoscape.js y qué parte implementó el equipo?
- **Cytoscape.js hace únicamente:** El renderizado gráfico del canvas en HTML5 Canvas/SVG, la animación de posiciones, el dibujo de arcos y puntas de flecha dirigidas, y la respuesta a eventos de zoom y arrastre.
- **El equipo implementó manualmente en JavaScript:**
  1. La clase [Graph](file:///c:/Users/gmora/Documents/js/graph.js) con el grafo interno, lista de adyacencia y matriz de pesos.
  2. El algoritmo de niveles topológicos para el posicionamiento visual.
  3. El algoritmo DFS de detección de ciclos dirigidos y reconstrucción del ciclo infractor.
  4. La generación aleatoria garantizada de DAGs conexos.
  5. El algoritmo completo de Dijkstra con seguimiento de estado por iteración.
  6. La gestión de múltiples predecesores y empates matemáticos.
  7. El algoritmo de backtracking para reconstruir todos los caminos mínimos.
  8. El gestor de pasos bidireccional (avanzar y retroceder sin recálculo).
  9. Todas las validaciones de datos y reglas de negocio del curso.

---

*Proyecto desarrollado con fines académicos para el curso de Matemática Computacional - UPC.*
