# Guía de uso - Reto 03 ESFV

## Primera vez

Abre la aplicación y elige **Agregar mis aparatos**. También puedes usar **Probar con un ejemplo** para conocer el recorrido, o **Abrir proyecto** si ya tienes un archivo JSON guardado.

Los pasos de la parte superior permiten ir y volver. Los resultados se actualizan al cambiar los datos; no hace falta pulsar un botón de recalcular.

## 1. Proyecto

Escribe el nombre del proyecto y sus integrantes. Elige si existe conexión a la red y cuántos días al mes se usarán los aparatos. Los sistemas aislados e híbridos proponen baterías; puedes cambiar esa elección en el último paso.

## 2. Aparatos

Agrega cada aparato con su nombre, cantidad y potencia en vatios (W). Busca los vatios en la etiqueta o ficha del aparato. Elige **Todo el día**, **Solo de día** o **Solo de noche**; también puedes escribir un horario personalizado.

Por ejemplo, `08-12;14-17` significa de 8 a 12 y de 14 a 17 horas. Para un horario nocturno puedes usar `18-06`. Selecciona una fila para editarla. También puedes importar la hoja de cargas Excel de los retos anteriores.

## 3. Consumo

Consulta cuánta energía necesitas por día y a qué hora ocurre la mayor demanda. El gráfico muestra las horas en que se usan más aparatos.

## 4. Paneles solares

Elige la ubicación. La aplicación usa el recurso solar guardado y propone un panel; puedes consultar NASA si lo necesitas. Los ajustes de rendimiento, temperaturas y catálogo están en **Opciones avanzadas y catálogo de paneles**. Conserva sus valores si aún no tienes información para cambiarlos.

Revisa la cantidad de paneles, la potencia y cualquier aviso de espacio insuficiente. Continúa a **Inversor y baterías**.

## 5. Inversor y baterías

1. Elige si usarás baterías. Si las usas, indica cuántos **días de respaldo** necesitas y la tecnología de batería. Las baterías incluidas son referencias académicas, identificadas como tales.
2. Compara los equipos y pulsa **Elegir este equipo**. **Compatible** indica que pasan los criterios calculados. **No compatible** señala límites que fallan. **Requiere revisión** indica que faltan datos de ficha. Abre **Ver comprobaciones y ficha** para revisar el detalle.
3. Revisa la cantidad de baterías y comprueba si la energía alcanza. Se muestran un día promedio del año y un día del mes con menos sol.

Si hacen falta paneles, el botón indica exactamente cuántos se añadirán. Al aceptarlo, la aplicación comprueba otra vez los equipos; puede ser necesario cambiar de equipo. **Deshacer ampliación** vuelve al generador original. El dimensionamiento del paso Paneles solares se conserva como punto de partida.

Elige otra opción si un equipo no es compatible. Cuando exista una conexión viable con los mismos paneles, puedes aplicar **Reorganizar**. Los ajustes de eficiencia, porcentaje utilizable de batería, voltajes y rango DC/AC están en **Ajustes avanzados del sistema**.

## Guardar y entregar

- **Guardar proyecto:** descarga un JSON con las entradas y los catálogos. Úsalo para continuar o reproducir el resultado.
- **Abrir proyecto:** recupera un JSON, incluidos los de los Retos 01/02.
- **Descargar informe:** genera el PDF ejecutivo de una página. Conserva las alertas y datos técnicos necesarios para la revisión académica.

El botón de ejemplo abre el caso estandarizado de Alta Guajira para la demostración. No representa un diseño aprobado para instalación. Completa tu proyecto y revisa sus avisos antes de generar la entrega final.
