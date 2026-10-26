import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { construirInforme } from '../src/reto03/informe.js';
import { casosEntrega, reconstruirProyecto, sensibilidadEntrega, fechaEntrega } from './datos-entrega.mjs';

const root = new URL('../', import.meta.url);
const destino = 'entrega/reto03/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = valor => JSON.stringify(valor, null, 2) + '\n';
const archivos = {};
async function guardar(ruta, datos) {
  const url = new URL(destino + ruta, root);
  await mkdir(new URL('./', url), { recursive: true });
  await writeFile(url, datos);
  archivos[ruta] = { sha256: hash(datos), bytes: Buffer.byteLength(datos) };
}
const casos = casosEntrega();
for (const [id, proyecto] of Object.entries(casos)) {
  const reconstruido = reconstruirProyecto(proyecto);
  await guardar(`casos/${id}.json`, json(proyecto));
  await guardar(`resultados/${id}.json`, json(reconstruido));
  const pdf = construirInforme(reconstruido);
  pdf.setCreationDate(`D:${fechaEntrega.replaceAll('-', '')}000000+00'00'`);
  pdf.setFileId(hash(json(proyecto)).slice(0, 32).toUpperCase());
  if (pdf.getNumberOfPages() !== 1) throw new Error(`${id}: el informe debe ocupar una pagina.`);
  await guardar(`informes/${id}.pdf`, Buffer.from(pdf.output('arraybuffer')));
}
await writeFile(new URL('public/caso_papeleria.json', root), json(casos['papeleria-final']));
const sensibilidad = sensibilidadEntrega();
await guardar('resultados/sensibilidad.json', json(sensibilidad));
const columnas = Object.keys(sensibilidad[0]);
const csv = [columnas.join(','), ...sensibilidad.map(f => columnas.map(k => f[k] == null ? '' : f[k]).join(','))].join('\n') + '\n';
await guardar('resultados/sensibilidad.csv', csv);
const rutasFuentes = ['package.json', 'scripts/datos-entrega.mjs', 'scripts/generar-entrega.mjs',
  'src/App.jsx', 'src/reto02/generador.js', 'src/reto02/recurso.js', 'src/reto03/calculos.js', 'src/reto03/informe.js', 'src/reto03/proyecto.js',
  'public/ejemplo_reto03.json', 'public/caso_papeleria.json', 'public/catalogo_modulos.json', 'public/catalogo_conversion.json', 'public/catalogo_conversion_tdr.json', 'public/catalogo_baterias.json',
  'entrega/reto03/entrada/papeleria-original.json'];
const fuentes = {};
for (const ruta of rutasFuentes) fuentes[ruta] = hash((await readFile(new URL(ruta, root), 'utf8')).replace(/\r\n/g, '\n'));
const paquete = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
await writeFile(new URL(destino + 'manifest.json', root), json({
  version: paquete.version, fecha: fechaEntrega, guia: { nombre: 'TdR_Reto03_ESFV_2026II.pdf', paginas: 3,
    sha256: '5c1a63377edc2c8cda7b22197dea43f75903efbb808473a6ab61529231f5d5e4' },
  generacion: 'pnpm entrega:generar', verificacion: 'pnpm entrega:verificar', fuentes, archivos,
}));
console.log(`Entrega ${paquete.version}: ${Object.keys(casos).length} casos JSON e informes de una pagina, resultados y sensibilidad en ${fileURLToPath(new URL(destino, root))}`);
