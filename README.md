# Reto 03 ESFV · Entrega final 2026-II

[![Validación](https://github.com/Nico2919/reto02-esfv/actions/workflows/validacion.yml/badge.svg)](https://github.com/Nico2919/reto02-esfv/actions/workflows/validacion.yml)

**Versión 3.3.0 · 25 de octubre de 2026**

Universidad del Magdalena · Energía Solar Fotovoltaica · Nicolas Paz Mejia

Aplicación web para dimensionar paneles, inversor/regulador MPPT y baterías. Integra los Retos 01, 02 y 03 en un recorrido de cinco pasos, con datos heredados, catálogos verificables y un informe de una página.

## Caso final: papelería con servicio de copiado

| Abrir y revisar | Contenido |
|---|---|
| [Proyecto final JSON](entrega/reto03/casos/papeleria-final.json) | Caso del docente, listo para **Abrir proyecto** |
| [Informe ejecutivo PDF](entrega/reto03/informes/papeleria-final.pdf) | Una página con equipos, verificaciones y balance |
| [Memoria del caso](entrega/reto03/MEMORIA_PAPELERIA.md) | Selección, fichas, restricciones y déficit explicado |
| [Índice completo de entrega](entrega/reto03/README.md) | Caso final, validaciones TdR y anexos |

**Restricción obligatoria: 30 m².** Se mantienen las ocho cargas y los datos solares del archivo original: 27,8 kWh/día y 3.150 W de demanda máxima. Se seleccionan **14 LONGi LR7-54HVH-500M (7 kWp, 28,5768 m²)** y un **GoodWe GW6000-MS-30 de 6 kW**, con dos cadenas de siete módulos en MPPT separados.

**La compatibilidad de los equipos no significa cobertura total del consumo.** El área permite una producción parcial: aproximadamente 62,7 % de la energía diaria en el escenario crítico del método. La aplicación muestra el déficit y bloquea ampliaciones que superen los 30 m². Se conserva el [JSON original del docente](entrega/reto03/entrada/papeleria-original.json); no se aumentan la superficie ni las HSP para obtener un aprobado.

## Ejecutar la aplicación

Requisitos: **Node.js 24** y **pnpm 11.25.0**. Se usa un único archivo de dependencias bloqueadas: `pnpm-lock.yaml`.

```sh
git clone https://github.com/Nico2919/reto02-esfv.git
cd reto02-esfv
pnpm install --frozen-lockfile
pnpm dev
```

Abre la dirección que muestra Vite, normalmente **http://localhost:5173**, y pulsa **Abrir caso final: papelería**. También puedes empezar desde cero, abrir un JSON o probar el caso estandarizado de Alta Guajira.

## Documentación y entregables

| Documento | Para qué sirve |
|---|---|
| [Entrega final](entrega/reto03/README.md) | Índice de seis proyectos, seis PDF y resultados reproducibles |
| [Matriz de la guía](entrega/reto03/MATRIZ_ENTREGABLES.md) | Evidencia de cada criterio y RF-25 a RF-36 |
| [Manual de uso](docs/GUIA_USO.md) | Recorrido de la aplicación |
| [Índice técnico](docs/README.md) | Método, validación, módulos e inversores |
| [Actualizaciones](CHANGELOG.md) | Historial de versiones |

El catálogo contiene **12 inversores reales**, tres reguladores Victron y cinco módulos comerciales con fichas oficiales. Las referencias académicas TdR y las baterías ilustrativas AGM/LFP están identificadas por separado. Los proyectos guardan sus entradas y catálogos para reconstruir los resultados.

## Validación y actualización

```sh
pnpm test
pnpm entrega:verificar
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:ui
```

En Windows con Edge instalado: `$env:PLAYWRIGHT_CHANNEL = 'msedge'` antes de `pnpm test:ui`. Las pruebas de navegador abren su propio servidor en el puerto 4173.

La entrega se comprueba con **26 pruebas numéricas/de regresión y 10 recorridos de interfaz**, además de hashes y reconstrucción de sus archivos. GitHub Actions ejecuta las mismas comprobaciones en cada actualización. Para regenerar informes y proyectos tras un cambio: `pnpm entrega:generar`, revisión de los PDF y `pnpm entrega:verificar`.

## Organización

```text
src/                  Aplicación e interfaz de los cinco pasos
  reto02/             Generador y transposición solar
  reto03/             Conversión, almacenamiento, persistencia e informe
public/               Catálogos externos y casos que abre la aplicación
docs/                 Manual y documentación técnica
entrega/reto03/       Caso final, PDF, resultados, matriz y anexos
scripts/              Generación y verificación reproducibles
tests/                Pruebas de cálculo y regresión
tests-ui/             Recorridos de la aplicación en navegador
.github/              Validación automática y plantilla de cambios
```

Se conserva la URL histórica `Nico2919/reto02-esfv` y el historial de los Retos 01/02. La entrega actual corresponde al **Reto 03**. Desarrollo asistido por **IA (Codex)**, declarado para revisión y sustentación. La fecha oficial de entrega es la publicada por el docente en Campus Virtual.
