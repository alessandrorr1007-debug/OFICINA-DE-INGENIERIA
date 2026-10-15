# Arquitectura actual

## Aplicación existente

Es una aplicación estática sin compilación ni servidor propio. HTML y CSS definen la interfaz; un script JavaScript concentra la lógica y carga Three.js mediante un import dinámico desde el mismo sitio. No se ha reemplazado la aplicación ni incorporado un framework.

## Estado y coordinación

`data` contiene misiones (`tasks`), solicitudes (`requests`), mensajes por empleado y actividad. `mission` referencia la misión activa; `missions` conserva la cola. `people` guarda los siete personajes, su posición, ruta, estado, temporizador, responsable de la misión y siguiente descanso. Paul vive dentro del controlador visual.

`choosePlan` selecciona especialistas mediante palabras clave. La coordinación usa estados como recibir, organizar, reunir, explicar, asignar, trabajar, recoger y presentar. Los resultados son plantillas simuladas. Aceptar termina una misión; pedir revisión repite el flujo actual.

## Escena y animación

Three.js usa WebGL 2, luces hemisférica/direccionales, materiales estándar y sombras. La geometría fija se agrupa por material. Las piezas de los personajes se reutilizan y transforman para caminar, conversar, trabajar y comer.

`requestAnimationFrame` avanza la simulación; pausa y velocidades multiplican su delta. La cámara permite giro, zoom, seguimiento y vistas de salas. Los controles son de puntero, rueda y gestos táctiles. Las etiquetas HTML se posicionan proyectando coordenadas 3D.

## Recorridos y limitaciones

`campusRoute` calcula puntos intermedios a través de entradas y pasillos. Las pruebas cubren 256 pares origen/destino y verifican sus centros respecto de las paredes. `traffic.js` añade una cola de turnos de circulación compartida con Paul. Un personaje camina y los demás esperan, evitando los bloqueos en encuentros opuestos. A* calcula una ruta libre respecto de paredes, escritorios, mesas registradas y posiciones de otros personajes; el movimiento comprueba cada segmento. El umbral entre centros es 0,72 unidades, con margen de planificación de 0,76. Si hay intercambio de destinos ocupados, un personaje se aparta temporalmente. Las sillas y sofás de asiento no están modelados como volúmenes físicos completos. Los guardados antiguos con superposiciones se separan al cargar, conservando una copia previa.

## Persistencia corregida

`save` añade un punto de control de versión interna 2 al formato local existente. Guarda referencias por identificador, posiciones, estados, temporizadores, rutas y acciones de llegada declarativas; no serializa ni evalúa funciones. `restoreRuntime` valida y reconstruye los callbacks mediante acciones conocidas. Los guardados anteriores usan la recuperación por etapas ya existente.

Paul y la cámara se conservan mediante un capturador visual. La interfaz vuelve a mostrar pausa y velocidad al recargar. Los resultados, mensajes, solicitudes y cola quedan en la misma estructura, con compatibilidad anterior y copia previa de JSON dañado.

## Pruebas y medición

`npm test` ejecuta las regresiones históricas y las pruebas de persistencia. El test de escena usa geometría real de Three.js con un renderizador de prueba, por lo que no ejecuta shaders ni mide rendimiento gráfico.

En un navegador real, `window.paulStudioDiagnostics.report()` devuelve FPS medios de las últimas 300 muestras, percentil 95 del tiempo entre fotogramas, primera entrega del fotograma, tamaño de viewport, llamadas de dibujo, triángulos y tiempo simulado. No sustituye la inspección visual ni el análisis de GPU. No se han recogido medidas reales en este entorno.

El contador visible se activa únicamente con `?debug=1`. Las cifras provienen del navegador donde se abre la aplicación; no se han medido FPS reales en el entorno de desarrollo.

## Ampliación visual: dos plantas

`building.js` define `connectionStations` con una estructura común: `id`, `nombre`, `encargado`, `estado`, `descripcion` y `mobiliario`, más posición, color y tipo de decoración. El estado es fijo Desconectado. Añadir módulos parte de este catálogo; no existen adaptadores ni credenciales de servicios.

La escena se divide en tres grupos: estructura compartida, planta baja y oficina superior trasladada 10 unidades en Y. Se conservan las coordenadas X/Z de las habitaciones originales. Los huecos de escaleras y ascensores recortan la losa y se registran como obstáculos. Los accesos ocupan franjas exteriores; se retira una planta decorativa que coincidía con el hueco de escalera. `building-view.js` construye recepción, módulos y accesos; agrupa geometría fija por material y planta, reutiliza geometrías móviles y no añade luces. La planta superior se oculta al mirar la inferior.

### Circulación vertical

Cada planta tiene su gestor `createStudioTraffic`. Las visitas enlazan las rutas horizontales con tres conectores reservables: escalera y dos ascensores, todos con capacidad de una persona. La escalera interpola un recorrido con tramos verticales y horizontales sobre 40 peldaños. Los ascensores abren puertas, embarcan, cierran, viajan y desembarcan; una cabina vacía vuelve al piso de recogida cuando hace falta. El movimiento comprueba separación espacial entre actores, además de la reserva del conector y del desembarco.

Los visitantes usan estados declarativos de cola, aproximación, espera, cruce, visita y regreso. Comparten el delta de simulación, pausa y velocidades. Los encargados hacen paseos cortos en su planta. Una misión nueva solicita el regreso de visitantes y espera antes de activar la coordinación habitual. Paul permanece en la oficina superior.

### Guardado y cámara

Se conserva `office3d-v2`, añadiendo `runtime.version = 2`, planta y elevación por actor, visitas, encargados y estado de conectores. Antes de migrar un punto de control versión 1 se guarda el contenido original bajo `office3d-v2-backup-floors-…`; sus posiciones y cámara se trasladan a la planta superior sin sustituir misiones ni historial. La cámara guarda `floorView` (1, 2 o all), destino y seguimiento. Seguir a un visitante cambia de planta según su altura.

### Validación pendiente de Paul

Esta entrega no ejecuta `npm test`, recorridos automatizados ni mediciones, conforme a la instrucción de Paul. Se actualizaron los cargadores de pruebas para incluir los dos scripts nuevos y se revisó la sintaxis. Queda pendiente revisar en móvil: oclusión de losas, legibilidad de letreros, trayectos y reservas simultáneas, puertas, restauración durante un cruce y rendimiento. La conservación de las pruebas históricas aún requiere ejecución; no se afirma que esta ampliación esté validada visualmente.
