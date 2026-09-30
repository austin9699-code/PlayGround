// RECON · motores de cálculo de reconstrucción de accidentes
const G = 9.81;
const $ = (id) => document.getElementById(id);
const kmh2ms = (v) => v / 3.6;
const ms2kmh = (v) => v * 3.6;
const fmt = (n, d = 1) => (isFinite(n) ? n.toFixed(d) : "—");

function pushHistorial(titulo, detalle) {
  const h = JSON.parse(localStorage.getItem("recon_hist") || "[]");
  h.unshift({ t: new Date().toLocaleString("es-ES"), titulo, detalle });
  localStorage.setItem("recon_hist", JSON.stringify(h.slice(0, 50)));
  renderHistorial();
}
function renderHistorial() {
  const h = JSON.parse(localStorage.getItem("recon_hist") || "[]");
  const ul = $("listaHistorial");
  if (!ul) return;
  ul.innerHTML = h.length
    ? h.map((x) => `<li><b>${x.titulo}</b><br>${x.detalle}<br><small>${x.t}</small></li>`).join("")
    : "<li>Sin cálculos todavía.</li>";
}
function setInforme(txt) { $("informe").textContent = txt; }

// --- pestañas ---
document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $("panel-" + b.dataset.tab).classList.add("active");
  })
);
document.querySelectorAll("[data-swap]").forEach((b) =>
  b.addEventListener("click", () => $("swap-" + b.dataset.swap).classList.toggle("hidden"))
);

function invalid(msg, el) {
  $(el).innerHTML = "⚠️ " + msg;
  return false;
}

function calcFrenado() {
  const d = parseFloat($("f-d").value), mu = parseFloat($("f-mu").value);
  const k = parseFloat($("f-k").value), i = parseFloat($("f-i").value) / 100;
  const muEf = mu * k + i;
  if (!(d > 0) || !(mu > 0)) return invalid("Revisa d y μ (deben ser > 0).", "res-frenado");
  if (muEf <= 0) return invalid("Adherencia efectiva ≤ 0 (pendiente en bajada muy fuerte). Revisa i.", "res-frenado");
  const vms = Math.sqrt(2 * G * d * muEf);
  const vkm = ms2kmh(vms);
  const txt = `FRENADO · d=${d} m, μ=${mu}, k=${k}, i=${(i * 100).toFixed(1)}% → v = ${fmt(vkm)} km/h (${fmt(vms, 2)} m/s)`;
  $("res-frenado").innerHTML = `✅ Velocidad estimada: <b>${fmt(vkm)} km/h</b> (${fmt(vms, 2)} m/s)<br><small>μ efectiva = ${fmt(muEf, 3)} · Rango ±10% por incertidumbre de μ: ${fmt(vkm * 0.9)} – ${fmt(vkm * 1.1)} km/h</small>`;
  setInforme(txt); pushHistorial("Frenado", txt);
}
function calcFrenadoInv() {
  const vkm = parseFloat($("f-vinv").value), mu = parseFloat($("f-mu").value);
  const k = parseFloat($("f-k").value), i = parseFloat($("f-i").value) / 100;
  const muEf = mu * k + i;
  if (!(vkm > 0) || muEf <= 0) return invalid("Revisa velocidad y adherencia efectiva.", "res-frenado");
  const vms = kmh2ms(vkm);
  const d = (vms * vms) / (2 * G * muEf);
  const txt = `FRENADO INVERSO · v=${vkm} km/h → distancia de huella ≈ ${fmt(d)} m`;
  $("res-frenado").innerHTML = `✅ Distancia de frenada: <b>${fmt(d)} m</b>`;
  setInforme(txt); pushHistorial("Frenado inverso", txt);
}
function calcAtropello() {
  const d = parseFloat($("a-d").value), mu = parseFloat($("a-mu").value), met = $("a-met").value;
  if (!(d > 0) || !(mu > 0)) return invalid("Revisa d y μ.", "res-atropello");
  let vms, tag;
  if (met === "searle") { vms = Math.sqrt((2 * mu * G * d) / (1 + mu * mu)); tag = "Searle (mínima)"; }
  else { vms = Math.sqrt(2 * mu * G * d); tag = "Simple (orientativa)"; }
  const vkm = ms2kmh(vms);
  const txt = `ATROPELLO [${tag}] · d=${d} m, μ=${mu} → v ≈ ${fmt(vkm)} km/h (${fmt(vms, 2)} m/s)`;
  $("res-atropello").innerHTML = `✅ Velocidad de impacto estimada [${tag}]: <b>${fmt(vkm)} km/h</b> (${fmt(vms, 2)} m/s)<br><small>Rango prudente: ${fmt(vkm)} – ${fmt(vkm * 1.2)} km/h según Searle/Collins.</small>`;
  setInforme(txt); pushHistorial("Atropello", txt);
}
function calcCurva() {
  const R = parseFloat($("c-r").value), mu = parseFloat($("c-mu").value), e = parseFloat($("c-e").value) / 100;
  if (!(R > 0) || !(mu > 0)) return invalid("Revisa R y μ.", "res-curva");
  const denom = 1 - mu * e;
  if (denom <= 0) return invalid("Peralte/adherencia incompatibles (1−μ·e ≤ 0).", "res-curva");
  const vc = Math.sqrt((G * R * (mu + e)) / denom);
  const vck = ms2kmh(vc);
  const alat = (vc * vc) / (G * R);
  let extra = "";
  const hv = parseFloat($("c-hv").value);
  if (hv > 0) extra = `<br><small>SSF vuelco ≈ ${fmt(hv, 2)} (si SSF &lt; μ, vuelca antes de derrapar).</small>`;
  const txt = `CURVA · R=${R} m, μ=${mu}, e=${(e * 100).toFixed(1)}% → Vc ≈ ${fmt(vck)} km/h (alat ≈ ${fmt(alat, 2)} g)`;
  $("res-curva").innerHTML = `✅ Velocidad crítica: <b>${fmt(vck)} km/h</b> (${fmt(vc, 2)} m/s)<br><small>Aceleración lateral ≈ ${fmt(alat, 2)} g</small>${extra}`;
  setInforme(txt); pushHistorial("Curva crítica", txt);
}
function calcCaida() {
  const h = parseFloat($("k-h").value), L = parseFloat($("k-l").value), v0in = parseFloat($("k-v0").value);
  if (!(h > 0)) return invalid("La altura debe ser > 0.", "res-caida");
  const t = Math.sqrt((2 * h) / G);
  const vImp = Math.sqrt(2 * G * h);
  let html = `⏱️ Tiempo de caída: <b>${fmt(t, 2)} s</b><br>💥 Velocidad de impacto vertical: <b>${fmt(ms2kmh(vImp))} km/h</b> (${fmt(vImp, 2)} m/s)`;
  let txt = `CAÍDA · h=${h} m → t=${fmt(t, 2)} s, v_impacto=${fmt(ms2kmh(vImp))} km/h`;
  if (L > 0) {
    const v0 = L / t, v0k = ms2kmh(v0);
    html += `<br>🚀 Velocidad horizontal deducida del alcance L=${L} m: <b>${fmt(v0k)} km/h</b> (${fmt(v0, 2)} m/s)`;
    txt += `, v0(${L} m)=${fmt(v0k)} km/h`;
  }
  if (v0in > 0) {
    const v0ms = kmh2ms(v0in), alcance = v0ms * t;
    html += `<br>📏 Con v₀=${v0in} km/h el alcance sería ≈ <b>${fmt(alcance)} m</b>`;
    txt += `; alcance con v0=${v0in} km/h ≈ ${fmt(alcance)} m`;
  }
  $("res-caida").innerHTML = html;
  setInforme(txt); pushHistorial("Caída", txt);
}
function calcDetencion() {
  const vkm = parseFloat($("d-v").value), tr = parseFloat($("d-tr").value);
  const mu = parseFloat($("d-mu").value), i = parseFloat($("d-i").value) / 100;
  const a = G * (mu + i);
  if (!(vkm > 0) || !(a > 0)) return invalid("Revisa velocidad y μ efectiva.", "res-detencion");
  const vms = kmh2ms(vkm);
  const dr = vms * tr, df = (vms * vms) / (2 * a), dt = dr + df;
  const txt = `DETENCIÓN · v=${vkm} km/h, tr=${tr}s, μ=${mu} → reacción ${fmt(dr)} m + frenada ${fmt(df)} m = TOTAL ${fmt(dt)} m`;
  $("res-detencion").innerHTML = `✅ Reacción: <b>${fmt(dr)} m</b> + Frenada: <b>${fmt(df)} m</b> = <b>Total ${fmt(dt)} m</b>`;
  setInforme(txt); pushHistorial("Detención", txt);
}
function calcDetencionInv() {
  const D = parseFloat($("d-dinv").value), tr = parseFloat($("d-tr").value);
  const mu = parseFloat($("d-mu").value), i = parseFloat($("d-i").value) / 100;
  const a = G * (mu + i);
  if (!(D > 0) || !(a > 0)) return invalid("Revisa distancia y μ.", "res-detencion");
  const vms = -a * tr + Math.sqrt(a * tr * a * tr + 2 * a * D); // raíz positiva de v²/2a + v·tr − D = 0
  const txt = `DETENCIÓN INVERSA · D=${D} m, tr=${tr}s → velocidad máx. ≈ ${fmt(ms2kmh(vms))} km/h`;
  $("res-detencion").innerHTML = `✅ Velocidad máxima para detenerse en ${D} m: <b>${fmt(ms2kmh(vms))} km/h</b>`;
  setInforme(txt); pushHistorial("Detención inversa", txt);
}
function calcColision() {
  const m1 = parseFloat($("x-m1").value), m2 = parseFloat($("x-m2").value);
  const d = parseFloat($("x-d").value), mu = parseFloat($("x-mu").value);
  if (!(m1 > 0) || !(m2 >= 0) || !(d > 0) || !(mu > 0)) return invalid("Revisa masas, d y μ.", "res-colision");
  const vcom = Math.sqrt(2 * mu * G * d);
  const v1 = ((m1 + m2) / m1) * vcom;
  const txt = `COLISIÓN · m1=${m1}kg, m2=${m2}kg, d_post=${d}m, μ=${mu} → v_común=${fmt(ms2kmh(vcom))} km/h, v1_impacto≈${fmt(ms2kmh(v1))} km/h`;
  $("res-colision").innerHTML = `✅ v conjunta tras impacto: <b>${fmt(ms2kmh(vcom))} km/h</b><br>✅ v₁ estimada antes del impacto (2.º parado): <b>${fmt(ms2kmh(v1))} km/h</b>`;
  setInforme(txt); pushHistorial("Colisión", txt);
}
function calcEnergia() {
  const m = parseFloat($("e-m").value), vkm = parseFloat($("e-v").value);
  if (!(m > 0) || !(vkm > 0)) { $("res-energia").innerHTML = "⚠️ Revisa masa y velocidad."; return; }
  const vms = kmh2ms(vkm), E = 0.5 * m * vms * vms;
  const tnt = E / 4184000;
  const txt = `ENERGÍA · m=${m}kg a ${vkm} km/h → E ≈ ${(E / 1000).toFixed(1)} kJ (≈${tnt.toFixed(4)} kg TNT)`;
  $("res-energia").innerHTML = `✅ Energía cinética: <b>${(E / 1000).toFixed(1)} kJ</b> <small>(${(E).toFixed(0)} J)</small>`;
  setInforme(txt); pushHistorial("Energía", txt);
}

document.querySelectorAll("[data-calc]").forEach((b) =>
  b.addEventListener("click", () => {
    ({ frenado: calcFrenado, frenadoInv: calcFrenadoInv, atropello: calcAtropello, curva: calcCurva, caida: calcCaida, detencion: calcDetencion, detencionInv: calcDetencionInv, colision: calcColision, energia: calcEnergia })[b.dataset.calc]();
  })
);

$("btnInforme").addEventListener("click", () => {
  const h = JSON.parse(localStorage.getItem("recon_hist") || "[]");
  const txt = "INFORME RECON — " + new Date().toLocaleString("es-ES") + "\n" + "=".repeat(46) + "\n" +
    (h.length ? h.map((x, n) => `${n + 1}. [${x.t}] ${x.titulo}: ${x.detalle}`).join("\n") : "(sin cálculos)") +
    "\n\nNota: valores orientativos. Indicar μ, método y mediciones en el dictamen.";
  setInforme(txt);
});
$("btnHistorial").addEventListener("click", () => { $("cardHistorial").classList.toggle("hidden"); renderHistorial(); });
$("btnLimpiar").addEventListener("click", () => { localStorage.removeItem("recon_hist"); renderHistorial(); setInforme("Historial borrado."); });
$("btnCopiar").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("informe").textContent); $("btnCopiar").textContent = "¡Copiado!"; setTimeout(() => ($("btnCopiar").textContent = "Copiar"), 1500); }
  catch { alert("No se pudo copiar. Selecciona el texto manualmente."); }
});
$("btnImprimir").addEventListener("click", () => window.print());

renderHistorial();

// Exponer para pruebas Node (sin DOM no hace nada)
if (typeof module !== "undefined") {
  module.exports = { G, kmh2ms, ms2kmh };
}
