# Fase 1 — aprobada; mejoras visuales pendientes de aprobación

Fecha: 14 de octubre de 2026. **Paul aprobó la Fase 1. La mejora adicional de la pantalla de reuniones queda PENDIENTE DE SU VERIFICACIÓN Y APROBACIÓN.** No se inició la Fase 2. La lista anterior se conserva como referencia, sin inventar resultados visuales.

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
| Mesa pequeña del CEO y mesa de reuniones | La mesa del CEO fue retirada en la mejora posterior, junto con sus seis sillas y su colisión. La mesa de la sala de reuniones sigue protegida. |
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

## Mejora adicional — pantalla de presentación de reuniones

### Resumen

La pantalla decorativa ya existía junto a la entrada, pero no tenía información dinámica. Se trasladó a la pared del fondo (Z = 21,71), con marco oscuro, soporte claro, superficie de 8,8 × 4,4 unidades y centro a 3,85 unidades de altura. Queda elevada sobre los personajes y la mesa.
Una CanvasTexture de 1536 × 768 muestra título, objetivo de Paul, todos los convocados y el encargo actual. Los objetivos largos se dividen en páginas; los encargos aparecen uno por uno, junto al mensaje de Nico correspondiente.
La explicación y las diapositivas comparten el temporizador simulado de Nico: respetan pausa, ×1/×2/×4 y recarga. La duración se adapta al texto y al número de encargos. Al terminar la explicación, vuelve al logo de la oficina.
La vista directa mira hacia la pantalla. El panel «Pantalla de la reunión · Ampliar» ofrece el objetivo completo y los encargos revelados como texto seleccionable y legible en móvil; se oculta fuera de reunión. No se repinta la textura si no cambió la diapositiva.

### Archivos

- `dist/presentation.js`: estado de presentación, páginas y duración.
- `dist/app.js`: pantalla 3D, textura, sincronización, mensajes progresivos y cámara de reuniones.
- `dist/index.html`, `dist/style.css`: lector ampliable y carga del módulo.
- `tests/pantalla.cjs`: prueba nueva de reunión y pantalla.
- `tests/escena.mjs`: textura real de Three.js con renderizador de prueba.
- `tests/harness.cjs`, `tests/coordinacion.cjs`, `tests/run.cjs`: carga del módulo y ejecución de la nueva suite.
- `docs/fase-1.md`: este informe.

### Cómo probar

1. Abrir la oficina y elegir «Sala de reuniones» en Cámara, o tocar su letrero. Observar el logo en reposo.
2. Dar la orden «Quiero crear un sistema de inventario con base de datos» y esperar a que Nico reúna al equipo.
3. Confirmar título y objetivo, seis convocados y aparición sucesiva de encargos. Contrastar el encargo en pantalla con el mensaje de Nico.
4. Pausar durante la explicación: la diapositiva debe permanecer quieta. Continuar y alternar ×1, ×2 y ×4.
5. Enviar un objetivo largo para ver todas sus páginas. Abrir «Pantalla de la reunión · Ampliar» para leer el texto completo y los encargos presentados.
6. Recargar durante la explicación: debe conservarse el punto de presentación. Cuando el equipo se levante, confirmar el regreso al logo y la desaparición del lector.
7. Ejecutar `npm test`.

### Pruebas y riesgos

Las nueve suites pasan, incluidos los 256 recorridos, reuniones, coordinación y guardado. La nueva prueba cubre objetivo, seis encargos, velocidades ×1/×2/×4, pausa, recarga, texto largo y reposo final. La prueba de escena verifica que existe CanvasTexture y que su versión cambia con el contenido y permanece estable durante la pausa.
Las reuniones con objetivos largos duran más para permitir presentar todo el texto. No se cambiaron recorridos, muebles de otras salas ni servicios de IA. La comprobación usa geometría de Three.js y un renderizador de prueba, no GPU ni navegador: la legibilidad y el encuadre en dispositivos reales siguen pendientes.

### Lista visual de esta mejora — PENDIENTE DE VERIFICACIÓN DE PAUL

- [ ] Pantalla en la pared del fondo, con marco oscuro y sin atravesar mesa o personajes.
- [ ] Legible desde todos los asientos y desde la cámara directa de la sala.
- [ ] Título, objetivo y convocados correctos.
- [ ] Encargos aparecen en el mismo momento que el mensaje correspondiente de Nico.
- [ ] Pausa congela la presentación; ×1, ×2 y ×4 la aceleran correctamente.
- [ ] Objetivo largo completo por páginas y lector ampliable sin cortes.
- [ ] Recarga recupera la diapositiva en curso.
- [ ] Logo en reposo al finalizar y antes de otra reunión.
- [ ] Lector ampliable legible en móvil y escritorio.

Se espera la aprobación de esta mejora. No continuar con la Fase 2 en este alcance.

## Mejora adicional — oficina de Paul (CEO)

### 1. Resumen

Se retiraron la mesa pequeña de reuniones, sus seis sillas y su obstáculo de navegación. En esa zona se instaló una TV grande en la pared izquierda, con marco oscuro y mueble bajo de madera. Hay dos sillas de visita junto al escritorio, con el punto central de recepción de Nico despejado.
Se añadieron alfombra ejecutiva, librería con libros y jarrón, tres diplomas, tres plantas grandes, lámparas de pie y escritorio, reloj de pared, bandeja de café, agenda y credenza con objetos decorativos. Se conserva la planta de la oficina, el escritorio y el estilo de madera, tonos claros y elementos oscuros.
La TV se apaga sin misión. Con misión activa muestra la marca de la oficina, objetivo, equipo y estado mediante CanvasTexture. El panel «TV de Paul · Ampliar resumen» permite leer todo el objetivo en móvil; la cámara «Oficina de Paul · TV» encuadra la zona.
Los nueve muebles de suelo y cuatro adornos de pared tienen obstáculos registrados. Dimensiones de muebles compartidas entre dibujo y navegación, con margen adicional para tiradores y bordes. No se inició la Fase 2 ni se modificaron otras salas.

### 2. Archivos creados o modificados

- `dist/ceo-office.js` (nuevo): dimensiones de los muebles CEO, decoración mural, punto de recepción y estado de la TV.
- `dist/app.js`: oficina CEO, obstáculos, textura de TV, lector de resumen y cámara directa.
- `dist/index.html`, `dist/style.css`: opción de cámara, carga del módulo y lector accesible.
- `tests/oficina-ceo.cjs` (nuevo): muebles, 32 rutas, recepción, visita, estado de TV y recarga.
- `tests/escena.mjs`: textura de TV y conservación de las tres luces.
- `tests/harness.cjs`, `tests/coordinacion.cjs`, `tests/run.cjs`: carga del módulo y ejecución de la nueva prueba.
- `docs/fase-1.md`: informe de esta mejora.

### 3. Cómo probarlo

1. Abrir la oficina y elegir «Cámara → Oficina de Paul · TV», o tocar el letrero «Paul · CEO».
2. Antes de enviar una misión, comprobar que la TV está apagada, que la mesa pequeña y sus seis sillas desaparecieron y que la decoración deja pasillos libres.
3. Enviar «Quiero crear un sistema de inventario con base de datos». La TV debe encenderse, mostrar el resumen y cambiar el estado conforme Nico avanza. Abrir «TV de Paul · Ampliar resumen» para leer el objetivo completo.
4. Observar a Nico en la recepción y entrega. Pedir a un empleado disponible «Ven a mi escritorio»: debe llegar al punto frontal sin atravesar muebles. Los personajes reciben las visitas de pie; las dos sillas nuevas son mobiliario protegido, no nuevos destinos automáticos para sentarse.
5. Recargar con una misión activa; la TV debe reconstruir el resumen del guardado. Aceptar la entrega y esperar sin cola: debe apagarse y ocultarse el lector.
6. Mover a Paul entre escritorio y pasillos. Revisar acceso alrededor de sillas, librería, mueble de TV, credenza, plantas y lámpara.
7. Ejecutar `npm test`. Para medir rendimiento real, abrir `?debug=1` en el mismo dispositivo y registrar FPS en ×1/×2/×4 y carga inicial. La versión anterior para comparación está en el historial de Git (commit local `d15623f`, equivalente al commit GitHub `8e09fff`).

### 4. Resultado de pruebas y rendimiento

`npm test` pasa las diez suites: coordinación, 256 recorridos históricos, reuniones, pantalla de reuniones, escena, persistencia, tránsito, diagnóstico, muebles y oficina CEO.
La prueba CEO comprueba que la mesa retirada ya no tiene colisión, que su zona se puede usar, que cada mueble/adorno mural registra un obstáculo y que 32 rutas desde las oficinas y la entrada hacia recepción, escritorio y zonas laterales evitan muebles. Verifica recepción de Nico, visita de un empleado, TV activa/apagada y recarga.
La prueba de escena usa Three.js real con renderizador de prueba: verifica CanvasTexture, apagado/encendido, reutilización del contenido sin repintado innecesario y las mismas tres luces. Las piezas se siguen agrupando por material y reutilizan las geometrías existentes.
Antes de los cambios, la prueba estructural contó 334 mallas; después, 332 en el mismo punto inicial. Esto es un conteo de estructura, **no una medición de FPS, GPU ni una garantía de rendimiento**. La nueva TV añade una textura de 1280 × 720, que solo se repinta cuando cambia la misión o su estado.
No se dispone del navegador de verificación compatible en este entorno. No se midieron FPS ni tiempo de carga reales antes/después y no se inventaron cifras.

| Medición real en el mismo dispositivo | Antes | Después |
|---|---|---|
| Carga inicial | Pendiente | Pendiente |
| FPS ×1 | Pendiente | Pendiente |
| FPS ×2 | Pendiente | Pendiente |
| FPS ×4 | Pendiente | Pendiente |

### 5. Riesgos y revisión pendiente de Paul

Los obstáculos son rectángulos conservadores con margen corporal: pueden hacer que un personaje se desvíe algo más, sin requerir física de cada pieza. La alfombra es suelo transitable; los accesorios del escritorio quedan dentro del volumen protegido del escritorio. Los guardados antiguos se separan con el mecanismo existente si una posición coincide con los muebles nuevos, conservando copia previa.
El texto 3D de la TV es un resumen con cortes marcados con «…» cuando excede el espacio. El lector ampliable conserva todo el objetivo. El reloj y las lámparas son decoración fija, sin reloj de tiempo real ni luces dinámicas adicionales. La legibilidad final y el rendimiento en celular requieren observación en dispositivo real.

- [ ] Mesa pequeña y seis sillas anteriores eliminadas; recepción de Nico despejada.
- [ ] TV grande visible desde el escritorio de Paul y la cámara CEO.
- [ ] TV apagada sin misión y con resumen cuando hay una misión activa.
- [ ] Resumen y lector ampliable legibles en móvil.
- [ ] Alfombra, librería, diplomas, plantas, lámparas, reloj, café y credenza armonizan sin saturar.
- [ ] Paul y los empleados no atraviesan los muebles nuevos ni la decoración mural.
- [ ] Visita, recepción y entrega mantienen recorridos coherentes.
- [ ] Recarga conserva el resumen; TV apagada después de aceptar sin misiones en cola.
- [ ] Medición de carga y FPS con `?debug=1` en escritorio y móvil.

**Estado: mejora implementada y pruebas automáticas verificadas; PENDIENTE DE VERIFICACIÓN VISUAL Y APROBACIÓN DE PAUL.** Detenerse al entregar el informe y no avanzar a la Fase 2.
