# Fase 1 — avance para verificación de Paul

Fecha: 14 de octubre de 2026. **Estado: implementaciones automáticas verificadas; cierre visual PENDIENTE DE VERIFICACIÓN DE PAUL.** La Fase 2 no se inició.

## 1. Resumen

Se conservaron la aplicación y las pruebas anteriores. Se añadió circulación por turnos y planificación de rutas que mantienen una separación mínima de 0,72 unidades entre centros de personajes.
Las pruebas simulan cruces en una puerta, velocidades ×1/×2/×4, intercambio de destinos, reunión y misión completa. Los 256 recorridos anteriores siguen pasando.
El contador de FPS y carga se activa con `?debug=1` y está oculto por defecto. Se revisaron los volúmenes de muebles por código y se elevó la altura de las puertas.
Paul completará la comprobación visual y las mediciones en escritorio y móvil. No se inventaron capturas ni cifras de rendimiento.

## 2. Archivos

- `dist/traffic.js`: cola, turnos, rutas A*, evasión de obstáculos/personajes y recuperación de guardados superpuestos.
- `dist/app.js`: integración del tránsito, destinos de descanso separados, posición de Nico fuera del paso, puertas más altas y panel de diagnóstico.
- `dist/index.html`, `dist/style.css`: carga del módulo y panel oculto de rendimiento.
- `tests/trafico.cjs`, `tests/debug.cjs`, `tests/muebles.cjs`: pruebas nuevas.
- `tests/harness.cjs`, `tests/coordinacion.cjs`, `tests/escena.mjs`, `tests/persistencia.cjs`, `tests/run.cjs`: carga del nuevo módulo y adaptación del diagnóstico. Se mantienen las comprobaciones anteriores.
- `README.md`, `docs/arquitectura.md`, `docs/fase-1.md`: instrucciones e informe.

## 3. Cómo probar

1. Ejecutar `npm test`. Abrir la aplicación normal: el contador debe estar oculto.
2. Abrir la misma URL con `?debug=1`. Debe mostrar FPS, carga, velocidad y viewport. «Carga» mide hasta el primer fotograma entregado al renderizador, no el final de toda actividad de red.
3. Pedir «Quiero crear un sistema de inventario», agregar otras dos misiones y observar la cola, la convocatoria y el regreso a las oficinas.
4. Probar ×1, ×2, ×4 y pausa. Los empleados que esperan turno permanecen quietos. El trabajo de los empleados no caminantes sigue avanzando.
5. Recargar durante caminata, reunión, trabajo y espera de aceptación. Comprobar misión activa, cola, encargos, solicitudes editadas e historial.
6. Mover a Paul mientras se desplazan los empleados; observar especialmente puertas y pasillos. Visitar comedor, descanso, baño y sala de reuniones.
7. Completar y devolver la lista manual siguiente antes de aprobar el cierre.

## 4. Resultados automáticos

| Comprobación | Resultado |
|---|---|
| Coordinación, cola, aceptación y revisión | PASA |
| Reunión: esperar a todos, repartir y entregar | PASA |
| 256 recorridos anteriores por entradas | PASA |
| Cruces en una puerta con cuatro personajes | PASA; distancia ≥ 0,72 |
| Desplazamientos con dt 0,016 / 0,032 / 0,064 / 0,24 | PASA |
| Intercambio de destinos mediante un apartamiento | PASA; ambos llegan |
| Misión completa con siete empleados y separación | PASA; termina sin superposición de centros |
| Recuperación de posiciones superpuestas antiguas | PASA; copia previa y separación |
| Guardado/recarga, cola, encargos, solicitud editada e historial | PASA |
| Panel oculto sin parámetro y visible con debug=1 | PASA |
| Desvíos respecto de escritorio CEO y tres mesas | PASA |
| Estructura 3D, cámaras, luces y matrices | PASA sin GPU; no certifica aspecto visual |

### Auditoría de muebles por código

| Elemento | Hallazgo y tratamiento |
|---|---|
| Escritorios de empleados y CEO | Volúmenes rectangulares protegidos, con margen de 0,34 unidades para el cuerpo. El paso entre los dos lados del escritorio CEO requiere un desvío. |
| Mesa de conferencia del CEO y mesa de reuniones | Protegidas; la ruta evita atravesar la superficie. |
| Mesa del comedor | Protegida; se adelantaron los destinos de comida para evitar que el cuerpo quede dentro del borde de la mesa. |
| Mesa de centro de descanso | Protegida; el movimiento busca un desvío. |
| Sofás | Los destinos de descanso son posiciones de asiento. No hay física completa de respaldos/apoyabrazos; el acceso lateral puede tener contacto visual. PENDIENTE de observación de Paul. |
| Sillas | Se permite ocupar la silla propia. Patas, ruedas y apoyabrazos no tienen colisiones separadas. PENDIENTE visual. |
| Armarios, estanterías y plantas | No todos están incluidos como obstáculos individuales. Las rutas habituales dejan espacio, pero los desvíos pueden acercarse a ellos. PENDIENTE visual. |
| Marcos de puertas | La altura anterior podía rozar la cabeza; se elevó el marco a 2,65 unidades. PENDIENTE de confirmación visual. |

La prueba mide separación entre centros en el plano del suelo. No es una simulación física de cada pieza animada del cuerpo. Un caso extremo con todos los destinos de asiento ocupados espera a que quede espacio; el planificador no permite invadir a otro personaje.

### Lista manual — PENDIENTE DE VERIFICACIÓN DE PAUL

Completar por separado en computadora y celular. Marcar solo después de observarlo.

- [ ] Giro de cámara con arrastre.
- [ ] Zoom por botones y rueda; pellizco en celular.
- [ ] Seguimiento de Paul y Nico durante un recorrido completo.
- [ ] Vistas de comedor, descanso, baño y sala de reuniones.
- [ ] Sombras y luz sin parpadeos, superficies negras ni errores de render.
- [ ] Entrada y salida por puertas sin cabeza atravesando el marco.
- [ ] Encuentros entre personajes sin cuerpos superpuestos ni bloqueos permanentes.
- [ ] Paul comparte los turnos de tránsito con los empleados.
- [ ] Los personajes no atraviesan escritorios ni mesas.
- [ ] Contacto al sentarse en sillas y sofás; registrar cualquier atravesamiento de respaldo/apoyabrazos.
- [ ] Los desvíos no atraviesan armarios, plantas ni estanterías.
- [ ] Reunión completa y retorno del equipo a sus oficinas.
- [ ] Las tres velocidades funcionan y la pausa congela la simulación.
- [ ] Recarga conserva misión activa, cola, encargos, solicitudes e historial.
- [ ] Panel oculto en URL normal y visible con `?debug=1`.
- [ ] Interfaz legible en móvil, sin controles fuera de pantalla.

**Medición:** tras cinco segundos de calentamiento, medir cada velocidad durante al menos 30 segundos. Para reiniciar las muestras, usar `window.paulStudioDiagnostics.reset()` en la consola, o recargar. El diagnóstico completo está disponible con `window.paulStudioDiagnostics.report()`.

| Dispositivo / navegador / viewport | Carga (s) | FPS ×1 | FPS ×2 | FPS ×4 | Observaciones |
|---|---|---|---|---|---|
| Computadora — por completar | — | — | — | — | — |
| Celular — por completar | — | — | — | — | — |

## 5. Riesgos y aprobación pendiente

- La circulación es conservadora: solo un personaje se desplaza por turno. Aumenta la espera, pero evita encuentros opuestos y mantiene la distancia comprobada.
- La planificación de rutas puede producir un breve trabajo de CPU al iniciar un recorrido. Paul deberá medirlo en su celular; no se ofrecen FPS estimados.
- La inspección completa de sillas, sofás y decoración depende de la lista manual; no se declara resuelta solo por pasar tests de centros y rectángulos.
- Los guardados viejos con personajes superpuestos se reubican cerca antes de dibujarse; se conserva una copia local previa. Las misiones y resultados no se eliminan.
- Se espera la revisión y aprobación de Paul. No avanzar a la Fase 2 sin ella.
