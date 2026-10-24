# Reto 03 ESFV · Inversor y banco de baterías

Aplicación web para elegir el equipo de conversión y dimensionar el almacenamiento de un sistema solar fotovoltaico. Proyecto de Energía Solar Fotovoltaica, Universidad del Magdalena, periodo 2026-II.

**Versión 3.1.0.** La entrega se centra en Reto 03. El registro de aparatos y el cálculo de paneles de los Retos 01 y 02 se mantienen integrados como datos de partida.

## Probar la aplicación

Requisitos: Node.js 24 y pnpm 11.25.0.

```sh
git clone https://github.com/Nico2919/reto02-esfv.git
cd reto02-esfv
pnpm install --frozen-lockfile
pnpm dev
```

Abre la dirección que muestra Vite, normalmente **http://localhost:5173**. Para explorar el caso académico, pulsa **Probar con un ejemplo**. Para empezar tu propio diseño, pulsa **Agregar mis aparatos** o **Abrir proyecto**.

## Qué permite hacer

- Trabajar con baterías (sistemas aislados o híbridos) o sin baterías (conectados a red).
- Comparar inversores y reguladores, comprobar voltajes/corrientes y reorganizar los paneles cuando sea posible.
- Calcular cantidad de baterías, capacidad, autonomía y límites de carga/descarga.
- Revisar la energía disponible durante el año y en el mes con menos sol; añadir paneles y deshacer la ampliación.
- Guardar/abrir el proyecto completo y descargar un informe ejecutivo PDF de una página.

La pantalla principal usa lenguaje sencillo. Las fórmulas, siglas, comprobaciones completas y catálogos editables están en secciones desplegables y en la guía técnica. Las alertas relevantes siguen visibles. «Requiere revisión» indica que faltan datos de ficha; no equivale a compatibilidad confirmada.

## Documentos para la entrega

| Documento | Contenido |
|---|---|
| [Guía de uso](docs/GUIA_USO.md) | Recorrido para una persona que abre la aplicación por primera vez |
| [Entrega del Reto 03](docs/ENTREGA_RETO03.md) | Alcance, demostración y archivos del proyecto |
| [Validación RF-25 a RF-36](docs/VALIDACION_RETO03.md) | Matriz de requisitos y resultados numéricos esperados |
| [Método de cálculo](docs/METODO_CALCULO.md) | Ecuaciones, unidades, supuestos y datos pendientes |
| [Historial de actualizaciones](CHANGELOG.md) | Cambios por versión |

## Verificar una actualización

```sh
pnpm test
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:ui
```

Las pruebas de interfaz usan la compilación de `dist/` y abren su propio servidor en el puerto 4173. En Windows con Edge instalado:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
pnpm test:ui
```

GitHub Actions ejecuta las pruebas, lint y build al actualizar `main`, las ramas `feat/` y las solicitudes de integración. Su resultado se consulta en **Actions**. Las capturas y PDF de pruebas quedan en `tmp/qa/` localmente; no forman parte del código fuente.

La validación local de esta versión incluye 16 pruebas numéricas/de regresión y 7 recorridos de interfaz.

## Organización

```text
src/reto03/          Interfaz, cálculo, mensajes, persistencia e informe del Reto 03
src/reto02/          Motor de paneles del Reto 02, conservado
src/App.jsx         Integración con aparatos y consumo del Reto 01
public/             Catálogos JSON, caso de ejemplo y guía técnica
docs/               Documentación de uso, entrega, método y validación
tests/              Pruebas numéricas y de regresión
tests-ui/           Recorridos reales en navegador
.github/workflows/  Validación automática de actualizaciones
```

Los catálogos comerciales incluyen fichas y revisiones de Victron, Deye y Solis. CTRL-A/B/C, INV-A/B/C y las baterías AGM/LFP del caso de prueba son **referencias académicas**, separadas de productos comerciales. Los catálogos pueden editarse desde la aplicación. El proyecto JSON v3 conserva las entradas y catálogos; también se pueden abrir archivos de los Retos 01/02.

Se conserva la dirección `Nico2919/reto02-esfv` para mantener la continuidad del repositorio. El nombre de la aplicación, documentación e historial identifican la entrega actual como **Reto 03**. Desarrollo asistido por IA (Codex), documentado para revisión y sustentación.
