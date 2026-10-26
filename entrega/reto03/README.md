# Entrega final · Reto 03 ESFV

**Versión 3.3.0 · 25 de octubre de 2026 · Nicolas Paz Mejia**

La única versión funcional es la [aplicación web](../../README.md). Esta carpeta contiene sus proyectos, informes y evidencias. El caso final es la **papelería con servicio de copiado entregada por el docente**.

## 1. Caso final: papelería

| Archivo | Uso |
|---|---|
| [Proyecto final](casos/papeleria-final.json) | Abrir en la aplicación sin reingresar datos |
| [Informe ejecutivo](informes/papeleria-final.pdf) | PDF de una página |
| [Memoria del caso](MEMORIA_PAPELERIA.md) | Fichas, selección, cálculos y restricciones |
| [Resultados completos](resultados/papeleria-final.json) | Criterios de todos los inversores y balance sin redondear |
| [Entrada original](entrada/papeleria-original.json) | Copia intacta del archivo del docente; no es un catálogo validado actualizado |

**Los 30 m² son obligatorios y se mantienen.** Los equipos seleccionados cumplen los criterios eléctricos y ocupan 28,5768 m², pero la energía disponible no cubre todo el consumo. El déficit se informa; no se cambia la superficie, la demanda ni el recurso solar para ocultarlo. La ampliación que excede el área queda bloqueada.

Pulsa **Abrir caso final: papelería** en la aplicación o descarga el JSON y usa **Abrir proyecto**. El informe se puede volver a exportar desde la misma sesión.

## 2. Validación estandarizada TdR

| Caso | Proyecto reabrible | PDF de una página | Cálculos completos |
|---|---|---|---|
| Con baterías AGM | [JSON](casos/tdr-agm.json) | [PDF](informes/tdr-agm.pdf) | [Resultados](resultados/tdr-agm.json) |
| Con baterías LFP | [JSON](casos/tdr-lfp.json) | [PDF](informes/tdr-lfp.pdf) | [Resultados](resultados/tdr-lfp.json) |
| Sin almacenamiento | [JSON](casos/tdr-sin-almacenamiento.json) | [PDF](informes/tdr-sin-almacenamiento.pdf) | [Resultados](resultados/tdr-sin-almacenamiento.json) |

Los reguladores y baterías de estos casos son referencias de la guía, sin fabricante comercial. Imp del regulador y C máximo continuo de descarga no están declarados; permanecen pendientes y alertados.

## 3. Anexo: sensibilidad con almacenamiento

Se conserva un estudio complementario de aula rural, con cargas y recurso asumidos e identificados; no se presenta como el caso real de la papelería.

| Estudio | Proyecto | PDF | Resultados |
|---|---|---|---|
| Aula rural, partida | [JSON](casos/propio-partida.json) | [PDF](informes/propio-partida.pdf) | [Datos](resultados/propio-partida.json) |
| Aula rural, cierre | [JSON](casos/propio-cierre.json) | [PDF](informes/propio-cierre.pdf) | [Datos](resultados/propio-cierre.json) |

[Memoria y seis escenarios](MEMORIA_CASO_PROPIO.md) · [Sensibilidad CSV](resultados/sensibilidad.csv) · [Sensibilidad JSON](resultados/sensibilidad.json). La sensibilidad a autonomía, DoD y tecnología pertenece a la rama con baterías y no se aplica ficticiamente a la papelería on-grid.

## 4. Correspondencia con la guía y verificación

- [Matriz de criterios y RF-25 a RF-36](MATRIZ_ENTREGABLES.md).
- [Manual, método, catálogos y pruebas](../../docs/README.md).
- [Manifest de integridad SHA-256](manifest.json).
- [Historial de actualizaciones](../../CHANGELOG.md) y [validación automática](https://github.com/Nico2919/reto02-esfv/actions).

```sh
pnpm entrega:generar
pnpm entrega:verificar
pnpm test
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:ui
```

La generación usa datos locales o NASA guardado y no hace consultas de red. Cada PDF se genera con la función de informe de la aplicación. Los hashes identifican fuentes y salidas; la verificación reconstruye los seis resultados y comprueba los seis PDF de una página. Si cambian datos, catálogos o motores, hay que regenerar y revisar antes de publicar.

## Procedencia y sustentación

Se contrastó la guía `TdR_Reto03_ESFV_2026II.pdf`, tres páginas; su SHA-256 está en el manifest. La fecha de Campus Virtual no figura en la guía y no se inventa.

El archivo original de la papelería se conserva intacto. En la versión dimensionada se mantienen las ocho cargas, días de operación, PR, eficiencia del inversor, coordenadas, datos solares guardados y superficie de 30 m². Se corrige el rótulo de ubicación a las coordenadas guardadas y se seleccionan módulos/inversor reales.

Se utilizó **IA (Codex)** para desarrollo, búsqueda y transcripción de fichas, documentación y pruebas. El integrante debe explicar las decisiones, ecuaciones, déficit y limitaciones en la sustentación. Los resultados calculados no se atribuyen a valores reservados del docente.
