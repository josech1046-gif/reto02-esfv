import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { casosEntrega, reconstruirProyecto, sensibilidadEntrega } from './datos-entrega.mjs';

const root = new URL('../', import.meta.url);
const leer = async ruta => JSON.parse(await readFile(new URL(ruta, root), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = await leer('entrega/reto03/manifest.json');
assert.equal(manifest.version, (await leer('package.json')).version);
assert.match(manifest.guia.sha256, /^[a-f0-9]{64}$/);
for (const [ruta, esperado] of Object.entries(manifest.fuentes)) {
  // Git puede transformar LF/CRLF al clonar en Windows. El contenido de texto se normaliza.
  const texto = (await readFile(new URL(ruta, root), 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(hash(texto), esperado, `Fuente cambio: ${ruta}. Regenere la entrega.`);
}
for (const [ruta, esperado] of Object.entries(manifest.archivos)) {
  const bytes = await readFile(new URL('entrega/reto03/' + ruta, root));
  const contenido = ruta.endsWith('.pdf') ? bytes : bytes.toString('utf8').replace(/\r\n/g, '\n');
  assert.equal(hash(contenido), esperado.sha256, `Archivo distinto del manifest: ${ruta}`);
}
for (const [id, esperado] of Object.entries(casosEntrega())) {
  const proyecto = await leer(`entrega/reto03/casos/${id}.json`);
  assert.deepEqual(proyecto, esperado, `${id}: entradas divergentes`);
  const reconstruido = reconstruirProyecto(proyecto);
  assert.deepEqual(await leer(`entrega/reto03/resultados/${id}.json`), JSON.parse(JSON.stringify(reconstruido)), `${id}: resultados divergentes`);
  const pdf = await readFile(new URL(`entrega/reto03/informes/${id}.pdf`, root));
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.equal((pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length, 1, `${id}: PDF de una pagina`);
}
assert.deepEqual(await leer('entrega/reto03/resultados/sensibilidad.json'), sensibilidadEntrega());
const agm = reconstruirProyecto(casosEntrega()['tdr-agm']);
assert.equal(agm.h.edWh, 7580); assert.equal(agm.resultado.banco.numero, 16);
assert.equal(agm.resultado.banco.wh, 38400);
assert.equal(reconstruirProyecto(casosEntrega()['tdr-lfp']).resultado.banco.numero, 5);
const propio = reconstruirProyecto(casosEntrega()['propio-cierre']);
assert.equal(propio.resultado.seleccionado.estado, 'Cumple');
assert.ok(propio.resultado.balance.critico.margenPct > 0);
assert.equal(propio.resultado.arreglo.nTotal, 4);
const papeleria = reconstruirProyecto(casosEntrega()['papeleria-final']);
assert.equal(papeleria.h.edWh, 27800); assert.equal(papeleria.h.pMax, 3150);
assert.equal(papeleria.resultado.seleccionado.estado, 'Cumple');
assert.ok(papeleria.resultado.balance.critico.margenPct < 0);
assert.equal(papeleria.h.areaDisponible, 30);
assert.ok(papeleria.h.areaGenerador <= papeleria.h.areaDisponible);
assert.match(papeleria.proyecto.notas, /30 m2 obligatorios/);
assert.equal(papeleria.resultado.arreglo.nTotal, 14);
assert.ok(papeleria.h.limitarPorArea);
assert.deepEqual(await leer('public/caso_papeleria.json'), casosEntrega()['papeleria-final']);
console.log(`Entrega verificada: ${Object.keys(casosEntrega()).length} proyectos reconstruidos e informes de una pagina, fuentes, integridad, sensibilidad y condicion de superficie de la papeleria.`);
