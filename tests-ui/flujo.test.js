import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { proyectoTdr } from '../tests/fixtures.js';

let server, browser;
const errors = [];
const baseURL = 'http://127.0.0.1:4173';
before(async () => {
  await mkdir('tmp/qa', {recursive:true});
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'], {stdio:'ignore',windowsHide:true});
  let ready=false;
  for(let i=0;i<50;i++) { try { if((await fetch(baseURL)).ok) {ready=true; break;} } catch { /* server starting */ } await new Promise(r=>setTimeout(r,200)); }
  assert.ok(ready,'Vite preview must start');
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
});
after(async () => { await browser?.close(); server?.kill(); });

const banco = page => page.locator('section').filter({has:page.getByRole('heading',{name:'Las baterías que necesitas'})});
const nav = (page, name) => page.locator('.app-nav').getByRole('button',{name}).click();
async function abrir(page, nombre) {
  const summary=page.getByText(nombre,{exact:true});
  if(await summary.locator('..').getAttribute('open') === null) await summary.click();
}
async function pageTdr(data=proyectoTdr()) {
  const page=await browser.newPage({viewport:{width:1366,height:950}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);
  await page.locator('input[type=file]').nth(1).setInputFiles({name:'caso.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await nav(page,/5.*Inversor y baterías/);
  await expect(banco(page).locator('.r3-metrics').first().getByText('38.40 kWh',{exact:true})).toBeVisible();
  return page;
}

test('Inicio comprensible: proyecto vacio, ejemplo en un clic y ayuda separada', async () => {
  const page=await browser.newPage({viewport:{width:1366,height:950}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);
  await expect(page.getByRole('heading',{name:'Empieza con lo que necesitas alimentar'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Descargar informe',exact:true})).toBeDisabled();
  assert.doesNotMatch(await page.locator('body').innerText(),/RF-\d|React|Vmp|Voc|DoD/);
  await page.screenshot({path:'tmp/qa/inicio-reto03.png',fullPage:true});
  await page.getByRole('button',{name:'Probar con un ejemplo',exact:true}).click();
  await expect(banco(page).getByText('16 baterías',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Comprueba si la energía alcanza'})).toBeVisible();
  assert.equal(await page.locator('.r3-advanced').getAttribute('open'),null);
  assert.equal(await page.locator('.r3-tools').getAttribute('open'),null);
  assert.doesNotMatch(await page.locator('body').innerText(),/RF-\d|React|1,25|betaVoc/);
  const help=await page.request.get(baseURL+'/guia-tecnica.html');
  assert.equal(help.status(),200); assert.match(await help.text(),/Voc_frío/);
  await page.close();
});

test('Caso TdR: ramas, LFP, comprobaciones accesibles y ampliacion reversible', async () => {
  const page=await pageTdr();
  const ctrl=page.locator('.r3-equipo').filter({hasText:'CTRL-B'});
  await ctrl.getByText('Ver comprobaciones y ficha',{exact:true}).click();
  assert.match(await ctrl.innerText(),/200.67/);
  await ctrl.getByText('Ver comprobaciones y ficha',{exact:true}).click();
  await page.screenshot({path:'tmp/qa/reto03-desktop.png',fullPage:true});
  await page.getByLabel('¿Usarás baterías?',{exact:true}).selectOption('sin');
  assert.equal(await banco(page).count(),0);
  await expect(page.getByText(/En horas de mucho sol, el inversor puede limitar/)).toBeVisible();
  const inv=page.locator('.r3-equipo').filter({hasText:'INV-B'});
  await inv.getByText('Ver comprobaciones y ficha',{exact:true}).click();
  assert.match(await inv.innerText(),/1.10/);
  await page.getByLabel('¿Usarás baterías?',{exact:true}).selectOption('con');
  await page.getByLabel('Tipo de batería',{exact:true}).selectOption('tdr-lfp');
  await expect(banco(page).locator('.r3-metrics').first().getByText('25.60 kWh',{exact:true})).toBeVisible();
  await abrir(page,'Ajustes avanzados del sistema');
  await expect(page.getByLabel('Voltaje del banco de baterías (V)')).toHaveValue('51.2');
  await expect(page.getByLabel('Voltaje nominal del cargador (V)')).toHaveValue('48');
  await page.getByLabel('Tipo de batería',{exact:true}).selectOption('tdr-agm');
  await page.locator('.r3-balance-card').filter({hasText:'Un día del mes con menos sol'}).getByRole('button',{name:'Añadir 4 paneles para este escenario'}).click();
  await expect(page.locator('.r3-adjustment')).toContainText('Ahora tienes 8 paneles');
  await expect(page.getByText(/Ningún equipo del catálogo admite/)).toBeVisible();
  await page.getByRole('button',{name:'Deshacer ampliación'}).click();
  assert.equal(await page.locator('.r3-adjustment').count(),0);
  await nav(page,/4.*Paneles solares/);
  assert.match(await page.locator('body').innerText(),/2.20 kWp/);
  await nav(page,/1.*Proyecto/);
  await page.getByLabel('Tipo de aplicacion').selectOption('On-grid');
  await nav(page,/5.*Inversor y baterías/);
  await page.getByLabel('¿Usarás baterías?',{exact:true}).selectOption('auto');
  assert.equal(await banco(page).count(),0);
  await page.close();
});

test('Guardar/abrir conserva los datos y el informe PDF se descarga', async () => {
  const page=await pageTdr();
  await page.getByLabel('Días de respaldo',{exact:true}).fill('3');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Guardar proyecto',exact:true}).click();
  const download=await downloadPromise;
  const saved=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(saved.version,3); assert.equal(saved.reto03.autonomia,3); assert.ok(saved.baseSolar); assert.deepEqual(saved.catalogosReto03,proyectoTdr().catalogosReto03);
  const expected=await banco(page).locator('.r3-metrics').first().innerText();
  await page.getByLabel('Días de respaldo',{exact:true}).fill('1');
  await page.locator('input[type=file]').nth(1).setInputFiles({name:'guardado.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  await expect(page.getByLabel('Días de respaldo',{exact:true})).toHaveValue('3');
  assert.equal(await banco(page).locator('.r3-metrics').first().innerText(),expected);
  const pdfPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Descargar informe',exact:true}).click();
  await (await pdfPromise).saveAs('tmp/qa/informe-navegador.pdf');
  assert.equal((await readFile('tmp/qa/informe-navegador.pdf')).subarray(0,4).toString(),'%PDF');
  await page.close();
});

test('Edicion avanzada conserva validacion, datos pendientes y catalogos separados', async () => {
  const page=await pageTdr();
  await expect(page.getByText(/Falta en la ficha el límite de corriente/)).toBeVisible();
  await abrir(page,'Catálogos y documentación técnica');
  await page.getByRole('button',{name:'Editar catálogos',exact:true}).click();
  await page.getByLabel('Catálogos JSON',{exact:true}).fill('{"conversion":[]}');
  await page.getByRole('button',{name:'Validar y guardar catálogo'}).click();
  assert.match(await page.getByRole('alert').innerText(),/dos baterias/);
  await page.getByRole('button',{name:'Cancelar edición'}).click();
  await abrir(page,'Ajustes avanzados del sistema');
  await page.getByLabel('Porcentaje utilizable de la batería (%)',{exact:true}).fill('0');
  await expect(page.getByRole('heading',{name:'Revisa estos datos para continuar'})).toBeVisible();
  assert.equal(await banco(page).count(),0);
  await page.getByLabel('Porcentaje utilizable de la batería (%)',{exact:true}).fill('50');
  await page.getByLabel('Catálogo de equipos',{exact:true}).selectOption('comercial');
  await expect(page.locator('.r3-equipment-grid')).toContainText('Victron Energy');
  assert.doesNotMatch(await page.locator('.r3-equipment-grid').innerText(),/CTRL-A|CTRL-B|CTRL-C/);
  await page.close();
});

test('Catalogo ampliado: actualiza proyectos anteriores, filtra inversores y conserva fichas y seleccion', async () => {
  const anterior=structuredClone(proyectoTdr());
  anterior.catalogosReto03.conversion=anterior.catalogosReto03.conversion.filter(e=>e.tipoFuente!=='ficha');
  const page=await pageTdr(anterior);
  await page.getByLabel('Catálogo de equipos',{exact:true}).selectOption('comercial');
  await expect(page.locator('.r3-equipo')).toHaveCount(4);
  await page.route('**/catalogo_conversion.json',route=>route.fulfill({status:503,body:'No disponible'}));
  await page.getByRole('button',{name:'Actualizar equipos comerciales',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo actualizar el catálogo');
  await expect(page.locator('.r3-equipo')).toHaveCount(4);
  await page.unroute('**/catalogo_conversion.json');
  await page.getByRole('button',{name:'Actualizar equipos comerciales',exact:true}).click();
  await expect(page.locator('.reto03').getByRole('status')).toContainText('Equipos comerciales actualizados');
  await expect(page.locator('.r3-equipo')).toHaveCount(8);
  await page.getByLabel('Mostrar equipos',{exact:true}).selectOption('inversor');
  await expect(page.locator('.r3-equipo')).toHaveCount(5);
  assert.doesNotMatch(await page.locator('.r3-equipment-grid').innerText(),/Victron|CTRL-/);
  for(const marca of ['GoodWe','Growatt','Solis','Deye']) await expect(page.locator('.r3-equipment-grid')).toContainText(marca);
  const goodwe=page.locator('.r3-equipo').filter({has:page.getByRole('heading',{name:/GW5000-ES-20/})});
  await expect(goodwe.getByRole('link')).toBeVisible();
  assert.match(await goodwe.getByRole('link').getAttribute('href'),/^https:\/\/latam.goodwe.com\/.*\.pdf$/);
  await goodwe.getByRole('button',{name:'Elegir este equipo',exact:true}).click();
  await page.locator('.r3-equipment-grid').screenshot({path:'tmp/qa/catalogo-inversores.png'});
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Guardar proyecto',exact:true}).click();
  const saved=JSON.parse(await readFile(await (await downloadPromise).path(),'utf8'));
  assert.equal(saved.reto03.equipoCon,'goodwe-es5k');
  assert.deepEqual(saved.catalogosReto03.baterias,proyectoTdr().catalogosReto03.baterias);
  const ordenar=lista=>lista.toSorted((a,b)=>a.id.localeCompare(b.id));
  assert.deepEqual(ordenar(saved.catalogosReto03.conversion),ordenar(proyectoTdr().catalogosReto03.conversion));
  await page.locator('input[type=file]').nth(1).setInputFiles({name:'inversores.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  await expect(goodwe.getByRole('button',{name:'Equipo seleccionado',exact:true})).toBeVisible();
  await page.getByLabel('¿Usarás baterías?',{exact:true}).selectOption('sin');
  await expect(page.locator('.r3-equipo')).toHaveCount(7);
  await expect(page.locator('.r3-equipment-grid')).toContainText('Sungrow');
  await expect(page.locator('.r3-equipment-grid')).toContainText('GW2000-XS-30');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.getByLabel('Catálogo de equipos',{exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'tmp/qa/catalogo-movil.png'});
  await page.getByLabel('Catálogo de equipos',{exact:true}).selectOption('tdr');
  await expect(page.locator('.r3-equipo')).toHaveCount(3);
  await page.close();
});

test('Los proyectos de entrega reconstruyen en la aplicacion sus informes y resultados', async () => {
  const page=await browser.newPage({viewport:{width:1366,height:950}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);
  const manifest=JSON.parse(await readFile('entrega/reto03/manifest.json','utf8'));
  const ids=Object.keys(manifest.archivos).filter(p=>p.startsWith('casos/')).map(p=>p.slice(6,-5));
  for(const id of ids) {
    const datos=await readFile(`entrega/reto03/casos/${id}.json`);
    const esperado=JSON.parse(await readFile(`entrega/reto03/resultados/${id}.json`,'utf8'));
    await page.locator('input[type=file]').nth(1).setInputFiles({name:`${id}.json`,mimeType:'application/json',buffer:datos});
    await nav(page,/5.*Inversor y baterías/);
    const resumen=page.getByLabel('Resumen de tu sistema',{exact:true});
    await expect(resumen).toContainText(`${(esperado.h.edWh/1000).toFixed(3)} kWh/día`);
    await expect(resumen).toContainText(`${esperado.h.ns*esperado.h.np} paneles`);
    await expect(page.getByRole('button',{name:'Equipo seleccionado',exact:true})).toBeVisible();
    if(esperado.resultado.banco) {
      await expect(banco(page).locator('.r3-metrics').first()).toContainText(`${esperado.resultado.banco.numero} baterías`);
      await expect(banco(page).locator('.r3-metrics').first()).toContainText(`${(esperado.resultado.banco.wh/1000).toFixed(2)} kWh`);
    } else assert.equal(await banco(page).count(),0);
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Descargar informe',exact:true}).click();
    const pdf=await readFile(await (await downloadPromise).path());
    assert.equal((pdf.toString('latin1').match(/\/Type \/Page\b/g)??[]).length,1);
    assert.ok(pdf.toString('latin1').includes(esperado.resultado.seleccionado.equipo.modelo.split(' (')[0]));
  }
  await page.close();
});

test('Caso final de papeleria: conserva 30 m2, muestra deficit y bloquea ampliaciones que no caben', async () => {
  const page=await browser.newPage({viewport:{width:1366,height:950}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);
  await page.getByRole('button',{name:'Abrir caso final: papelería',exact:true}).click();
  await expect(page.getByText('27.800 kWh/día',{exact:true})).toBeVisible();
  await expect(page.locator('.app-design-note')).toContainText('30 m2 obligatorios');
  await expect(page.locator('.r3-equipo.selected')).toContainText('GW6000-MS-30');
  await expect(page.locator('.r3-equipo.selected').getByText('Compatible',{exact:true})).toBeVisible();
  assert.equal(await banco(page).count(),0);
  await nav(page,/4.*Paneles solares/);
  const ficha=page.getByRole('link',{name:/Hoja de datos oficial del panel/});
  await expect(ficha).toBeVisible(); assert.match(await ficha.getAttribute('href'),/static.longi.com/);
  await abrir(page,'Opciones avanzadas y catálogo de paneles');
  await expect(page.getByRole('checkbox',{name:'Respetar el área como límite obligatorio'})).toBeChecked();
  await nav(page,/5.*Inversor y baterías/);
  const pendiente=page.waitForEvent('download');
  await page.getByRole('button',{name:'Guardar proyecto',exact:true}).click();
  const guardado=JSON.parse(await readFile(await (await pendiente).path(),'utf8'));
  assert.equal(guardado.generador.areaDisponible,30); assert.match(guardado.proyecto.notas,/30 m2 obligatorios/);
  const ampliaciones=page.getByRole('button',{name:'La ampliación no cabe en 30 m²',exact:true});
  await expect(ampliaciones).toHaveCount(2);
  await expect(ampliaciones.nth(0)).toBeDisabled(); await expect(ampliaciones.nth(1)).toBeDisabled();
  await page.getByRole('heading',{name:'Tu punto de partida',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'tmp/qa/papeleria-escritorio.png'});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.screenshot({path:'tmp/qa/papeleria-movil.png'});
  await page.close();
});

test('Editar aparatos y rendimiento actualiza consumo, paneles y Reto 03', async () => {
  const page=await pageTdr();
  await nav(page,/2.*Aparatos/);
  await page.getByLabel('Nombre del aparato').fill('Carga adicional');
  await page.getByLabel('Potencia [W]',{exact:true}).fill('100');
  await page.getByLabel('Horario de uso').fill('17-18');
  await page.getByRole('button',{name:'Agregar carga',exact:true}).click();
  await nav(page,/5.*Inversor y baterías/);
  await expect(page.getByText('7.680 kWh/día',{exact:true})).toBeVisible();
  await expect(page.locator('.r3-overview').locator('.r3-metrics').first().getByText('1010 W',{exact:true})).toBeVisible();
  await abrir(page,'Ver datos del consumo y los paneles');
  assert.match(await page.locator('.r3-overview').innerText(),/5.280 kWh.*2.400 kWh/);
  await nav(page,/4.*Paneles solares/);
  await abrir(page,'Opciones avanzadas y catálogo de paneles');
  await page.getByLabel('Rendimiento esperado de los paneles (PR)').fill('0.6');
  await nav(page,/5.*Inversor y baterías/);
  await abrir(page,'Ver datos del consumo y los paneles');
  assert.match(await page.locator('.r3-overview').innerText(),/PR.*0.6/);
  assert.match(await page.locator('.r3-balance-grid').innerText(),/3.065/);
  await page.close();
});

test('Proyecto anterior y los cinco pasos funcionan en movil sin desborde', async () => {
  const data=proyectoTdr(); data.version=2; delete data.reto03; delete data.catalogosReto03;
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);
  await page.locator('input[type=file]').nth(1).setInputFiles({name:'v2.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  for(const name of [/1.*Proyecto/,/2.*Aparatos/,/3.*Consumo/,/4.*Paneles solares/,/5.*Inversor y baterías/]) {
    await nav(page,name);
    if(String(name).includes('Consumo')) { assert.match(await page.locator('body').innerText(),/7.58/); assert.match(await page.locator('body').innerText(),/0.91/); }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),String(name));
  }
  await expect(banco(page).locator('.r3-metrics').first().getByText('38.40 kWh',{exact:true})).toBeVisible();
  await page.screenshot({path:'tmp/qa/reto03-mobile.png',fullPage:true});
  await page.screenshot({path:'tmp/qa/reto03-mobile-viewport.png'});
  await page.close();
  assert.deepEqual(errors,[]);
});

test('Recorrido desde cero: horarios habituales y botones para continuar', async () => {
  const page=await browser.newPage({viewport:{width:1366,height:950}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);
  await page.getByRole('button',{name:'Agregar mis aparatos'}).click();
  await page.getByLabel('Nombre del aparato').fill('Luz LED');
  await page.getByLabel('Potencia [W]',{exact:true}).fill('10');
  await page.getByRole('button',{name:'Solo de noche',exact:true}).click();
  await expect(page.getByLabel('Horario de uso')).toHaveValue('18-06');
  await page.getByRole('button',{name:'Agregar carga',exact:true}).click();
  await page.getByRole('button',{name:'Ver mi consumo'}).click();
  assert.match(await page.locator('main').innerText(),/0.12/);
  await page.getByRole('button',{name:'Elegir paneles solares',exact:true}).click();
  await page.getByRole('button',{name:'Continuar con inversor y baterías'}).click();
  await expect(page.getByRole('heading',{name:'Elige cómo funcionará tu sistema'})).toBeVisible();
  await expect(page.getByText('0.120 kWh/día',{exact:true})).toBeVisible();
  await page.close();
  assert.deepEqual(errors,[]);
});
