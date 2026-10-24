import { inicialReto03, validarCatalogos } from './calculos.js';

// Validate before mutating React state. Old v1/v2 files keep their original shape.
export function leerProyecto(datos) {
  if (datos?._tipo !== 'Reto01-ProyectoESFV' || ![1, 2, 3].includes(datos.version ?? 1)) throw new Error('Formato o version de proyecto no compatible.');
  if (!datos.proyecto || typeof datos.proyecto.nombre !== 'string' || typeof datos.proyecto.integrantes !== 'string' || typeof datos.proyecto.tipoApp !== 'string' || !Number.isFinite(datos.proyecto.diasMes) || datos.proyecto.diasMes <= 0 || datos.proyecto.diasMes > 31 || !Number.isFinite(datos.proyecto.cu)) throw new Error('Contexto de proyecto invalido.');
  if (!Array.isArray(datos.cargas) || datos.cargas.some(c => typeof c.carga !== 'string' || !Number.isFinite(c.cantidad) || c.cantidad <= 0 || !Number.isFinite(c.potenciaUnitaria) || c.potenciaUnitaria <= 0 || !Array.isArray(c.mask) || c.mask.length !== 24 || c.mask.some(v => v !== 0 && v !== 1))) throw new Error('Cargas o perfil horario invalidos.');
  const criterio = datos.criterio ?? { inicio: 6, fin: 18 };
  if (!Number.isInteger(criterio.inicio) || !Number.isInteger(criterio.fin) || criterio.inicio < 0 || criterio.inicio > 23 || criterio.fin < 0 || criterio.fin > 24 || criterio.inicio === criterio.fin) throw new Error('Ventana temporal invalida.');
  if (datos.generador) {
    const g = datos.generador;
    if (!Array.isArray(g.catalogo) || !g.catalogo.length || g.catalogo.some(m => !m || !m.id || typeof m.fabricante !== 'string' || typeof m.modelo !== 'string' || ['potencia','voc','vmp','isc','imp','area','noct'].some(k => !Number.isFinite(m[k]) || m[k] <= 0) || !Number.isFinite(m.beta))) throw new Error('Catalogo de modulos invalido.');
    for (const k of ['pr','vMaxSistema','tMinAmbiente','tOperacion','areaDisponible','lat','lon','inclinacion','azimut']) if (g[k] != null && !Number.isFinite(g[k])) throw new Error(`Parametro del generador invalido: ${k}.`);
    if (g.rawDataApi && ['ghi','dni','dif'].some(k => !Array.isArray(g.rawDataApi[k]) || g.rawDataApi[k].length !== 12 || g.rawDataApi[k].some(v => !Number.isFinite(v)))) throw new Error('Recurso NASA guardado invalido.');
  }
  if (datos.baseSolar && (!Array.isArray(datos.baseSolar) || !datos.baseSolar.length || datos.baseSolar.some(s => !s.id || typeof s.nombre !== 'string' || typeof s.fuente !== 'string' || !Array.isArray(s.mensual) || s.mensual.length !== 12 || s.mensual.some(v => !Number.isFinite(v) || v <= 0)))) throw new Error('Base solar invalida.');
  if (datos.reto03 != null) {
    const c = datos.reto03;
    if (typeof c !== 'object' || Array.isArray(c)) throw new Error('Entradas de Reto 03 invalidas.');
    for (const k of ['etaInv','autonomia','dod','factorTemp','vBanco','vNominal','etaBat','dcAcMin','dcAcMax']) if (c[k] != null && c[k] !== '' && !Number.isFinite(c[k])) throw new Error(`Entrada Reto 03 invalida: ${k}.`);
    if (c.ns != null && c.ns !== '' && !Number.isFinite(c.ns)) throw new Error('Ns Reto 03 invalido.');
    if (c.rama != null && !['auto','con','sin'].includes(c.rama)) throw new Error('Rama Reto 03 invalida.');
    if (c.catalogo != null && !['tdr','comercial'].includes(c.catalogo)) throw new Error('Origen de catalogo invalido.');
  }
  if (datos.catalogosReto03) validarCatalogos(datos.catalogosReto03);
  return { ...datos, criterio, reto03: { ...inicialReto03(), ...datos.reto03 } };
}

export function crearProyecto({ proyecto, criterio, cargas, generador, baseSolar, reto03, catalogosReto03 }) {
  return {
    _tipo: 'Reto01-ProyectoESFV', version: 3, proyecto, criterio,
    cargas: cargas.map(({ id, item, carga, cantidad, potenciaUnitaria, mask }) => ({ id, item, carga, cantidad, potenciaUnitaria, mask })),
    generador, baseSolar, reto03, catalogosReto03: catalogosReto03?.conversion?.length ? catalogosReto03 : undefined,
  };
}
