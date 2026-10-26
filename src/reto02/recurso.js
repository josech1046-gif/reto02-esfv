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

export function transponerATiltoMensual({ lat, tiltDeg, azimutDeg, ghi, dif, rho = 0.2 }) {
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
