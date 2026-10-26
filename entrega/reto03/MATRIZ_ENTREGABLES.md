# Matriz de entregables y requisitos de la guía

Guía contrastada: **TdR Reto 03 ESFV 2026-II**, tres páginas. Versión de entrega: **3.3.0**. El documento pide una sola aplicación web en la sección 8; las evidencias de esta carpeta corresponden a los criterios de la sección 7 y a RF-25 a RF-36, no a entregables adicionales impuestos por esta matriz.

## Criterios de evaluación y condiciones

| Guía | Qué debe poder revisar el docente | Evidencia publicada | Estado y alcance |
|---|---|---|---|
| §1, §2 y §7: integración | Una aplicación con herencia automática y reacción a cambios | `src/App.jsx`, `src/reto02/generador.js`, `src/reto03/`; pruebas de cambios de aparatos/PR | Implementado; Retos 01/02 conservados |
| §5 y §7: requisitos | Implementación de RF-25 a RF-36 | Matriz detallada siguiente, pruebas numéricas y de navegador | Implementado; datos no declarados se alertan |
| §6 y §7: caso estandarizado | Reguladores, AGM/LFP, cierre y rama sin baterías | [AGM](casos/tdr-agm.json), [LFP](casos/tdr-lfp.json), [red](casos/tdr-sin-almacenamiento.json); PDF y cálculos en sus carpetas | Reproducible desde entradas; se comparan ecuaciones, no valores reservados del docente |
| §1 y §7: usabilidad | Flujo entre ramas, correcciones, veredictos legibles y respuesta inmediata | Aplicación guiada; `tests-ui/flujo.test.js`; [manual](../../docs/GUIA_USO.md) | Implementado y probado en escritorio/móvil |
| §5 RF-27 y §7: catálogo | Al menos tres equipos de conversión y dos tecnologías de batería; selección y fuentes | 15 conversiones comerciales (12 inversores y 3 reguladores), 6 referencias TdR, AGM/LFP; [fichas](../../docs/CATALOGO_INVERSORES.md) | Comercial y académico separados; sin atribuir baterías TdR a una marca real |
| §7: ingeniería propia | Caso, método justificado y sensibilidad | [Papelería del docente](MEMORIA_PAPELERIA.md) y [estudio complementario propio](MEMORIA_CASO_PROPIO.md) con sensibilidad CSV/JSON | Caso propuesto con supuestos identificados; seis escenarios |
| §5 RF-36 y §7: informe | Informe de una página con equipo, banco, cierre y alertas | [Índice de seis informes](README.md) | Cada PDF tiene una página y un proyecto asociado |
| §7: repositorio y pruebas | README, separación de cálculo/interfaz, pruebas e historial | README, motores puros, `tests/`, `tests-ui/`, CHANGELOG y Actions | Versionado y verificable con los comandos de entrega |
| §8: única versión funcional | Aplicación web | Raíz del repositorio y `pnpm dev` / `pnpm build` | Los casos y PDF son salidas de esa misma aplicación |
| §8: redondeo | Diferencias de hasta 1 % con el mismo método | Resultados completos sin redondeo y PDF con presentación redondeada; pruebas con tolerancias estrictas | Método TdR; no se presenta comparación con referencias no publicadas |
| §8: uso de IA y sustentación | Uso declarado y decisiones explicables | Declaración en [índice](README.md#procedencia-y-sustentación) y memoria | Uso de Codex explícito; sustentación a cargo del integrante |
| §8: credenciales | Ausencia de credenciales publicadas | Código y configuración versionados; consulta NASA sin credenciales; escaneo local antes de publicar | Sin credenciales detectadas en archivos versionados |
| §8: catálogo fiel y sobretensión | Ficha consistente y alarma si Voc supera el máximo | Límites por revisión; pruebas RF-28 y de catálogos | Un equipo real puede dar «No compatible»; estar en el catálogo no lo aprueba |
| §8: fecha de entrega | Fecha de Campus Virtual | Condición externa al repositorio | La guía no indica una fecha concreta; debe consultarse en Campus |

## RF-25 a RF-36

| RF | Estado funcional | Evidencia de implementación y prueba |
|---|---|---|
| 25 | Implementado | `ramaPorTipo`, selector automático/manual; pruebas off-grid/híbrido/on-grid |
| 26 | Implementado | `heredarReto03`; datos de cargas, perfil, recurso y módulo; prueba de actualización aguas arriba |
| 27 | Implementado | JSON externos, `validarCatalogos`, editor y actualización comercial atómica; dos tecnologías de batería |
| 28 | Implementado | `temperaturas`/`evaluarEquipo`: Voc frío, Vmp caliente/frío, MPPT, arranque y Ns máximo; pruebas de sobretensión y temperatura |
| 29 | Implementado | Corrientes por MPPT y salida sin 1,25; corriente de conductores separada; pruebas de reparto par/impar |
| 30 | Implementado | Relación DC/AC configurable 1,0-1,3 por defecto; INV-A/B/C y nuevos inversores de red |
| 31 | Implementado | Criterios y veredicto por equipo; alternativas de reconexión; prueba CTRL-A en 2S2P |
| 32 | Implementado | `bancoBaterias`: Wh/Ah, autonomía, DoD, fT, tensión y eficiencias; validación de entradas inválidas |
| 33 | Implementado | Ns/Np enteros, Ah/kWh instalados y DoD; AGM 4S4P y LFP 1S5P en el caso estandarizado |
| 34 | Implementado | `balanceEnergia`, márgenes y módulos; aceptación/deshacer y nueva evaluación; caso propio de 2 a 4 módulos |
| 35 | Implementado con datos de ficha pendientes | Tasas C calculadas, comparación con límite cuando existe, recuperación y dos tecnologías. El TdR no declara C máximo de descarga; la comprobación física de descarga permanece pendiente y alertada. La prueba inyecta un límite para comprobar que se detecta su exceso |
| 36 | Implementado | Proyectos v3 con lectura v1/v2; seis JSON reabribles, seis PDF de una página y resultados reconstruidos; prueba de ida/vuelta y descargas |

La matriz registra el alcance comprobable del software; no reemplaza la valoración académica ni elimina los avisos de datos faltantes. [VALIDACION_RETO03.md](../../docs/VALIDACION_RETO03.md) detalla los valores esperados y [manifest.json](manifest.json) identifica los archivos generados.

## Restricción fija del caso del docente

La papelería conserva los **30 m² obligatorios**, el consumo y las HSP del archivo original. La entrega final usa 14 módulos que caben en ese límite y un inversor eléctricamente compatible. El balance sigue mostrando un déficit: no cumple cobertura solar del 100 %. En on-grid el apoyo de la red es necesario. Una aplicación que avisa esta restricción no está fallando su cálculo; está mostrando la inviabilidad de cubrirlo todo con las entradas dadas. Las pruebas verifican esta separación y bloquean una ampliación fuera del área.
