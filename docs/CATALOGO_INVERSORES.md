# Catálogo de inversores comerciales

Actualizado el **25 de octubre de 2026**. La versión 3.3.0 incluye **doce inversores reales de cinco fabricantes**: cinco con baterías y siete de conexión a red. Los tres reguladores Victron se cuentan por separado. La papelería de 30 m² utiliza el GoodWe GW6000-MS-30, con 7 kWp de módulos y DC/AC 1,166667.

Cada enlace conduce al documento del fabricante. Se transcribieron los límites de la columna y revisión indicadas; no se mezclan variantes de una misma familia. Las fichas se consultan directamente desde las tarjetas de la aplicación. Los valores de corriente siguientes son **por entrada MPPT**, no la suma de todas las entradas.

## Con baterías: híbridos y respaldo

| Fabricante y modelo | Salida CA | Banco | Tensión FV máxima / ventana MPPT / arranque | Imp / Isc | MPPT × cadenas por MPPT | Carga máxima | Hoja de datos |
|---|---:|---:|---|---|---|---:|---|
| Deye SUN-5K-SG03LP1-EU, existente | 5 kW | 40-60 V | 500 / 150-425 / 125 V | 13 / 17 A | 2 × 1 | 120 A | [240722, p. 2](https://www.deyeinverter.com/deyeinverter/2024/07/23/datasheet_sun-3.6-6k-sg03lp1_240722_en.pdf) |
| **GoodWe GW5000-ES-20**, nuevo | 5 kW | 40-60 V | 600 / 60-550 / 58 V | 16 / 23 A | 2 × 1 | 120 A | [LATAM-ES V2.1, 20260609, p. 2](https://latam.goodwe.com/Ftp/Downloads/Datasheet/LATAM/GW_ES%20G2_Datasheet-LATAM_ES.pdf) |
| **Growatt SPH 3000TL BL-UP**, nuevo | 3 kW | 42-59 V | 550 / 120-550 / 120 V | 13,5 / 16,9 A | 2 × 1 | 66 A | [202604, p. 2](https://en.growatt.com/upload/file/SPH_3000-6000TL_BL-UP_Datasheet_202604.pdf) |
| **Solis S6-EH1P5K-L-PLUS**, nuevo | 5 kW | 40-60 V | 500 / 90-435 / 90 V | 16 / 20 A | 2 × 1 | 112 A | [Global V3.8, columna 5K](https://storage-official-website.oss-eu-central-1.aliyuncs.com/solisstorage/products/S6-EH1P%283-10%29K-L-PLUS/S6-EH1P%283-10%29K-Global-Datasheet-V3.8_20260208165904.pdf) |
| **Deye SUN-5K-SG04LP1-EU**, nuevo | 5 kW | 40-60 V | 500 / 150-425 / 125 V | 18 / 27 A | 2 × 1 | 120 A | [20260911, publicada 14/09/2026, p. 2](https://www.deyeinverter.com/deyeinverter/2026/09/14/BDatasheetSUN-3-6K-SG04LP120260911en.pdf) |

El PDF de Solis se distribuye desde el almacenamiento enlazado por su [página oficial de producto](https://www.solisstorage.com/en/product/20260129161642.html). La columna de 5 kW declara **16 A por MPPT**; la mención de 21 A corresponde a otras variantes. Growatt declara 3 kW tanto en red como en respaldo para el modelo de 3 kW; los modelos mayores de esa familia tienen otros límites de respaldo.

GoodWe admite litio/plomo-ácido en la variante sin M seleccionada. Su respaldo requiere conexión fase-neutro de 220/230/240 V: no admite fase-fase ni cargas de 110-127 V. La ficha indica reducción de carga/descarga de batería sobre 490 V FV y espera sobre 560 V. Estos avisos quedan en el detalle del equipo. El banco y su BMS también condicionan la carga/descarga real.

## Sin baterías: conexión a red

| Fabricante y modelo | Salida CA | Tensión FV máxima / ventana MPPT / arranque | Imp / Isc | MPPT × cadenas por MPPT | Documento oficial |
|---|---:|---|---|---|---|
| Solis S6-GR1P2K-M, existente | 2 kW | 600 / 80-500 / 90 V | 14 / 22 A | 1 × 1 | [Manual EUR V1.0](https://www.ginlong.com/uploads/file/Solis_Manual_S6-GR1P%280%2C7-3%2C6%29K-M_EUR_V1%2C0.pdf) |
| Solis S6-GR1P3K, existente | 3 kW | 600 / 90-520 / 120 V | 14 / 22 A | 2 × 1 | [Manual EUR V1.2](https://www.ginlong.com/uploads/file/Solis_Manual_S6-GR1P%282%2C5-6%29K_FN_EUR_V1%2C2%2820221116%29.pdf) |
| **GoodWe GW2000-XS-30**, nuevo | 2 kW | 600 / 40-450 / 50 V | 16 / 25 A | 1 × 1 | [Hoja LATAM-ES V2.1, 20241011, p. 2](https://latam.goodwe.com/Ftp/Downloads/Datasheet/LATAM/GW_XS%20PLUS%2B_Datasheet-LATAM_ES.pdf) |
| **Sungrow SG3.0RS**, nuevo | 3 kW | 600 / 40-560 / 50 V | 16 / 20 A | 2 × 1 | [Hoja Global V12, 20220714, p. 2](https://info-support.sungrowpower.com/application/pdf/2023/07/22/DS_20220714_SG3.0_3.6_4.0RS_Datasheet_V12_EN%28GL%29.pdf) |
| **GoodWe GW5000-MS-30** | 5 kW | 600 / 40-560 / 50 V | 20 / 25 A | 3 × 1 | [LATAM-ES V2.1, 20250910, p. 2](https://latam.goodwe.com/Ftp/Downloads/Datasheet/LATAM/GW_MS%20G3_Datasheet-LATAM_ES.pdf) |
| **GoodWe GW6000-MS-30** | 6 kW | 600 / 40-560 / 50 V | 20 / 25 A | 3 × 1 | [LATAM-ES V2.1, 20250910, p. 2](https://latam.goodwe.com/Ftp/Downloads/Datasheet/LATAM/GW_MS%20G3_Datasheet-LATAM_ES.pdf) |
| **GoodWe GW10K-MS-30** | 10 kW | 600 / 40-560 / 50 V | 20 / 25 A | 3 × 1 | [LATAM-ES V2.1, 20250910, p. 2](https://latam.goodwe.com/Ftp/Downloads/Datasheet/LATAM/GW_MS%20G3_Datasheet-LATAM_ES.pdf) |

Todos estos modelos declaran salida monofásica de 220/230 V (algunos también 240 V), 50/60 Hz. Esto no confirma certificación, disponibilidad comercial ni adecuación a una red local específica. Los modelos de conexión a red no proporcionan respaldo autónomo con baterías.

## Potencia de módulos y potencia procesable

Se mantienen distinciones explícitas para evitar inventar límites:

- GoodWe ES 5 kW: entrada FV máxima 7.500 W; XS de 2 kW: 4.000 W.
- Deye SG04 de 5 kW: acceso FV máximo 10.000 W y entrada procesable 8.000 W. `pvMax` representa el límite de acceso, y la nota explica el posible recorte.
- Solis híbrido de 5 kW: arreglo recomendado de hasta 10.000 Wp y potencia utilizable de 8.000 W. No se convierte la recomendación ni la potencia utilizable en un límite absoluto de módulos.
- Growatt de 3 kW: arreglo recomendado de hasta 6.500 Wp. Sungrow de 3 kW: hasta 4.500 Wp recomendados. Estos valores quedan en las notas, sin tratarlos como límites absolutos.

El balance con HSP y PR conserva el método académico y no simula recortes horarios ni restricciones dinámicas de BMS. La relación DC/AC de la rama sin almacenamiento continúa siendo configurable de 1,0 a 1,3 por defecto.

## Uso y actualización

En **5. Inversor y baterías → Elige el equipo**, selecciona **Equipos comerciales**. Con baterías puedes filtrar **Solo inversores con baterías** o **Solo reguladores de carga**. El documento oficial se abre desde cada tarjeta; **Ver comprobaciones y ficha** muestra los valores calculados, límites y notas de revisión.

Los proyectos guardados conservan su catálogo para reproducir resultados. **Actualizar equipos comerciales** consulta el JSON publicado e incorpora las nuevas referencias. Actualiza las fichas con el mismo ID comercial y conserva los equipos propios con otros IDs, las referencias académicas y las baterías. Una descarga o validación fallida deja el catálogo anterior intacto. Guarda otra vez el proyecto para conservar la actualización.

Las referencias CTRL-A/B/C e INV-A/B/C permanecen en `catalogo_conversion_tdr.json`. Los tres Victron SmartSolar son **reguladores de carga CC**, requieren inversor CA independiente y no se incluyen en el recuento de doce inversores. Ningún equipo se marca compatible solo por estar en este catálogo: se evalúa contra los paneles, temperatura, corrientes, demanda y banco del proyecto.

Los MS G3 de 5/6/10 kW declaran 7.750/9.300/15.500 W máximos de entrada FV en la tabla LATAM usada. Se usa Pac nominal para DC/AC y no se mezclan sus notas específicas de Brasil/Chile. El GW6000-MS-30 admite las dos cadenas de la papelería en MPPT separados; su compatibilidad eléctrica no elimina el déficit energético por área.
