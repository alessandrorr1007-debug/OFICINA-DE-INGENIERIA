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

`save` añade un punto de control de versión interna 1 al formato local existente. Guarda referencias por identificador, posiciones, estados, temporizadores, rutas y acciones de llegada declarativas; no serializa ni evalúa funciones. `restoreRuntime` valida y reconstruye los callbacks mediante acciones conocidas. Los guardados anteriores usan la recuperación por etapas ya existente.

Paul y la cámara se conservan mediante un capturador visual. La interfaz vuelve a mostrar pausa y velocidad al recargar. Los resultados, mensajes, solicitudes y cola quedan en la misma estructura, con compatibilidad anterior y copia previa de JSON dañado.

## Pruebas y medición

`npm test` ejecuta las regresiones históricas y las pruebas de persistencia. El test de escena usa geometría real de Three.js con un renderizador de prueba, por lo que no ejecuta shaders ni mide rendimiento gráfico.

En un navegador real, `window.paulStudioDiagnostics.report()` devuelve FPS medios de las últimas 300 muestras, percentil 95 del tiempo entre fotogramas, primera entrega del fotograma, tamaño de viewport, llamadas de dibujo, triángulos y tiempo simulado. No sustituye la inspección visual ni el análisis de GPU. No se han recogido medidas reales en este entorno.

El contador visible se activa únicamente con `?debug=1`. Las cifras provienen del navegador donde se abre la aplicación; no se han medido FPS reales en el entorno de desarrollo.
