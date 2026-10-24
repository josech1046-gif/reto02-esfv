// RF-25..35. Pure functions; all energy quantities are Wh and power is W.
export const inicialReto03 = () => ({
  rama: 'auto', catalogo: 'comercial', etaInv: 0.9, autonomia: 2,
  dod: 0.5, factorTemp: 1, vBanco: 48, vNominal: 48, etaBat: 0.8,
  bateriaId: 'tdr-agm', equipoCon: 'victron25070', equipoSin: 'solis2k',
  dcAcMin: 1, dcAcMax: 1.3, ajuste: null, ns: null,
});
export const ramaPorTipo = (tipo = '') => /on.?grid/i.test(tipo) && !/h[ií]brid/i.test(tipo) ? 'sin' : 'con';
const positivo = v => Number.isFinite(v) && v > 0;
const fraccion = v => positivo(v) && v <= 1;
const entero = v => Number.isSafeInteger(v) && v > 0;
export const formato = (v, n = 2) => Number.isFinite(v) ? v.toFixed(n) : 'No disponible';

export function heredarReto03({ resultados, proyecto, dimension, modulo, gen, hspAnual, hspCritico, sitio }) {
  const dentro = resultados.perfil.slice(6, 18).reduce((a, v) => a + v, 0);
  return {
    edWh: resultados.energiaDia * 1000, perfil: [...resultados.perfil],
    pMax: resultados.pMax, horaPico: resultados.horaPico, dentroWh: dentro,
    fueraWh: resultados.energiaDia * 1000 - dentro,
    tipoApp: proyecto.tipoApp, diasMes: proyecto.diasMes,
    potenciaWp: dimension.pInstalada, ns: dimension.nSerie, np: dimension.nParalelo,
    modulo: { ...modulo }, tMin: gen.tMinAmbiente, tCelda: dimension.tCelda,
    hspAnual, hspCritico, pr: gen.pr,
    requeridaReto02Wp: dimension.ppico * 1000, excedenteReto02Pct: dimension.excedentePct,
    areaGenerador: dimension.areaGen, areaDisponible: gen.areaDisponible, corrienteDisenoReto02: dimension.iDiseno,
    recursoNombre: sitio?.nombre, recursoFuente: gen.modoRecurso === 'api' && gen.apiStatus === 'ok' ? 'NASA POWER; transposicion local al plano del generador' : sitio?.fuente,
    errores: dimension.bloqueado ? dimension.errores : [],
  };
}

export function temperaturas(modulo, tMin, tCelda) {
  const beta = Math.abs(modulo.beta) / 100; // TdR: beta Voc also applies to Vmp.
  return {
    vocFrio: modulo.voc * (1 + beta * (25 - tMin)),
    vmpFrio: modulo.vmp * (1 + beta * (25 - tMin)),
    vmpCaliente: modulo.vmp * (1 - beta * (tCelda - 25)),
  };
}

export function validarCatalogos(c) {
  if (!c || !Array.isArray(c.conversion) || !c.conversion.length || !Array.isArray(c.baterias) || c.baterias.length < 2) throw new Error('Se requieren conversion[] y al menos dos baterias[].');
  const ids = new Set();
  for (const e of [...c.conversion, ...c.baterias]) {
    if (!e.id || ids.has(e.id) || !e.fabricante || !e.modelo || !e.fuente || !['tdr', 'comercial'].includes(e.origen)) throw new Error('Equipo sin identidad, fuente, origen o ID duplicado.');
    ids.add(e.id);
  }
  for (const e of c.conversion) {
    if (!['con', 'sin'].includes(e.rama) || !positivo(e.vMax) || !positivo(e.mpptMax) || e.mpptMax > e.vMax || !entero(e.mppts) || e.mppts > 256 || !positivo(e.iscMax)) throw new Error(`Parametros electricos invalidos: ${e.id}`);
    for (const k of ['mpptMin', 'startV', 'startOffset']) if (e[k] != null && (!Number.isFinite(e[k]) || e[k] < 0)) throw new Error(`${e.id}: ${k} invalido.`);
    if ((e.mpptMin ?? 0) >= e.mpptMax || (e.startV == null && e.startOffset == null)) throw new Error(`${e.id}: ventana MPPT o arranque invalido.`);
    for (const k of ['impMax', 'outMax', 'pac', 'pvMax', 'batMin', 'batMax']) if (e[k] != null && !positivo(e[k])) throw new Error(`${e.id}: ${k} debe ser positivo o null.`);
    if (e.stringsMax != null && !entero(e.stringsMax)) throw new Error(`${e.id}: stringsMax invalido.`);
    if (e.clasesBanco != null && (!Array.isArray(e.clasesBanco) || !e.clasesBanco.length || e.clasesBanco.some(v => !positivo(v)))) throw new Error(`${e.id}: clases nominales invalidas.`);
    if (e.rama === 'sin' && (!positivo(e.pac) || !positivo(e.mpptMin))) throw new Error(`${e.id}: falta potencia CA o minimo MPPT.`);
    if (e.rama === 'con' && !positivo(e.outMax)) throw new Error(`${e.id}: falta corriente al banco.`);
  }
  for (const b of c.baterias) {
    if (!b.tecnologia || !positivo(b.voltaje) || !positivo(b.ah) || !fraccion(b.dod) || !fraccion(b.eficiencia) || !positivo(b.vida) || !positivo(b.cCarga) || (b.claseNominal != null && !positivo(b.claseNominal))) throw new Error(`Bateria invalida: ${b.id}`);
    if (b.cDescarga != null && !positivo(b.cDescarga)) throw new Error(`${b.id}: tasa C de descarga invalida.`);
    if (b.maxSerie != null && !entero(b.maxSerie)) throw new Error(`${b.id}: maxSerie invalido.`);
  }
  return c;
}

export function bancoBaterias(h, c, b, potenciaWp) {
  const ecc = h.edWh / c.etaInv;
  const capacidadWh = ecc * c.autonomia / (c.dod * c.factorTemp);
  const capacidadAh = capacidadWh / c.vBanco;
  const ns = c.vBanco / b.voltaje;
  const np = Math.ceil(capacidadAh / b.ah - 1e-10);
  const ah = np * b.ah;
  const wh = ah * c.vBanco;
  const iCarga = potenciaWp / c.vNominal;
  const iDescarga = h.pMax / (c.etaInv * c.vBanco);
  return {
    bateria: b, ecc, capacidadWh, capacidadAh, ns, np, numero: ns * np,
    ah, wh, dodDiario: ecc / wh, dodFinal: ecc * c.autonomia / wh,
    dodEfectivo: ecc * c.autonomia / (wh * c.factorTemp),
    iCarga, iDescarga, cCarga: iCarga / ah, cDescarga: iDescarga / ah,
    nominalPorAnio: wh / b.vida,
  };
}

export function balanceEnergia(h, c, rama, potenciaWp) {
  const ecc = h.edWh / c.etaInv;
  const etaBat = rama === 'con' ? c.etaBat : 1;
  const energiaGenerar = ecc / etaBat;
  const periodo = hsp => {
    const produccion = potenciaWp * hsp * h.pr;
    const util = produccion * etaBat;
    const excedente = util - ecc;
    const requeridaWp = energiaGenerar / (hsp * h.pr);
    return {
      produccion, util, requeridaWp, excedente,
      margenPct: (potenciaWp / requeridaWp - 1) * 100,
      modulosAdicionales: Math.max(0, Math.ceil((requeridaWp - potenciaWp) / h.modulo.potencia - 1e-10)),
      recuperacion: rama === 'con' && excedente > 1e-9 ? c.autonomia * ecc / excedente : null,
    };
  };
  return { ecc, energiaGenerar, anual: periodo(h.hspAnual), critico: periodo(h.hspCritico) };
}

export function evaluarEquipo(h, c, a, e, rama) {
  const t = temperaturas(h.modulo, h.tMin, h.tCelda);
  const voc = t.vocFrio * a.ns, caliente = t.vmpCaliente * a.ns, frio = t.vmpFrio * a.ns;
  const distribucion = Array.from({ length: e.mppts }, (_, i) => Math.floor(a.np / e.mppts) + (i < a.np % e.mppts ? 1 : 0));
  const cadenas = Math.max(...distribucion);
  const imp = cadenas * h.modulo.imp, isc = cadenas * h.modulo.isc;
  const salida = a.potenciaWp / c.vNominal;
  const start = e.startOffset != null ? c.vBanco + e.startOffset : e.startV;
  const criterios = [];
  const check = (nombre, valor, limite, cumple, unidad = '', nota = '') => criterios.push({ nombre, valor, limite, cumple, unidad, nota });
  check('Voc frio', voc, e.vMax, voc <= e.vMax, 'V');
  check('Vmp caliente / MPPT minimo', caliente, e.mpptMin ?? (rama === 'con' ? c.vBanco + 5 : null), caliente >= (e.mpptMin ?? c.vBanco + 5), 'V', e.mpptMin == null ? 'Limite derivado: Vbanco + 5 V (metodo TdR).' : '');
  check('Vmp frio / MPPT maximo', frio, e.mpptMax, frio <= e.mpptMax, 'V');
  check('Arranque (Vmp caliente conservador)', caliente, start, e.startOffset != null ? caliente > start : caliente >= start, 'V');
  if (rama === 'con') check('Margen sobre banco (Vbat + 5 V)', caliente, c.vBanco + 5, caliente > c.vBanco + 5, 'V');
  check('Isc por MPPT', isc, e.iscMax, isc <= e.iscMax, 'A');
  check('Imp por MPPT', imp, e.impMax, e.impMax == null ? null : imp <= e.impMax, 'A', e.impMax == null ? 'La ficha no declara limite Imp independiente; requiere confirmacion.' : '');
  if (e.stringsMax != null) check('Cadenas por MPPT', cadenas, e.stringsMax, cadenas <= e.stringsMax);
  if (rama === 'con') {
    check('Salida al banco (sin 1,25)', salida, e.outMax, salida <= e.outMax, 'A');
    if (e.clasesBanco) check('Clase nominal de bateria', c.vNominal, e.clasesBanco.join('/'), e.clasesBanco.includes(c.vNominal), 'V');
    if (e.batMin != null) check('Tension banco minima', c.vBanco, e.batMin, c.vBanco >= e.batMin, 'V');
    if (e.batMax != null) check('Tension banco maxima', c.vBanco, e.batMax, c.vBanco <= e.batMax, 'V');
    if (e.pac != null) check('Demanda maxima CA', h.pMax, e.pac, h.pMax <= e.pac, 'W');
  }
  if (e.pvMax != null) check('Potencia FV maxima', a.potenciaWp, e.pvMax, a.potenciaWp <= e.pvMax, 'W');
  const ratio = e.pac ? a.potenciaWp / e.pac : null;
  if (rama === 'sin') check('Relacion DC/AC', ratio, `${c.dcAcMin}-${c.dcAcMax}`, ratio >= c.dcAcMin && ratio <= c.dcAcMax);
  const fallos = criterios.filter(x => x.cumple === false);
  const pendientes = criterios.filter(x => x.cumple == null);
  const avisos = [];
  if (rama === 'sin' && ratio > 1) avisos.push('Recorte posible cuando la potencia CC disponible supera Pac; el cociente no cuantifica perdidas anuales.');
  if (rama === 'sin' && ratio < c.dcAcMin) avisos.push('Inversor sobredimensionado frente al rango DC/AC configurado.');
  if (e.tipo === 'regulador') avisos.push('Este equipo es un regulador CC: falta seleccionar el inversor CA independiente para las cargas.');
  if (e.nota) avisos.push(e.nota);
  return { equipo: e, criterios, fallos, pendientes, avisos, ratio, distribucion,
    nsMax: Math.floor(e.vMax / t.vocFrio), voc, caliente, frio, imp, isc, salida,
    estado: fallos.length ? 'No cumple' : pendientes.length ? 'Alerta' : 'Cumple',
    cumple: fallos.length === 0 && pendientes.length === 0,
  };
}

export function calcularReto03(h, c, catalogos) {
  const rama = c.rama === 'auto' ? ramaPorTipo(h.tipoApp) : c.rama;
  const errores = [...(h.errores || [])];
  if (!['con', 'sin'].includes(rama)) errores.push('Rama invalida.');
  if (!fraccion(c.etaInv)) errores.push('Eficiencia del inversor: 0 < eficiencia <= 1.');
  if (!positivo(h.edWh) || !positivo(h.hspAnual) || !positivo(h.hspCritico) || !fraccion(h.pr)) errores.push('Revise energia, HSP y PR en Retos 01 y 02.');
  if (!entero(h.ns) || !entero(h.np) || !positivo(h.modulo?.potencia) || !positivo(h.modulo?.voc) || !positivo(h.modulo?.vmp) || !positivo(h.modulo?.imp) || !positivo(h.modulo?.isc) || !Number.isFinite(h.modulo?.beta) || !Number.isFinite(h.tMin) || !Number.isFinite(h.tCelda)) errores.push('Generador o modulo heredado incompleto.');
  if (!positivo(c.dcAcMin) || !positivo(c.dcAcMax) || c.dcAcMin > c.dcAcMax) errores.push('Rango DC/AC invalido: 0 < minimo <= maximo.');
  const bateria = catalogos.baterias.find(b => b.id === c.bateriaId);
  if (rama === 'con') {
    if (!positivo(c.autonomia)) errores.push('La autonomia debe ser mayor que cero.');
    if (!fraccion(c.dod)) errores.push('DoD: mayor que 0 y hasta 100 %.');
    if (!fraccion(c.factorTemp)) errores.push('Factor de temperatura: 0 < fT <= 1.');
    if (!fraccion(c.etaBat)) errores.push('Eficiencia bateria: 0 < eficiencia <= 1.');
    if (!positivo(c.vBanco) || !positivo(c.vNominal)) errores.push('Las tensiones de banco y nominal deben ser positivas.');
    if (!bateria) errores.push('Seleccione una bateria del catalogo.');
    else if (!entero(c.vBanco / bateria.voltaje) || (bateria.maxSerie && c.vBanco / bateria.voltaje > bateria.maxSerie)) errores.push('Vbanco debe ser un multiplo entero de la tension de la bateria y respetar su limite de serie.');
    else if (Math.abs(c.vNominal - (c.vBanco / bateria.voltaje) * (bateria.claseNominal ?? bateria.voltaje)) > 1e-6) errores.push('La clase nominal del regulador debe coincidir con la clase nominal del banco seleccionado.');
  }
  if (!['anual', 'critico', null].includes(c.ajuste)) errores.push('Ajuste del generador invalido.');
  if (errores.length) return { rama, errores };
  const baseTotal = h.ns * h.np;
  const baseBalance = balanceEnergia(h, c, rama, baseTotal * h.modulo.potencia);
  const necesarios = c.ajuste ? Math.max(baseTotal, Math.ceil(baseBalance[c.ajuste].requeridaWp / h.modulo.potencia - 1e-10)) : baseTotal;
  // The accepted expansion adds full original strings. Rewiring preserves that count.
  const nTotal = Math.ceil(necesarios / h.ns) * h.ns;
  if (!Number.isSafeInteger(nTotal) || nTotal > 1e6) return { rama, errores: ['El generador solicitado excede el rango de calculo (un millon de modulos). Revise energia y autonomia.'] };
  const ns = c.ns ?? h.ns;
  if (!entero(ns) || nTotal % ns !== 0) return { rama, errores: ['Ns debe ser un divisor entero del numero de modulos. Restablezca la configuracion heredada.'] };
  const arreglo = { ns, np: nTotal / ns, nTotal, potenciaWp: nTotal * h.modulo.potencia };
  const balance = balanceEnergia(h, c, rama, arreglo.potenciaWp);
  const equipos = catalogos.conversion.filter(e => e.rama === rama && e.origen === c.catalogo).map(e => {
    const r = evaluarEquipo(h, c, arreglo, e, rama);
    r.alternativas = [];
    if (r.fallos.length) {
      const divisores = new Set();
      for (let s = 1; s * s <= nTotal; s++) if (nTotal % s === 0) { divisores.add(s); divisores.add(nTotal / s); }
      for (const s of [...divisores].sort((a, b) => a - b)) {
        const alt = evaluarEquipo(h, c, { ...arreglo, ns: s, np: nTotal / s }, e, rama);
        if (!alt.fallos.length) r.alternativas.push({ ns: s, np: nTotal / s, estado: alt.estado });
      }
    }
    return r;
  });
  const seleccionadoId = rama === 'con' ? c.equipoCon : c.equipoSin;
  const seleccionado = equipos.find(e => e.equipo.id === seleccionadoId);
  const banco = rama === 'con' ? bancoBaterias(h, c, bateria, arreglo.potenciaWp) : null;
  const avisos = [];
  if (positivo(h.areaDisponible) && arreglo.nTotal * h.modulo.area > h.areaDisponible) avisos.push('El arreglo efectivo supera el area disponible del Reto 02. Revise el espacio antes de ampliar.');
  if (!seleccionado) avisos.push('Seleccione un equipo del catalogo activo.');
  if (!equipos.some(e => !e.fallos.length)) avisos.push('Ningun equipo admite el arreglo: reconfigure cadenas, agregue otro equipo con reparto independiente o reduzca el generador.');
  if (banco) {
    if (banco.dodEfectivo > c.dod + 1e-9) avisos.push('El DoD efectivo supera el DoD de diseno. Aumente cadenas de baterias.');
    if (c.dod > bateria.dod) avisos.push('El DoD solicitado supera el recomendado por la bateria.');
    if (banco.cCarga > bateria.cCarga) avisos.push('Tasa C de carga excedida: aumente el banco o limite la carga.');
    if (bateria.cDescarga == null) avisos.push('Tasa C de descarga pendiente: el catalogo no declara limite continuo.');
    else if (banco.cDescarga > bateria.cDescarga) avisos.push('Tasa C de descarga excedida: aumente cadenas de baterias.');
    if (h.tMin < 18 && c.factorTemp === 1) avisos.push('Tmin < 18 C: revise fT con la ficha de bateria.');
    if (balance.anual.recuperacion == null) avisos.push('El banco no se recupera con este generador en el promedio anual.');
    if (balance.critico.recuperacion == null) avisos.push('El banco no se recupera con este generador en el mes critico.');
  }
  const tecnologias = rama === 'con' ? catalogos.baterias.map(b => {
    const vBanco = (b.maxSerie === 1 ? b.voltaje : Math.max(1, Math.round(c.vBanco / b.voltaje)) * b.voltaje);
    return bancoBaterias(h, { ...c, dod: b.dod, etaBat: b.eficiencia, vBanco }, b, arreglo.potenciaWp);
  }) : [];
  return { rama, errores: [], arreglo, balance, banco, equipos, seleccionado, avisos, tecnologias,
    modulosAgregados: nTotal - baseTotal,
    conductor: { isc: arreglo.np * h.modulo.isc, diseno: 1.25 * arreglo.np * h.modulo.isc },
  };
}
