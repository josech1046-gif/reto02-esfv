import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularReto03, temperaturas, validarCatalogos, ramaPorTipo, heredarReto03 } from '../src/reto03/calculos.js';
import { calcularGenerador } from '../src/reto02/generador.js';
import { crearProyecto, leerProyecto } from '../src/reto03/proyecto.js';
import { construirInforme } from '../src/reto03/informe.js';
import { catalogos, heredados as h, config as c, modulo, proyectoTdr } from './fixtures.js';
const calc = (config = {}, heredados = {}) => calcularReto03({ ...h, ...heredados }, { ...c, ...config }, catalogos);
const near = (actual, expected, epsilon = 1e-6) => assert.ok(Math.abs(actual-expected) < epsilon, `${actual} != ${expected}`);

test('RF-25: rama automatica on-grid, off-grid e hibrida; override explicito', () => {
  assert.equal(ramaPorTipo('On-grid'),'sin'); assert.equal(ramaPorTipo('Híbrido'),'con'); assert.equal(ramaPorTipo('Off-grid'),'con');
  assert.equal(calc({}, {tipoApp:'On-grid'}).rama,'sin'); assert.equal(calc({rama:'con'}, {tipoApp:'On-grid'}).rama,'con');
});
test('RF-26: adaptador conserva unidades, perfil, coeficientes y ventana fija 06-18', () => {
  const p = proyectoTdr(); const her = heredarReto03({ resultados:{energiaDia:7.58,perfil:h.perfil,pMax:910,horaPico:17}, proyecto:p.proyecto, dimension:{pInstalada:2200,nSerie:4,nParalelo:1,tCelda:63.2}, modulo, gen:p.generador, hspAnual:5.8,hspCritico:5.2 });
  assert.equal(her.edWh,7580); assert.equal(her.dentroWh,5180); assert.equal(her.fueraWh,2400); assert.deepEqual(her.modulo,modulo); assert.notEqual(her.perfil,h.perfil);
  assert.ok(calc({}, {edWh:9000}).banco.capacidadWh > calc().banco.capacidadWh);
});
test('RF-27: catalogos externos validos, origen separado y datos corruptos rechazados', () => {
  validarCatalogos(catalogos); assert.equal(catalogos.conversion.filter(e=>e.origen==='comercial').length,6);
  for (const patch of [{vMax:-1},{mppts:0},{impMax:'16'},{mpptMin:900},{startOffset:-5}]) {
    const bad = structuredClone(catalogos); Object.assign(bad.conversion[0],patch); assert.throws(()=>validarCatalogos(bad));
  }
  const bad=structuredClone(catalogos); bad.baterias[0].id=bad.conversion[0].id; assert.throws(()=>validarCatalogos(bad));
});
test('RF-28: temperaturas y maximos de serie exactos (incluye Tmin=0)', () => {
  const t=temperaturas(modulo,20,63.2); near(t.vocFrio*4,200.673); near(t.vmpFrio*4,168.241); near(t.vmpCaliente*4,148.87876);
  near(temperaturas(modulo,0,25).vocFrio,52.84125);
  assert.deepEqual(calc().equipos.map(e=>e.nsMax),[2,4,4]);
  assert.ok(calc().equipos[0].fallos.some(x=>x.nombre==='Voc frio'));
  assert.ok(calc({}, {tCelda:150}).equipos[0].fallos.some(x=>x.nombre.includes('Vmp')));
});
test('RF-29: salida sin 1,25 y corriente de conductores aparte', () => {
  const r=calc(); near(r.banco.iCarga,45.8333333333333); near(r.conductor.diseno,17.5);
  assert.equal(r.equipos[1].fallos.length,0); assert.equal(r.equipos[1].estado,'Alerta');
  assert.ok(r.equipos[2].fallos.some(x=>x.nombre.includes('Salida')));
});
test('RF-29/31: reparto en MPPT independiente y limites por entrada', () => {
  const r=calc({rama:'sin',catalogo:'comercial',equipoSin:'solis3k'}, {ns:4,np:2});
  const e=r.equipos.find(x=>x.equipo.id==='solis3k'); assert.deepEqual(e.distribucion,[1,1]); near(e.imp,13.3); near(e.isc,14);
  const impar=calc({rama:'sin',catalogo:'comercial'}, {ns:4,np:3}).equipos.find(x=>x.equipo.id==='solis3k');
  assert.deepEqual(impar.distribucion,[2,1]); assert.ok(impar.fallos.some(x=>x.nombre==='Imp por MPPT'));
});
test('RF-30: INV-A falla Imp y DC/AC, INV-B cumple, INV-C sobredimensionado', () => {
  const r=calc({rama:'sin'}); const [a,b,d]=r.equipos;
  near(a.ratio,2200/1500); assert.ok(a.fallos.some(x=>x.nombre==='Imp por MPPT')); assert.ok(a.fallos.some(x=>x.nombre==='Relacion DC/AC'));
  near(b.ratio,1.1); assert.equal(b.estado,'Cumple'); near(d.ratio,2200/3000); assert.equal(d.estado,'No cumple'); assert.ok(d.avisos.some(x=>x.includes('sobredimensionado')));
  assert.equal(calc({rama:'sin',dcAcMin:.7}).equipos[2].estado,'Cumple');
});
test('RF-31: reconfiguracion mantiene numero de modulos, resuelve CTRL-A', () => {
  const a=calc().equipos[0]; assert.ok(a.alternativas.some(x=>x.ns===2&&x.np===2));
  const r=calc({ns:2}); assert.equal(r.arreglo.nTotal,4); assert.equal(r.equipos[0].fallos.length,0);
  assert.ok(calc({ns:3}).errores.length); assert.ok(calc({ns:null}).arreglo);
});
test('RF-32/33: AGM Wh/Ah, enteros, DoD diario/final y factor de temperatura', () => {
  const b=calc().banco; near(b.ecc,8422.2222222222); near(b.capacidadWh,33688.8888888889); near(b.capacidadAh,701.8518518519);
  assert.deepEqual([b.ns,b.np,b.numero,b.ah,b.wh],[4,4,16,800,38400]); near(b.dodDiario,.219328703704); near(b.dodFinal,.438657407407);
  const cold=calc({factorTemp:.7}).banco; assert.ok(cold.np>b.np); assert.ok(cold.dodEfectivo<=.5);
});
test('RF-32: entradas invalidas bloquean sin NaN/Infinity', () => {
  for (const patch of [{autonomia:0},{autonomia:-1},{dod:0},{dod:1.1},{etaInv:0},{etaInv:1.1},{etaBat:0},{etaBat:1.01},{factorTemp:0},{factorTemp:1.1},{vBanco:50},{vNominal:0},{dcAcMin:1.4,dcAcMax:1.3},{autonomia:''},{etaInv:NaN}]) assert.ok(calc(patch).errores.length,JSON.stringify(patch));
  assert.ok(calc({}, {hspCritico:0}).errores.length); assert.ok(calc({}, {errores:['Reto 02 bloqueado']}).errores.length);
  assert.equal(calc({rama:'sin',autonomia:0,dod:0,etaBat:0}).errores.length,0);
});
test('RF-33: LFP 51.2 V / clase 48 V sin inventar series fraccionarias', () => {
  const r=calc({bateriaId:'tdr-lfp',vBanco:51.2,dod:.8,etaBat:.92}); const b=r.banco;
  near(b.capacidadWh,21055.5555555556); assert.deepEqual([b.ns,b.np,b.numero,b.ah,b.wh],[1,5,5,500,25600]); near(b.dodFinal,.657986111111); near(b.iCarga,45.8333333333);
  assert.ok(calc({bateriaId:'tdr-lfp',vBanco:48}).errores.length);
  assert.ok(calc({bateriaId:'tdr-lfp',vBanco:102.4}).errores.length);
  assert.ok(calc({vNominal:24}).errores.length);
});
test('RF-34: balance AGM anual/critico, deficit, adicionales y ajuste aceptado', () => {
  const r=calc(); near(r.balance.anual.produccion,8932); near(r.balance.critico.produccion,8008);
  near(r.balance.anual.requeridaWp,2593.04871373837); near(r.balance.critico.requeridaWp,2892.24664224664);
  near(r.balance.anual.margenPct,-15.1577836412); assert.deepEqual([r.balance.anual.modulosAdicionales,r.balance.critico.modulosAdicionales],[1,2]);
  const adjusted=calc({ajuste:'critico'}); assert.equal(adjusted.modulosAgregados,4); assert.equal(adjusted.arreglo.nTotal,8); assert.ok(adjusted.balance.critico.margenPct>0); assert.ok(adjusted.equipos[1].fallos.some(x=>x.nombre.includes('Salida')));
  assert.ok(adjusted.avisos.some(x=>x.includes('Ningun equipo'))); assert.equal(h.ns*h.np,4);
});
test('RF-35: tasas C, limite de carga, descarga desconocida y recuperacion', () => {
  const r=calc(); near(r.banco.cCarga,.0572916666667); near(r.banco.cDescarga,.0263310185185); assert.equal(r.balance.anual.recuperacion,null);
  assert.ok(r.avisos.some(x=>x.includes('descarga pendiente')));
  const full=calc({ajuste:'critico'}); near(full.balance.anual.recuperacion,16844.4444444444/(17864*.8-8422.2222222222));
  const zero=calc({}, {hspAnual:(h.edWh/.9)/(.8*2200*.7)}); assert.equal(zero.balance.anual.recuperacion,null);
  near(r.tecnologias[0].nominalPorAnio,9600); near(r.tecnologias[1].nominalPorAnio,2560);
  const bad=calc({}, {np:8}); assert.ok(bad.avisos.some(x=>x.includes('carga excedida')));
  const cats=structuredClone(catalogos); cats.baterias[0].cDescarga=.01; assert.ok(calcularReto03(h,c,cats).avisos.some(x=>x.includes('descarga excedida')));
});
test('RF-36: ida y vuelta conserva todo, reconstruye resultados; v1/v2 compatibles', () => {
  const p=proyectoTdr(); const saved=crearProyecto(p); const restored=leerProyecto(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(restored,saved); assert.deepEqual(calcularReto03(h,restored.reto03,restored.catalogosReto03),calc());
  for (const version of [1,2]) { const legacy={...p,version}; delete legacy.reto03; delete legacy.catalogosReto03; assert.equal(leerProyecto(legacy).reto03.rama,'auto'); }
  assert.throws(()=>leerProyecto({...p,version:99})); assert.throws(()=>leerProyecto({...p,cargas:[{...p.cargas[0],mask:[1]}]}));
  assert.throws(()=>leerProyecto({...p,reto03:{rama:'inventada'}}));
  assert.throws(()=>leerProyecto({...p,generador:{...p.generador,pr:'0.7'}}));
});
test('RF-36: PDF ejecutivo de una pagina en ambas ramas y con errores', () => {
  for (const patch of [{},{rama:'sin'},{etaInv:0},{bateriaId:'tdr-lfp',vBanco:51.2,dod:.8,etaBat:.92}]) {
    const doc=construirInforme({proyecto:proyectoTdr().proyecto,resultados:{pInst:5810,energiaMes:227.4,costoMes:227400},h,config:{...c,...patch},resultado:calc(patch)});
    assert.equal(doc.getNumberOfPages(),1); assert.ok(doc.output('arraybuffer').byteLength>3000);
    assert.ok(doc.output().includes('Integrantes: Equipo ESFV'));
  }
});
test('Regresion Reto 02: funciones extraidas sin cambiar resultados del generador', () => {
  const r=calcularGenerador({ed:7.58,hsp:5.8,pr:.7,modulo,vMaxSistema:600,tMin:20,tOp:31.95,areaDisponible:20,catalogo:[modulo]});
  assert.equal(r.bloqueado,false); assert.deepEqual([r.nSerie,r.nParalelo,r.nTotal,r.pInstalada],[4,1,4,2200]); near(r.vocGen,200.673); near(r.iDiseno,21.875); near(r.energiaGenerador,8.932); near(r.tCelda,63.2);
});
