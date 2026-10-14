# Paul Engineering Studio

Oficina web 3D personal de Paul, enfocada en ingeniería de sistemas. El equipo trabaja mediante una simulación: no hay proveedor de IA conectado ni se generan resultados técnicos verificados.

[Aplicación publicada](https://oficina-alessandro-ia.cooltang.chatgpt.site)

## Ejecutar

Requiere Node.js 22 o posterior para las pruebas y un navegador con WebGL 2 para la escena.

```bash
npm test
python3 -m http.server 8080 --directory dist
```

Abrir `http://localhost:8080`. No se necesita instalar paquetes: Three.js está incluido en `dist/vendor` con su licencia MIT.

## Estructura

- `dist/index.html`: interfaz, formularios, controles y diálogos.
- `dist/style.css`: diseño adaptable a escritorio y móvil.
- `dist/app.js`: estado, orquestación, navegación, animaciones, cámara y guardado.
- `dist/traffic.js`: turnos de circulación y rutas libres con separación mínima de 0,72 unidades.
- `dist/vendor`: distribución local de Three.js y licencia.
- `tests`: coordinación, 256 recorridos, reunión, escena sin GPU, persistencia, separación entre personajes, diagnóstico y mesas protegidas.
- `docs/arquitectura.md`: arquitectura y límites actuales.
- `docs/fase-1.md`: comprobación de la Fase 1, resultados y pendientes.
- `.openai/hosting.json`: configuración del sitio existente; conservar su identidad.

## Estado de las fases

La Fase 1 permanece abierta: faltan revisión visual real, medición en escritorio/móvil y comprobación manual del contacto con mobiliario y personajes. Las pruebas estructurales no equivalen a una validación visual ni a una medición de FPS real.

Las fases 2–5 no se han iniciado. No hay claves de API en este repositorio. Cualquier integración futura necesitará un backend y aprobación de Paul al cerrar la fase anterior.

## Guardado

Se conserva el formato `office3d-v2` de localStorage. Los nuevos puntos de control incluyen misión activa, cola, recorridos, temporizadores, encargos, pausa y velocidad. Se guarda en transiciones, aproximadamente cada dos segundos simulados y al salir de la página. Los datos antiguos siguen siendo compatibles. Si un JSON está dañado, se intenta preservar su contenido en una clave de copia de seguridad antes de recuperar el estado inicial.

Los datos son locales al navegador. No hay sincronización ni autenticación todavía.

## Medición manual

Añadir `?debug=1` a la URL muestra el panel de FPS y carga inicial (hasta el primer fotograma enviado al renderizador). Sin ese parámetro no aparece. La circulación es conservadora: hay un desplazamiento activo por turno; las tareas y temporizadores de trabajo siguen avanzando.
