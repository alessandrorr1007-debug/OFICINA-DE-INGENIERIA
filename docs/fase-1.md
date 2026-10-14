# Fase 1 — comprobación y avance

Fecha: 14 de octubre de 2026. **Estado: ABIERTA. No cumple todavía el criterio de cierre.**

## 1. Resumen

Se leyó el código existente y se ejecutaron las regresiones anteriores antes de modificarlo.
Se incorporaron las pruebas al repositorio, sin reescribir la aplicación.
Se corrigió la recarga para conservar estado activo y se corrigió el movimiento de Paul a su posición actual.
Se añadió instrumentación para medir el navegador real. Se detectaron superposiciones de personajes; la revisión visual y el rendimiento real siguen pendientes.

## 2. Archivos

- `dist/app.js`: puntos de control validados, restauración, compatibilidad, copia de JSON dañado, llegada de Paul y diagnóstico.
- `package.json`, `tests/*`: ejecutor y regresiones reproducibles; nueva cobertura de recarga.
- `README.md`, `docs/arquitectura.md`, `docs/fase-1.md`: instrucciones y estado explícito.

## 3. Cómo probar

1. Ejecutar `npm test` en un checkout del repositorio con Node.js 22 o posterior.
2. Servir `dist` por HTTP y abrirlo en un navegador con WebGL 2.
3. Dar una misión completa y dos misiones adicionales. Recargar durante caminata, reunión, asignación, trabajo y espera de aceptación.
4. Comprobar que permanecen cola, posiciones, temporizadores, encargos, resultados, solicitudes editadas, mensajes e historial. Aceptar y comprobar que sigue la siguiente misión.
5. Seleccionar el escritorio de Paul estando ya en él: debe quedar disponible, no caminando.
6. Probar giro, rueda, zoom, pellizco táctil, seguimiento de Paul/Nico y las cuatro vistas de salas.
7. Para medir, esperar cinco segundos de calentamiento, ejecutar `window.paulStudioDiagnostics.reset()`, mantener cada velocidad ×1/×2/×4 durante al menos 30 segundos y obtener `window.paulStudioDiagnostics.report()`. Anotar dispositivo, navegador, viewport, FPS, P95 y carga inicial; repetir con escritorio y móvil reales.
8. Observar desplazamientos por puertas y muebles, encuentros en sentidos contrarios y llegada de todos a la reunión. Registrar superposiciones o bloqueos; este punto aún requiere corrección.

## 4. Lista de comprobación

| Punto | Resultado actual | Evidencia / pendiente |
|---|---|---|
| Coordinación y cola | PASA automático | Regresión anterior, aceptación y revisión |
| Convocatoria y reunión | PASA automático | Se espera a todos; se completa la entrega |
| 256 recorridos y paredes | PASA automático | Centros de rutas; no prueba volumen corporal |
| Recarga de misiones y cola | PASA automático | Cinco checkpoints y continuación posterior |
| Recarga de encargos, solicitudes e historial | PASA automático | Incluye solicitud editada y mensajes |
| Recarga de pausa y velocidad | PASA automático | Se restauran ×4 y pausa |
| Guardados antiguos / JSON dañado | PASA automático | Compatibilidad y copia de seguridad previa |
| Paul al elegir su ubicación actual | PASA estructural | Corrige estado caminando permanente |
| Giro, zoom y seguimiento | PASA estructural / PENDIENTE visual | No hay navegador/GPU en estas pruebas |
| Comedor, descanso, baño, reuniones | PASA estructural / PENDIENTE visual | Cámaras con valores válidos |
| Sombras e iluminación | PENDIENTE visual | Configuración validada; GPU no ejecutada |
| Atravesar muebles | PENDIENTE | Falta auditoría completa de volúmenes y animaciones |
| Colisiones entre personajes | FALLA, detectada | El algoritmo actual no separa cuerpos en tránsito |
| FPS escritorio y móvil | PENDIENTE | Instrumentación preparada; sin mediciones reales |
| Carga inicial escritorio y móvil | PENDIENTE | Sin navegación real ni hardware medido |
| Velocidades ×1/×2/×4 | PENDIENTE visual y rendimiento | Lógica previa preservada; falta prueba real |

### Limitación del entorno

Sites requiere su controlador `control-browser` para iniciar la previsualización administrada. Ese controlador no está disponible en esta sesión. La guía indica que, si no está disponible, se debe omitir la QA de navegador y no iniciar un servidor alternativo ni instalar un navegador. Se respetó esta limitación; no se inventaron capturas ni FPS.

## 5. Riesgos y decisiones pendientes

- No aprobar el cierre mientras sigan las colisiones, la inspección visual y las mediciones de hardware pendientes.
- La restauración exacta es un cambio compatible, pero sigue siendo local al navegador. El cierre forzado puede perder hasta el último intervalo de guardado; la salida normal guarda mediante `pagehide`.
- La televisión sigue siendo decorativa y la coordinación sigue simulada.
- No se eligieron base de datos, autenticación ni proveedores de IA; corresponden a fases posteriores y requieren las decisiones de Paul.
