# Catálogo de módulos fotovoltaicos

Verificado el **25 de octubre de 2026**. `public/catalogo_modulos.json` contiene cinco modelos comerciales y una referencia académica TdR. Las cifras comerciales proceden de la columna STC de la revisión enlazada; las columnas NOCT/NMOT no se usan como si fueran valores STC.

| Modelo | Wp | Voc / Vmp, V | Isc / Imp, A | Área geométrica, m² | Documento oficial |
|---|---:|---|---|---:|---|
| Canadian Solar HiKu6 CS6L-450MS | 450 | 41,0 / 34,4 | 13,9 / 13,1 | 2,158002 | [V1.21_EN, marzo 2023, p. 2](https://static.csisolar.com/wp-content/uploads/2023/03/29160719/CS-Datasheet-HiKu6_CS6L-MS_v1.21_EN.pdf) |
| Jinko Tiger Neo JKM575N-72HL4-V | 575 | 50,88 / 42,22 | 14,39 / 13,62 | 2,583252 | [F3-EN, columna 575, p. 2](https://www.jinkosolar.com/uploads/JKM565-585N-72HL4-%28V%29-F3-EN.pdf) |
| Trina Vertex TSM-DEG21C.20 | 665 | 46,1 / 38,3 | 18,5 / 17,39 | 3,106352 | [TSM_EN_2022_A, columna frontal 665, p. 2](https://static.trinasolar.com/sites/default/files/DT_M_0013_B%20Datasheet_Vertex_DEG21C.20_EN_2022_A_web.pdf) |
| Jinko Tiger Neo JKM585N-72HL4-V | 585 | 51,16 / 42,52 | 14,55 / 13,76 | 2,583252 | [F3-EN, columna 585, p. 2](https://www.jinkosolar.com/uploads/JKM565-585N-72HL4-%28V%29-F3-EN.pdf) |
| **LONGi Hi-MO X10 LR7-54HVH-500M Anti-Glare** | **500** | **40,75 / 33,73** | **15,53 / 14,83** | **2,0412** | [BGV03 20250813, columna 500, p. 2](https://static.longi.com/LR_7_54_HVH_480_500_M_30_30_and_15_Frame_Anti_Glare_BGV_03_20250813_EN_cced5c1b69.pdf) |

El caso final de la papelería usa el LONGi por su potencia por unidad de superficie: **14 × 2,0412 = 28,5768 m²**, dentro del límite obligatorio. La selección no significa que alcance toda la demanda; el [balance de la memoria](../entrega/reto03/MEMORIA_PAPELERIA.md) muestra el déficit.

## Coeficientes y temperatura

| Modelo | Beta Voc | Alfa Isc | Gamma Pmax | NOCT/NMOT nominal |
|---|---:|---:|---:|---:|
| Canadian 450 | -0,26 | +0,05 | -0,34 | 41 °C |
| Jinko F3 575/585 | -0,25 | +0,045 | -0,29 | 45 °C |
| Trina 665 | -0,25 | +0,04 | -0,34 | 43 °C |
| LONGi 500 | -0,20 | +0,05 | -0,26 | 45 °C |

Coeficientes en %/°C. El método TdR aplica beta Voc a Vmp; no se atribuye ese supuesto al fabricante. En Trina se usa únicamente la potencia STC frontal, sin añadir una ganancia bifacial no simulada.

En esta revisión se corrigen las cifras heredadas del Jinko 575 a su ficha F3-EN y Vmp/NOCT del Trina 665 a la ficha 2022_A; también se añade la fuente oficial y eficiencia correcta del Canadian 450. Los proyectos antiguos conservan sus catálogos guardados; el archivo original del docente permanece intacto como entrada histórica.

## Referencia académica

El módulo **TdR de 550 Wp** conserva sus parámetros originales de prueba: no representa una marca comercial. Se mantiene para reconstruir los Retos 01/02 y el caso estandarizado de la guía.

Las áreas corresponden a dimensiones exteriores del módulo. No equivalen a un plano de implantación ni incluyen pasillos, separación o accesos. La ficha seleccionada se puede abrir desde el paso **Paneles solares**.
