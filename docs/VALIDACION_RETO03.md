# Validación Reto 03

Versión 3.3.0: **26 pruebas numéricas/de regresión, 10 recorridos de navegador** y `pnpm entrega:verificar`. Los seis proyectos y sus informes se reconstruyen desde las entradas publicadas. Los Retos 01/02 mantienen su comportamiento anterior al desactivar el nuevo límite obligatorio de área.

La [papelería](../entrega/reto03/MEMORIA_PAPELERIA.md) conserva 27.800 Wh/día, 3.150 W, coordenadas, recurso solar y 30 m². Se verifican 14 LONGi de 500 W en 7S2P, 28,5768 m², GoodWe de 6 kW, DC/AC 1,166667 y déficit crítico del 37,3451 %. Las pruebas exigen que el déficit siga visible y que una ampliación no pueda superar el área. No se confunde la compatibilidad eléctrica con cobertura total.

La [entrega](../entrega/reto03/README.md) reúne seis JSON y seis PDF de una página: papelería, tres casos TdR y dos casos complementarios con baterías. Los hashes comprueban sus fuentes y salidas. El navegador abre cada JSON y vuelve a exportar su informe. La [matriz de la guía](../entrega/reto03/MATRIZ_ENTREGABLES.md) registra el alcance y los datos pendientes.

## Matriz de cobertura

| RF | Implementación y comprobación |
|---|---|
| 25 | Rama automática/manual; recorrido de interfaz off-grid/on-grid/híbrido |
| 26 | Adaptador de cargas, perfil, generador y recurso; unidades Wh/W y ventana fija 06-18 |
| 27 | Tres JSON externos, editor atómico; quince comerciales (doce inversores y tres reguladores), seis TdR y dos tecnologías de batería |
| 28 | Voc frío, Vmp caliente/frío, MPPT, arranque y Ns máximo; incluye Tmin=0 |
| 29 | Imp/Isc por MPPT, reparto par/impar y salida al banco sin 1,25 |
| 30 | DC/AC editable, recorte/sobredimensión; caso INV-A/B/C |
| 31 | Veredicto por criterio/equipo y reconexión; CTRL-A admite 2S2P |
| 32 | Wh/Ah, N, DoD, fT, eficiencias y bloqueo de entradas inválidas |
| 33 | Ns/Np enteros, unidades, instalado y DoD; AGM 4S4P y LFP 1S5P |
| 34 | Balance anual/crítico, adicionales y ajuste reversible con nueva evaluación de equipos |
| 35 | C carga/descarga, recuperación con excedente positivo y comparación nominal/año |
| 36 | Proyecto v3, lectura v1/v2, descargas en navegador y PDF de una página |

`pnpm test` verifica el motor y la regresión Reto 02; `pnpm build` genera producción; `pnpm test:ui` prueba producción con Chromium/Edge. Capturas y PDFs de QA van a `tmp/qa/`, sin versionarse. `pnpm lint` revisa todo el código.

Las pruebas de interfaz incluyen el recorrido desde cero, horarios habituales, ambas ramas, AGM/LFP, ampliación y deshacer, guardar/abrir, PDF, datos de ficha pendientes, edición de catálogos, cambios de aparatos/PR y los cinco pasos en móvil. Las referencias RF y las fórmulas ya no ocupan la pantalla principal: permanecen en comprobaciones, guía técnica y documentación.

## Caso estandarizado

Ed=7.580 Wh/día; Pmax=910 W a las 17 h; dentro/fuera=5.180/2.400 Wh; cuatro módulos de 550 Wp, 4S1P; Voc=49,5 V, Vmp=41,5 V, Isc=14 A, Imp=13,3 A; beta=-0,27 %/°C; Tmin=20 °C, Tcelda=63,2 °C; HSP=5,8/5,2, PR=0,70. etaInv=0,90, N=2, fT=1.

| Verificación | Resultado |
|---|---:|
| Voc frío módulo / arreglo | 50,16825 / 200,673 V |
| Vmp caliente / frío arreglo | 148,87876 / 168,241 V |
| I al banco, clase nominal 48 V | 45,833333 A |
| Isc / 1,25 Isc Reto 03 | 14 / 17,5 A |
| Ns máximo CTRL-A / B / C | 2 / 4 / 4 |
| CTRL-A | No cumple Voc; 2S2P resuelve criterios declarados |
| CTRL-B | Cumple límites declarados; alerta por Imp no declarado |
| CTRL-C | No cumple salida 45,833 A > 40 A |

| Banco | AGM | LFP |
|---|---:|---:|
| Unidad | 12 V / 200 Ah | 51,2 V / 100 Ah |
| Banco / clase regulador | 48 / 48 V | 51,2 / 48 V |
| DoD / eficiencia | 0,50 / 0,80 | 0,80 / 0,92 |
| Ecc | 8.422,222222 Wh/día | 8.422,222222 Wh/día |
| Cn requerida Wh | 33.688,888889 | 21.055,555556 |
| Cn requerida Ah | 701,851852 | 411,241319 |
| Ns × Np / baterías | 4 × 4 / 16 | 1 × 5 / 5 |
| Instalado | 800 Ah / 38,4 kWh | 500 Ah / 25,6 kWh |
| DoD diario / final | 21,932870 / 43,865741 % | 32,899306 / 65,798611 % |
| C carga / límite | 0,057292 / 0,2 C | 0,091667 / 0,5 C |
| C descarga (límite no declarado) | 0,026331 C | 0,039497 C |
| E nominal/año de servicio | 9,60 kWh/año | 2,56 kWh/año |

Descarga usa Pmax/(etaInv × Vbanco). Carga usa Ppico/48 V en ambas tecnologías, según TdR.

| Balance AGM | Promedio anual | Mes crítico |
|---|---:|---:|
| Producción FV diaria | 8.932 Wh | 8.008 Wh |
| Energía a generar | 10.527,777778 Wh | 10.527,777778 Wh |
| Potencia requerida | 2.593,048714 Wp | 2.892,246642 Wp |
| Margen sobre requerida | -15,157784 % | -23,934565 % |
| Módulos mínimos adicionales | 1 | 2 |
| Recuperación | No se recupera | No se recupera |

Aceptar ajuste conservando cadenas de cuatro añade cuatro módulos (4S2P, 4.400 Wp). Salida=91,666667 A, superior a CTRL-B (80 A). Ninguno de los tres reguladores TdR admite ese arreglo individualmente; se muestra la acción necesaria. Retirar ajuste vuelve a 4S1P. LFP tampoco tiene excedente de recuperación con los 2.200 Wp iniciales.

| Sin almacenamiento | DC/AC | Veredicto |
|---|---:|---|
| INV-A, 1.500 W | 1,466667 | Falla rango y límite Imp 12 A |
| INV-B, 2.000 W | 1,100000 | Cumple parámetros declarados; recorte posible en picos |
| INV-C, 3.000 W | 0,733333 | Sobredimensionado respecto al mínimo 1,0 |

Son resultados derivados de las ecuaciones publicadas, no valores de referencia atribuidos al docente. Los parámetros no declarados y los supuestos se identifican en pantalla e informe.

## Fichas y alcance

El [catálogo documentado](CATALOGO_INVERSORES.md) recoge las seis incorporaciones con hojas oficiales verificadas: GoodWe ES/XS, Growatt SPH, Solis híbrido, Deye SG04 y Sungrow SG3.0RS. Las pruebas comprueban límites eléctricos de los nuevos modelos, actualización sin perder referencias propias/académicas, conservación ante descarga fallida, filtros, enlaces visibles y guardado de la selección. No se hacen solicitudes externas desde las pruebas automáticas; las fichas se descargaron y sus tablas se revisaron durante esta actualización.

- [Victron VE.Can 150/70 y 250/70-100](https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_150-70_up_to_250-100_VE.Can/es/technical-specifications.html): versiones Tr; corriente de salida/corto y tensión absoluta/operativa. Imp independiente ausente.
- [Deye SUN-SG03LP1-EU, revisión 240722](https://www.deyeinverter.com/deyeinverter/2024/07/23/datasheet_sun-3.6-6k-sg03lp1_240722_en.pdf): 5 kW, 500 V, MPPT 150-425 V, arranque 125 V, Imp 13+13 A e Isc 17+17 A; banco 40-60 V, carga 120 A.
- [Solis S6-GR1P(0.7-3.6)K-M EUR V1.0](https://www.ginlong.com/uploads/file/Solis_Manual_S6-GR1P%280%2C7-3%2C6%29K-M_EUR_V1%2C0.pdf): S6-GR1P2K-M de 14 A, no variante 16 A.
- [Solis S6-GR1P(2.5-6)K EUR V1.2](https://www.ginlong.com/uploads/file/Solis_Manual_S6-GR1P%282%2C5-6%29K_FN_EUR_V1%2C2%2820221116%29.pdf): S6-GR1P3K; dos MPPT, 14 A/22 A por MPPT, una cadena por MPPT.

Las baterías incluidas son referencias sintéticas AGM/LFP del TdR. Pueden sustituirse en el editor por fichas verificadas con vida, eficiencia, DoD, tasas C, tensión, Ah, clase nominal y límite de serie. No se infieren límites de corriente a partir de Pac/Isc. Un regulador CC requiere inversor CA independiente. La compatibilidad CC no certifica red AC, BMS, picos transitorios, protecciones ni instalación.
