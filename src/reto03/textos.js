export function estadoEquipo(equipo) {
  if (!equipo) return 'Elige un equipo';
  return equipo.fallos.length ? 'No compatible' : equipo.pendientes.length ? 'Requiere revisión' : 'Compatible';
}

export function criterioAmigable(nombre) {
  const textos = {
    'Voc frio': 'El voltaje máximo de los paneles supera el límite del equipo.',
    'Vmp caliente / MPPT minimo': 'Los paneles no entregan suficiente voltaje cuando hace calor.',
    'Vmp frio / MPPT maximo': 'El voltaje de trabajo supera el límite del equipo cuando hace frío.',
    'Arranque (Vmp caliente conservador)': 'El voltaje de los paneles no alcanza para encender este equipo.',
    'Margen sobre banco (Vbat + 5 V)': 'Hace falta más voltaje de los paneles para cargar las baterías.',
    'Isc por MPPT': 'La corriente máxima de los paneles supera el límite de entrada.',
    'Imp por MPPT': 'La corriente de trabajo de los paneles supera el límite de entrada.',
    'Cadenas por MPPT': 'Hay demasiados grupos de paneles para una entrada del equipo.',
    'Salida al banco (sin 1,25)': 'El regulador necesita más capacidad para cargar estas baterías.',
    'Clase nominal de bateria': 'El voltaje nominal de las baterías no es compatible con este equipo.',
    'Tension banco minima': 'El voltaje de las baterías es demasiado bajo para este equipo.',
    'Tension banco maxima': 'El voltaje de las baterías es demasiado alto para este equipo.',
    'Demanda maxima CA': 'La potencia del inversor no alcanza para todos los aparatos encendidos a la vez.',
    'Potencia FV maxima': 'La potencia de los paneles supera la capacidad del equipo.',
    'Relacion DC/AC': 'El tamaño del inversor está fuera del rango elegido para estos paneles.',
  };
  return textos[nombre] ?? nombre;
}

export function avisoAmigable(texto) {
  const reglas = [
    ['supera el area', 'Los paneles necesitan más espacio del disponible. Revisa el área en Paneles solares.'],
    ['Ningun equipo', 'Ningún equipo del catálogo admite esta configuración. Cambia la conexión de los paneles o elige otro equipo.'],
    ['Seleccione un equipo', 'Elige un equipo para completar la revisión.'],
    ['DoD efectivo', 'La batería se descargaría más de lo permitido. Aumenta su capacidad.'],
    ['DoD solicitado', 'El uso de batería elegido supera el recomendado. Reduce el porcentaje utilizable en Ajustes avanzados.'],
    ['Tasa C de carga excedida', 'Las baterías recibirían más corriente de la permitida. Aumenta su capacidad o limita la carga.'],
    ['descarga pendiente', 'Falta en la ficha el límite de corriente que pueden entregar las baterías. Debe confirmarse antes de instalar.'],
    ['descarga excedida', 'Los aparatos exigen más corriente de la que las baterías pueden entregar. Aumenta su capacidad.'],
    ['Tmin <', 'Con temperaturas bajas, las baterías pueden almacenar menos energía. Revisa el ajuste de temperatura.'],
    ['no se recupera', 'La energía disponible no alcanza para recargar completamente las baterías mientras se atiende el consumo.'],
  ];
  return reglas.find(([parte]) => texto.includes(parte))?.[1] ?? texto;
}

export function errorAmigable(texto) {
  if (texto.startsWith('DoD:')) return 'El porcentaje utilizable de la batería debe ser mayor que 0 y hasta 100 %.';
  if (texto.startsWith('Eficiencia del inversor')) return 'La eficiencia del inversor debe ser mayor que 0 y hasta 100 %.';
  if (texto.startsWith('Eficiencia bateria')) return 'La eficiencia de la batería debe ser mayor que 0 y hasta 100 %.';
  if (texto.startsWith('Factor de temperatura')) return 'El factor de temperatura debe ser mayor que 0 y hasta 1.';
  if (texto.startsWith('Ns debe')) return 'La cantidad de paneles por grupo no permite repartirlos por igual. Restablece la conexión original.';
  if (texto.startsWith('Vbanco debe')) return 'El voltaje del banco debe corresponder a un número entero de baterías compatibles. Revisa el voltaje o elige de nuevo la batería.';
  if (texto.startsWith('La clase nominal')) return 'El voltaje del cargador debe corresponder al banco de baterías. Elige de nuevo la batería para recuperar sus valores propuestos.';
  if (texto.startsWith('Revise energia')) return 'Agrega aparatos con consumo y revisa los datos del sol y los paneles.';
  if (texto.startsWith('Generador o modulo')) return 'Revisa la selección de paneles solares para continuar.';
  if (texto.startsWith('Rango DC/AC')) return 'La relación mínima debe ser mayor que cero y no superar la relación máxima.';
  return texto;
}
