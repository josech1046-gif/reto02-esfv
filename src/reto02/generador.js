function disponerPaneles(necesarios, maxSerie, areaDisponible, areaModulo, limitarPorArea) {
  if (limitarPorArea) {
    const nTotal = Math.min(necesarios, Math.floor(areaDisponible / areaModulo + 1e-10));
    if (!Number.isSafeInteger(nTotal) || nTotal < 1 || !Number.isSafeInteger(maxSerie) || maxSerie < 1) return null;
    let ns = Math.min(nTotal, maxSerie);
    while (ns > 1 && nTotal % ns !== 0) ns--;
    return { ns, np: nTotal / ns, nt: nTotal };
  }
  const ns = Math.min(necesarios, maxSerie);
  const np = Math.ceil(necesarios / ns);
  return { ns, np, nt: ns * np };
}

export function evaluarCatalogo({ ed, hsp, pr, vMaxSistema, tMin, catalogo, areaDisponible, limitarPorArea = false }) {
  const ppico = hsp > 0 && pr > 0 ? ed / (hsp * pr) : 0;

  const opciones = (catalogo || []).map((m) => {
    const vocM = m.voc * (1 + (m.beta / 100) * (tMin - 25));
    if (vocM > vMaxSistema) {
      return { id: m.id, nombre: `${m.fabricante} ${m.modelo}`, descartado: true,
        motivo: `Voc a Tmin (${vocM.toFixed(1)} V) supera la tensión máxima (${vMaxSistema} V).` };
    }

    const nsMax = Math.floor(vMaxSistema / vocM);
    if (nsMax < 1) {
       return { id: m.id, nombre: `${m.fabricante} ${m.modelo}`, descartado: true,
        motivo: `Inviable: No cabe ni 1 módulo bajo ${vMaxSistema}V a Tmin.` };
    }

    const nNec = Math.max(1, Math.ceil((ppico * 1000) / m.potencia));
    const arreglo = disponerPaneles(nNec, nsMax, areaDisponible, m.area, limitarPorArea);
    if (!arreglo) return { id: m.id, nombre: `${m.fabricante} ${m.modelo}`, descartado: true, motivo: 'El modulo no cabe en el area disponible.' };
    const { nt } = arreglo;
    const pInst = nt * m.potencia;
    const exc = ppico > 0 ? ((pInst / 1000 - ppico) / ppico) * 100 : 0;
    return { id: m.id, nombre: `${m.fabricante} ${m.modelo}`, nTotal: nt, pInst, excedentePct: exc, descartado: false };
  });

  const viables = opciones.filter((o) => !o.descartado);
  const mejorOpcion = viables.length > 0 ? viables.slice().sort((a, b) => Math.abs(a.excedentePct) - Math.abs(b.excedentePct))[0] : null;

  return { ppico, opciones, mejorOpcion, hayViables: viables.length > 0 };
}

export function calcularGenerador({ ed, hsp, pr, modulo, vMaxSistema, tMin, tOp, areaDisponible, catalogo, limitarPorArea = false }) {
  const { opciones, mejorOpcion, hayViables } = evaluarCatalogo({ ed, hsp, pr, vMaxSistema, tMin, catalogo, areaDisponible, limitarPorArea });

  const errores = [];
  if (hsp <= 0) errores.push("El recurso solar (HSP) debe ser mayor que cero.");
  if (pr <= 0 || pr > 1) errores.push("El factor de desempeño (PR) debe estar entre 0.01 y 1.00.");
  if (vMaxSistema <= 0) errores.push("La tensión máxima del sistema debe ser mayor que 0 V.");
  if (areaDisponible <= 0) errores.push("El área disponible debe ser declarada (> 0 m²).");
  if (tMin < -40 || tMin > 60) errores.push("Temperatura mínima fuera de un rango terrestre razonable (-40 a 60 °C).");
  if (tOp < -20 || tOp > 85) errores.push("Temperatura de operación fuera de rango razonable (-20 a 85 °C).");
  if (!hayViables) errores.push("Ningún módulo del catálogo es viable bajo las restricciones de tensión declaradas.");

  if (errores.length > 0) return { bloqueado: true, errores, opciones, mejorOpcion };

  const ppico = ed / (hsp * pr);
  const vocModTmin = modulo.voc * (1 + (modulo.beta / 100) * (tMin - 25));
  const nSerieMax = Math.floor(vMaxSistema / vocModTmin);

  if (nSerieMax < 1) {
     return { bloqueado: true, errores: [`El módulo forzado manualmente (${modulo.modelo}) NO ES VIABLE. Su Voc a Tmin (${vocModTmin.toFixed(1)} V) supera el límite de ${vMaxSistema} V.`], opciones, mejorOpcion };
  }

  const nNecesarios = Math.max(1, Math.ceil((ppico * 1000) / modulo.potencia));
  const arreglo = disponerPaneles(nNecesarios, nSerieMax, areaDisponible, modulo.area, limitarPorArea);
  if (!arreglo) return { bloqueado: true, errores: ['El modulo seleccionado no cabe en el area disponible.'], opciones, mejorOpcion };
  const { ns: nSerie, np: nParalelo, nt: nTotal } = arreglo;
  const pInstalada = nTotal * modulo.potencia;
  const excedentePct = ppico > 0 ? ((pInstalada / 1000 - ppico) / ppico) * 100 : 0;
  const vocGen = nSerie * vocModTmin;
  const tCelda = tOp + ((modulo.noct - 20) / 800) * 1000;
  const vmpGenOperacion = nSerie * modulo.vmp * (1 + (modulo.beta / 100) * (tCelda - 25));
  const iscGen = nParalelo * modulo.isc;
  const iDiseno = 1.25 * 1.25 * iscGen;
  const areaGen = nTotal * modulo.area;
  const energiaGenerador = (pInstalada / 1000) * hsp * pr;

  return {
    bloqueado: false, errores: [],
    ppico, nSerieMax, nNecesarios, nSerie, nParalelo, nTotal, pInstalada, excedentePct,
    vocModTmin, vocGen, tCelda, vmpGenOperacion, iscGen, iDiseno, areaGen, energiaGenerador,
    opciones, mejorOpcion, cabeEnArea: areaGen <= areaDisponible,
    limitarPorArea, limitadoPorArea: limitarPorArea && nTotal < nNecesarios,
  };
}
