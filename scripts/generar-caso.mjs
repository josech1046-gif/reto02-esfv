import { mkdir, writeFile } from 'node:fs/promises';
import { proyectoTdr } from '../tests/fixtures.js';
await mkdir('tmp', { recursive: true });
await writeFile('tmp/caso-tdr-reto03.json', JSON.stringify(proyectoTdr(), null, 2));
console.log('Caso generado: tmp/caso-tdr-reto03.json. Abralo con Cargar proyecto.');
