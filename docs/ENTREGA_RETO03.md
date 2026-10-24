# Entrega del proyecto - Reto 03 ESFV

## Objeto de la entrega

Dimensionamiento del regulador/inversor MPPT y banco de baterías. Una sola aplicación conserva las cargas y los paneles de los Retos 01/02 e incorpora las dos ramas del Reto 03. El alcance funcional y los resultados esperados se documentan en [VALIDACION_RETO03.md](VALIDACION_RETO03.md).

La versión 3.1.0 presenta un recorrido guiado. La pantalla inicial no impone cargas domésticas de demostración: permite empezar desde cero, abrir un proyecto existente o probar el caso académico.

## Demostración sugerida

1. Ejecutar `pnpm install --frozen-lockfile` y `pnpm dev`.
2. Abrir la dirección local y pulsar **Probar con un ejemplo**.
3. Verificar el caso AGM: 16 baterías y 38,40 kWh instalados; revisar el déficit en el mes con menos sol.
4. Cambiar a LFP: 5 baterías y 25,60 kWh. Abrir los ajustes para ver banco de 51,2 V y clase nominal de 48 V.
5. Elegir **No, usaré conexión a la red**: desaparece el banco y se comparan inversores sin almacenamiento.
6. Volver a baterías, añadir paneles para el escenario de menor sol y mostrar que se revisan otra vez los equipos. Deshacer la ampliación.
7. Guardar el JSON, cambiar un dato y abrirlo de nuevo. Descargar el informe PDF.

La demostración usa referencias TdR, identificadas como académicas. El catálogo comercial se selecciona en Ajustes avanzados del sistema. Los datos que no estén declarados en las fichas permanecen como pendientes; no se presentan como aprobados.

## Archivos para presentar

- Enlace al repositorio y a la rama/commit de entrega con el código de Reto 03.
- JSON del proyecto propio guardado desde la aplicación.
- PDF ejecutivo exportado desde la misma sesión.
- Guía de uso, método y matriz RF incluidos en `docs/`.
- Historial de actualizaciones en `CHANGELOG.md` y resultados de validación automática en GitHub Actions.

El nombre, fecha e integrantes se completan en **Proyecto** antes de exportar el caso propio. Los datos del ejemplo no se sustituyen por datos personales inventados.

## Comprobaciones de una actualización

```sh
pnpm test
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:ui
```

En Windows se puede usar Edge con `$env:PLAYWRIGHT_CHANNEL = 'msedge'`. Las pruebas de navegador comprueban el recorrido inicial, el ejemplo, ambas ramas, baterías, ampliación reversible, entradas inválidas, lectura de proyectos anteriores, PDF y pantallas pequeñas. El cálculo físico conserva sus pruebas de regresión.

El repositorio conserva su URL histórica. Para incorporar una actualización de la rama `feat/reto03-mppt-baterias` en `main`, se utiliza una solicitud de integración y se revisan sus comprobaciones. No se eliminan los retos anteriores ni se reescribe su historial.
