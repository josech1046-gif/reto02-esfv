import test from 'node:test';
import assert from 'node:assert/strict';
import { incorporarComerciales } from '../src/reto03/catalogos.js';
import { calcularReto03 } from '../src/reto03/calculos.js';
import { catalogos, config, heredados } from './fixtures.js';

const comerciales = catalogos.conversion.filter(e => e.origen === 'comercial');
const evaluar = (id, cambios = {}) => {
  const equipo = comerciales.find(e => e.id === id);
  return calcularReto03({ ...heredados, ...cambios }, { ...config, catalogo: 'comercial', rama: equipo.rama, equipoCon: id, equipoSin: id }, catalogos).seleccionado;
};

test('Catalogo: al menos cuatro inversores reales por rama y cinco fabricantes con documentos oficiales', () => {
  const inversores = comerciales.filter(e => e.tipo !== 'regulador');
  for (const rama of ['con', 'sin']) assert.ok(inversores.filter(e => e.rama === rama).length >= 4);
  assert.ok(new Set(inversores.map(e => e.fabricante)).size >= 5);
  const fichas = comerciales.filter(e => e.tipoFuente === 'ficha');
  assert.ok(fichas.length >= 6);
  const dominios = new Set(['latam.goodwe.com', 'en.growatt.com', 'www.deyeinverter.com', 'info-support.sungrowpower.com', 'storage-official-website.oss-eu-central-1.aliyuncs.com']);
  for (const e of fichas) {
    const url = new URL(e.fuente);
    assert.equal(url.protocol, 'https:'); assert.ok(dominios.has(url.hostname));
    assert.ok(url.pathname.endsWith('.pdf')); assert.ok(e.revision); assert.match(e.fechaConsulta, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('Nuevos hibridos: limites completos, modelos de 48 V y corrientes evaluadas por MPPT', () => {
  for (const id of ['goodwe-es5k', 'growatt-sph3k', 'solis-hibrido5k']) {
    const e = evaluar(id);
    assert.equal(e.estado, 'Cumple', id); assert.equal(e.pendientes.length, 0, id);
    assert.deepEqual(e.distribucion, [1, 0]); assert.equal(e.imp, 13.3);
    assert.ok(evaluar(id, { np: 3 }).fallos.some(c => c.nombre === 'Imp por MPPT'), id);
  }
  assert.ok(evaluar('deye-sg04-5k').fallos.some(c => c.nombre === 'Vmp caliente / MPPT minimo'));
  assert.ok(evaluar('deye5k').fallos.some(c => c.nombre === 'Imp por MPPT'));
  assert.ok(!evaluar('deye-sg04-5k').fallos.some(c => c.nombre === 'Imp por MPPT'));
});

test('Nuevos on-grid: GoodWe de 2 kW cumple 1.1 DC/AC; Sungrow de 3 kW requiere mas paneles', () => {
  assert.equal(evaluar('goodwe-xs2k').estado, 'Cumple');
  assert.equal(evaluar('goodwe-xs2k').ratio, 1.1);
  assert.ok(evaluar('sungrow3k').fallos.some(c => c.nombre === 'Relacion DC/AC'));
  const sungrow = evaluar('sungrow3k', { ns: 6 });
  assert.equal(sungrow.estado, 'Cumple'); assert.equal(sungrow.imp, 13.3);
  assert.ok(evaluar('goodwe-xs2k', { ns: 12 }).fallos.some(c => c.nombre === 'Voc frio'));
});

test('Actualizacion conserva equipos propios, referencias, baterias y proyecto original; rechaza mezcla y duplicados', () => {
  const nuevos = comerciales.filter(e => e.tipoFuente === 'ficha');
  const anterior = structuredClone(catalogos);
  anterior.conversion = anterior.conversion.filter(e => !nuevos.some(n => n.id === e.id));
  anterior.conversion.push({ ...comerciales[0], id: 'equipo-personalizado' });
  const copia = structuredClone(anterior);
  const actualizado = incorporarComerciales(anterior, nuevos);
  assert.deepEqual(anterior, copia);
  assert.ok(actualizado.conversion.some(e => e.id === 'equipo-personalizado'));
  assert.deepEqual(actualizado.baterias, anterior.baterias);
  assert.deepEqual(actualizado.conversion.filter(e => e.origen === 'tdr'), anterior.conversion.filter(e => e.origen === 'tdr'));
  assert.deepEqual(incorporarComerciales(actualizado, nuevos), actualizado);
  for (const invalido of [[], [{ ...nuevos[0], origen: 'tdr' }], [nuevos[0], nuevos[0]], [{ ...nuevos[0], vMax: -1 }], [{ ...nuevos[0], id: 'ctrl-a' }]]) {
    assert.throws(() => incorporarComerciales(anterior, invalido));
    assert.deepEqual(anterior, copia);
  }
});
