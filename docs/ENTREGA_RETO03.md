# Preparación y revisión de la entrega final

La **versión 3.3.0** conserva una sola aplicación web y organiza la revisión en tres partes: [papelería del docente](../entrega/reto03/MEMORIA_PAPELERIA.md), validación estandarizada TdR y estudio complementario con baterías. Todos los archivos están enlazados en el [índice de entrega](../entrega/reto03/README.md).

## Demostración recomendada

1. Ejecutar `pnpm install --frozen-lockfile` y `pnpm dev`.
2. Abrir **Caso final: papelería** y mostrar las ocho cargas, 27,8 kWh/día y 30 m² obligatorios.
3. Revisar las fichas LONGi de 500 W y GoodWe de 6 kW; comprobar 14 módulos y 7S2P.
4. Explicar que el inversor y el área cumplen, pero la cobertura energética es parcial. Mostrar el déficit y que la ampliación fuera de 30 m² está bloqueada.
5. Guardar/abrir el proyecto y descargar su informe PDF de una página.
6. Probar el ejemplo TdR y cambiar entre AGM, LFP y sin baterías para demostrar la otra rama.
7. Revisar la sensibilidad de autonomía, DoD y tecnología en el anexo con almacenamiento.

## Archivos versionados

- Aplicación, instrucciones y catálogos oficiales.
- Entrada original del docente y proyecto dimensionado sin cambiar sus cargas, recurso ni superficie.
- Seis proyectos JSON, seis informes PDF y resultados completos.
- Memorias de diseño, matriz de la guía, método, manual, fuentes e historial.
- Manifest SHA-256, scripts de regeneración/verificación y pruebas en GitHub Actions.

## Comprobaciones antes de publicar

```sh
pnpm entrega:generar
pnpm entrega:verificar
pnpm test
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:ui
```

En Windows se puede usar Edge con `$env:PLAYWRIGHT_CHANNEL = 'msedge'`. Revisar visualmente los seis PDF después de regenerarlos. El uso de IA está declarado; los límites no declarados por las referencias académicas permanecen pendientes. No se atribuyen los resultados a valores de referencia reservados del docente.
