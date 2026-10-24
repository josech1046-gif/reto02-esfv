# Método de cálculo - Reto 03 ESFV

## Método y supuestos

```text
Voc_frio = Voc * (1 + abs(betaVoc)/100 * (25 - Tmin))
Vmp_caliente = Vmp * (1 - abs(betaVoc)/100 * (Tcelda - 25))
Vmp_frio = Vmp * (1 + abs(betaVoc)/100 * (25 - Tmin))
Ns_max = floor(Vmax / Voc_frio_modulo)
I_banco = Ppico / Vnominal                  # sin 1,25
I_conductores_Reto03 = 1,25 * Isc           # separado del equipo
DC_AC = Ppico / Pac                         # rango inicial 1,0-1,3
Ecc = Ed / etaInv
Cn_Wh = Ecc * N / (DoD * fT)
Cn_Ah = Cn_Wh / Vbanco
Ns_bat = Vbanco / Vunidad                   # debe ser entero
Np_bat = ceil(Cn_Ah / Ah_unidad)
DoD_diario = Ecc / E_instalada
DoD_final = Ecc * N / E_instalada
Egen = Ecc / etaBat
Preq = Egen / (HSP * PR)
trec = N * Ecc / (Ppico * HSP * PR * etaBat - Ecc)
```

Energía interna en Wh, potencia en W y beta en %/°C. Se usa beta Voc también para Vmp, como Reto 02. Arranque verificado conservadoramente con Vmp caliente. PR se interpreta antes de las eficiencias nuevas; cada pérdida se aplica una sola vez. El método TdR aplica etaBat a toda Ed, incluso a cargas diurnas; no simula despacho horario híbrido.

`fT` reduce la capacidad disponible y se muestra `DoD_efectivo = DoD_final/fT`. C de carga usa Ppico/Vnominal antes de limitar el cargador; descarga usa Pmax/(etaInv × Vbanco). La comparación es energía instalada/vida declarada, no energía entregada ni costo por ciclo. El balance con cada HSP es por día de operación; la autonomía representa días consecutivos. Los días de operación del Reto 01 se conservan como contexto de consumo.

Los reguladores TdR no declaran ventana independiente ni Imp máximo: se muestra la envolvente derivada Vbat+5 a Vmax e Imp queda pendiente. Los inversores TdR no declaran arranque: se adopta mínimo MPPT como supuesto visible. Las baterías TdR no declaran límite C de descarga: se calcula la tasa y se alerta. Victron no declara Imp máximo independiente en la ficha citada: no se inventa. Un regulador CC requiere inversor CA independiente; la aplicación lo señala.

El indicador original de Reto 02 (`1,25 × 1,25 × Isc`) se conserva e identifica en su pestaña/informe; el factor de Reto 03 no se aplica al regulador. Quedan fuera conductores, protecciones, puesta a tierra y análisis económico de Reto 03.


Consulte también [las fórmulas y el glosario de la aplicación](../public/guia-tecnica.html) y la [validación numérica](VALIDACION_RETO03.md).
