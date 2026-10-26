import { useState } from 'react';
import { BatteryCharging, PlugZap, ArrowRight, Settings2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formato as f } from './calculos.js';
import { incorporarComerciales } from './catalogos.js';
import { avisoAmigable, criterioAmigable, errorAmigable, estadoEquipo } from './textos.js';
import './reto03.css';

function Campo({ label, value, onChange, min, max, step = 'any', ayuda }) {
  return <label className="r3-field"><span>{label}</span>
    <input aria-label={label} type="number" value={value ?? ''} min={min} max={max} step={step}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
    {ayuda && <small>{ayuda}</small>}
  </label>;
}
function Metrica({ label, value, ayuda }) {
  return <div className="r3-metric"><span>{label}</span><strong>{value}</strong>{ayuda && <small>{ayuda}</small>}</div>;
}
function Fuente({ equipo }) {
  return /^https:\/\//.test(equipo.fuente)
    ? <a className="r3-source-link" href={equipo.fuente} target="_blank" rel="noreferrer" aria-label={`Documento oficial de ${equipo.fabricante} ${equipo.modelo}`}>{equipo.tipoFuente === 'ficha' ? 'Hoja de datos (PDF)' : 'Documento del fabricante'}</a>
    : <small>{equipo.fuente}</small>;
}
const porcentaje = v => typeof v === 'number' ? v * 100 : '';
const fraccion = v => v === '' ? '' : v / 100;
const resultadoCriterio = cumple => cumple === true ? 'Cumple' : cumple === false ? 'No cumple' : 'Dato pendiente';

function Equipo({ evaluacion: e, seleccionado, onElegir, onReorganizar }) {
  return <article className={`r3-equipo ${seleccionado ? 'selected' : ''}`}>
    <div className="r3-equipo-head"><span>{e.equipo.fabricante}</span>
      <span className={`r3-badge ${e.fallos.length ? 'bad' : e.pendientes.length ? 'warn' : 'ok'}`}>{estadoEquipo(e)}</span>
    </div>
    <h4>{e.equipo.modelo.replace(/\s+\([^)]*\)$/, '')}</h4>
    <p className="r3-equipo-kind">{e.equipo.origen === 'tdr' ? 'Referencia académica' : e.equipo.tipo === 'regulador' ? 'Regulador de carga' : e.equipo.rama === 'con' ? 'Inversor con baterías' : 'Inversor de red'} · {e.equipo.pac ? `${f(e.equipo.pac / 1000)} kW de salida` : `${e.equipo.outMax} A`}</p>
    {e.equipo.origen === 'comercial' && <Fuente equipo={e.equipo} />}
    <button className={seleccionado ? 'r3-selection' : 'r3-primary'} onClick={onElegir} aria-pressed={seleccionado}>
      {seleccionado ? <><CheckCircle2 size={15} /> Equipo seleccionado</> : 'Elegir este equipo'}
    </button>
    {e.fallos.length > 0 && <ul className="r3-device-issues">{e.fallos.slice(0, 2).map(k => <li key={k.nombre}>{criterioAmigable(k.nombre)}</li>)}</ul>}
    {e.fallos.length > 2 && <small>Hay {e.fallos.length - 2} comprobaciones adicionales que no cumplen. Consulta el detalle.</small>}
    {e.pendientes.length > 0 && <p className="r3-note">La ficha no incluye todos los límites de entrada. Consulta el detalle antes de usar este equipo.</p>}
    {e.alternativas.length > 0 && <div className="r3-actions">{e.alternativas.map(a =>
      <button key={a.ns} onClick={() => onReorganizar(a.ns)}>Reorganizar: {a.ns} paneles por grupo × {a.np} grupos</button>
    )}</div>}
    <details className="r3-details"><summary>Ver comprobaciones y ficha</summary>
      <p>Modelo y revisión: {e.equipo.modelo}.</p>
      {e.equipo.revision && <p>Ficha: {e.equipo.revision}. Consulta: {e.equipo.fechaConsulta}.</p>}
      <p>Máximo de paneles en serie: <b>{e.nsMax}</b>. Grupos por entrada MPPT: [{e.distribucion.join(', ')}].{e.ratio != null && <> Relación paneles/inversor (DC/AC): <b>{f(e.ratio)}</b>.</>}</p>
      <div className="r3-scroll"><table><thead><tr><th>Comprobación</th><th>Valor calculado</th><th>Límite</th><th>Resultado</th></tr></thead>
        <tbody>{e.criterios.map(k => <tr key={k.nombre}><td>{k.nombre}{k.nota && <small>{k.nota}</small>}</td>
          <td>{f(k.valor)} {k.unidad}</td><td>{typeof k.limite === 'string' ? k.limite : f(k.limite)} {k.unidad}</td>
          <td className={k.cumple === false ? 'r3-fail' : ''}>{resultadoCriterio(k.cumple)}</td></tr>)}</tbody>
      </table></div>
      {e.avisos.map((v, i) => <p className="r3-note" key={i}>{v}</p>)}{e.equipo.origen !== 'comercial' && <Fuente equipo={e.equipo} />}
    </details>
  </article>;
}

export default function Reto03Tab({ heredados: h, config: c, setConfig, catalogos, setCatalogos, resultado: r, errorCatalogo, onIr, onEjemplo, onCasoFinal }) {
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState('todos');
  const [actualizando, setActualizando] = useState(false);
  const [mensajeCatalogo, setMensajeCatalogo] = useState('');
  const [errorActualizacion, setErrorActualizacion] = useState('');
  const patch = p => setConfig(v => ({ ...v, ...p }));
  const conBaterias = r.rama === 'con';
  const equipoKey = conBaterias ? 'equipoCon' : 'equipoSin';
  const cambiarCatalogo = origen => {
    const primero = rama => catalogos.conversion.find(x => x.origen === origen && x.rama === rama && x.tipo !== 'regulador') ?? catalogos.conversion.find(x => x.origen === origen && x.rama === rama);
    patch({ catalogo: origen, equipoCon: primero('con')?.id, equipoSin: primero('sin')?.id });
    setTipoEquipo('todos');
  };
  const actualizarComerciales = async () => {
    setActualizando(true); setMensajeCatalogo(''); setErrorActualizacion('');
    try {
      const respuesta = await fetch('./catalogo_conversion.json', { cache: 'no-store' });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const nuevos = await respuesta.json();
      setCatalogos(incorporarComerciales(catalogos, nuevos));
      setMensajeCatalogo('Equipos comerciales actualizados. Puedes elegirlos en el catálogo.');
    } catch (e) { setErrorActualizacion(`No se pudo actualizar el catálogo: ${e.message}`); }
    finally { setActualizando(false); }
  };
  const equiposVisibles = r.equipos?.filter(e => !conBaterias || c.catalogo !== 'comercial' || tipoEquipo === 'todos' || (tipoEquipo === 'regulador' ? e.equipo.tipo === 'regulador' : e.equipo.tipo !== 'regulador'))
    .toSorted((a, b) => Number(a.equipo.tipo === 'regulador') - Number(b.equipo.tipo === 'regulador')) ?? [];
  const cambiarBateria = id => {
    const b = catalogos.baterias.find(x => x.id === id);
    patch({ bateriaId: id, vBanco: b.maxSerie === 1 ? b.voltaje : Math.max(1, Math.round(c.vBanco / b.voltaje)) * b.voltaje, dod: b.dod, etaBat: b.eficiencia });
  };
  const avisos = [...new Set((r.avisos ?? []).map(avisoAmigable))];
  if (!conBaterias && r.seleccionado?.ratio > 1) avisos.push('En horas de mucho sol, el inversor puede limitar parte de la producción de los paneles.');
  if (!conBaterias && r.seleccionado?.ratio < c.dcAcMin) avisos.push('El inversor es grande para la potencia de paneles y el rango que elegiste. Revisa otras opciones.');
  const critico = r.balance?.critico;
  const agregar = periodo => {
    const necesarios = Math.max(h.ns * h.np, Math.ceil(periodo.requeridaWp / h.modulo.potencia - 1e-10));
    return Math.max(0, Math.ceil(necesarios / h.ns) * h.ns - r.arreglo.nTotal);
  };

  if (h.edWh <= 0) return <div className="reto03">
    <header className="r3-heading"><div><span className="r3-eyebrow">RETO 03</span><h2>Diseña tu sistema solar</h2><p>De tus aparatos al inversor y las baterías, paso a paso.</p></div></header>
    <section className="r3-welcome"><div className="r3-welcome-icon"><BatteryCharging size={36} /></div>
      <h3>Empieza con lo que necesitas alimentar</h3><p>Agrega tus aparatos y las horas en que los usas. Después podrás elegir paneles, inversor y baterías.</p>
      <div className="r3-actions"><button className="r3-primary" onClick={() => onIr('cargas')}>Agregar mis aparatos <ArrowRight size={16} /></button><button onClick={onCasoFinal}>Abrir caso final: papelería</button><button onClick={onEjemplo}>Probar con un ejemplo</button></div>
      <small>Si ya tienes un proyecto guardado, usa «Abrir proyecto» en la parte superior.</small>
    </section>
  </div>;

  return <div className="reto03">
    <header className="r3-heading"><div><span className="r3-eyebrow">RETO 03</span><h2>Inversor y baterías</h2>
      <p>Elige cómo usar la energía solar y comprueba si tu sistema alcanza.</p></div>
      <div className="r3-actions"><button onClick={onCasoFinal}>Abrir caso final: papelería</button><button onClick={onEjemplo}>Probar con un ejemplo</button></div>
    </header>

    <section className="r3-overview" aria-label="Resumen de tu sistema">
      <div className="r3-section-heading"><div><h3>Tu punto de partida</h3><p>Estos datos vienen de tus aparatos y paneles solares.</p></div>
        <div className="r3-actions"><button onClick={() => onIr('cargas')}>Revisar aparatos <ArrowRight size={14} /></button><button onClick={() => onIr('generador')}>Revisar paneles <ArrowRight size={14} /></button></div>
      </div>
      <div className="r3-metrics">
        <Metrica label="Consumo diario" value={`${f(h.edWh / 1000, 3)} kWh/día`} />
        <Metrica label="Mayor consumo al mismo tiempo" value={`${f(h.pMax, 0)} W`} ayuda={`A las ${String(h.horaPico).padStart(2, '0')}:00`} />
        <Metrica label="Paneles solares" value={`${h.ns * h.np || '—'} paneles`} ayuda={`${f(h.potenciaWp / 1000)} kWp en total`} />
      </div>
      <details className="r3-details"><summary>Ver datos del consumo y los paneles</summary>
        <p>{h.tipoApp} · {h.diasMes} días de uso al mes. Consumo entre 06 y 18 h: {f(h.dentroWh / 1000, 3)} kWh. Fuera de ese horario: {f(h.fueraWh / 1000, 3)} kWh.</p>
        <p>{h.modulo.fabricante} {h.modulo.modelo} · {h.modulo.potencia} Wp · Voc {h.modulo.voc} V · Vmp {h.modulo.vmp} V · Isc {h.modulo.isc} A · Imp {h.modulo.imp} A.</p>
        <p>βVoc {h.modulo.beta} %/°C · αIsc {h.modulo.alpha} %/°C · γP {h.modulo.gamma} %/°C · Tmin {h.tMin} °C · Tcelda {f(h.tCelda)} °C.</p>
        <p>HSP promedio anual / mes de menor sol: {f(h.hspAnual)} / {f(h.hspCritico)}. Rendimiento del generador (PR): {h.pr}. Conexión: {h.ns} en serie × {h.np} en paralelo.</p>
        <div className="r3-profile">{h.perfil.map((p, i) => <span key={i}>{String(i).padStart(2, '0')} h<strong>{f(p, 0)} W</strong></span>)}</div>
      </details>
    </section>

    {errorCatalogo && <p role="alert" className="r3-error">{errorCatalogo}</p>}

    <section><div className="r3-step-title"><span>1</span><div><h3>Elige cómo funcionará tu sistema</h3><p>Con baterías puedes guardar energía para usarla después.</p></div></div>
      <div className="r3-fields">
        <label className="r3-field"><span>¿Usarás baterías?</span><select aria-label="¿Usarás baterías?" value={c.rama} onChange={e => patch({ rama: e.target.value, ns: null, ajuste: null })}>
          <option value="auto">Según mi proyecto: {conBaterias ? 'con baterías' : 'sin baterías'}</option>
          <option value="con">Sí, quiero almacenar energía</option><option value="sin">No, usaré conexión a la red</option>
        </select></label>
        {conBaterias && <>
          <Campo label="Días de respaldo" value={c.autonomia} min={0.01} onChange={v => patch({ autonomia: v })} ayuda="Cuántos días necesitas funcionar sin sol." />
          <label className="r3-field"><span>Tipo de batería</span><select aria-label="Tipo de batería" value={c.bateriaId} onChange={e => cambiarBateria(e.target.value)}>
            {catalogos.baterias.map(b => <option key={b.id} value={b.id}>{b.tecnologia === 'AGM' ? 'Plomo sellado (AGM)' : b.tecnologia === 'LFP' ? 'Litio (LFP)' : `${b.tecnologia} · ${b.modelo}`}</option>)}
          </select><small>{catalogos.baterias.find(b => b.id === c.bateriaId)?.origen === 'tdr' ? 'Referencia académica; no es un producto comercial.' : 'Consulta la ficha antes de instalar.'}</small></label>
        </>}
      </div>
      <details className="r3-details r3-advanced"><summary><Settings2 size={15} /> Ajustes avanzados del sistema</summary>
        <div className="r3-fields">
          <Campo label="Eficiencia del inversor (%)" value={porcentaje(c.etaInv)} min={0.01} max={100} onChange={v => patch({ etaInv: fraccion(v) })} />
          <Campo label="Relación paneles/inversor mínima (DC/AC)" value={c.dcAcMin} min={0.01} onChange={v => patch({ dcAcMin: v })} />
          <Campo label="Relación paneles/inversor máxima (DC/AC)" value={c.dcAcMax} min={c.dcAcMin} onChange={v => patch({ dcAcMax: v })} />
          {conBaterias && <>
            <Campo label="Voltaje del banco de baterías (V)" value={c.vBanco} min={1} onChange={v => patch({ vBanco: v })} />
            <Campo label="Voltaje nominal del cargador (V)" value={c.vNominal} min={1} onChange={v => patch({ vNominal: v })} />
            <Campo label="Porcentaje utilizable de la batería (%)" value={porcentaje(c.dod)} min={0.01} max={100} onChange={v => patch({ dod: fraccion(v) })} ayuda="También llamado profundidad de descarga o DoD." />
            <Campo label="Factor de capacidad por temperatura" value={c.factorTemp} min={0.01} max={1} onChange={v => patch({ factorTemp: v })} />
            <Campo label="Eficiencia de la batería (%)" value={porcentaje(c.etaBat)} min={0.01} max={100} onChange={v => patch({ etaBat: fraccion(v) })} />
          </>}
        </div>
      </details>
    </section>

    {r.errores.length ? <section role="alert" className="r3-error"><h3>Revisa estos datos para continuar</h3><ul>{r.errores.map((e, i) => <li key={i}>{errorAmigable(e)}</li>)}</ul>
      <div className="r3-actions"><button onClick={() => patch({ ns: null, ajuste: null })}>Restablecer conexión de paneles</button><button onClick={() => onIr('generador')}>Revisar paneles solares</button></div>
    </section> : <>
      <section><div className="r3-step-title"><span>2</span><div><h3>Elige el equipo</h3><p>Compara las opciones y selecciona la que vas a revisar.</p></div></div>
        <div className="r3-fields">
          <label className="r3-field"><span>Equipos que quieres comparar</span><select aria-label="Catálogo de equipos" value={c.catalogo} onChange={e => cambiarCatalogo(e.target.value)}>
            <option value="comercial">Equipos comerciales</option><option value="tdr">Referencias del caso de prueba</option>
          </select></label>
          {conBaterias && c.catalogo === 'comercial' && <label className="r3-field"><span>Mostrar equipos</span><select aria-label="Mostrar equipos" value={tipoEquipo} onChange={e => setTipoEquipo(e.target.value)}>
            <option value="todos">Inversores y reguladores</option><option value="inversor">Solo inversores con baterías</option><option value="regulador">Solo reguladores de carga</option>
          </select></label>}
        </div>
        <div className="r3-actions"><button onClick={actualizarComerciales} disabled={actualizando}>{actualizando ? 'Actualizando equipos…' : 'Actualizar equipos comerciales'}</button>
          <small>{r.equipos.filter(e => e.equipo.tipo !== 'regulador').length} inversores{conBaterias ? ` y ${r.equipos.filter(e => e.equipo.tipo === 'regulador').length} reguladores` : ''} en este catálogo</small>
        </div>
        {mensajeCatalogo && <p role="status">{mensajeCatalogo}</p>}
        {errorActualizacion && <p role="alert" className="r3-error">{errorActualizacion}</p>}
        <div className="r3-equipment-grid">{equiposVisibles.map(e => <Equipo key={e.equipo.id} evaluacion={e} seleccionado={e.equipo.id === r.seleccionado?.equipo.id}
          onElegir={() => patch({ [equipoKey]: e.equipo.id })} onReorganizar={ns => patch({ ns, [equipoKey]: e.equipo.id })} />)}</div>
        {r.seleccionado?.equipo.tipo === 'regulador' && <p className="r3-note">El regulador carga las baterías. Para alimentar aparatos de corriente alterna también necesitas un inversor independiente.</p>}
        <details className="r3-details"><summary>Ajustar la conexión de los paneles</summary>
          <p>Conexión actual: {r.arreglo.ns} paneles por grupo × {r.arreglo.np} grupos. Total: {r.arreglo.nTotal} paneles ({f(r.arreglo.potenciaWp / 1000)} kWp).</p>
          <Campo label="Paneles en serie por grupo" value={r.arreglo.ns} min={1} max={r.arreglo.nTotal} step={1} onChange={v => patch({ ns: v })} />
          <button onClick={() => patch({ ns: null })}>Restablecer conexión de paneles</button>
          <p>Corriente de cortocircuito: {f(r.conductor.isc)} A. Corriente de diseño de conductores (1,25 × Isc): {f(r.conductor.diseno)} A.</p>
        </details>
      </section>

      {r.banco && <section><div className="r3-step-title"><span><BatteryCharging size={19} /></span><div><h3>Las baterías que necesitas</h3><p>Resultado para {c.autonomia} días de respaldo.</p></div></div>
        <div className="r3-metrics">
          <Metrica label="Cantidad de baterías" value={`${r.banco.numero} baterías`} ayuda={`${r.banco.bateria.tecnologia} · ${r.banco.bateria.voltaje} V / ${r.banco.bateria.ah} Ah por unidad`} />
          <Metrica label="Energía almacenada" value={`${f(r.banco.wh / 1000)} kWh`} ayuda={`${f(r.banco.ah)} Ah a ${c.vBanco} V`} />
          <Metrica label="Uso al terminar el respaldo" value={`${f(r.banco.dodFinal * 100)} %`} ayuda={`Máximo elegido: ${f(c.dod * 100)} %`} />
        </div>
        <details className="r3-details"><summary>Ver cálculo de baterías y comparación</summary>
          <div className="r3-metrics">
            <Metrica label="Energía diaria en corriente continua" value={`${f(r.banco.ecc)} Wh/día`} />
            <Metrica label="Capacidad mínima requerida" value={`${f(r.banco.capacidadWh / 1000)} kWh · ${f(r.banco.capacidadAh)} Ah`} />
            <Metrica label="Conexión del banco" value={`${r.banco.ns} en serie × ${r.banco.np} en paralelo`} />
            <Metrica label="Uso diario / al final (DoD)" value={`${f(r.banco.dodDiario * 100)} / ${f(r.banco.dodFinal * 100)} %`} />
            <Metrica label="DoD ajustado por temperatura" value={`${f(r.banco.dodEfectivo * 100)} %`} />
            <Metrica label="Corriente de carga / descarga" value={`${f(r.banco.iCarga)} / ${f(r.banco.iDescarga)} A`} />
            <Metrica label="Tasa C de carga / límite" value={`${f(r.banco.cCarga, 3)} / ${r.banco.bateria.cCarga} C · ${resultadoCriterio(r.banco.cCarga <= r.banco.bateria.cCarga)}`} />
            <Metrica label="Tasa C de descarga / límite" value={`${f(r.banco.cDescarga, 3)} C / ${r.banco.bateria.cDescarga ?? 'dato pendiente'}`} />
          </div>
          <Fuente equipo={r.banco.bateria} />
          <div className="r3-scroll"><table><thead><tr><th>Tecnología</th><th>Conexión</th><th>Capacidad</th><th>DoD / eficiencia</th><th>C carga / descarga</th><th>Vida de diseño</th><th>Energía nominal / año</th></tr></thead>
            <tbody>{r.tecnologias.map(t => <tr key={t.bateria.id}><td>{t.bateria.tecnologia}</td><td>{t.ns}S × {t.np}P</td><td>{f(t.wh / 1000)} kWh</td><td>{t.bateria.dod * 100} % / {t.bateria.eficiencia}</td><td>{f(t.cCarga, 3)} / {f(t.cDescarga, 3)} C</td><td>{t.bateria.vida} años</td><td>{f(t.nominalPorAnio / 1000)} kWh/año</td></tr>)}</tbody>
          </table></div>
          <p>Energía nominal/año = capacidad instalada / vida de diseño. No representa la energía entregada a lo largo de su vida útil.</p>
        </details>
      </section>}

      <section><div className="r3-step-title"><span>3</span><div><h3>Comprueba si la energía alcanza</h3><p>El mes con menos sol es el escenario más exigente.</p></div></div>
        <div className={`r3-result-banner ${critico.margenPct < 0 ? 'needs-work' : 'enough'}`}>
          {critico.margenPct < 0 ? <AlertTriangle size={23} /> : <CheckCircle2 size={23} />}
          <div><strong>{critico.margenPct < 0 ? 'Necesitas más energía solar en el mes con menos sol' : 'La energía alcanza incluso en el mes con menos sol'}</strong>
            <p>{critico.margenPct < 0 ? `Falta un ${f(Math.abs(critico.margenPct), 1)} % de la potencia solar necesaria.` : `Tienes un margen del ${f(critico.margenPct, 1)} % sobre la potencia necesaria.`}</p>
          </div>
        </div>
        <div className="r3-balance-grid">{[['anual', 'Un día promedio del año'], ['critico', 'Un día del mes con menos sol']].map(([key, label]) => {
          const b = r.balance[key], adicionales = agregar(b);
          const cabe = !h.limitarPorArea || (r.arreglo.nTotal + adicionales) * h.modulo.area <= h.areaDisponible + 1e-9;
          return <article className="r3-balance-card" key={key}><span>{label}</span><h4>{f(b.produccion / 1000, 3)} kWh/día</h4>
            <p>Producción estimada de los paneles.</p>
            <dl><div><dt>Potencia solar necesaria</dt><dd>{f(b.requeridaWp / 1000, 3)} kWp</dd></div>
              <div><dt>{b.margenPct < 0 ? 'Déficit' : 'Margen'}</dt><dd className={b.margenPct < 0 ? 'r3-fail' : ''}>{f(Math.abs(b.margenPct))} %</dd></div>
              {!r.banco && <div><dt>Déficit equivalente en CA</dt><dd>{f(Math.max(0, -b.excedente * c.etaInv) / 1000, 3)} kWh/día</dd></div>}
              {r.banco && <div><dt>Recarga después del respaldo</dt><dd>{b.recuperacion == null ? 'La energía no alcanza' : `${f(b.recuperacion)} días`}</dd></div>}
            </dl>
            <button className="r3-primary" disabled={!adicionales || !cabe} onClick={() => patch({ ajuste: key, ns: null })}>{!cabe ? `La ampliación no cabe en ${f(h.areaDisponible, 0)} m²` : adicionales ? `Añadir ${adicionales} paneles para este escenario` : 'No necesitas añadir paneles'}</button>
            {!cabe && <p>{r.banco ? 'El área es obligatoria y no permite ampliar el generador para cubrir este consumo.' : 'El área es obligatoria. La red debe aportar la energía que falta; este arreglo no cubre el 100 % del consumo.'}</p>}
          </article>;
        })}</div>
        {r.modulosAgregados > 0 && <div className="r3-adjustment"><p><b>Se añadieron {r.modulosAgregados} paneles.</b> Ahora tienes {r.arreglo.nTotal} paneles; se revisaron de nuevo los equipos.</p><button onClick={() => patch({ ajuste: null, ns: null })}>Deshacer ampliación</button></div>}
        <details className="r3-details"><summary>Ver balance detallado</summary>
          <p>Energía diaria a generar: {f(r.balance.energiaGenerar / 1000, 3)} kWh. Se añaden grupos completos para conservar la conexión de los paneles.</p>
          <div className="r3-scroll"><table><thead><tr><th>Escenario</th><th>Producción FV</th><th>Preq</th><th>Balance CC diario</th><th>Margen</th><th>Módulos mínimos adicionales</th><th>Recuperación</th></tr></thead>
            <tbody>{[['anual', 'Promedio anual'], ['critico', 'Mes crítico']].map(([key, label]) => {
              const b = r.balance[key]; return <tr key={key}><td>{label}</td><td>{f(b.produccion / 1000, 3)} kWh</td><td>{f(b.requeridaWp / 1000, 3)} kWp</td><td>{f(b.excedente / 1000, 3)} kWh</td><td>{f(b.margenPct)} %</td><td>{b.modulosAdicionales}</td><td>{r.banco ? b.recuperacion == null ? 'No se recupera' : `${f(b.recuperacion)} días` : 'No aplica'}</td></tr>;
            })}</tbody>
          </table></div>
        </details>
      </section>

      <section className="r3-review" aria-live="polite"><h3>Antes de finalizar</h3>
        <div className="r3-final-status"><PlugZap size={19} /><strong>{estadoEquipo(r.seleccionado)}</strong></div>
        {avisos.length > 0 && <ul>{avisos.map((v, i) => <li key={i}>{v}</li>)}</ul>}
        {!!r.seleccionado?.fallos.length && <p className="r3-fail">El equipo elegido tiene límites que no se cumplen. Revisa las opciones del paso 2.</p>}
        {!!r.seleccionado?.pendientes.length && <p>Faltan datos en la ficha del equipo. Su compatibilidad completa aún no está confirmada.</p>}
        {!avisos.length && r.seleccionado?.cumple && <p>Las comprobaciones calculadas cumplen. Puedes descargar el informe desde la parte superior.</p>}
      </section>
    </>}

    <details className="r3-tools"><summary><Settings2 size={16} /> Catálogos y documentación técnica</summary>
      <div className="r3-tools-body"><p>Los equipos comerciales y las referencias académicas se mantienen separados.</p>
        <div className="r3-actions"><button onClick={() => { setEditor(JSON.stringify(catalogos, null, 2)); setEditorError(''); }}>Editar catálogos</button>
          <a href="./guia-tecnica.html" target="_blank" rel="noreferrer">Consultar fórmulas y supuestos</a>
        </div>
        {editor != null && <div><label className="r3-field"><span>Catálogos JSON</span><textarea aria-label="Catálogos JSON" rows={14} value={editor} onChange={e => setEditor(e.target.value)} /></label>
          <div className="r3-actions"><button onClick={() => { try { setCatalogos(JSON.parse(editor)); setEditor(null); setEditorError(''); } catch (e) { setEditorError(e.message); } }}>Validar y guardar catálogo</button><button onClick={() => setEditor(null)}>Cancelar edición</button></div>
          {editorError && <p role="alert" className="r3-error">{editorError}</p>}
        </div>}
      </div>
    </details>
  </div>;
}
