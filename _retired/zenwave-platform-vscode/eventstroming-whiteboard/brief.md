# Brief: pizarra de Event Storming en VS Code

Oct 18, 2026 · @Ivan Garcia Sainz-Aja

## Objetivo y alcance

La v1 es una extensión de VS Code para que un facilitador dibuje el Event Storming de un proceso con 2 o 3 personas y exporte el resultado a ZFL con un botón. El problema de negocio es el hueco entre el taller y el primer modelo que compila: hoy es lento y pierde información por el camino.

**Entra en la v1**

- Pizarra de un solo usuario con notas tipadas y flechas.
- Paleta a la derecha y panel de detalle por nota.
- Guardado en un fichero JSON dentro del repo.
- Export a ZFL con diagnóstico.
- Funciona en VS Code de escritorio y en VS Code web.

**Queda fuera de la v1**

- Edición multiusuario en tiempo real. Para dos o tres personas, un driver y pantalla compartida bastan.
- Big picture. La v1 es para process level.
- Importar ZFL de vuelta a la pizarra.
- Publicación gratuita. Es una herramienta para usar como driver de sesiones o para licenciar.

## Principios de diseño

La pizarra es la fuente de verdad durante el taller y el ZFL es una exportación, no una sincronía. La razón es práctica: el estado de un taller es sucio, con notas sin ordenar, ramas a medias y hot spots, y un ZFL válido no tolera eso.

1. **Pizarra primero, ZFL después.** El export no vuelve a la pizarra. Quien edite el ZFL a mano después ya trabaja en otro sitio.
2. **Exportar con diagnóstico.** El botón genera lo que puede y avisa de lo que falta. Un export que falla entero desanima.
3. **Formatos abiertos.** JSON documentado y ZFL. Cualquier cliente puede llevarse sus datos y cerrar el programa.
4. **Local primero.** Un fichero en el repo, sin servidor.
5. **El driver manda.** La velocidad de entrada importa más que la belleza del diagrama.

## Arquitectura en VS Code

La extensión es un custom editor sobre un fichero JSON, con el webview como vista y un motor de export puro.

&#91;embedded content: arquitectura de la extensión · 5 componentes\]

El webview solo muestra y edita. Cada cambio viaja por mensaje al extension host, que lo aplica como una edición del documento. Así funcionan sin trabajo extra deshacer, guardar, git y los cambios hechos desde fuera. El webview se reconstruye desde el documento cuando hace falta.

## Canvas y paleta

El canvas es un React Flow dentro de un webview, con la paleta fija en el lado derecho. Cada ficha de la paleta tiene el color de la leyenda y se arrastra al canvas.

**Tipos de nota en la v1**

- Evento (naranja), comando (azul), actor, policy (lila), agregado (amarillo), read model (verde), sistema externo (rosa) y hot spot (rojo).
- La leyenda de colores es fija y siempre visible. Sin ella el export no se puede parsear.

**Flechas y grupos**

- La línea de tiempo va de izquierda a derecha, pero la flecha explícita lleva el flujo exacto. Se crea arrastrando desde el borde de una nota y puede llevar una etiqueta corta, como "si falla" o "reintentar".
- Un grupo es un contenedor para un sistema o contexto. Las notas que caen dentro heredan a qué sistema pertenecen.

**Atajos para el driver**

- Enter o doble clic edita el nombre de la nota seleccionada.
- Tab crea la siguiente nota conectada a la derecha y deja el cursor en ella.
- Lazo para selección múltiple. Deshacer y rehacer son los de VS Code.
- Un botón "Ordenar" lanza el layout automático con ELK. No se ejecuta solo, para no mover lo que el driver colocó.

## Edición: en línea y en el panel de detalle

El nombre se edita en línea sobre la nota y todo lo demás se edita en un panel de detalle a la derecha. Las dos cosas son necesarias: el nombre se toca cien veces durante el taller y no puede costar un clic extra, pero la descripción es texto largo y los campos tienen tipo.

Al seleccionar una nota, el panel de detalle aparece bajo la paleta. Sin selección solo se ve la paleta. Un campo obligatorio vacío se marca en rojo con el mismo mensaje que luego sale en el panel Problems.

| Tipo | Campos del panel de detalle |
| --- | --- |
| Evento | Nombre (en pasado), descripción, sistema (heredado del grupo), payload en texto libre |
| Comando | Nombre (imperativo), actor, descripción, sistema |
| Policy | Nombre, **descripción obligatoria**, eventos que la disparan y comandos que lanza (ambos derivados de las flechas) |
| Agregado | Nombre, descripción, sistema |
| Read model | Nombre, descripción, quién lo consulta |
| Sistema externo | Nombre, descripción |
| Actor | Nombre, rol |
| Hot spot | Pregunta, estado (abierto o resuelto), notas |

La descripción de la policy va al JavaDoc del bloque ZFL, por eso es obligatoria y se escribe en Markdown ligero. En el resto de tipos es opcional. Cómo se traduce exactamente al JavaDoc se define contra la gramática real de ZFL.

## Modelo de datos

El fichero es un JSON documentado, con nodos, aristas y grupos en mapas por id. Esa forma da diffs limpios en git y deja la puerta abierta a Yjs, donde cada mapa pasa a ser un `Y.Map` sin rediseñar nada.

```json
{
  "version": 1,
  "title": "Checkout de edición limitada",
  "groups": {
    "g_storefront": { "name": "Storefront", "x": 0, "y": 0, "w": 900, "h": 400 }
  },
  "nodes": {
    "n_01": { "type": "event", "name": "Cart Submitted", "group": "g_storefront", "x": 120, "y": 80 },
    "n_02": { "type": "policy", "name": "Reserve copy on submit", "description": "Cuando se envía el carrito, se reserva una copia numerada.", "x": 320, "y": 80 }
  },
  "edges": {
    "e_01": { "from": "n_01", "to": "n_02", "label": "" }
  }
}
```

- Los ids son estables y cortos. Nunca se usa el índice de un array como identidad.
- Las claves se escriben siempre en el mismo orden, para que el diff de git se lea.
- `version` permite migrar ficheros antiguos.
- Las posiciones `x` e `y` van en el mismo fichero porque la pizarra es la fuente. Si ensucian los diffs, se pueden mover a un fichero aparte sin cambiar el modelo.
- Si más adelante hay una vista en vivo, el orden de las notas se guardará con índices fraccionarios y no por posición.

## Export a ZFL con diagnóstico

El botón exporta lo que puede y publica en el panel Problems de VS Code un informe de lo que falta. Un comando, `ZenWave: Export board to ZFL`, escribe el fichero `.zfl` junto al de la pizarra.

**Mapeo provisional.** Se define contra la gramática real de ZFL y se prueba con dos o tres procesos de Arcadia antes de construir nada más.

| Pizarra | ZFL |
| --- | --- |
| Policy | Bloque `when` con sus eventos de entrada |
| Comando lanzado por una policy | Llamada (`call`, o `async call` si es asíncrona) |
| Evento resultante | `emits`, agrupado con `@outcome` si hay ramas |
| Descripción de la policy | JavaDoc del bloque |
| Rama de fallo con compensación | `@compensates` y `compensatedBy` |

**Diagnóstico.** Usa la colección de diagnósticos de VS Code. Cada mensaje apunta a una nota, y el webview la resalta con un borde.

- Error: comando sin actor, policy sin evento de entrada, policy sin descripción.
- Aviso: evento sin sistema, nota sin conectar, hot spot abierto.
- Lo que no se puede resolver sale en el ZFL como comentario `TODO`. Nunca se omite en silencio.

**Implementación.** Una función pura en Kotlin Multiplatform: entra el JSON de la pizarra, salen el texto ZFL y la lista de diagnósticos. Se prueba con ficheros de referencia, sin abrir VS Code. El export es de un solo sentido y no hay importación de vuelta en la v1.

## Modo web y restricciones

La misma extensión corre en VS Code de escritorio y en VS Code web si se empaqueta como extensión web. El precio es no depender de nada que solo exista en escritorio.

- **Entrada `browser` en `package.json`.** La extensión corre en un web worker, sin Node, sin `fs` y sin procesos hijos.
- **Ficheros por `vscode.workspace.fs`.** Así funciona también con repos abiertos en vscode.dev o github.dev.
- **El export vive dentro de la extensión.** No puede llamar al CLI JBang de ZenWave, porque en web no hay proceso externo. Por eso la lógica va en Kotlin Multiplatform compilado a JS.
- **Webview.** React y React Flow empaquetados con esbuild. Se sirven igual en escritorio y en web.
- **Layout.** `elkjs`, en su variante para web worker.
- **Pruebas.** Pruebas de escritorio normales más `@vscode/test-web` para el modo web.

## Tecnologías

La pila reutiliza lo que ya usas en ZenWave y deja fuera todo lo que exigiría un servidor.

| Capa | Elección | Por qué, y qué se descarta |
| --- | --- | --- |
| Editor | Custom Text Editor de VS Code, sobre un fichero JSON | Deshacer, guardar, git y cambios externos funcionan con VS Code. Se descarta un editor binario propio. |
| Canvas | React Flow (xyflow) | Nodos propios con campos, aristas y arrastrar desde una paleta. Excalidraw y tldraw se orientan a dibujo libre, sin notas tipadas. |
| Layout automático | elkjs | Es lo que usa EventCatalog y corre en un web worker. |
| Panel de detalle | React con CSS sobre las variables del tema de VS Code | Hereda tema claro y oscuro sin librerías extra. |
| Lógica de export | Kotlin Multiplatform compilado a JS | Misma pila que el resto de ZenWave. Se prueba sin VS Code. |
| Empaquetado | esbuild | Un paquete para la extensión web y otro para el webview. |
| Estado compartido (después) | Yjs | Solo si las sesiones reales piden edición simultánea. Fuera de la v1. |

## Hitos

Los hitos 1 a 4 son del orden de unas pocas semanas de trabajo con foco. Es una estimación sin medir. El hito 4 es el que decide si el resto merece la pena.

1. **Esqueleto.** Custom editor con webview, React Flow y guardado en JSON. Salida: crear dos notas, conectarlas, guardar, cerrar y reabrir sin perder nada.
2. **Paleta y tipos.** Los ocho tipos de nota, la leyenda y los grupos. Salida: dibujar un proceso de Arcadia completo.
3. **Panel de detalle y atajos.** Edición en línea, campos por tipo y Tab para encadenar notas. Salida: un driver escribe el proceso sin tocar el ratón más de lo necesario.
4. **Export a ZFL con diagnóstico.** Mapeo contra la gramática real y panel Problems. Salida: un proceso de Arcadia sale como ZFL y compila.
5. **Modo web.** Empaquetado como extensión web y prueba en vscode.dev.
6. **Sesiones reales.** Tres sesiones con la métrica de la sección siguiente.

**Para después, solo si las sesiones lo piden**

- Vista en vivo de solo lectura para los otros participantes, con un websocket.
- Edición multiusuario con Yjs.
- Importar ZFL a la pizarra.
- Big picture.
- El mismo renderer para las historias de Domain Storytelling, con otra gramática.

## Riesgos, preguntas abiertas y métrica

La métrica es el número de horas entre el fin de una sesión y el primer ZFL que compila. Si baja a unas pocas horas, hay un argumento comercial que no depende de la pizarra.

**Riesgos**

- **El mapeo de notas a ZFL pierde información o fuerza un estilo.** Se mitiga probando con dos o tres procesos de Arcadia antes de pulir el canvas.
- **El teclado es más lento que el papel en un taller.** Se prueba con un facilitador real antes de añadir funciones.
- **El estado del webview se pierde al ocultarlo.** El documento es la fuente de verdad y el webview se reconstruye desde él.
- **El foso es más fino de lo que parece.** La pizarra se copia. El valor está en el método, en los procesos ya modelados y en la cadena integrada hasta el SDK.
- **Tensión con la decisión de que la UI web sea de solo lectura y la edición pase por Git.** Hay que decidir si la pizarra es parte de la plataforma o una herramienta aparte.

**Preguntas abiertas**

- ¿El panel de detalle va apilado bajo la paleta o en pestañas?
- ¿Los disparadores y las acciones de una policy se derivan de las flechas o son campos explícitos?
- ¿Qué pasa con los hot spots tras el export: comentarios en el ZFL o solo informe?
- ¿Un fichero por proceso o uno por bounded context?
- ¿Qué extensión de fichero se usa, por ejemplo `.esboard.json`?
