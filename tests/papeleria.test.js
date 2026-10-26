import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { casoPapeleria, reconstruirProyecto } from '../scripts/datos-entrega.mjs';
import { temperaturas, evaluarEquipo, calcularReto03 } from '../src/reto03/calculos.js';
import { calcularGenerador } from '../src/reto02/generador.js';
import { crearProyecto, leerProyecto } from '../src/reto03/proyecto.js';
import { construirInforme } from '../src/reto03/informe.js';

const original = JSON.parse(readFileSync(new URL('../entrega/reto03/entrada/papeleria-original.json', import.meta.url), 'utf8'));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('Papeleria conserva ocho cargas y datos NASA originales; 27.8 kWh, 3150 W y ventana solar', () => {
  const p = casoPapeleria();
  assert.deepEqual(p.cargas, original.cargas);
  assert.deepEqual(p.generador.rawDataApi, original.generador.rawDataApi);
  assert.equal(p.proyecto.integrantes, original.proyecto.integrantes);
  const { h, resultado: r } = reconstruirProyecto(p);
  assert.equal(h.edWh, 27800); assert.equal(h.pMax, 3150); assert.equal(h.horaPico, 9);
  assert.equal(h.dentroWh, 26470); assert.equal(h.fueraWh, 1330);
  assert.equal(r.rama, 'sin'); assert.equal(r.banco, null);
});

test('Recurso NASA guardado se transpone igual que el motor original, sin red ni recurso de Riohacha', () => {
  const { h } = reconstruirProyecto(casoPapeleria());
  near(h.hspAnual, 4.253694173253957); near(h.hspCritico, 3.949676990907228);
  near(h.tCelda, 65.25); assert.match(h.recursoNombre, /Neiva/);
  const sinDatos = casoPapeleria(); sinDatos.generador.rawDataApi = null;
  assert.throws(() => reconstruirProyecto(sinDatos), /Falta el recurso solar guardado/);
});

test('LONGi 500 W y GoodWe MS 6 kW cumplen superficie, tensiones, corrientes por MPPT y DC/AC', () => {
  const { h, config, resultado: r } = reconstruirProyecto(casoPapeleria());
  assert.deepEqual(r.arreglo, { ns: 7, np: 2, nTotal: 14, potenciaWp: 7000 });
  const e = r.seleccionado;
  assert.equal(e.estado, 'Cumple'); assert.equal(e.pendientes.length, 0);
  assert.ok(e.criterios.every(c => c.cumple === true));
  near(e.voc, 285.8205); near(e.caliente, 217.103145); near(e.frio, 236.58222);
  near(e.ratio, 7/6); near(e.imp, 14.83); near(e.isc, 15.53);
  assert.deepEqual(e.distribucion, [1, 1, 0]); assert.equal(e.nsMax, 14);
  near(h.areaGenerador, 28.5768); near(r.balance.critico.margenPct, -37.34505205071626);
  assert.ok(evaluarEquipo(h, config, { ns: 15, np: 1, potenciaWp: 7500 }, e.equipo, 'sin').fallos.some(c => c.nombre === 'Voc frio'));
  near(temperaturas(h.modulo, 24, 65.25).vocFrio, 40.8315);
});

test('Se mantienen 30 m2 y el deficit real; una ampliacion no puede superar la superficie obligatoria', () => {
  const p = casoPapeleria(); const { h, config, resultado: r } = reconstruirProyecto(p);
  assert.equal(h.areaDisponible, original.generador.areaDisponible);
  assert.match(p.proyecto.notas, /30 m2 obligatorios/);
  assert.ok(r.avisos.some(a => a.includes('no cubre todo el consumo')));
  near(r.balance.critico.produccion*.9, 17418.075529900874);
  assert.ok(calcularReto03(h, { ...config, ajuste: 'critico' }, p.catalogosReto03).errores.some(e => e.includes('area obligatoria')));
  const conBanco = calcularReto03(h, { ...config, rama: 'con' }, p.catalogosReto03);
  assert.ok(conBanco.avisos.some(a => a.includes('recuperar el banco')));
  assert.ok(!conBanco.avisos.some(a => a.includes('La red debe aportar')));
});

test('Limite de superficie es optativo y visible: conserva el calculo anterior cuando esta desactivado', () => {
  const p=casoPapeleria(), g=p.generador, m=g.catalogo.find(m=>m.id==='longi500');
  const args={ed:27.8,hsp:4.253694173253957,pr:.7,modulo:m,vMaxSistema:600,tMin:24,tOp:34,areaDisponible:30,catalogo:g.catalogo};
  assert.equal(calcularGenerador(args).nTotal,28);
  const limitado=calcularGenerador({...args,limitarPorArea:true});
  assert.equal(limitado.nTotal,14); assert.ok(limitado.limitadoPorArea); assert.ok(limitado.cabeEnArea);
  assert.ok(calcularGenerador({...args,areaDisponible:1,limitarPorArea:true}).bloqueado);
});

test('Notas, fichas y condicion de superficie se conservan al guardar/abrir y en el PDF de una pagina', () => {
  const p = casoPapeleria();
  const recuperado = leerProyecto(crearProyecto(p));
  assert.equal(recuperado.proyecto.notas, p.proyecto.notas);
  const pdf = construirInforme(reconstruirProyecto(recuperado));
  assert.equal(pdf.getNumberOfPages(), 1);
  for (const texto of ['30 m2 obligatorios', 'static.longi.com', 'latam.goodwe.com', 'GW6000-MS-30']) assert.ok(pdf.output().includes(texto), texto);
  assert.throws(() => leerProyecto({ ...p, proyecto: { ...p.proyecto, notas: {} } }), /deben ser texto/);
});
