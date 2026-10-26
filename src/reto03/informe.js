import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { formato as f } from './calculos.js';

// Bounded executive report: arbitrary load/catalog counts never add pages.
export function construirInforme({ proyecto, resultados, h, config: c, resultado: r }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const text = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/η/g, 'eta').replace(/β/g, 'beta').replace(/×/g, 'x').replace(/[–−—]/g, '-').replace(/[^\x20-\x7e\n]/g, '');
  const line = (s, y, size = 8) => { doc.setFontSize(size); doc.text(text(s).slice(0, 135), 12, y); };
  const table = (y, head, body) => {
    autoTable(doc, { startY: y, margin: { left: 12, right: 12 }, theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [23, 43, 69] },
      head: [head.map(text)], body: body.map(row => row.map(text)),
    });
    return doc.lastAutoTable.finalY + 5;
  };
  doc.setFillColor(11, 18, 32); doc.rect(0, 0, 210, 24, 'F'); doc.setTextColor(255);
  line('RETO 03 ESFV | INVERSOR Y BANCO DE BATERIAS', 9, 12);
  line(`${proyecto.nombre.slice(0, 65)} | ${proyecto.fecha} | ${proyecto.tipoApp}`, 16, 8);
  if (proyecto.integrantes?.trim()) line(`Integrantes: ${proyecto.integrantes.split('\n').map(n => n.trim()).filter(Boolean).join(' / ')}`, 21, 6);
  doc.setTextColor(22, 32, 46);
  let inicio = 26;
  if (proyecto.notas) {
    doc.setFontSize(7);
    const notas = doc.splitTextToSize(text(proyecto.notas), 185).slice(0, 4);
    doc.text(notas, 12, inicio + 3); inicio += notas.length * 3 + 6;
  }
  let y = table(inicio, ['Consumo del proyecto', 'Perfil y operacion', 'Energia temporal (06-18 h)'], [[
    `Ed ${f(h.edWh / 1000, 3)} kWh/dia; Pmax ${f(h.pMax, 0)} W a ${h.horaPico}:00\nP instalada ${f(resultados.pInst / 1000)} kW`,
    `${h.diasMes} dias/mes; ${h.diasMes * 12} dias/ano\nE mes ${f(resultados.energiaMes)} kWh; costo mes $${Math.round(resultados.costoMes)}`,
    `Dentro ${f(h.dentroWh / 1000, 3)} / fuera ${f(h.fueraWh / 1000, 3)} kWh/dia`,
  ]]);
  doc.setFontSize(6);
  const perfilLines = doc.splitTextToSize(`Perfil 00-23 h [W]: ${h.perfil.map(v => f(v, 0)).join(', ')}`, 185);
  doc.text(perfilLines, 12, y); y += perfilLines.length * 2.5 + 5;
  y = table(y, ['Paneles solares de partida', 'Modulo y coeficientes', 'Recurso y temperaturas'], [[
    `${f(h.potenciaWp / 1000)} kWp; ${h.ns}S x ${h.np}P\nPreq ${f(h.requeridaReto02Wp / 1000)} kWp; margen ${f(h.excedenteReto02Pct)}%\nArea ${f(h.areaGenerador)} / ${f(h.areaDisponible)} m2\nI diseno Reto 02 ${f(h.corrienteDisenoReto02)} A`,
    `${h.modulo.fabricante} ${h.modulo.modelo}\n${h.modulo.potencia} Wp; Voc/Vmp ${h.modulo.voc}/${h.modulo.vmp} V\nIsc/Imp ${h.modulo.isc}/${h.modulo.imp} A; beta ${h.modulo.beta}%/C\nalpha ${h.modulo.alpha}; gamma ${h.modulo.gamma}%/C`,
    `HSP anual/critica ${f(h.hspAnual)}/${f(h.hspCritico)}; PR ${h.pr}\nTmin ${h.tMin} C; Tcelda ${f(h.tCelda)} C\n${h.recursoNombre ?? ''}\n${(h.recursoFuente ?? '').slice(0, 95)}`,
  ]]);
  if (r.errores.length) {
    line('Reto 03: calculo bloqueado por entradas invalidas', y, 10);
    doc.setFontSize(8); doc.text(doc.splitTextToSize(text(r.errores.join('; ')).slice(0, 1500), 185), 12, y + 7);
    return doc;
  }
  const e = r.seleccionado;
  y = table(y, ['Reto 03: sistema y equipo', 'Entradas de diseno', 'Paneles utilizados'], [[
    `${r.rama === 'con' ? 'Con almacenamiento' : 'Sin almacenamiento'}\n${e?.equipo.modelo ?? 'Sin equipo seleccionado'} (${e?.equipo.origen ?? '-'})\n${e?.estado ?? 'Pendiente'}`,
    `etaInv ${c.etaInv}; DC/AC ${c.dcAcMin}-${c.dcAcMax}\n${r.banco ? `N ${c.autonomia} d; DoD ${f(c.dod * 100)}%; fT ${c.factorTemp}\nVbanco ${c.vBanco}; Vnom ${c.vNominal}; etaBat ${c.etaBat}` : 'Banco: no aplica'}`,
    `${r.arreglo.ns}S x ${r.arreglo.np}P; ${r.arreglo.nTotal} modulos\n${f(r.arreglo.potenciaWp / 1000)} kWp; +${r.modulosAgregados} modulos\nIsc ${f(r.conductor.isc)} A; 1.25 Isc ${f(r.conductor.diseno)} A`,
  ]]);
  if (e) {
    y = table(y, ['Verificacion electrica', 'Corrientes por MPPT / banco', 'Criterios que fallan o faltan'], [[
      `Voc frio ${f(e.voc)} / limite ${e.equipo.vMax} V; Ns max ${e.nsMax}\nVmp caliente/frio ${f(e.caliente)}/${f(e.frio)} V\nVentana ${e.equipo.mpptMin ?? c.vBanco + 5}-${e.equipo.mpptMax} V; arranque ${e.equipo.startV ?? c.vBanco + e.equipo.startOffset} V`,
      `Isc/Imp ${f(e.isc)}/${f(e.imp)} A\nLimites ${e.equipo.iscMax}/${e.equipo.impMax ?? 'no declarado'} A; reparto [${e.distribucion.join(', ')}]\n${r.banco ? `Salida ${f(e.salida)} / limite ${e.equipo.outMax} A sin 1.25` : `DC/AC ${f(e.ratio)}`}`,
      [...e.fallos.map(k => `Falla: ${k.nombre}`), ...e.pendientes.map(k => `Pendiente: ${k.nombre}`)].join('\n') || 'Cumple criterios evaluados',
    ]]);
  }
  if (r.banco) {
    const b = r.banco;
    y = table(y, ['Banco requerido e instalado', 'DoD y tasas C', 'Comparacion E nominal / ano'], [[
      `${b.bateria.modelo}\nCn ${f(b.capacidadWh / 1000)} kWh / ${f(b.capacidadAh)} Ah\n${b.ns}S x ${b.np}P = ${b.numero} baterias\nInst ${f(b.wh / 1000)} kWh / ${f(b.ah)} Ah`,
      `DoD diario/final ${f(b.dodDiario * 100)}/${f(b.dodFinal * 100)}%\nEfectivo fT ${f(b.dodEfectivo * 100)}%\nCarga ${f(b.cCarga, 3)} C (lim ${b.bateria.cCarga})\nDescarga ${f(b.cDescarga, 3)} C (lim ${b.bateria.cDescarga ?? 'no declarado'})`,
      r.tecnologias.slice(0, 3).map(t => `${t.bateria.tecnologia}: ${f(t.nominalPorAnio / 1000)} kWh/ano (${t.bateria.vida} anos)`).join('\n') + '\nIndicador nominal, no energia entregada.',
    ]]);
  }
  y = table(y, ['Balance diario', 'Produccion FV / Preq', 'Margen / modulos minimos', r.banco ? 'Recuperacion banco' : 'Deficit equivalente CA'], ['anual', 'critico'].map(key => {
    const b = r.balance[key]; return [key === 'anual' ? 'Promedio anual' : 'Mes critico', `${f(b.produccion / 1000, 3)} kWh / ${f(b.requeridaWp / 1000, 3)} kWp`, `${f(b.margenPct)}% / +${b.modulosAdicionales}`, r.banco ? b.recuperacion == null ? 'No se recupera' : `${f(b.recuperacion)} dias` : `${f(Math.max(0, -b.excedente * c.etaInv) / 1000, 3)} kWh/dia`];
  }));
  const avisos = [...r.avisos, ...(e?.avisos ?? [])];
  doc.setFontSize(6.5);
  const avisoText = text(`Alertas: ${avisos.length ? avisos.join(' | ') : 'Sin alertas adicionales.'}`).slice(0, 1000);
  const avisoLines = doc.splitTextToSize(avisoText, 185).slice(0, 7);
  doc.text(avisoLines, 12, y); y += avisoLines.length * 2.8 + 4;
  doc.setFontSize(6);
  const metodo = 'Metodo TdR: Ecc=Ed/etaInv; Preq=Egen/(HSP*PR). ' + (r.banco
    ? 'Cn=Ecc*N/(DoD*fT); Egen=Ecc/etaBat. Toda Ed atraviesa el inversor y la eficiencia de bateria. trec=N*Ecc/(Ppico*HSP*PR*etaBat-Ecc). '
    : 'Sin bateria: Egen=Ecc; etaBat y recuperacion no aplican. ') + 'Beta Voc se aplica a Vmp. JSON del proyecto conserva entradas y catalogos completos.';
  doc.text(doc.splitTextToSize(metodo, 185), 12, y);
  doc.setFontSize(5.5);
  doc.text(doc.splitTextToSize(text(`Ficha panel: ${h.modulo.fuente ?? 'No declarada'}`), 185).slice(0, 2), 12, 274);
  doc.text(doc.splitTextToSize(text(`Ficha equipo: ${e?.equipo.fuente ?? 'No seleccionado'}`), 185).slice(0, 3), 12, 281);
  line('Referencias TdR sin fabricante. Revisar alertas antes de adoptar el diseno. 1 / 1', 293, 6);
  return doc;
}
