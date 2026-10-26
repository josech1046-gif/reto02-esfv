import { readFileSync } from 'node:fs';
import { calcularGenerador } from '../src/reto02/generador.js';
import { transponerATiltoMensual } from '../src/reto02/recurso.js';
import { calcularReto03, heredarReto03 } from '../src/reto03/calculos.js';
import { leerProyecto } from '../src/reto03/proyecto.js';

const leer = ruta => JSON.parse(readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8'));
export const fechaEntrega = '2026-10-25';

export function casoPapeleria() {
  const p = leer('entrega/reto03/entrada/papeleria-original.json');
  p.proyecto.fecha = fechaEntrega;
  p.proyecto.notas = 'CASO DEL DOCENTE: 30 m2 obligatorios. Sistema on-grid sin baterias, limitado al espacio disponible. Equipos electricamente compatibles; la produccion solar es parcial y la red debe cubrir el deficit. No hay autonomia sin red.';
  p.generador.catalogo = leer('public/catalogo_modulos.json');
  Object.assign(p.generador, { moduloForzado: true, moduloSeleccionadoId: 'longi500', limitarPorArea: true, sitioId: 'neiva-cache' });
  p.catalogosReto03 = { conversion: [...leer('public/catalogo_conversion.json'), ...leer('public/catalogo_conversion_tdr.json')], baterias: leer('public/catalogo_baterias.json') };
  Object.assign(p.reto03, { rama: 'sin', catalogo: 'comercial', equipoSin: 'goodwe-ms6k', ajuste: null, ns: 7 });
  const g = p.generador;
  const mensual = transponerATiltoMensual({ lat: g.lat, tiltDeg: g.inclinacion, azimutDeg: g.azimut, ...g.rawDataApi });
  p.baseSolar.push({ id: 'neiva-cache', nombre: 'Neiva - coordenadas y recurso guardados', lat: g.lat, lon: g.lon, mensual,
    fuente: 'NASA POWER guardado en el JSON original; transposicion local. No se ha realizado una consulta nueva.', fechaConsulta: '2026-10-24' });
  return p;
}

export function casosEntrega() {
  const carga = (id, nombre, cantidad, potencia, horas) => ({
    id, item: id, carga: nombre, cantidad, potenciaUnitaria: potencia,
    mask: Array.from({ length: 24 }, (_, h) => Number(horas.includes(h))),
  });
  const base = leer('public/ejemplo_reto03.json');
  base.catalogosReto03 = {
    conversion: [...leer('public/catalogo_conversion.json'), ...leer('public/catalogo_conversion_tdr.json')],
    baterias: leer('public/catalogo_baterias.json'),
  };
  base.proyecto.fecha = fechaEntrega;
  base.proyecto.integrantes = 'Nicolas Paz';
  base.cargas = [
    carga(1, 'Equipo de monitoreo', 1, 200, Array.from({ length: 24 }, (_, h) => h)),
    carga(2, 'Transmision de datos', 1, 710, [17]),
    carga(3, 'Sistemas auxiliares', 1, 230, [8,9,10,11,12,13,14,15,16]),
  ];
  const agm = structuredClone(base);
  agm.proyecto.nombre = 'Caso TdR - AGM';
  const lfp = structuredClone(base);
  lfp.proyecto.nombre = 'Caso TdR - LFP';
  Object.assign(lfp.reto03, { bateriaId: 'tdr-lfp', vBanco: 51.2, dod: 0.8, etaBat: 0.92 });
  const red = structuredClone(base);
  Object.assign(red.proyecto, { nombre: 'Caso TdR - sin almacenamiento', tipoApp: 'On-grid' });
  Object.assign(red.reto03, { rama: 'sin', equipoSin: 'inv-b' });

  const propioBase = structuredClone(lfp);
  Object.assign(propioBase.proyecto, { nombre: 'Caso propuesto - aula rural - partida', tipoApp: 'Híbrido' });
  propioBase.cargas = [
    carga(1, 'Portatiles - potencia de diseno asumida', 4, 65, [10,11,12,13,14,15,16,17]),
    carga(2, 'Router - potencia de diseno asumida', 1, 12, Array.from({ length: 24 }, (_, h) => h)),
    carga(3, 'Monitoreo - potencia de diseno asumida', 1, 20, Array.from({ length: 24 }, (_, h) => h)),
    carga(4, 'Iluminacion LED - potencia de diseno asumida', 4, 9, [18,19,20,21,22,23]),
    carga(5, 'Ventilador - potencia de diseno asumida', 1, 45, [12,13,14,15,16,17,18,19]),
  ];
  propioBase.baseSolar[0].nombre = 'Alta Guajira - recurso supuesto para estudio';
  propioBase.baseSolar[0].fuente = 'Supuesto de diseno: HSP anual 5.8 y critica 5.2 del escenario TdR; no es una medicion del aula.';
  Object.assign(propioBase.reto03, { rama: 'con', catalogo: 'comercial', equipoCon: 'goodwe-es5k', ajuste: null, ns: null });
  const propio = structuredClone(propioBase);
  propio.proyecto.nombre = 'Caso propuesto - aula rural - cierre';
  Object.assign(propio.reto03, { ajuste: 'critico', ns: 4 });
  return { 'papeleria-final': casoPapeleria(),
    'tdr-agm': agm, 'tdr-lfp': lfp, 'tdr-sin-almacenamiento': red, 'propio-partida': propioBase, 'propio-cierre': propio };
}

export function reconstruirProyecto(entrada) {
  const p = leerProyecto(entrada);
  const perfil = Array.from({ length: 24 }, (_, h) => p.cargas.reduce((s, c) => s + c.cantidad * c.potenciaUnitaria * c.mask[h], 0));
  const energiaDia = perfil.reduce((s, v) => s + v, 0) / 1000;
  const pMax = Math.max(...perfil);
  const resultados = {
    perfil, pMax, horaPico: perfil.indexOf(pMax), energiaDia,
    pInst: p.cargas.reduce((s, c) => s + c.cantidad * c.potenciaUnitaria, 0),
    energiaMes: energiaDia * p.proyecto.diasMes, costoMes: energiaDia * p.proyecto.diasMes * p.proyecto.cu,
  };
  const g = p.generador;
  if (!g.moduloForzado) throw new Error('Los casos de entrega requieren un modulo explicito para reproducirse.');
  if (g.modoRecurso === 'api' && !g.rawDataApi) throw new Error('Falta el recurso solar guardado: la entrega no realiza consultas de red.');
  const sitio = p.baseSolar.find(s => s.id === g.sitioId);
  const modulo = g.catalogo.find(m => m.id === g.moduloSeleccionadoId);
  const esApi = g.modoRecurso === 'api' && g.rawDataApi;
  const mensual = esApi ? transponerATiltoMensual({ lat: g.lat, tiltDeg: g.inclinacion, azimutDeg: g.azimut, ...g.rawDataApi }) : sitio.mensual;
  const hspAnual = !esApi && sitio.anualOficial != null ? sitio.anualOficial : mensual.reduce((s, v) => s + v, 0) / 12;
  const hspCritico = !esApi && sitio.mesCriticoOficial != null ? sitio.mesCriticoOficial : Math.min(...mensual);
  const dimension = calcularGenerador({ ed: energiaDia, hsp: g.criterioDimension === 'anual' ? hspAnual : hspCritico,
    pr: g.pr, modulo, vMaxSistema: g.vMaxSistema, tMin: g.tMinAmbiente, tOp: g.tOperacion, areaDisponible: g.areaDisponible, catalogo: g.catalogo, limitarPorArea: g.limitarPorArea });
  if (dimension.bloqueado) throw new Error(dimension.errores.join('; '));
  const h = heredarReto03({ resultados, proyecto: p.proyecto, dimension, modulo, gen: g, hspAnual, hspCritico, sitio });
  const resultado = calcularReto03(h, p.reto03, p.catalogosReto03);
  if (resultado.errores.length) throw new Error(resultado.errores.join('; '));
  return { proyecto: p.proyecto, resultados, h, config: p.reto03, resultado };
}

export function sensibilidadEntrega() {
  const base = casosEntrega()['propio-cierre'];
  const escenarios = [
    ['base-lfp', {}], ['autonomia-1-dia', { autonomia: 1 }], ['autonomia-3-dias', { autonomia: 3 }],
    ['dod-60-porciento', { dod: 0.6 }], ['dod-70-porciento', { dod: 0.7 }],
    ['tecnologia-agm', { bateriaId: 'tdr-agm', vBanco: 48, dod: 0.5, etaBat: 0.8 }],
  ];
  return escenarios.map(([id, cambios]) => {
    const p = structuredClone(base);
    Object.assign(p.reto03, cambios);
    const { config: c, resultado: r } = reconstruirProyecto(p);
    const b = r.banco;
    return { id, tecnologia: b.bateria.tecnologia, autonomia_dias: c.autonomia, dod_diseno: c.dod,
      eficiencia_bateria: c.etaBat, voltaje_banco_V: c.vBanco, capacidad_requerida_Wh: b.capacidadWh,
      baterias_serie: b.ns, cadenas_paralelo: b.np, numero_baterias: b.numero, capacidad_instalada_Ah: b.ah,
      energia_instalada_kWh: b.wh / 1000, dod_diario: b.dodDiario, dod_final: b.dodFinal,
      tasa_c_carga: b.cCarga, tasa_c_descarga: b.cDescarga,
      limite_c_descarga: b.bateria.cDescarga ?? null, nominal_por_anio_kWh: b.nominalPorAnio / 1000,
      paneles: r.arreglo.nTotal, potencia_Wp: r.arreglo.potenciaWp,
      margen_anual_pct: r.balance.anual.margenPct, margen_critico_pct: r.balance.critico.margenPct,
      recuperacion_anual_dias: r.balance.anual.recuperacion, recuperacion_critica_dias: r.balance.critico.recuperacion,
      equipo: r.seleccionado.equipo.id, estado_equipo: r.seleccionado.estado };
  });
}
