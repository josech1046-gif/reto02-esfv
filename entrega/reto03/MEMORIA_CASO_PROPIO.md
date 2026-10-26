# Caso propuesto: aula rural con comunicaciones

## Objetivo y supuestos

Se propone alimentar un aula pequeña con cuatro portátiles, comunicaciones, monitoreo, iluminación y ventilación. El caso permite estudiar autonomía, DoD y tecnología, y distinguir un inversor eléctricamente compatible de un generador que cubre el mes crítico. **Las potencias, horarios y recurso son supuestos de diseño; no son mediciones de una instalación real.** La preparación se hizo con asistencia de IA, declarada en el índice de entrega.

Se adopta el método TdR sin modificaciones: herencia de los Retos 01/02, beta Voc también para Vmp, corriente al banco Ppico/Vnominal sin 1,25, y eficiencias explícitas de inversor y batería. Esto mantiene trazabilidad con las clases y el caso estandarizado. No se propone una ecuación alternativa ni se afirma haber consultado los valores reservados del docente.

| Carga supuesta | Cantidad × W | Horario | Wh/día |
|---|---:|---|---:|
| Portátiles | 4 × 65 | 10:00-18:00 | 2.080 |
| Router | 1 × 12 | 00:00-24:00 | 288 |
| Monitoreo | 1 × 20 | 00:00-24:00 | 480 |
| Iluminación LED | 4 × 9 | 18:00-24:00 | 216 |
| Ventilador | 1 × 45 | 12:00-20:00 | 360 |
| **Total** | **373 W instalados** | Pmax simultánea 337 W, primera vez a las 12 h | **3.424** |

La energía entre 06-18 h es 2.734 Wh y fuera de esa ventana, 690 Wh. Se supone uso 30 días/mes. El perfil de 24 h queda guardado en las máscaras de cada carga del JSON.

Recurso de estudio: HSP anual/crítica 5,8/5,2 h y PR 0,70, tomados del escenario del TdR para aislar el efecto de las nuevas cargas. No se atribuye a NASA una consulta nueva ni una medición del aula. Módulo de referencia de 550 Wp: Voc 49,5 V, Vmp 41,5 V, Isc 14 A, Imp 13,3 A y beta -0,27 %/°C. Tmin 20 °C; temperatura ambiente de operación 31,95 °C y NOCT 45 °C generan Tcelda 63,2 °C en el motor del Reto 02.

## Banco y selección del equipo

Se elige inicialmente LFP declarada en la guía: 51,2 V / 100 Ah por unidad, DoD de diseño 80 %, eficiencia 0,92, vida ilustrativa 10 años y carga máxima 0,5 C. Autonomía 2 días, fT 1 y eficiencia de inversor 0,90. Estas baterías son referencias académicas sin fabricante; no se afirma una combinación BMS certificada.

Ecc = 3.424/0,90 = 3.804,444 Wh/día. Cn = Ecc × 2/0,80 = 9.511,111 Wh = 185,764 Ah a 51,2 V. El redondeo exige **1S2P: dos baterías**, 200 Ah y 10,24 kWh. DoD diario/final: **37,153/74,306 %**, por debajo del 80 % de diseño.

El inversor comercial seleccionado es **GoodWe GW5000-ES-20**, ficha LATAM-ES V2.1, enlazada en el [catálogo](../../docs/CATALOGO_INVERSORES.md). Su mínimo MPPT de 60 V y arranque de 58 V permiten operar con la cadena corta inicial. Growatt SPH 3000 requiere 120 V; Solis híbrido, 90 V; Deye SG04, 150 V. Con 2S, Vmp caliente es 74,439 V: la elección se basa en compatibilidad de entrada y banco, no solo en la potencia CA. Los 5 kW exceden ampliamente la demanda de 337 W; esta selección técnica del catálogo no es una optimización económica ni un requisito de potencia de la carga.

## Cierre del generador

El Reto 02 entrega dos paneles en 2S1P, 1.100 Wp. Al incluir eficiencias, la potencia necesaria es 1.018,538 Wp con HSP anual y **1.136,062 Wp** con HSP crítica. Aunque la entrada del GoodWe es compatible, el generador inicial tiene **-3,174 %** de margen crítico y el banco no se recupera en ese escenario.

Al aceptar el ajuste crítico se agrega una cadena completa original de dos módulos. Se pasa de dos a **cuatro paneles, 2.200 Wp**, y se reorganiza a **4S1P**. El mínimo aritmético sería un panel adicional, pero la acción de ampliación conserva cadenas completas del Reto 02; esta decisión explica el sobredimensionamiento final. Ambas configuraciones quedan en proyectos e informes separados para que se pueda revisar el antes y el después.

| Verificación del cierre | Resultado / límite |
|---|---|
| Voc frío | 200,673 / 600 V |
| Vmp caliente / mínimo MPPT | 148,879 / 60 V |
| Vmp frío / máximo MPPT | 168,241 / 550 V |
| Arranque | 148,879 V frente a 58 V |
| Margen sobre banco | 148,879 V > 56,2 V |
| Ns máximo por Voc frío | 11; se usan 4 |
| Imp / Isc por MPPT | 13,3/14 A frente a 16/23 A |
| Distribución de cadenas | [1, 0]; una cadena en el primer MPPT |
| Corriente al banco | 45,833 A frente a 120 A; sin factor 1,25 |
| C de carga | 0,22917 C frente a 0,5 C |
| C de descarga | 0,03657 C; límite continuo no declarado |
| Margen anual / crítico | +115,996 / +93,651 % |
| Recuperación anual / crítica | 1,724 / 2,136 días |

La relación FV/CA del híbrido es 0,44. El rango 1,0-1,3 es el criterio de la rama sin baterías; aquí no se fuerza un falso rechazo del híbrido por ese cociente. Se conserva la advertencia de verificación BMS y de límites faltantes. La instalación requiere comprobar también la salida 220/230/240 V fase-neutro; el respaldo de este modelo no admite cargas de 110-127 V ni conexión fase-fase.

## Sensibilidad

Se mantiene el generador final de 4 módulos y el mismo inversor. Se cambia una variable de diseño a la vez, excepto la comparación tecnológica, que cambia también tensión, DoD y eficiencia a los declarados para AGM. Los valores sin redondear están en [CSV](resultados/sensibilidad.csv) y [JSON](resultados/sensibilidad.json).

| Escenario | Tecnología | Autonomía | DoD diseño | Baterías | kWh instalados | DoD final | Recuperación crítica, días |
|---|---|---:|---:|---:|---:|---:|---:|
| Base | LFP | 2 | 80 % | 2 | 10,24 | 74,31 % | 2,136 |
| Menor autonomía | LFP | 1 | 80 % | 1 | 5,12 | 74,31 % | 1,068 |
| Mayor autonomía | LFP | 3 | 80 % | 3 | 15,36 | 74,31 % | 3,203 |
| Menor DoD | LFP | 2 | 60 % | 3 | 15,36 | 49,54 % | 2,136 |
| DoD intermedio | LFP | 2 | 70 % | 3 | 15,36 | 49,54 % | 2,136 |
| Cambio de tecnología | AGM | 2 | 50 % | 8 (4S2P) | 19,20 | 39,63 % | 2,924 |

El banco crece en escalones por el redondeo entero. Por eso 60 % y 70 % de DoD requieren tres LFP en este caso. El tiempo de recuperación usa la energía consumida durante N días, no una descarga arbitraria del banco completo: variar DoD manteniendo N y Ed no cambia ese tiempo en el método TdR. Cambiar a AGM aumenta la energía necesaria por su menor eficiencia.

La comparación de energía nominal por año de vida declarada es 1,024 kWh/año para LFP y 4,8 kWh/año para AGM en los bancos instalados. No representa producción anual, energía útil durante la vida, rentabilidad ni costo por ciclo.

## Alcance comprobado

El resultado del equipo seleccionado cumple los criterios eléctricos evaluados y el cierre energético final es positivo en ambos recursos. Sigue **pendiente la comparación C de descarga contra una ficha comercial**, porque la guía no declara ese límite para las baterías ilustrativas. No se inventa un valor para obtener un aprobado. El JSON y el PDF muestran esa condición.

No se dimensionan conductores, protecciones, puesta a tierra ni economía, conforme al alcance de la guía. La presencia de costo mensual heredado del Reto 01 en el informe no constituye un análisis económico del Reto 03.
