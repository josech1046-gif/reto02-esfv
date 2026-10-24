import { readFileSync } from 'node:fs';
import { inicialReto03 } from '../src/reto03/calculos.js';
const json = name => JSON.parse(readFileSync(new URL(`../public/${name}.json`, import.meta.url), 'utf8'));
export const catalogos = { conversion: [...json('catalogo_conversion'), ...json('catalogo_conversion_tdr')], baterias: json('catalogo_baterias') };
export const modulo = json('catalogo_modulos')[0];
export const perfil = [200,200,200,200,200,200,300,300,300,300,300,300,400,400,400,600,670,910,200,200,200,200,200,200];
export const heredados = { edWh:7580, perfil, pMax:910, horaPico:17, dentroWh:5180, fueraWh:2400, tipoApp:'Off-grid', diasMes:30, potenciaWp:2200, ns:4, np:1, modulo, tMin:20, tCelda:63.2, hspAnual:5.8, hspCritico:5.2, pr:.7, errores:[] };
export const config = { ...inicialReto03(), catalogo:'tdr', equipoCon:'ctrl-b', equipoSin:'inv-b' };
export function proyectoTdr() {
  return {
    _tipo:'Reto01-ProyectoESFV', version:3,
    proyecto:{ nombre:'Caso estandarizado Alta Guajira', fecha:'2026-10-23', integrantes:'Equipo ESFV', tipoApp:'Off-grid', diasMes:30, cu:1000 },
    criterio:{ inicio:6, fin:18 },
    cargas:perfil.map((w,h) => ({id:h+1,item:h+1,carga:`Carga ${h}:00`,cantidad:1,potenciaUnitaria:w,mask:perfil.map((_,i)=>i===h?1:0)})),
    generador:{ modoRecurso:'local',sitioId:'nazareth',lat:12.18,lon:-71.28,inclinacion:12,azimut:180,apiStatus:'idle',rawDataApi:null,criterioDimension:'anual',pr:.7,vMaxSistema:600,tMinAmbiente:20,tOperacion:31.95,areaDisponible:20,moduloSeleccionadoId:modulo.id,moduloForzado:true,catalogo:[modulo] },
    baseSolar:[{id:'nazareth',nombre:'Nazareth TdR',lat:12.18,lon:-71.28,mensual:[5.8,5.8,5.8,5.8,5.8,5.8,5.8,5.8,5.8,5.2,5.8,5.8],anualOficial:5.8,mesCriticoOficial:5.2,fuente:'Caso estandarizado TdR',fechaConsulta:'2026-10-23'}],
    reto03:config, catalogosReto03:catalogos,
  };
}
