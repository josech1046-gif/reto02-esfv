import { validarCatalogos } from './calculos.js';

export function incorporarComerciales(guardados, nuevos) {
  if (!Array.isArray(nuevos) || !nuevos.length || nuevos.some(e => e?.origen !== 'comercial')) {
    throw new Error('El archivo debe contener equipos comerciales.');
  }
  const ids = new Set(nuevos.map(e => e.id));
  if (guardados.conversion.some(e => e.origen !== 'comercial' && ids.has(e.id))) {
    throw new Error('Un equipo comercial no puede reemplazar una referencia académica.');
  }
  return validarCatalogos({
    ...guardados,
    conversion: [...guardados.conversion.filter(e => !ids.has(e.id)), ...nuevos],
  });
}
