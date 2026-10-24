import { useState, useMemo, useRef, useEffect, useId, Children, cloneElement, isValidElement } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot, BarChart, Bar,
} from "recharts";
import * as XLSX from "xlsx";
import Reto03Tab from './reto03/Reto03Tab.jsx';
import { inicialReto03, heredarReto03, calcularReto03, validarCatalogos } from './reto03/calculos.js';
import { crearProyecto, leerProyecto } from './reto03/proyecto.js';
import { construirInforme } from './reto03/informe.js';
import { calcularGenerador, evaluarCatalogo } from './reto02/generador.js';
import {
  Sun, Moon, Sunrise, Plus, Pencil, Trash2, Eraser, Upload, Save,
  FolderOpen, FileDown, CheckCircle2, AlertTriangle, X,
  Gauge, Zap, BatteryCharging, CalendarDays, Coins, Clock, ListChecks, ArrowRight,
  MapPin, Wifi, WifiOff, Database, Grid3x3, Settings2, PanelsTopLeft,
} from "lucide-react";

/* ============================================================
   RETO 03 · ESFV — APLICACION INTEGRADA
   ============================================================ */

function interpretarHorario(texto) {
  const mask = new Array(24).fill(0);
  const limpio = (texto || "").trim();

  if (limpio.length === 0) {
    return { mask, error: "Ingrese al menos un intervalo horario. Ejemplo: 08-12;14-17." };
  }

  const partes = limpio.split(";");
  for (const rawParte of partes) {
    const parte = rawParte.trim();
    if (parte.length === 0) {
      return { mask, error: 'Hay un intervalo vacio. Revise los separadores ";".' };
    }

    const m = parte.match(/^(\d{1,2})(?::00)?\s*-\s*(\d{1,2})(?::00)?$/);
    if (!m) {
      return { mask, error: `Formato invalido en "${parte}". Use por ejemplo 08-12 o 20-02.` };
    }

    const ini = parseInt(m[1], 10);
    const fin = parseInt(m[2], 10);

    if (ini < 0 || ini > 23 || fin < 0 || fin > 24) {
      return { mask, error: `Intervalo fuera de rango: ${parte}. Horas validas: inicio 0-23, fin 0-24.` };
    }
    if (ini === fin) {
      return { mask, error: `El intervalo ${parte} tiene la misma hora de inicio y fin.` };
    }

    const nuevo = mascaraIntervalo(ini, fin);

    for (let h = 0; h < 24; h++) {
      if (mask[h] && nuevo[h]) {
        return { mask, error: `El intervalo ${parte} se superpone con otro intervalo ya ingresado.` };
      }
    }
    for (let h = 0; h < 24; h++) mask[h] = mask[h] || nuevo[h] ? 1 : 0;
  }

  return { mask, error: null };
}

function mascaraIntervalo(ini, fin) {
  const mask = new Array(24).fill(0);
  if (ini === fin) return mask;
  if (fin === 24 && ini === 0) return mask.fill(1);
  if (fin === 24) {
    for (let h = ini; h < 24; h++) mask[h] = 1;
  } else if (fin > ini) {
    for (let h = ini; h < fin; h++) mask[h] = 1;
  } else {
    for (let h = ini; h < 24; h++) mask[h] = 1;
    for (let h = 0; h < fin; h++) mask[h] = 1;
  }
  return mask;
}

function clasificarCarga(mask, ini, fin) {
  if (!mask.some(Boolean)) return "Sin horario";
  const dia = mascaraIntervalo(ini, fin);
  let tieneDia = false;
  let tieneNoche = false;
  for (let h = 0; h < 24; h++) {
    if (mask[h] && dia[h]) tieneDia = true;
    if (mask[h] && !dia[h]) tieneNoche = true;
  }
  if (tieneDia && tieneNoche) return "Mixta";
  if (tieneDia) return "Diurna";
  return "Nocturna";
}

function mascaraATexto(mask) {
  const arr = mask.map((v) => (v ? 1 : 0));
  if (!arr.some(Boolean)) return "Sin horario";
  if (arr.every(Boolean)) return "00-24";

  const startIdx = arr.indexOf(0);
  const rotated = [];
  for (let k = 0; k < 24; k++) rotated.push(arr[(startIdx + k) % 24]);

  const partes = [];
  let j = 0;
  while (j < 24) {
    if (rotated[j] === 1) {
      const s = j;
      while (j < 24 && rotated[j] === 1) j++;
      const e = j;
      const iniHora = (startIdx + s) % 24;
      const finHora = (startIdx + e) % 24;
      partes.push(`${pad2(iniHora)}-${pad2(finHora === 0 && e === 24 ? 0 : finHora)}`);
    } else {
      j++;
    }
  }
  return partes.join(";");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function claseColor(clasificacion) {
  switch (clasificacion) {
    case "Diurna": return { bg: "#FFF3DE", fg: "#8A5A00", icon: Sun };
    case "Nocturna": return { bg: "#E4E9FF", fg: "#33409A", icon: Moon };
    case "Mixta": return { bg: "#E6F5EC", fg: "#1E7A46", icon: Sunrise };
    default: return { bg: "#F1F1F3", fg: "#6B6B70", icon: Clock };
  }
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function ESFVApp() {
  const [tab, setTab] = useState("reto03");
  const [reto03, setReto03] = useState(inicialReto03);
  const [catalogosReto03, setCatalogosReto03] = useState({ conversion: [], baterias: [] });
  const [errorCatalogoReto03, setErrorCatalogoReto03] = useState('Cargando catalogos externos...');
  const proyectoRestaurado = useRef(false);
  const catalogosRestaurados = useRef(false);

  function actualizarCatalogosReto03(datos) {
    validarCatalogos(datos);
    catalogosRestaurados.current = true;
    setCatalogosReto03(datos);
    setErrorCatalogoReto03('');
  }

  useEffect(() => {
    let activo = true;
    Promise.all(['catalogo_conversion.json', 'catalogo_conversion_tdr.json', 'catalogo_baterias.json'].map(async nombre => {
      const resp = await fetch(`./${nombre}`);
      if (!resp.ok) throw new Error(`${nombre}: HTTP ${resp.status}`);
      return resp.json();
    })).then(([comercial, tdr, baterias]) => {
      const datos = validarCatalogos({ conversion: [...comercial, ...tdr], baterias });
      if (activo && !catalogosRestaurados.current) actualizarCatalogosReto03(datos);
    }).catch(e => { if (activo && !catalogosRestaurados.current) setErrorCatalogoReto03(`No se pudieron cargar catalogos: ${e.message}. Importe JSON desde la pestaña 5.`); });
    return () => { activo = false; };
  }, []);

  const [proyecto, setProyecto] = useState({
    nombre: "Mi proyecto solar",
    fecha: new Date().toISOString().slice(0, 10),
    integrantes: "",
    tipoApp: "Off-grid",
    diasMes: 30,
    cu: 1000,
  });

  const [criterio, setCriterio] = useState({ inicio: 6, fin: 18 });
  const [cargas, setCargas] = useState([]);
  const [seleccionId, setSeleccionId] = useState(null);

  const [form, setForm] = useState({
    carga: "", cantidad: 1, potencia: 100, horarioTexto: "08-12;14-17",
  });
  const [formError, setFormError] = useState(null);

  const [status, setStatus] = useState("Empieza con tus aparatos, abre un proyecto o prueba el ejemplo.");
  const [modal, setModal] = useState(null);
  const [factoresInfo, setFactoresInfo] = useState(
    ""
  );

  const fileExcelRef = useRef(null);
  const fileProyectoRef = useRef(null);
  const nasaCache = useRef({}); 

  const mostrarAlerta = (titulo, mensaje) => setModal({ tipo: "alert", titulo, mensaje });
  const pedirConfirmacion = (titulo, mensaje, onConfirm) =>
    setModal({ tipo: "confirm", titulo, mensaje, onConfirm });

  const cargasCalc = useMemo(() => {
    return cargas.map((c) => {
      const potenciaTotal = c.cantidad * c.potenciaUnitaria;
      const horasUso = c.mask.reduce((a, b) => a + b, 0);
      const clasificacion = clasificarCarga(c.mask, criterio.inicio, criterio.fin);
      const horarioTexto = mascaraATexto(c.mask);
      return { ...c, potenciaTotal, horasUso, clasificacion, horarioTexto };
    });
  }, [cargas, criterio]);

  const resultados = useMemo(() => {
    const pInst = cargasCalc.reduce((a, c) => a + c.potenciaTotal, 0);
    const perfil = new Array(24).fill(0);
    for (const c of cargasCalc) {
      for (let h = 0; h < 24; h++) {
        if (c.mask[h]) perfil[h] += c.potenciaTotal;
      }
    }
    let pMax = 0, horaPico = 0;
    perfil.forEach((v, h) => { if (v > pMax) { pMax = v; horaPico = h; } });

    const energiaDia = perfil.reduce((a, b) => a + b, 0) / 1000;
    const energiaMes = energiaDia * proyecto.diasMes;
    const energiaAnio = energiaMes * 12;
    const costoDia = energiaDia * proyecto.cu;
    const costoMes = energiaMes * proyecto.cu;
    const costoAnio = energiaAnio * proyecto.cu;

    const nDiurnas = cargasCalc.filter((c) => c.clasificacion === "Diurna").length;
    const nNocturnas = cargasCalc.filter((c) => c.clasificacion === "Nocturna").length;
    const nMixtas = cargasCalc.filter((c) => c.clasificacion === "Mixta").length;
    const sinHorario = cargasCalc.filter((c) => c.clasificacion === "Sin horario").length;

    const energiaDentro = perfil.reduce((a, v, h) => {
      const dia = mascaraIntervalo(criterio.inicio, criterio.fin);
      return a + (dia[h] ? v : 0);
    }, 0) / 1000;
    const energiaFuera = energiaDia - energiaDentro;

    return {
      pInst, perfil, pMax, horaPico, energiaDia, energiaMes, energiaAnio,
      costoDia, costoMes, costoAnio, nDiurnas, nNocturnas, nMixtas, sinHorario,
      energiaDentro, energiaFuera,
    };
  }, [cargasCalc, proyecto.diasMes, proyecto.cu, criterio]);

  const chartData = resultados.perfil.map((w, h) => ({
    hora: `${pad2(h)}:00`, horaNum: h, kw: +(w / 1000).toFixed(3),
  }));

  const previewClasificacion = useMemo(() => {
    const { mask, error } = interpretarHorario(form.horarioTexto);
    if (error) return { texto: "Horario invalido", error };
    return { texto: clasificarCarga(mask, criterio.inicio, criterio.fin), error: null };
  }, [form.horarioTexto, criterio]);

  function limpiarFormulario() {
    setForm({ carga: "", cantidad: 1, potencia: 100, horarioTexto: "08-12;14-17" });
    setFormError(null);
    setSeleccionId(null);
  }

  function leerFormulario() {
    const nombre = form.carga.trim();
    const cant = Number(form.cantidad);
    const pot = Number(form.potencia);

    if (nombre.length === 0) return { ok: false, msg: "La descripcion de la carga es obligatoria." };
    if (!Number.isFinite(cant) || cant <= 0 || Math.abs(cant - Math.round(cant)) > 1e-9) {
      return { ok: false, msg: "La cantidad debe ser un numero entero mayor que cero." };
    }
    if (!Number.isFinite(pot) || pot <= 0) {
      return { ok: false, msg: "La potencia unitaria debe ser mayor que cero." };
    }
    const { mask, error } = interpretarHorario(form.horarioTexto);
    if (error) return { ok: false, msg: error };
    if (!mask.some(Boolean)) return { ok: false, msg: "La carga debe tener al menos una hora de operacion." };

    return { ok: true, nombre, cant, pot, mask };
  }

  function onVerificarHorario() {
    const { error } = interpretarHorario(form.horarioTexto);
    setFormError(error);
  }

  function onAgregar() {
    const r = leerFormulario();
    if (!r.ok) { setFormError(r.msg); mostrarAlerta("Datos invalidos", r.msg); return; }

    const yaExiste = cargas.some(
      (c) => c.id !== seleccionId && c.carga.trim().toLowerCase() === r.nombre.toLowerCase()
    );
    if (yaExiste) {
      mostrarAlerta("Carga duplicada", "Ya existe una carga con esa descripcion. Edite la existente o cambie el nombre.");
      return;
    }

    if (seleccionId != null) {
      setCargas((prev) => prev.map((c) => (
        c.id === seleccionId
          ? { ...c, carga: r.nombre, cantidad: r.cant, potenciaUnitaria: r.pot, mask: r.mask }
          : c
      )));
      setStatus(`Carga actualizada: ${r.nombre}`);
    } else {
      const nuevoItem = cargas.length === 0 ? 1 : Math.max(...cargas.map((c) => c.item)) + 1;
      setCargas((prev) => [...prev, {
        id: nuevoItem, item: nuevoItem, carga: r.nombre, cantidad: r.cant,
        potenciaUnitaria: r.pot, mask: r.mask,
      }]);
      setStatus(`Carga agregada: ${r.nombre}`);
    }
    limpiarFormulario();
  }

  function onSeleccionarFila(c) {
    setSeleccionId(c.id);
    setForm({
      carga: c.carga, cantidad: c.cantidad, potencia: c.potenciaUnitaria,
      horarioTexto: mascaraATexto(c.mask),
    });
    setFormError(null);
  }

  function onEliminar(c) {
    pedirConfirmacion("Confirmar eliminacion", `¿Eliminar la carga "${c.carga}"?`, () => {
      setCargas((prev) => prev.filter((x) => x.id !== c.id));
      if (seleccionId === c.id) limpiarFormulario();
      setStatus(`Carga eliminada: ${c.carga}`);
      setModal(null);
    });
  }

  function normalizar(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function onImportarExcelClick() { fileExcelRef.current?.click(); }

  function onImportarExcel(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const nombresHojas = wb.SheetNames;
        const idxLimpia = nombresHojas.find((h) => h.trim().toLowerCase() === "linea_base_matlab");
        const idxOriginal = nombresHojas.find((h) => h.trim().toLowerCase() === "linea base");

        let nuevas = [];
        let factorElectro = null, factorFuerza = null;
        let hojaUsada = "";

        if (idxLimpia) {
          hojaUsada = idxLimpia;
          const sheet = wb.Sheets[idxLimpia];
          const filas = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
          if (filas.length < 2) throw new Error("La hoja LINEA_BASE_MATLAB esta vacia.");

          const header = filas[0].map(normalizar);
          const cItem = header.indexOf("item");
          const cCarga = header.indexOf("carga");
          let cPot = header.findIndex((h) => h.includes("potenciaw") || h.includes("potenciaunitariaw"));
          if (cPot === -1) cPot = header.findIndex((h) => h.includes("potencia"));
          const cCant = header.findIndex((h) => h === "cantidad" || h === "cant");
          const cHoras = [];
          for (let h = 0; h < 24; h++) cHoras.push(header.indexOf(`h${pad2(h)}`));

          if (cItem === -1 || cCarga === -1 || cPot === -1 || cHoras.some((c) => c === -1)) {
            throw new Error("Formato invalido en LINEA_BASE_MATLAB.");
          }

          for (let r = 1; r < filas.length; r++) {
            const fila = filas[r];
            if (!fila) continue;
            const nombre = String(fila[cCarga] ?? "").trim();
            const pot = Number(fila[cPot]);
            if (!nombre || !Number.isFinite(pot) || pot <= 0) continue;

            let cant = cCant === -1 ? 1 : Number(fila[cCant]);
            if (!Number.isFinite(cant) || cant <= 0) cant = 1;

            const mask = new Array(24).fill(0);
            for (let h = 0; h < 24; h++) {
              const v = Number(fila[cHoras[h]]);
              if (Number.isFinite(v) && v > 0) mask[h] = 1;
            }
            nuevas.push({ carga: nombre, cantidad: cant, potenciaUnitaria: pot, mask });
          }

          const idxParam = nombresHojas.find((h) => h.trim().toLowerCase() === "parametros");
          if (idxParam) {
            try {
              const sp = XLSX.utils.sheet_to_json(wb.Sheets[idxParam], { header: 1, defval: null });
              for (const fila of sp) {
                const nomP = normalizar(fila?.[0]);
                const valP = Number(fila?.[1]);
                if (nomP.includes("electro") && Number.isFinite(valP)) factorElectro = valP;
                else if (nomP.includes("fuerza") && Number.isFinite(valP)) factorFuerza = valP;
              }
            } catch { /* Optional source: retain local fallback. */ }
          }
        } else if (idxOriginal) {
          hojaUsada = idxOriginal;
          const sheet = wb.Sheets[idxOriginal];
          const filas = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, range: "B8:AB41" });
          if (!filas[0] || filas[0].length < 27) throw new Error('Bloque B8:AB41 no encontrado en "LINEA BASE".');

          for (let r = 1; r < filas.length; r++) {
            const fila = filas[r];
            if (!fila) continue;
            const nombre = String(fila[1] ?? "").trim();
            const pot = Number(fila[2]);
            if (!nombre || !Number.isFinite(pot) || pot <= 0) continue;

            const mask = new Array(24).fill(0);
            for (let h = 0; h < 24; h++) {
              const v = Number(fila[3 + h]);
              if (Number.isFinite(v) && v > 0) mask[h] = 1;
            }
            nuevas.push({ carga: nombre, cantidad: 1, potenciaUnitaria: pot, mask });
          }

          try {
            const factores = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, range: "D4:E5" });
            factorElectro = Number(factores?.[0]?.[1]);
            factorFuerza = Number(factores?.[1]?.[1]);
            if (!Number.isFinite(factorElectro)) factorElectro = null;
            if (!Number.isFinite(factorFuerza)) factorFuerza = null;
          } catch { /* Optional source: retain local fallback. */ }
        } else {
          throw new Error("Formato de Excel no reconocido. Se esperaba una hoja 'LINEA_BASE_MATLAB' o 'LINEA BASE'.");
        }

        if (nuevas.length === 0) throw new Error("No se encontraron cargas validas en el archivo.");

        const cargasFinal = nuevas.map((c, idx) => ({ id: idx + 1, item: idx + 1, ...c }));
        setCargas(cargasFinal);
        limpiarFormulario();

        if (factorElectro == null && factorFuerza == null) {
          setFactoresInfo("No se detectaron factores de consumo.");
        } else {
          setFactoresInfo(
            `Factores detectados: electrodomesticos = ${factorElectro ?? "no detectado"} | fuerza = ${factorFuerza ?? "no detectado"}.`
          );
        }
        setStatus(`Importacion correcta: ${nuevas.length} cargas desde la hoja "${hojaUsada}".`);
      } catch (err) {
        mostrarAlerta("Error de importacion", `No fue posible importar el archivo:\n${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function onGuardarProyecto() {
    const datos = crearProyecto({ proyecto, criterio, cargas, generador: generadorState, baseSolar, reto03, catalogosReto03 });
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const nombreArchivo = `${(proyecto.nombre || "proyecto").trim().replace(/\s+/g, "_")}.json`;
    a.href = url; a.download = nombreArchivo;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setStatus(`Proyecto guardado en: ${nombreArchivo}`);
  }

  function onCargarProyectoClick() { fileProyectoRef.current?.click(); }

  function restaurarProyecto(entrada, nombre) {
    const datos = leerProyecto(entrada);
    proyectoRestaurado.current = true;
    setProyecto(datos.proyecto);
    setCriterio(datos.criterio);
    setCargas(datos.cargas);
    setGeneradorState({ ...generadorInicial(), ...datos.generador });
    setBaseSolar(datos.baseSolar || BASE_DATOS_SOLAR);
    setReto03(datos.reto03);
    if (datos.catalogosReto03) actualizarCatalogosReto03(datos.catalogosReto03);
    limpiarFormulario();
    setStatus(`Proyecto abierto: ${nombre}.`);
  }

  async function onCargarEjemplo() {
    try {
      const respuesta = await fetch('./ejemplo_reto03.json');
      if (!respuesta.ok) throw new Error('El ejemplo no esta disponible.');
      restaurarProyecto(await respuesta.json(), 'Estacion de monitoreo - Alta Guajira');
      setTab('reto03');
    } catch (err) { mostrarAlerta('No se pudo abrir el ejemplo', err.message); }
  }

  function onCargarProyecto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        restaurarProyecto(JSON.parse(ev.target.result), file.name);
      } catch (err) {
        mostrarAlerta("Error al cargar el archivo", err.message);
      }
    };
    reader.readAsText(file);
  }

  /* ================================================================
     RETO 02 · GENERADOR FOTOVOLTAICO (RF-13 a RF-24)
     ================================================================ */

  const generadorInicial = () => ({
    modoRecurso: "local",            
    sitioId: "nazareth",
    lat: 12.18, lon: -71.28,
    inclinacion: 12, azimut: 180,
    apiStatus: "idle",               
    apiMensaje: "",
    apiMensual: null,                
    rawDataApi: null, 
    criterioDimension: "anual",      
    pr: 0.70,
    vMaxSistema: 600,
    tMinAmbiente: 20,
    tOperacion: 32,
    areaDisponible: 20,
    moduloSeleccionadoId: "tdr550",
    moduloForzado: false,
    catalogo: CATALOGO_INICIAL(),
  });
  const [generadorState, setGeneradorState] = useState(generadorInicial);

  function setGen(patch) {
    setGeneradorState((g) => (typeof patch === "function" ? patch(g) : { ...g, ...patch }));
  }

  const [baseSolar, setBaseSolar] = useState(BASE_DATOS_SOLAR);
  const [fuenteDatosInfo, setFuenteDatosInfo] = useState(
    "Catalogo y base solar: usando copia embebida de respaldo."
  );
  const fileCatalogoRef = useRef(null);
  const fileBaseSolarRef = useRef(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const mensajes = [];
      try {
        const r = await fetch("./catalogo_modulos.json");
        if (r.ok) {
          const json = await r.json();
          if (Array.isArray(json) && json.length > 0 && activo && !proyectoRestaurado.current) {
            setGen({ catalogo: json });
            mensajes.push(`catalogo_modulos.json (${json.length} referencias)`);
          }
        }
      } catch { /* Optional source: retain local fallback. */ }
      try {
        const r = await fetch("./base_datos_solar.json");
        if (r.ok) {
          const json = await r.json();
          if (Array.isArray(json) && json.length > 0 && activo && !proyectoRestaurado.current) {
            setBaseSolar(json);
            mensajes.push(`base_datos_solar.json (${json.length} sitios)`);
          }
        }
      } catch { /* Optional source: retain local fallback. */ }
      if (activo && mensajes.length > 0) {
        setFuenteDatosInfo(`Cargado desde archivo externo: ${mensajes.join(" y ")}.`);
      } else if (activo) {
        setFuenteDatosInfo(
          "No se encontraron JSON externos junto a la app. Usando copia embebida; use los botones para cargarlos."
        );
      }
    })();
    return () => { activo = false; };
  }, []);

  function onImportarCatalogoClick() { fileCatalogoRef.current?.click(); }
  function onImportarBaseSolarClick() { fileBaseSolarRef.current?.click(); }

  function onImportarCatalogo(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (!Array.isArray(json) || json.length === 0) throw new Error("El archivo debe ser un arreglo JSON.");
        setGen({ catalogo: json });
        setFuenteDatosInfo(`Catalogo importado manualmente: ${file.name} (${json.length} referencias).`);
        setStatus(`Catalogo de modulos actualizado.`);
      } catch (err) {
        mostrarAlerta("Error al importar el catalogo", err.message);
      }
    };
    reader.readAsText(file);
  }

  function onImportarBaseSolar(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (!Array.isArray(json) || json.length === 0) throw new Error("El archivo debe ser un arreglo JSON.");
        setBaseSolar(json);
        setGen({ sitioId: json[0].id });
        setFuenteDatosInfo(`Base solar importada manualmente: ${file.name} (${json.length} sitios).`);
        setStatus(`Base de datos solar actualizada.`);
      } catch (err) {
        mostrarAlerta("Error al importar la base solar", err.message);
      }
    };
    reader.readAsText(file);
  }

  const sitio = baseSolar.find((s) => s.id === generadorState.sitioId) || baseSolar[0];

  const recursoMensual = useMemo(() => {
    if (generadorState.modoRecurso === "api" && generadorState.rawDataApi) {
      return transponerATiltoMensual({
        lat: generadorState.lat, tiltDeg: generadorState.inclinacion, azimutDeg: generadorState.azimut,
        ...generadorState.rawDataApi
      });
    }
    return sitio.mensual;
  }, [generadorState.modoRecurso, generadorState.rawDataApi, generadorState.lat, generadorState.inclinacion, generadorState.azimut, sitio]);

  const esLocal = generadorState.modoRecurso === "local" || !generadorState.rawDataApi;

  const hspAnual = useMemo(() => {
    if (esLocal && Number.isFinite(sitio.anualOficial)) return sitio.anualOficial;
    return recursoMensual.reduce((a, b) => a + b, 0) / 12;
  }, [esLocal, sitio, recursoMensual]);

  const hspCritico = useMemo(() => {
    if (esLocal && Number.isFinite(sitio.mesCriticoOficial)) return sitio.mesCriticoOficial;
    return Math.min(...recursoMensual);
  }, [esLocal, sitio, recursoMensual]);

  const mesCriticoIdx = recursoMensual.indexOf(Math.min(...recursoMensual));

  const hspUsado = generadorState.criterioDimension === "anual" ? hspAnual : hspCritico;

  async function onConsultarNasaPower() {
    setGen({ apiStatus: "cargando", apiMensaje: "Consultando NASA POWER..." });
    const { lat, lon, inclinacion, azimut } = generadorState;
    const cacheKey = `${lat}_${lon}`; 
    
    if (nasaCache.current[cacheKey]) {
      setGen({ 
        apiStatus: "ok", 
        rawDataApi: nasaCache.current[cacheKey], 
        apiMensaje: `Datos crudos recuperados de caché para ${lat}°, ${lon}°. Transposición recalculada localmente a ${inclinacion}° y Azimut ${azimut}°.` 
      });
      setStatus("Recurso solar transpuesto desde caché local.");
      return;
    }

    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,ALLSKY_SFC_SW_DNI,ALLSKY_SFC_SW_DIFF&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const p = data?.properties?.parameter;
      if (!p) throw new Error("Respuesta sin parametros.");
      
      const meses = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const ghi = meses.map((m) => Number(p.ALLSKY_SFC_SW_DWN?.[m]));
      const dni = meses.map((m) => Number(p.ALLSKY_SFC_SW_DNI?.[m]));
      const dif = meses.map((m) => Number(p.ALLSKY_SFC_SW_DIFF?.[m]));
      
      const rawData = { ghi, dni, dif };
      nasaCache.current[cacheKey] = rawData;
      
      setGen({
        apiStatus: "ok", rawDataApi: rawData,
        apiMensaje: `Consulta exitosa a NASA POWER (${new Date().toLocaleTimeString()}). Datos guardados en caché.`,
      });
      setStatus("Recurso solar actualizado desde NASA POWER.");
    } catch (err) {
      setGen({
        apiStatus: "error_fallback", rawDataApi: null,
        apiMensaje: `No se pudieron consultar los datos de NASA (${err.message}). Se usan los datos guardados.`,
      });
      setStatus("API no disponible: contingencia local.");
    }
  }

  const dimension = useMemo(() => {
    // Si se forzó el módulo, usamos ese. Si no, pasamos el objeto entero para que calcule el mejor
    const mejorOpcionPrevia = evaluarCatalogo({ 
        ed: resultados.energiaDia, hsp: hspUsado, pr: generadorState.pr, 
        vMaxSistema: generadorState.vMaxSistema, tMin: generadorState.tMinAmbiente, 
        catalogo: generadorState.catalogo 
    }).mejorOpcion;

    const moduloActivoId = generadorState.moduloForzado
      ? generadorState.moduloSeleccionadoId
      : (mejorOpcionPrevia?.id || generadorState.moduloSeleccionadoId);
    
    const moduloSeleccionado = generadorState.catalogo.find((m) => m.id === moduloActivoId) || generadorState.catalogo[0];

    return calcularGenerador({
      ed: resultados.energiaDia, hsp: hspUsado, pr: generadorState.pr,
      modulo: moduloSeleccionado, vMaxSistema: generadorState.vMaxSistema,
      tMin: generadorState.tMinAmbiente, tOp: generadorState.tOperacion,
      areaDisponible: generadorState.areaDisponible, catalogo: generadorState.catalogo,
    });
  }, [resultados.energiaDia, hspUsado, generadorState.pr, generadorState.vMaxSistema,
      generadorState.tMinAmbiente, generadorState.tOperacion, generadorState.areaDisponible, 
      generadorState.catalogo, generadorState.moduloForzado, generadorState.moduloSeleccionadoId]);

  const moduloActivo = generadorState.catalogo.find(
      (m) => m.id === (generadorState.moduloForzado ? generadorState.moduloSeleccionadoId : dimension.mejorOpcion?.id)
  ) || generadorState.catalogo[0];

  const heredadosReto03 = heredarReto03({ resultados, proyecto, dimension, modulo: moduloActivo, gen: generadorState, hspAnual, hspCritico, sitio });
  const resultadoReto03 = calcularReto03(heredadosReto03, reto03, catalogosReto03);

  /* ---------------------- Informe ejecutivo (RF-11 / RF-24) ---------------------- */

  function onGenerarInforme() {
    const c = criterio;
    const maxKw = Math.max(...chartData.map((d) => d.kw), 0.001);
    const puntosEscalados = chartData
      .map((d) => `${(d.horaNum / 23) * 560 + 20},${60 - (d.kw / maxKw) * 55}`)
      .join(" L ");

    const filasCargas = cargasCalc.map((cc) => `
      <tr>
        <td>${cc.item}</td><td>${escapeHtml(cc.carga)}</td><td>${cc.cantidad}</td>
        <td>${cc.potenciaUnitaria}</td><td>${cc.potenciaTotal}</td>
        <td>${cc.clasificacion}</td><td>${cc.horarioTexto}</td>
      </tr>`).join("");

    const d = dimension;
    const seccionGenerador = `
      <div class="section-title">Generador fotovoltaico (Reto 02)</div>
      <div class="sub">Sitio: <b>${escapeHtml(sitio.nombre)}</b> (${sitio.lat}°, ${sitio.lon}°) ·
        Fuente del recurso: ${escapeHtml(generadorState.modoRecurso === "api" && generadorState.apiStatus === "ok" ? "NASA POWER (consulta en vivo)" : sitio.fuente)} ·
        Consultado: ${escapeHtml(generadorState.modoRecurso === "api" && generadorState.apiStatus === "ok" ? new Date().toLocaleDateString() : sitio.fechaConsulta)} ·
        Criterio de dimensionamiento: ${generadorState.criterioDimension === "anual" ? "promedio anual" : "mes critico"} (HSP = ${hspUsado.toFixed(2)} kWh/m²·día) ·
        PR = ${generadorState.pr}</div>
      <div class="grid">
        <div class="card"><div class="t">Potencia pico requerida</div><div class="v">${d.ppico.toFixed(2)} kWp</div></div>
        <div class="card"><div class="t">Modulos / config.</div><div class="v">${d.nTotal} × ${moduloActivo.potencia} Wp</div></div>
        <div class="card"><div class="t">Potencia instalada</div><div class="v">${(d.pInstalada/1000).toFixed(2)} kWp</div></div>
        <div class="card"><div class="t">Excedente</div><div class="v">${d.excedentePct >= 0 ? "+" : ""}${d.excedentePct.toFixed(1)} %</div></div>
        <div class="card"><div class="t">Cadenas</div><div class="v">${d.nParalelo} × ${d.nSerie} serie</div></div>
        <div class="card"><div class="t">Voc generador (Tmin)</div><div class="v">${d.vocGen.toFixed(1)} V</div></div>
        <div class="card"><div class="t">Corriente de diseño</div><div class="v">${d.iDiseno.toFixed(1)} A</div></div>
        <div class="card"><div class="t">Area generador</div><div class="v">${d.areaGen.toFixed(2)} m²</div></div>
      </div>
      <div class="sub">Modulo seleccionado: <b>${escapeHtml(moduloActivo.fabricante)} ${escapeHtml(moduloActivo.modelo)}</b>
        (criterio de seleccion: menor excedente de potencia) · Voc=${moduloActivo.voc} V, Isc=${moduloActivo.isc} A,
        β=${moduloActivo.beta}%/°C, γ=${moduloActivo.gamma}%/°C, NOCT=${moduloActivo.noct}°C ·
        Fuente: ${escapeHtml(moduloActivo.fuente)} (consulta: ${escapeHtml(moduloActivo.fechaConsulta)}).
        ${d.areaGen > generadorState.areaDisponible ? '<b style="color:#B3261E">El area del generador excede el area disponible declarada.</b>' : "El area del generador cabe en el area disponible declarada."}
        Supuesto: temperatura de celda estimada con modelo NOCT (Tcelda = Ta + (NOCT-20)/800·1000); corriente de diseño con factor NTC 2050 art. 690-8 (1.25×1.25×Isc).</div>`;

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
      <title>Informe ejecutivo - ${escapeHtml(proyecto.nombre)}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#16202E;max-width:900px;margin:24px auto;padding:0 20px;}
        h1{font-size:20px;margin-bottom:2px;color:#10192B;}
        .sub{color:#5A6472;font-size:12px;margin-bottom:18px;line-height:1.5;}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0 20px;}
        .card{border:1px solid #E1E4E9;border-radius:8px;padding:8px 10px;}
        .card .t{font-size:10px;text-transform:uppercase;color:#5A6472;letter-spacing:.04em;}
        .card .v{font-size:16px;font-weight:700;color:#10192B;font-family:'Courier New',monospace;}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;}
        th,td{border:1px solid #E1E4E9;padding:4px 6px;text-align:left;}
        th{background:#F4F6F8;}
        .section-title{font-size:13px;font-weight:700;margin:18px 0 4px;color:#10192B;border-bottom:2px solid #F5A623;display:inline-block;padding-bottom:2px;}
        svg{background:#F9FAFB;border:1px solid #E1E4E9;border-radius:6px;}
        @media print{body{margin:0;padding:12px;}}
      </style></head><body>
      <h1>RETO 03 ESFV · Informe del sistema solar</h1>
      <div class="sub">Proyecto: <b>${escapeHtml(proyecto.nombre)}</b> &nbsp;|&nbsp;
        Fecha: ${escapeHtml(proyecto.fecha)} &nbsp;|&nbsp;
        Tipo de aplicacion: ${escapeHtml(proyecto.tipoApp)} &nbsp;|&nbsp;
        Criterio dia/noche: ${pad2(c.inicio)}:00-${pad2(c.fin === 24 ? 0 : c.fin)}:00</div>

      <div class="section-title">Indicadores de consumo (Reto 01)</div>
      <div class="grid">
        <div class="card"><div class="t">Potencia instalada</div><div class="v">${(resultados.pInst/1000).toFixed(2)} kW</div></div>
        <div class="card"><div class="t">Demanda maxima</div><div class="v">${(resultados.pMax/1000).toFixed(2)} kW</div></div>
        <div class="card"><div class="t">Energia diaria</div><div class="v">${resultados.energiaDia.toFixed(2)} kWh</div></div>
        <div class="card"><div class="t">Energia mensual</div><div class="v">${resultados.energiaMes.toFixed(2)} kWh</div></div>
        <div class="card"><div class="t">Costo diario</div><div class="v">$ ${Math.round(resultados.costoDia)}</div></div>
        <div class="card"><div class="t">Costo mensual</div><div class="v">$ ${Math.round(resultados.costoMes)}</div></div>
        <div class="card"><div class="t">Costo anual</div><div class="v">$ ${Math.round(resultados.costoAnio)}</div></div>
        <div class="card"><div class="t">Hora pico</div><div class="v">${pad2(resultados.horaPico)}:00</div></div>
      </div>

      <div class="section-title">Perfil horario de demanda (24 h)</div><br/>
      <svg viewBox="0 0 580 70" width="100%" height="90">
        <polyline fill="none" stroke="#F5A623" stroke-width="2" points="M ${puntosEscalados}"/>
      </svg>

      ${seccionGenerador}
      <div class="section-title">Conversion y banco (Reto 03)</div>
      <div class="sub">Rama: ${resultadoReto03.rama === 'con' ? 'con almacenamiento' : 'sin almacenamiento'}.
      ${escapeHtml(resultadoReto03.errores.length ? resultadoReto03.errores.join('; ') :
        `Equipo: ${resultadoReto03.seleccionado?.equipo.modelo ?? 'sin seleccionar'}; ${resultadoReto03.seleccionado?.estado ?? 'pendiente'}. Arreglo efectivo: ${resultadoReto03.arreglo.ns}S x ${resultadoReto03.arreglo.np}P. Banco: ${resultadoReto03.banco ? (resultadoReto03.banco.wh / 1000).toFixed(2) + ' kWh' : 'no aplica'}. Margen anual/critico: ${resultadoReto03.balance.anual.margenPct.toFixed(2)}% / ${resultadoReto03.balance.critico.margenPct.toFixed(2)}%. Alertas: ${resultadoReto03.avisos.join('; ')}`)}</div>

      <div class="section-title">Cuadro de cargas (${cargasCalc.length})</div>
      <table><thead><tr><th>Item</th><th>Carga</th><th>Cant.</th><th>P. unit [W]</th>
        <th>P. total [W]</th><th>Clasificacion</th><th>Horario</th></tr></thead>
        <tbody>${filasCargas}</tbody></table>

      <p style="font-size:10px;color:#8A93A0;margin-top:18px;">
        Generado por Reto 03 ESFV.
        Dias de operacion/mes: ${proyecto.diasMes} · CU: $${proyecto.cu}/kWh.
      </p>
      </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Informe_${(proyecto.nombre || "proyecto").trim().replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setStatus("Informe ejecutivo generado y descargado.");
  }

  function onGenerarInformePDF() {
    const doc = construirInforme({ proyecto, resultados, h: heredadosReto03, config: reto03, resultado: resultadoReto03 });
    doc.save(`Informe_${(proyecto.nombre || "proyecto").trim().replace(/\s+/g, "_")}.pdf`);
    setStatus("Informe ejecutivo PDF Reto 01+02+03 generado (una pagina).");
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
    ));
  }

  return (
    <div className="esfv-app">
      <header className="app-header">
        <div className="app-brand"><div className="app-brand-icon"><Sun size={27} /></div><div>
          <small>ESFV · RETO 03</small><h1>Tu sistema solar</h1><p>{proyecto.nombre}</p>
        </div></div>
        <div className="app-toolbar">
          <button onClick={onGuardarProyecto}><Save size={15} /> Guardar proyecto</button>
          <button onClick={onCargarProyectoClick}><FolderOpen size={15} /> Abrir proyecto</button>
          <button onClick={onGenerarInformePDF} disabled={resultados.energiaDia <= 0}><FileDown size={15} /> Descargar informe</button>
        </div>
      </header>
      <nav className="app-nav" aria-label="Pasos del proyecto">
        <TabButton n="1" label="Proyecto" active={tab === "proyecto"} onClick={() => setTab("proyecto")} />
        <TabButton n="2" label="Aparatos" active={tab === "cargas"} onClick={() => setTab("cargas")} />
        <TabButton n="3" label="Consumo" active={tab === "resultados"} onClick={() => setTab("resultados")} />
        <TabButton n="4" label="Paneles solares" active={tab === "generador"} onClick={() => setTab("generador")} />
        <TabButton n="5" label="Inversor y baterías" active={tab === "reto03"} onClick={() => setTab("reto03")} />
      </nav>
      <div className="app-status" role="status">{status}</div>
      <main className="app-main">
        {tab === "reto03" && <Reto03Tab heredados={heredadosReto03} config={reto03} setConfig={setReto03}
          catalogos={catalogosReto03} setCatalogos={actualizarCatalogosReto03} resultado={resultadoReto03}
          errorCatalogo={errorCatalogoReto03} onIr={setTab} onEjemplo={onCargarEjemplo} />}
        {tab === "proyecto" && (
          <ProyectoTab proyecto={proyecto} setProyecto={setProyecto} criterio={criterio}
            onValidar={() => {
              const nombre = proyecto.nombre.trim();
              const integrantes = proyecto.integrantes.split("\n").map((s) => s.trim()).filter(Boolean);
              if (!nombre) { mostrarAlerta("Dato faltante", "Ingrese el nombre o ID del proyecto."); return; }
              if (integrantes.length === 0) { mostrarAlerta("Dato faltante", "Ingrese al menos un integrante."); return; }
              setStatus(`Proyecto validado: ${nombre} | ${proyecto.tipoApp} | ${proyecto.fecha}`);
              mostrarAlerta("Proyecto", "Los datos basicos del proyecto son validos.");
            }}
          />
        )}

        {tab === "cargas" && (
          <CargasTab
            form={form} setForm={setForm} formError={formError}
            preview={previewClasificacion} seleccionId={seleccionId}
            onAgregar={onAgregar} onLimpiar={limpiarFormulario}
            onVerificar={onVerificarHorario}
            onEliminarSeleccion={() => {
              const c = cargas.find((x) => x.id === seleccionId);
              if (!c) { mostrarAlerta("Sin seleccion", "Seleccione primero una fila de la tabla."); return; }
              onEliminar(c);
            }}
            cargasCalc={cargasCalc} onSeleccionarFila={onSeleccionarFila}
            onImportarExcelClick={onImportarExcelClick}
            factoresInfo={factoresInfo || "Puedes agregar aparatos o importar una hoja de cálculo."}
          />
        )}

        {tab === "resultados" && (
          <ResultadosTab resultados={resultados} chartData={chartData} criterio={criterio}
            setCriterio={setCriterio} nCargas={cargasCalc.length}
            onGenerarInforme={onGenerarInforme} onGenerarInformePDF={onGenerarInformePDF} />
        )}

        {tab === "generador" && (
          <GeneradorTab
            resultados={resultados} proyecto={proyecto} criterio={criterio}
            gen={generadorState} setGen={setGen} sitio={sitio} baseSolar={baseSolar}
            recursoMensual={recursoMensual} hspAnual={hspAnual} hspCritico={hspCritico}
            mesCriticoIdx={mesCriticoIdx} hspUsado={hspUsado}
            onConsultarNasaPower={onConsultarNasaPower}
            modulo={moduloActivo} dimension={dimension} mejorOpcionId={dimension.mejorOpcion?.id}
            onGenerarInforme={onGenerarInforme} onGenerarInformePDF={onGenerarInformePDF}
            fuenteDatosInfo={fuenteDatosInfo}
            onImportarCatalogoClick={onImportarCatalogoClick}
            onImportarBaseSolarClick={onImportarBaseSolarClick}
          />
        )}
        {tab !== 'reto03' && <div className="app-step-footer"><button onClick={() => setTab(({ proyecto: 'cargas', cargas: 'resultados', resultados: 'generador', generador: 'reto03' })[tab])}>
          {({ proyecto: 'Continuar con mis aparatos', cargas: 'Ver mi consumo', resultados: 'Elegir paneles solares', generador: 'Continuar con inversor y baterías' })[tab]} <ArrowRight size={16} />
        </button></div>}
      </main>
      <footer className="app-footer"><span>Reto 03 · Energía Solar Fotovoltaica · Universidad del Magdalena</span><a href="./guia-tecnica.html" target="_blank" rel="noreferrer">Guía técnica</a></footer>

      <input ref={fileExcelRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={onImportarExcel} />
      <input ref={fileProyectoRef} type="file" accept=".json" style={{ display: "none" }} onChange={onCargarProyecto} />
      <input ref={fileCatalogoRef} type="file" accept=".json" style={{ display: "none" }} onChange={onImportarCatalogo} />
      <input ref={fileBaseSolarRef} type="file" accept=".json" style={{ display: "none" }} onChange={onImportarBaseSolar} />

      {modal && <ModalDialog modal={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ============================================================
   RETO 02 · FUNCIONES DE INGENIERIA (puras)
   ============================================================ */

function CATALOGO_INICIAL() {
  return [
    {
      id: "tdr550", fabricante: "Referencia TdR", modelo: "Caso Oficial 550W",
      potencia: 550, voc: 49.5, isc: 14.0, vmp: 41.5, imp: 13.3,
      beta: -0.27, alpha: 0.05, gamma: -0.35, noct: 45, celdas: 72,
      area: 2.58, eficiencia: 21.3,
      fuente: "Caso de prueba oficial TdR Reto 02",
      fechaConsulta: "2026-10-03",
    },
    {
      id: "canadian450", fabricante: "Canadian Solar", modelo: "HiKu6 CS6L-450MS",
      potencia: 450, voc: 41.0, isc: 13.9, vmp: 34.4, imp: 13.1,
      beta: -0.26, alpha: 0.05, gamma: -0.34, noct: 41, celdas: 120,
      area: 2.158, eficiencia: 20.9,
      fuente: "Canadian Solar - ficha tecnica HiKu6 CS6L-MS",
      fechaConsulta: "2026-10-02",
    },
    {
      id: "jinko575", fabricante: "Jinko Solar", modelo: "Tiger Neo JKM575N-72HL4",
      potencia: 575, voc: 52.15, isc: 13.95, vmp: 43.17, imp: 13.32,
      beta: -0.25, alpha: 0.045, gamma: -0.29, noct: 45, celdas: 144,
      area: 2.583, eficiencia: 22.26,
      fuente: "JinkoSolar - ficha tecnica JKM555-575N-72HL4-(V)",
      fechaConsulta: "2026-10-02",
    },
    {
      id: "trina665", fabricante: "Trina Solar", modelo: "Vertex TSM-DEG21C.20 665W",
      potencia: 665, voc: 46.10, isc: 18.50, vmp: 39.30, imp: 17.39,
      beta: -0.25, alpha: 0.04, gamma: -0.34, noct: 44, celdas: 132,
      area: 3.106, eficiencia: 21.4,
      fuente: "Trina Solar - ficha tecnica Vertex TSM-DEG21C.20",
      fechaConsulta: "2026-10-02",
    },
  ];
}

const BASE_DATOS_SOLAR = [
  {
    id: "nazareth", nombre: "Nazareth, Alta Guajira (caso de prueba)",
    lat: 12.18, lon: -71.28, inclinacion: 12, azimut: 180,
    anualOficial: 5.8, mesCriticoOficial: 5.2,
    mensual: [6.1, 6.2, 6.1, 6.0, 5.8, 5.9, 6.0, 5.9, 5.4, 5.2, 5.3, 5.9],
    fuente: "Valor anual y de mes critico: caso de prueba oficial del TdR Reto 02. Perfil mensual: NASA POWER LARC climatology.",
    fechaConsulta: "2026-09-28",
  },
  {
    id: "riohacha", nombre: "Riohacha, La Guajira",
    lat: 11.52, lon: -72.92, inclinacion: 12, azimut: 180,
    anualOficial: 5.61, mesCriticoOficial: null,
    mensual: [6.1, 6.2, 6.0, 5.8, 5.5, 5.6, 5.8, 5.7, 5.2, 5.0, 5.1, 5.7],
    fuente: "UPME/IDEAM - Atlas de Radiacion Solar de Colombia. Contrastado con datos historicos POWER LARC.",
    fechaConsulta: "2026-09-28",
  },
  {
    id: "barranquilla", nombre: "Barranquilla, Atlantico",
    lat: 11.04, lon: -74.82, inclinacion: 11, azimut: 180,
    anualOficial: 5.95, mesCriticoOficial: null,
    mensual: [6.4, 6.5, 6.3, 6.0, 5.8, 6.1, 6.3, 6.1, 5.5, 5.3, 5.5, 6.2],
    fuente: "UPME/IDEAM - Atlas de Radiacion Solar de Colombia. Contrastado con datos historicos POWER LARC.",
    fechaConsulta: "2026-09-28",
  },
  {
    id: "bogota", nombre: "Bogota D.C. (sabana andina)",
    lat: 4.71, lon: -74.15, inclinacion: 5, azimut: 180,
    anualOficial: 4.04, mesCriticoOficial: null,
    mensual: [4.5, 4.4, 4.2, 3.8, 3.6, 3.7, 3.9, 4.1, 3.9, 3.7, 3.8, 4.3],
    fuente: "UPME/IDEAM - Atlas de Radiacion Solar de Colombia. Contrastado con datos historicos POWER LARC.",
    fechaConsulta: "2026-09-28",
  },
  {
    id: "leticia", nombre: "Leticia, Amazonas",
    lat: -4.21, lon: -69.94, inclinacion: 4, azimut: 0,
    anualOficial: 4.0, mesCriticoOficial: null,
    mensual: [4.3, 4.1, 3.8, 3.6, 3.7, 3.9, 4.2, 4.4, 4.2, 4.0, 3.8, 4.1],
    fuente: "Consulta historica NASA POWER - Radiacion solar incidente en zona ecuatorial amazonica.",
    fechaConsulta: "2026-09-28",
  },
];

const DIAS_REPRESENTATIVOS = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];

function declinacionSolar(n) {
  return 23.45 * Math.sin((2 * Math.PI / 365) * (284 + n));
}
function toRad(d) { return d * Math.PI / 180; }

// Integración Numérica para incorporar efecto exacto del Azimut
function rbPromedioMensual(latDeg, tiltDeg, n, azimutDeg) {
  const phi = toRad(latDeg);
  const beta = toRad(tiltDeg);
  const delta = toRad(declinacionSolar(n));
  const gamma = toRad(azimutDeg - 180); 

  const argWs = -Math.tan(phi) * Math.tan(delta);
  const ws = Math.acos(Math.max(-1, Math.min(1, argWs)));

  let num = 0, den = 0;
  const dW = Math.PI / 180; 

  for (let w = -ws; w <= ws; w += dW) {
    const cosTz = Math.sin(phi)*Math.sin(delta) + Math.cos(phi)*Math.cos(delta)*Math.cos(w);
    if (cosTz <= 0) continue;

    const term1 = Math.sin(delta) * Math.sin(phi) * Math.cos(beta);
    const term2 = -Math.sin(delta) * Math.cos(phi) * Math.sin(beta) * Math.cos(gamma);
    const term3 = Math.cos(delta) * Math.cos(phi) * Math.cos(beta) * Math.cos(w);
    const term4 = Math.cos(delta) * Math.sin(phi) * Math.sin(beta) * Math.cos(gamma) * Math.cos(w);
    const term5 = Math.cos(delta) * Math.sin(beta) * Math.sin(gamma) * Math.sin(w);
    
    const cosT = term1 + term2 + term3 + term4 + term5;

    den += cosTz * dW;
    if (cosT > 0) num += cosT * dW;
  }
  return den > 0 ? num / den : 1;
}

function transponerATiltoMensual({ lat, tiltDeg, azimutDeg, ghi, dif, rho = 0.2 }) {
  const beta = toRad(tiltDeg);
  return ghi.map((H, i) => {
    const n = DIAS_REPRESENTATIVOS[i];
    const Hd = Number.isFinite(dif?.[i]) ? dif[i] : H * 0.3; 
    const Hb = Math.max(0, H - Hd);
    const Rb = rbPromedioMensual(lat, tiltDeg, n, azimutDeg);
    const HT = Hb * Rb + Hd * (1 + Math.cos(beta)) / 2 + H * rho * (1 - Math.cos(beta)) / 2;
    return Math.max(0, HT);
  });
}

/* ============================================================
   SUBCOMPONENTES COMPARTIDOS
   ============================================================ */

function TabButton({ n, label, active, onClick }) {
  return <button className={`app-tab${active ? ' active' : ''}`} aria-current={active ? 'step' : undefined} onClick={onClick}>
    <span>{n}</span>{label}
  </button>;
}

function Field({ label, children, hint }) {
  const id = useId();
  return <div style={{ marginBottom: 14 }}>
    <label htmlFor={id} style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#3A4453', marginBottom: 5 }}>{label}</label>
    {Children.map(children, child => isValidElement(child) && ['input', 'select', 'textarea'].includes(child.type) ? cloneElement(child, { id }) : child)}
    {hint && <div style={{ fontSize: 11, color: '#627487', marginTop: 5 }}>{hint}</div>}
  </div>;
}

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #D7DCE3",
  fontSize: 13, boxSizing: "border-box", background: "#fff", color: "#16202E",
};

const btnPrimary = {
  padding: "9px 14px", borderRadius: 7, border: "none", background: "#10192B",
  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
};
const btnSecondary = { ...btnPrimary, background: "#fff", color: "#10192B", border: "1px solid #D7DCE3" };
const btnDanger = { ...btnPrimary, background: "#fff", color: "#B3261E", border: "1px solid #F2C6C2" };

function Panel({ title, children, style, icon: Icon }) {
  return (
    <div className="app-panel" style={{ background: "#fff", borderRadius: 12, border: "1px solid #E1E4E9", padding: 16, ...style }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 800, color: "#10192B", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          {Icon && <Icon size={15} />} {title}
        </div>
      )}
      {children}
    </div>
  );
}

/* --------------------------- TAB 1: PROYECTO --------------------------- */

function ProyectoTab({ proyecto, setProyecto, criterio, onValidar }) {
  const set = (k) => (e) => setProyecto((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
      <Panel title="Datos del proyecto">
        <Field label="Nombre / ID del proyecto">
          <input style={inputStyle} value={proyecto.nombre} onChange={set("nombre")} />
        </Field>
        <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Fecha">
            <input type="date" style={inputStyle} value={proyecto.fecha} onChange={set("fecha")} />
          </Field>
          <Field label="Tipo de aplicacion">
            <select style={inputStyle} value={proyecto.tipoApp} onChange={set("tipoApp")}>
              <option value="Off-grid">Sin red eléctrica (off-grid)</option>
              <option value="On-grid">Conectado a la red (on-grid)</option>
              <option value="Hibrido off-grid">Híbrido sin red eléctrica</option>
              <option value="Hibrido on-grid">Híbrido conectado a la red</option>
            </select>
          </Field>
        </div>
        <Field label="Integrantes (uno por linea)">
          <textarea style={{ ...inputStyle, minHeight: 80, fontFamily: "inherit", resize: "vertical" }}
            value={proyecto.integrantes} onChange={set("integrantes")} />
        </Field>
        <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Dias de operacion al mes">
            <input type="number" min={1} max={31} style={inputStyle} value={proyecto.diasMes}
              onChange={(e) => setProyecto((p) => ({ ...p, diasMes: Number(e.target.value) }))} />
          </Field>
          <Field label="Costo unitario CU [$/kWh]">
            <input type="number" min={0} style={inputStyle} value={proyecto.cu}
              onChange={(e) => setProyecto((p) => ({ ...p, cu: Number(e.target.value) }))} />
          </Field>
        </div>
        <button style={btnPrimary} onClick={onValidar}><CheckCircle2 size={15} /> Validar datos del proyecto</button>
      </Panel>

      <Panel title="Cómo usar el proyecto">
        <div style={{ fontSize: 12, color: "#5A6472", lineHeight: 1.6 }}>
          Añade tus aparatos y sus horarios, revisa los paneles y elige el inversor y las baterías.
          Puedes guardar el proyecto y continuar después.
        </div>
        <div style={{ marginTop: 16, padding: 12, background: "#FFF8EC", border: "1px solid #F5DBA5", borderRadius: 8, fontSize: 12, color: "#8A5A00" }}>
          <b>Sistema seleccionado:</b> {proyecto.tipoApp}. Horario diurno: {pad2(criterio.inicio)}:00 a {pad2(criterio.fin)}:00.
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------- TAB 2: CARGAS --------------------------- */

function CargasTab(props) {
  const {
    form, setForm, formError, preview, seleccionId, onAgregar, onLimpiar, onVerificar,
    onEliminarSeleccion, cargasCalc, onSeleccionarFila, onImportarExcelClick,
    factoresInfo,
  } = props;

  const clas = claseColor(preview.texto);
  const Icon = clas.icon;

  return (
    <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>
      <Panel title={seleccionId != null ? "Editar aparato" : "Agregar un aparato"}>
        <Field label="Nombre del aparato">
          <input style={inputStyle} value={form.carga}
            onChange={(e) => setForm((f) => ({ ...f, carga: e.target.value }))} placeholder="Ej.: Aire acondicionado" />
        </Field>
        <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Cantidad">
            <input type="number" min={1} style={inputStyle} value={form.cantidad}
              onChange={(e) => setForm((f) => ({ ...f, cantidad: Number(e.target.value) }))} />
          </Field>
          <Field label="Potencia [W]" hint="Busca los vatios (W) en la etiqueta del aparato.">
            <input type="number" min={0} style={inputStyle} value={form.potencia}
              onChange={(e) => setForm((f) => ({ ...f, potencia: Number(e.target.value) }))} />
          </Field>
        </div>
        <div className="app-schedules" aria-label="Horarios habituales">
          {[['Todo el día', '00-24'], ['Solo de día', '06-18'], ['Solo de noche', '18-06']].map(([texto, horario]) => <button key={horario} type="button" aria-pressed={form.horarioTexto === horario} onClick={() => setForm(f => ({ ...f, horarioTexto: horario }))}>{texto}</button>)}
        </div>
        <Field label="Horario de uso">
          <input style={inputStyle} value={form.horarioTexto}
            onChange={(e) => setForm((f) => ({ ...f, horarioTexto: e.target.value }))} placeholder="08-12;14-17" />
          <div style={{ fontSize: 11, color: "#8A93A0", marginTop: 4 }}>
            Ejemplo: 08-12;14-17 significa de 8 a 12 y de 14 a 17 horas.
          </div>
        </Field>

        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
          borderRadius: 8, background: clas.bg, color: clas.fg, fontWeight: 700, fontSize: 12, marginBottom: 10,
        }}>
          <Icon size={15} /> Clasificacion: {preview.texto}
        </div>
        {(formError || preview.error) && (
          <div style={{ fontSize: 11.5, color: "#B3261E", marginBottom: 10, display: "flex", gap: 6 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {formError || preview.error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button style={btnSecondary} onClick={onVerificar}><CheckCircle2 size={14} /> Verificar horario</button>
          <button style={btnPrimary} onClick={onAgregar}>
            {seleccionId != null ? <Pencil size={14} /> : <Plus size={14} />}
            {seleccionId != null ? "Actualizar carga" : "Agregar carga"}
          </button>
          {seleccionId != null && (
            <button style={btnDanger} onClick={onEliminarSeleccion}><Trash2 size={14} /> Eliminar seleccionada</button>
          )}
          <button style={btnSecondary} onClick={onLimpiar}><Eraser size={14} /> Limpiar formulario</button>
        </div>
      </Panel>

      <Panel title="Cuadro de cargas">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <button style={btnSecondary} onClick={onImportarExcelClick}><Upload size={14} /> Importar linea base Excel</button>
          <div style={{ flex: 1 }} />
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #E1E4E9", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#F4F6F8", textAlign: "left" }}>
                {["Item", "Carga", "Cant.", "P. unit [W]", "P. total [W]", "Horas/dia", "Clasificacion", "Horario"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid #E1E4E9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargasCalc.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 18, textAlign: "center", color: "#8A93A0" }}>
                  No hay cargas registradas todavia.
                </td></tr>
              )}
              {cargasCalc.map((c) => {
                const clas2 = claseColor(c.clasificacion);
                return (
                  <tr key={c.id} onClick={() => onSeleccionarFila(c)} style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={td}>{c.item}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{c.carga}</td>
                    <td style={td}>{c.cantidad}</td>
                    <td style={td}>{c.potenciaUnitaria}</td>
                    <td style={td}>{c.potenciaTotal}</td>
                    <td style={td}>{c.horasUso}</td>
                    <td style={td}>
                      <span style={{ background: clas2.bg, color: clas2.fg, padding: "2px 8px", borderRadius: 999, fontWeight: 700, fontSize: 11 }}>
                        {c.clasificacion}
                      </span>
                    </td>
                    <td style={{ ...td, fontFamily: "'Courier New',monospace" }}>{c.horarioTexto}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: "#8A93A0", marginTop: 10 }}>{factoresInfo || "Puedes agregar aparatos o importar una hoja de cálculo."}</div>
        <div style={{ fontSize: 11, color: "#8A93A0", marginTop: 4 }}>
          Clic sobre una fila para editarla o eliminarla desde el panel izquierdo.
        </div>
      </Panel>
    </div>
  );
}

const td = { padding: "7px 10px", borderBottom: "1px solid #F0F2F4" };

/* --------------------------- TAB 3: RESULTADOS --------------------------- */

function ResultadosTab({ resultados, chartData, criterio, setCriterio, nCargas, onGenerarInforme, onGenerarInformePDF }) {
  const tarjetas = [
    { titulo: "Potencia instalada", valor: `${(resultados.pInst / 1000).toFixed(2)} kW`, icon: Gauge },
    { titulo: "Demanda maxima", valor: `${(resultados.pMax / 1000).toFixed(2)} kW`, icon: Zap },
    { titulo: "Energia diaria", valor: `${resultados.energiaDia.toFixed(2)} kWh/dia`, icon: BatteryCharging },
    { titulo: "Energia mensual", valor: `${resultados.energiaMes.toFixed(2)} kWh/mes`, icon: CalendarDays },
    { titulo: "Costo diario", valor: `$ ${Math.round(resultados.costoDia)}`, icon: Coins },
    { titulo: "Costo mensual", valor: `$ ${Math.round(resultados.costoMes)}`, icon: Coins },
    { titulo: "Costo anual", valor: `$ ${Math.round(resultados.costoAnio)}`, icon: Coins },
    { titulo: "Hora pico", valor: resultados.pMax > 0 ? `${pad2(resultados.horaPico)}:00` : "--:--", icon: Clock },
  ];

  return (
    <div>
      <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {tarjetas.map((t) => (
          <div key={t.titulo} style={{
            background: "#fff", border: "1px solid #E1E4E9", borderRadius: 12, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8A93A0", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
              <t.icon size={13} /> {t.titulo}
            </div>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: 22, fontWeight: 800, color: "#10192B", marginTop: 6 }}>
              {t.valor}
            </div>
          </div>
        ))}
      </div>

      <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "2.1fr 1fr", gap: 16, marginBottom: 18 }}>
        <Panel title="Perfil horario de demanda · 24 h">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
              <XAxis dataKey="hora" interval={1} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "kW", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} kW`, "Demanda"]} />
              <Line type="stepAfter" dataKey="kw" stroke="#F5A623" strokeWidth={2.4} dot={false} />
              {resultados.pMax > 0 && (
                <ReferenceDot x={chartData[resultados.horaPico]?.hora} y={resultados.pMax / 1000}
                  r={5} fill="#10192B" stroke="none"
                  label={{ value: `Max ${(resultados.pMax / 1000).toFixed(2)} kW`, position: "top", fontSize: 11, fontWeight: 700 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Demanda por hora" style={{ maxHeight: 340, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: "left", color: "#8A93A0" }}>
              <th style={{ padding: "4px 6px" }}>Hora</th><th style={{ padding: "4px 6px" }}>Demanda [kW]</th>
            </tr></thead>
            <tbody>
              {chartData.map((d) => (
                <tr key={d.hora} style={{ borderTop: "1px solid #F0F2F4" }}>
                  <td style={{ padding: "4px 6px" }}>{d.hora}</td>
                  <td style={{ padding: "4px 6px", fontFamily: "'Courier New',monospace" }}>{d.kw.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Horario del día e informe">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-end" }}>
          <Field label="Inicio dia">
            <input type="number" min={0} max={23} style={{ ...inputStyle, width: 90 }} value={criterio.inicio}
              onChange={(e) => setCriterio((c) => ({ ...c, inicio: Math.round(Number(e.target.value)) }))} />
          </Field>
          <Field label="Fin dia">
            <input type="number" min={1} max={24} style={{ ...inputStyle, width: 90 }} value={criterio.fin}
              onChange={(e) => setCriterio((c) => ({ ...c, fin: Math.round(Number(e.target.value)) }))} />
          </Field>
          <div style={{ fontSize: 12, color: "#5A6472", marginBottom: 12 }}>
            Diurno {pad2(criterio.inicio)}:00-{pad2(criterio.fin === 24 ? 0 : criterio.fin)}:00 | Nocturno: periodo complementario
          </div>
          <div style={{ flex: 1 }} />
          <button style={btnPrimary} onClick={onGenerarInformePDF}><FileDown size={14} /> Generar informe (PDF)</button>
          <button style={btnSecondary} onClick={onGenerarInforme}><FileDown size={14} /> Informe detallado (HTML)</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12.5, color: "#3A4453", display: "flex", alignItems: "center", gap: 6 }}>
          <ListChecks size={14} />
          Cargas: {nCargas} | Diurnas: {resultados.nDiurnas} | Nocturnas: {resultados.nNocturnas} | Mixtas: {resultados.nMixtas} | Sin horario: {resultados.sinHorario}.
          Energia dentro de la ventana solar: {resultados.energiaDentro.toFixed(2)} kWh/dia | Fuera: {resultados.energiaFuera.toFixed(2)} kWh/dia.
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------- TAB 4: GENERADOR FV (RETO 02) --------------------------- */

function GeneradorTab(props) {
  const {
    resultados, gen, setGen, sitio, baseSolar, recursoMensual, hspAnual, hspCritico,
    mesCriticoIdx, hspUsado, onConsultarNasaPower, modulo, dimension, mejorOpcionId,
    onGenerarInforme, onGenerarInformePDF,
    fuenteDatosInfo, onImportarCatalogoClick, onImportarBaseSolarClick,
  } = props;

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const datosMensuales = recursoMensual.map((v, i) => ({ mes: MESES[i], hsp: +v.toFixed(2) }));

  return (
    <div>
      <details className="app-details"><summary>Origen de los datos solares y del catálogo</summary><p>{fuenteDatosInfo}</p></details>

      <Panel icon={PanelsTopLeft} title="Tu consumo de energía" style={{ marginBottom: 16 }}>
        <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { t: "Energia diaria (Ed)", v: `${resultados.energiaDia.toFixed(2)} kWh/dia` },
            { t: "Demanda maxima (Pmax)", v: `${(resultados.pMax / 1000).toFixed(2)} kW` },
            { t: "Hora de demanda maxima", v: `${pad2(resultados.horaPico)}:00` },
            { t: "Dentro / fuera ventana solar", v: `${resultados.energiaDentro.toFixed(2)} / ${resultados.energiaFuera.toFixed(2)} kWh` },
          ].map((x) => (
            <div key={x.t} style={{ background: "#F9FAFB", border: "1px solid #EEF1F5", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: "#8A93A0", textTransform: "uppercase", fontWeight: 700 }}>{x.t}</div>
              <div style={{ fontFamily: "'Courier New',monospace", fontWeight: 700, fontSize: 15, color: "#10192B" }}>{x.v}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Panel icon={Sun} title="Sol disponible en tu ubicación">
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button style={gen.modoRecurso === "local" ? btnPrimary : btnSecondary}
              onClick={() => setGen({ modoRecurso: "local" })}><Database size={14} /> Elegir ubicación</button>
            <button style={gen.modoRecurso === "api" ? btnPrimary : btnSecondary}
              onClick={() => setGen({ modoRecurso: "api" })}><Wifi size={14} /> Consultar datos de la NASA</button>
          </div>

          {gen.modoRecurso === "local" ? (
            <>
              <Field label="Sitio documentado">
                <select style={inputStyle} value={gen.sitioId} onChange={(e) => setGen({ sitioId: e.target.value })}>
                  {baseSolar.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </Field>
              <div style={{ fontSize: 11.5, color: "#5A6472", lineHeight: 1.5, marginBottom: 6 }}>
                <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />
                {sitio.lat}°, {sitio.lon}° · Inclinacion {sitio.inclinacion}° · Azimut {sitio.azimut}°<br />
                Fuente: {sitio.fuente} · Consultado: {sitio.fechaConsulta}
              </div>
              <button style={btnSecondary} onClick={onImportarBaseSolarClick}>
                <Upload size={14} /> Importar base solar (JSON)
              </button>
            </>
          ) : (
            <>
              <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Latitud (°)">
                  <input type="number" step="0.01" min="-90" max="90" style={inputStyle} value={gen.lat}
                    onChange={(e) => setGen({ lat: Number(e.target.value) })} />
                </Field>
                <Field label="Longitud (°)">
                  <input type="number" step="0.01" min="-180" max="180" style={inputStyle} value={gen.lon}
                    onChange={(e) => setGen({ lon: Number(e.target.value) })} />
                </Field>
                <Field label="Inclinacion (°)">
                  <input type="number" min="0" max="90" style={inputStyle} value={gen.inclinacion}
                    onChange={(e) => setGen({ inclinacion: Number(e.target.value) })} />
                </Field>
                <Field label="Azimut (° desde N, 180=sur)">
                  <input type="number" min="0" max="360" style={inputStyle} value={gen.azimut}
                    onChange={(e) => setGen({ azimut: Number(e.target.value) })} />
                </Field>
              </div>
              <button style={btnPrimary} onClick={onConsultarNasaPower} disabled={gen.apiStatus === "cargando"}>
                <Wifi size={14} /> {gen.apiStatus === "cargando" ? "Consultando..." : "Consultar NASA POWER"}
              </button>
              {gen.apiMensaje && (
                <div style={{
                  marginTop: 10, fontSize: 11.5, lineHeight: 1.5, padding: "8px 10px", borderRadius: 8,
                  display: "flex", gap: 6,
                  background: gen.apiStatus === "ok" ? "#E6F5EC" : "#FFF3DE",
                  color: gen.apiStatus === "ok" ? "#1E7A46" : "#8A5A00",
                }}>
                  {gen.apiStatus === "ok" ? <Wifi size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <WifiOff size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
                  {gen.apiMensaje}
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button style={gen.criterioDimension === "anual" ? btnPrimary : btnSecondary}
              onClick={() => setGen({ criterioDimension: "anual" })}>Promedio anual ({hspAnual.toFixed(2)})</button>
            <button style={gen.criterioDimension === "critico" ? btnPrimary : btnSecondary}
              onClick={() => setGen({ criterioDimension: "critico" })}>
              Mes critico: {MESES[mesCriticoIdx]} ({hspCritico.toFixed(2)})
            </button>
          </div>
        </Panel>

        <Panel icon={CalendarDays} title="Energía solar disponible por mes [kWh/m²·día]">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={datosMensuales} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="hsp" fill="#F5A623" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: "#5A6472", marginTop: 6 }}>
            Sol disponible para el cálculo: <b>{hspUsado.toFixed(2)} kWh/m²·día</b> ({gen.criterioDimension === "anual" ? "promedio anual" : "mes critico"}).
          </div>
        </Panel>
      </div>

      <details className="app-details"><summary>Opciones avanzadas y catálogo de paneles</summary>
      <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Panel icon={Settings2} title="Ajustes de los paneles">
          <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Rendimiento esperado de los paneles (PR)" hint="El valor 0,70 considera pérdidas del generador.">
              <input type="number" step="0.01" min="0.3" max="0.95" style={inputStyle} value={gen.pr}
                onChange={(e) => setGen({ pr: Number(e.target.value) })} />
            </Field>
            <Field label="Tension maxima del sistema [V]">
              <input type="number" min="0" style={inputStyle} value={gen.vMaxSistema}
                onChange={(e) => setGen({ vMaxSistema: Number(e.target.value) })} />
            </Field>
            <Field label="Temp. ambiente minima esperada [°C]">
              <input type="number" style={inputStyle} value={gen.tMinAmbiente}
                onChange={(e) => setGen({ tMinAmbiente: Number(e.target.value) })} />
            </Field>
            <Field label="Temp. ambiente de operacion [°C]">
              <input type="number" style={inputStyle} value={gen.tOperacion}
                onChange={(e) => setGen({ tOperacion: Number(e.target.value) })} />
            </Field>
            <Field label="Area disponible [m²]">
              <input type="number" min="0" style={inputStyle} value={gen.areaDisponible}
                onChange={(e) => setGen({ areaDisponible: Number(e.target.value) })} />
            </Field>
            <Field label="Modulo preferido (solo si se fuerza manualmente)"
              hint={gen.moduloForzado ? "Activo: se esta usando este modulo." : "Inactivo: la app esta usando el de menor excedente automaticamente."}>
              <select style={inputStyle} value={gen.moduloSeleccionadoId} disabled={!gen.moduloForzado}
                onChange={(e) => setGen({ moduloSeleccionadoId: e.target.value })}>
                {gen.catalogo.map((m) => <option key={m.id} value={m.id}>{m.fabricante} {m.modelo} ({m.potencia} Wp)</option>)}
              </select>
            </Field>
          </div>
        </Panel>

        <Panel icon={Grid3x3} title="Comparar paneles solares">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#3A4453" }}>
              <input type="checkbox" checked={gen.moduloForzado}
                onChange={(e) => setGen({ moduloForzado: e.target.checked })} />
              Forzar modulo manualmente (desactiva la seleccion automatica)
            </label>
            <button style={btnSecondary} onClick={onImportarCatalogoClick}>
              <Upload size={13} /> Importar catalogo (JSON)
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: "#F4F6F8", textAlign: "left" }}>
                  <th style={thSm}>Modulo</th><th style={thSm}>Wp</th><th style={thSm}>N° mod.</th>
                  <th style={thSm}>Excedente</th><th style={thSm}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {dimension.opciones?.map((o) => {
                  const esActiva = o.id === modulo?.id;
                  const esAuto = o.id === mejorOpcionId;
                  return (
                    <tr key={o.id} style={{
                      background: esActiva ? "#FFF3DE" : o.descartado ? "#FAFAFA" : "transparent",
                      fontWeight: esActiva ? 700 : 400,
                      color: o.descartado ? "#B0B5BC" : "inherit",
                      textDecoration: o.descartado ? "line-through" : "none",
                    }}>
                      <td style={tdSm}>{o.nombre}</td>
                      <td style={tdSm}>{gen.catalogo.find((m) => m.id === o.id)?.potencia}</td>
                      <td style={tdSm}>{o.descartado ? "—" : o.nTotal}</td>
                      <td style={tdSm}>{o.descartado ? "—" : `${o.excedentePct >= 0 ? "+" : ""}${o.excedentePct.toFixed(1)}%`}</td>
                      <td style={{ ...tdSm, textDecoration: "none", fontSize: 10.5 }}>
                        {o.descartado ? "Descartado" : esActiva ? (esAuto ? "✓ Usado (auto)" : "✓ Usado (forzado)") : esAuto ? "Mejor opcion" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {dimension.opciones?.some((o) => o.descartado) && (
            <div style={{ fontSize: 10.5, color: "#8A93A0", marginTop: 6 }}>
              Descartado = su Voc corregido a Tmin supera la tensión máxima del
              sistema declarada; ninguna cadena en serie es viable bajo ${gen.vMaxSistema} V.
            </div>
          )}
          <div style={{ fontSize: 11, color: "#5A6472", marginTop: 8 }}>
            {gen.moduloForzado
              ? "Seleccion manual activa: se usa el modulo elegido en \"Modulo preferido\", aunque no sea el de menor excedente."
              : "Seleccion automatica activa: se usa siempre el modulo viable de menor excedente de potencia (fila resaltada)."}
          </div>
        </Panel>
      </div>

      </details>

      <Panel icon={Zap} title="Tus paneles solares">
        {dimension.bloqueado ? (
          <div style={{ padding: 16, background: "#FDEDEC", color: "#B3261E", borderRadius: 8, border: "1px solid #F2C6C2" }}>
            <div style={{ fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={16} /> Revisa estos datos para calcular los paneles
            </div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {dimension.errores.map((err, idx) => <li key={idx} style={{ fontSize: 13, marginBottom: 4 }}>{err}</li>)}
            </ul>
          </div>
        ) : (
          <>
            <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
              <Metric titulo="Potencia pico requerida" valor={`${dimension.ppico.toFixed(2)} kWp`} />
              <Metric titulo="Modulos seleccionados" valor={`${dimension.nTotal} × ${modulo.potencia} Wp`} />
              <Metric titulo="Potencia instalada" valor={`${(dimension.pInstalada / 1000).toFixed(2)} kWp`} />
              <Metric titulo="Excedente / deficit" valor={`${dimension.excedentePct >= 0 ? "+" : ""}${dimension.excedentePct.toFixed(1)} %`}
                warn={Math.abs(dimension.excedentePct) > 25} />
            </div>
            <details className="app-details"><summary>Ver conexión y comprobaciones eléctricas de los paneles</summary>
              <div className="app-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              <Metric titulo="Configuracion" valor={`${dimension.nParalelo} cadena(s) × ${dimension.nSerie} en serie`} />
              <Metric titulo="Max. modulos en serie" valor={`${dimension.nSerieMax} (límite ${gen.vMaxSistema} V)`} />
              <Metric titulo="Voc generador (Tmin)" valor={`${dimension.vocGen.toFixed(1)} V`} />
              <Metric titulo="Vmp generador (Top)" valor={`${dimension.vmpGenOperacion.toFixed(1)} V`} />
              <Metric titulo="Isc generador" valor={`${dimension.iscGen.toFixed(1)} A`} />
              <Metric titulo="Corriente de diseño" valor={`${dimension.iDiseno.toFixed(1)} A`} hint="NTC 2050 art. 690-8: 1.25×1.25×Isc" />
              <Metric titulo="Temp. celda estimada" valor={`${dimension.tCelda.toFixed(1)} °C`} hint="Modelo NOCT" />
              <Metric titulo="Area del generador" valor={`${dimension.areaGen.toFixed(2)} m²`}
                warn={!dimension.cabeEnArea} />
              </div>
            </details>
            {!dimension.cabeEnArea && (
              <div style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#FDEDEC", color: "#B3261E", borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                El area del generador ({dimension.areaGen.toFixed(2)} m²) supera el area disponible declarada ({gen.areaDisponible} m²).
              </div>
            )}
            <div style={{ fontSize: 11.5, color: "#5A6472", lineHeight: 1.6 }}>
              Producción estimada de los paneles: <b>{dimension.energiaGenerador.toFixed(2)} kWh al día</b>.
              <details className="app-details"><summary>Ver método de cálculo</summary>PR = {gen.pr}; temperatura de celda por modelo NOCT con G=1000 W/m²; corrección de Voc y Vmp con βVoc.</details>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button style={btnPrimary} onClick={onGenerarInformePDF}><FileDown size={14} /> Descargar informe</button>
              <button style={btnSecondary} onClick={onGenerarInforme}><FileDown size={14} /> Informe detallado (HTML)</button>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

function Metric({ titulo, valor, hint, warn }) {
  return (
    <div style={{ background: warn ? "#FDEDEC" : "#F9FAFB", border: `1px solid ${warn ? "#F2C6C2" : "#EEF1F5"}`, borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 9.5, color: warn ? "#B3261E" : "#8A93A0", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".03em" }}>{titulo}</div>
      <div style={{ fontFamily: "'Courier New',monospace", fontWeight: 800, fontSize: 15, color: warn ? "#B3261E" : "#10192B" }}>{valor}</div>
      {hint && <div style={{ fontSize: 9.5, color: "#8A93A0", marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

const thSm = { padding: "6px 8px", borderBottom: "1px solid #E1E4E9" };
const tdSm = { padding: "6px 8px", borderBottom: "1px solid #F0F2F4" };

function ModalDialog({ modal, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(11,18,32,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, width: 380, maxWidth: "90%" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#10192B" }}>{modal.titulo}</div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#8A93A0" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: 13, color: "#3A4453", whiteSpace: "pre-line", lineHeight: 1.5 }}>{modal.mensaje}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          {modal.tipo === "confirm" && (
            <button style={btnSecondary} onClick={onClose}>Cancelar</button>
          )}
          <button style={modal.tipo === "confirm" ? btnDanger : btnPrimary}
            onClick={modal.tipo === "confirm" ? modal.onConfirm : onClose}>
            {modal.tipo === "confirm" ? "Eliminar" : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
}
