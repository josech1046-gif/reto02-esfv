# Papelería con servicio de copiado · Memoria de diseño

**Caso del docente · 30 m² obligatorios · Versión 3.3.0**

## Resultado y alcance

Se seleccionan **14 módulos LONGi Hi-MO X10 LR7-54HVH-500M Anti-Glare**, 7.000 Wp y 28,5768 m², con **GoodWe GW6000-MS-30 de 6.000 W CA**. La configuración final es **7S2P**: dos cadenas de siete módulos, cada una en un MPPT independiente; el tercero queda libre.

Los equipos cumplen tensiones, arranque, corrientes y DC/AC. El arreglo cabe en el área geométrica de 30 m², pero **no cubre toda la energía del negocio**. En un sistema on-grid la red atiende el faltante. Si se exige cobertura solar del 100 %, el caso es inviable con esta superficie y este recurso; no corresponde aumentar el área ni ocultar el déficit para obtener «Cumple».

## Datos conservados del archivo del docente

| Parámetro | Valor |
|---|---:|
| Energía diaria CA | 27,800 kWh/día |
| Mayor demanda simultánea | 3.150 W, primera ocurrencia a las 09 h |
| Dentro / fuera de 06-18 h | 26,470 / 1,330 kWh/día |
| Operación | 30 días/mes |
| Superficie disponible obligatoria | 30 m² |
| Coordenadas guardadas | 2,93°, -75,28° |
| Inclinación / azimut | 3° / 180° |
| PR / eficiencia del inversor | 0,70 / 0,90 |
| Tmin / temperatura ambiente de operación | 24 / 34 °C |

Las ocho cargas y sus máscaras horarias no se alteran. Tampoco se cambian GHI/DNI/difusa guardados para mejorar el resultado. El identificador antiguo decía Riohacha, aunque la consulta guardada usa coordenadas de Neiva: solo se corrige ese rótulo. No se presenta como una consulta nueva a NASA.

Se conserva exactamente la transposición del Reto 02, extraída a un módulo puro para reutilizarla al generar la entrega. De los datos guardados resultan **HSP anual 4,253694** y **HSP crítica 3,949677**. NOCT nominal 45 °C y el método previo dan **Tcelda 65,25 °C**.

## Hojas de datos oficiales

### Módulo seleccionado

[LONGi Hi-MO X10 LR7-54HVH-500M Anti-Glare, BGV03 20250813](https://static.longi.com/LR_7_54_HVH_480_500_M_30_30_and_15_Frame_Anti_Glare_BGV_03_20250813_EN_cced5c1b69.pdf), página 2, columna de 500 W STC.

| Dato | Valor de la ficha |
|---|---:|
| Pmax | 500 Wp |
| Voc / Vmp | 40,75 / 33,73 V |
| Isc / Imp | 15,53 / 14,83 A |
| Beta Voc / alfa Isc / gamma Pmax | -0,200 / +0,050 / -0,260 %/°C |
| NOCT | 45 ± 2 °C; se usa el nominal |
| Dimensiones | 1.800 × 1.134 × 30 mm |
| Área geométrica | 2,0412 m² |
| Eficiencia de módulo | 24,5 % |

Se usa esta revisión Anti-Glare; no se mezclan cifras de una variante Scientist ni de otra potencia. Se eligió un módulo de alta eficiencia por unidad de superficie: los 14 módulos suman 28,5768 m². Un módulo más daría 30,618 m² y excedería el límite. El dato de área es geométrico; no constituye un plano de cubierta ni demuestra acceso, separación o resistencia estructural.

### Inversor seleccionado

[GoodWe MS G3, ficha LATAM-ES V2.1 de 20250910](https://latam.goodwe.com/Ftp/Downloads/Datasheet/LATAM/GW_MS%20G3_Datasheet-LATAM_ES.pdf), página 2, columna **GW6000-MS-30**.

| Dato | Valor de la ficha |
|---|---:|
| Potencia CA nominal | 6.000 W |
| Potencia FV máxima de entrada | 9.300 W |
| Tensión CC máxima | 600 V |
| Ventana MPPT | 40-560 V |
| Arranque | 50 V |
| Corriente de trabajo / corto por MPPT | 20 / 25 A |
| MPPT / cadenas por MPPT | 3 / 1 |
| Red declarada | Monofásica 220/230/240 V, 50/60 Hz |

Se usa la potencia nominal de 6 kW para DC/AC, no la potencia máxima temporal ni los límites específicos de Brasil/Chile. La red del negocio debe corresponder a la variante comprada; la evaluación de esta aplicación no certifica interconexión AC. El inversor on-grid no proporciona respaldo durante una falla de red.

## Configuración y verificación

El nuevo modo visible **Respetar el área como límite obligatorio** está activo. El Reto 02 calcula la potencia necesaria sin reducir Ed y limita solo el número instalado al entero que cabe en 30 m². El Reto 03 reorganiza esos mismos 14 módulos de 14S1P a 7S2P para repartirlos entre dos MPPT. No se cambia el método de los proyectos anteriores cuando este modo está desactivado.

| Comprobación final | Calculado | Límite | Resultado |
|---|---:|---:|---|
| Área de módulos | 28,5768 m² | 30 m² | Cumple |
| Voc frío por cadena | 285,8205 V | 600 V | Cumple |
| Vmp caliente | 217,1031 V | Mínimo 40 V | Cumple |
| Vmp frío | 236,5822 V | Máximo 560 V | Cumple |
| Arranque conservador | 217,1031 V | 50 V | Cumple |
| Isc por MPPT | 15,53 A | 25 A | Cumple |
| Imp por MPPT | 14,83 A | 20 A | Cumple |
| Cadenas por MPPT | [1, 1, 0] | Una por entrada | Cumple |
| Potencia FV | 7.000 Wp | 9.300 W | Cumple |
| DC/AC | 1,166667 | 1,0-1,3 | Cumple |
| Máximo de módulos en serie por Voc | 14 | Se usan 7 | Cumple |

La corriente no se suma entre MPPT independientes. Con 15 módulos por cadena, Voc frío superaría 600 V; las pruebas comprueban que esa configuración se rechaza. Las corrientes de diseño de conductores se muestran separadas y no se aplican como un aumento de la capacidad del inversor.

## Balance y restricción de cobertura

El método conserva la eficiencia de inversor 0,90 del archivo original. Ecc = 27,8/0,90 = **30,888889 kWh/día**. La potencia FV necesaria es **10,373803 kWp** con HSP anual y **11,172302 kWp** con HSP crítica, superior a los 7 kWp que se instalan.

| Escenario diario | Promedio anual | Mes crítico |
|---|---:|---:|
| Producción FV antes de etaInv | 20,843101 kWh | 19,353417 kWh |
| Equivalente CA con etaInv = 0,90 | 18,758791 kWh | 17,418076 kWh |
| Demanda CA | 27,800 kWh | 27,800 kWh |
| Cobertura energética equivalente | 67,4777 % | 62,6549 % |
| Déficit equivalente en CA | 9,041209 kWh | 10,381924 kWh |
| Margen respecto a potencia requerida | -32,5223 % | -37,3451 % |

No es una simulación horaria de importación/exportación: el déficit anterior es un balance neto equivalente. La energía fuera de la ventana solar y las diferencias instantáneas también requieren la red. DC/AC > 1 puede producir recortes; el método HSP/PR no cuantifica sus pérdidas horarias.

Para cubrir el mes crítico con el módulo seleccionado harían falta al menos 23 unidades, **46,9476 m² de módulos**, incluso antes de resolver las cadenas y espacios de instalación. Otra forma de ver la limitación es 11.172,302 Wp / 30 m² = 372,410 Wp/m²: equivaldría a una eficiencia de módulo de alrededor del **37,24 %** a STC, frente al 24,5 % de la ficha elegida. No se atribuye tal rendimiento a un equipo comercial.

Por ello la aplicación **bloquea la ampliación que no cabe**, conserva la advertencia de déficit y no transforma la compatibilidad del inversor en una aprobación de cobertura del 100 %. Ese comportamiento es la respuesta verificable al caso del profesor.

## Archivos y pruebas

[Entrada original](entrada/papeleria-original.json) · [Proyecto dimensionado](casos/papeleria-final.json) · [Informe](informes/papeleria-final.pdf) · [Resultados completos](resultados/papeleria-final.json).

Las pruebas comprueban conservación de cargas/recurso/superficie, HSP, área instalada, tensiones, corrientes, DC/AC, déficit, rechazo de una ampliación fuera de área, guardar/abrir e informe. El uso de IA está declarado en el índice de entrega. La interpretación y sustentación corresponden al integrante.
