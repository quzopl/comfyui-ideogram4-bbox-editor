const { app } = window.comfyAPI.app;

const STYLE = `
.ideo4{--bg:#0e0f12;--panel:#16181d;--panel2:#1d2026;--line:#2a2e36;--txt:#e6e7ea;
  --mut:#9aa0aa;--acc:#d8743a;--acc2:#3aa0d8;--warn:#e0a83a;--err:#e0544a;--ok:#4ab86a;
  --grid:rgba(255,255,255,.06);--mono:ui-monospace,Menlo,Consolas,monospace;--sans:system-ui,sans-serif;
  background:var(--bg);color:var(--txt);font:14px/1.45 var(--sans);
  display:flex;flex-direction:column;gap:10px;padding:10px;border-radius:8px;height:100%;box-sizing:border-box}
.ideo4 *{box-sizing:border-box}
.ideo4 .toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ideo4 .seg{display:flex;border:1px solid var(--line);border-radius:7px;overflow:hidden}
.ideo4 .seg button{background:var(--panel);color:var(--mut);border:0;padding:6px 11px;cursor:pointer;font:13px var(--sans)}
.ideo4 .seg button.on{background:var(--acc);color:#1a0d05;font-weight:600}
.ideo4 .btn{background:var(--panel2);color:var(--txt);border:1px solid var(--line);padding:6px 11px;border-radius:7px;cursor:pointer;font:13px var(--sans)}
.ideo4 .btn:hover{border-color:var(--acc)}
.ideo4 .btn.acc{background:var(--acc);color:#1a0d05;border-color:var(--acc);font-weight:600}
.ideo4 .arInput{width:74px;text-align:center;font-family:var(--mono)}
.ideo4 .canvas-host{flex:0 0 auto;display:flex;align-items:center;justify-content:center;
  background:repeating-linear-gradient(45deg,#101216 0 10px,#0d0f12 10px 20px);
  border:1px solid var(--line);border-radius:10px;height:300px;padding:14px;overflow:hidden}
.ideo4 .frame{position:relative;background:#1a1d22;box-shadow:0 0 0 1px var(--line);
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:10% 10%,10% 10%}
.ideo4 .bx{position:absolute;border:1.5px solid var(--acc);background:rgba(216,116,58,.12);cursor:move;border-radius:2px}
.ideo4 .bx.sel{border-color:#fff;background:rgba(216,116,58,.22);box-shadow:0 0 0 1px var(--acc)}
.ideo4 .bx .tag{position:absolute;top:-10px;left:6px;background:var(--acc);color:#1a0d05;font:600 12px/1.4 var(--sans);
  padding:1px 6px;border-radius:5px;white-space:nowrap;pointer-events:none;max-width:160px;overflow:hidden;text-overflow:ellipsis}
.ideo4 .bx.text .tag{background:var(--acc2);color:#04161f}
.ideo4 .bx.text{border-color:var(--acc2);background:rgba(58,160,216,.12)}
.ideo4 .h{position:absolute;width:11px;height:11px;background:#fff;border:1px solid var(--acc);border-radius:2px}
.ideo4 .h.se{right:-6px;bottom:-6px;cursor:nwse-resize}
.ideo4 .hint{color:var(--mut);font-size:12px;line-height:1.5}
.ideo4 .field{display:flex;flex-direction:column;gap:4px;margin-bottom:6px}
.ideo4 label.lbl{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.5px}
.ideo4 .lbl .ctr{float:right;text-transform:none;letter-spacing:0;font-family:var(--mono)}
.ideo4 .lbl .ctr.over{color:var(--err)}
.ideo4 input,.ideo4 textarea{background:var(--panel2);color:var(--txt);border:1px solid var(--line);border-radius:7px;
  padding:6px 8px;font:13px var(--sans);width:100%}
.ideo4 textarea{resize:vertical;min-height:46px;font:12px var(--mono);line-height:1.45}
.ideo4 .sec{border:1px solid var(--line);border-radius:9px;padding:11px;background:var(--panel2);display:flex;flex-direction:column;gap:8px}
.ideo4 .sec h2{margin:0;font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.6px;font-weight:600}
.ideo4 .list{display:flex;flex-direction:column;gap:10px;max-height:300px;overflow:auto}
.ideo4 .card{border:1px solid var(--line);border-radius:9px;padding:10px;background:var(--panel2)}
.ideo4 .card.sel{border-color:var(--acc)}
.ideo4 .card .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.ideo4 .card .top b{font-size:13px}
.ideo4 .mini{font-family:var(--mono);font-size:11px;color:var(--mut)}
.ideo4 .x{background:transparent;border:0;color:var(--mut);cursor:pointer;font-size:16px;line-height:1}
.ideo4 .x:hover{color:var(--acc)}
.ideo4 .zb{background:var(--panel);border:1px solid var(--line);color:var(--mut);cursor:pointer;font-size:11px;line-height:1;border-radius:4px;padding:3px 6px}
.ideo4 .zb:hover{color:var(--acc);border-color:var(--acc)}
.ideo4 pre.json{margin:0;background:#0b0c0e;border:1px solid var(--line);border-radius:8px;padding:9px;
  font:12px var(--mono);color:#cdd2da;max-height:140px;overflow:auto;white-space:pre-wrap;word-break:break-word}
.ideo4 .vList{display:flex;flex-direction:column;gap:6px;margin-bottom:8px}
.ideo4 .v{font-size:12px;padding:7px 9px;border-radius:7px;border:1px solid var(--line);display:flex;gap:7px;align-items:flex-start}
.ideo4 .v.warn{border-color:var(--warn);background:rgba(224,168,58,.08)}
.ideo4 .v.err{border-color:var(--err);background:rgba(224,84,74,.08)}
.ideo4 .v .ico{font-weight:700}
.ideo4 .v.warn .ico{color:var(--warn)} .ideo4 .v.err .ico{color:var(--err)}
.ideo4 .v.ok{border-color:var(--ok);background:rgba(74,184,106,.08);color:var(--ok)}
`;

function injectStyleOnce() {
  if (document.getElementById("ideo4-bbox-style")) return;
  const s = document.createElement("style");
  s.id = "ideo4-bbox-style";
  s.textContent = STYLE;
  document.head.appendChild(s);
}

const ARP = { "1:1": [1, 1], "4:5": [4, 5], "9:16": [9, 16], "16:9": [16, 9], "3:1": [3, 1] };
const clamp = (v) => Math.max(0, Math.min(1000, v));
const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wordCount = (s) => ((s || "").trim() ? s.trim().split(/\s+/).length : 0);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function ratioFromSize(sz) {
  const m = ("" + sz).match(/(\d+)\s*[xX*\s]\s*(\d+)/);
  if (!m) return null;
  const w = parseInt(m[1]), h = parseInt(m[2]);
  if (!w || !h) return null;
  const g = gcd(w, h);
  return w / g + ":" + h / g;
}

// validation regexes (v15 guideline checks)
const WARM_RE = /\bwarm(\b|ly)/i;
const RENDER_RE = /\b(bokeh|depth of field|shallow focus|f\/\d|mm lens|telephoto|chromatic aberration|lens flare|vignett|film grain|motion blur|iso \d|drop shadow|cast shadow|casts a shadow)\b/i;
const PART_WORDS = /\b(thorax|abdomen|wingtip|left leg|right leg|left arm|right arm|windshield|wheels?|petals?|stem only|each limb|forearm only)\b/i;
const FLOOR_WORDS = /\b(pavement|puddle|wet ground|rain-slicked|asphalt|cobblestone|sidewalk|the floor|the ground|turf|grass surface|snow on the ground|tile floor|hardwood floor|reflective ground)\b/i;
const HEDGE_RE = /\b(things like|such as|e\.g\.|for example|or similar|various|could include|might be|implied|suggested|hinted|barely visible|perhaps|reads as)\b/i;
const BG_POST_RE = /\b(film grain|kodak|portra|tri-x|iso noise|lens flare|chromatic aberration|vignett|bokeh|halftone|risograph|brushstroke|paper texture|canvas texture)\b/i;
const BG_ARR_RE = /\b(rows of desks|grid of desks|chairs arranged|cars parked|customers seated|room is filled with people|seated at the (desks|tables))\b/i;
const BUILT_RE = /\b(shop|stall|restaurant|store|sign|market|cafe|bar|workshop|poster|cover|banner)\b/i;

function buildEditor(node) {
  const widget = (node.widgets || []).find((w) => w.name === "caption_json");
  if (widget) { widget.type = "hidden"; widget.computeSize = () => [0, -4]; }

  let ar = "1:1", hld = "", bg = "", els = [], sel = null, uid = 0, hadLegacyStyle = false;

  const root = document.createElement("div");
  root.className = "ideo4";
  root.innerHTML = `
    <div class="toolbar">
      <div class="seg" data-ar>
        <button data-arv="1:1" class="on">1:1</button>
        <button data-arv="4:5">4:5</button>
        <button data-arv="9:16">9:16</button>
        <button data-arv="16:9">16:9</button>
        <button data-arv="3:1">3:1</button>
      </div>
      <input class="arInput" data-arcustom value="1:1" title="własne W:H">
      <button class="btn acc" data-add="obj">+ obj</button>
      <button class="btn" data-add="text">+ text</button>
      <button class="btn" data-imp>Wklej JSON</button>
    </div>
    <div data-impbar style="display:none;flex-direction:column;gap:6px">
      <textarea data-imptxt placeholder="Wklej prompt JSON (stary lub nowy format, także zepsuty / podwójnie zakodowany — rozpakuję i przekonwertuję na v15)" style="min-height:80px"></textarea>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn acc" data-impload>Wczytaj</button>
        <button class="btn" data-impcancel>Anuluj</button>
        <span class="hint" data-impmsg></span>
      </div>
    </div>
    <div class="canvas-host"><div class="frame" data-frame></div></div>
    <div class="hint">Klik na boksie = wybór + przeciąganie (środek przesuwa, róg skaluje). Powtórny klik cykluje nakładające się boksy. Strzałki na karcie = z-order. Współrzędne 0–1000.</div>
    <div class="list" data-list></div>
    <div class="out">
      <div class="vList" data-valbox></div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <button class="btn acc" data-copy style="flex:1">Kopiuj JSON (minified)</button>
        <button class="btn" data-copypretty>Pretty</button>
        <button class="btn" data-dl>Pobierz</button>
      </div>
      <pre class="json" data-json></pre>
    </div>
  `;

  const q = (s) => root.querySelector(s);
  const qa = (s) => root.querySelectorAll(s);
  const frame = q("[data-frame]");

  // keep pointer/wheel interactions inside the editor (don't pan/drag the node)
  root.addEventListener("pointerdown", (e) => e.stopPropagation());
  root.addEventListener("wheel", (e) => e.stopPropagation());

  function arRatio() { const m = ar.match(/^(\d+):(\d+)$/); return m ? [parseInt(m[1]), parseInt(m[2])] : [1, 1]; }
  function setAR(val) {
    ar = val; q("[data-arcustom]").value = val;
    qa("[data-ar] button").forEach((b) => b.classList.toggle("on", b.dataset.arv === val));
    fitFrame();
  }
  function fitFrame() {
    const host = frame.parentElement, pad = 28;
    const availW = host.clientWidth - pad, availH = host.clientHeight - pad, [aw, ah] = arRatio();
    let w = availW, h = (w * ah) / aw;
    if (h > availH) { h = availH; w = (h * aw) / ah; }
    frame.style.width = Math.max(120, w) + "px";
    frame.style.height = Math.max(120, h) + "px";
    render();
  }
  function defBbox(type) {
    const [aw, ah] = arRatio(), wide = aw / ah >= 1.4;
    if (type === "text") return wide ? [120, 300, 300, 700] : [120, 250, 260, 750];
    return wide ? [80, 400, 1000, 620] : (aw / ah <= 0.85 ? [40, 250, 1000, 750] : [60, 300, 1000, 700]);
  }
  function pxFromBbox(b) {
    const W = frame.clientWidth, H = frame.clientHeight, [y0, x0, y1, x1] = b;
    return { left: (x0 / 1000) * W, top: (y0 / 1000) * H, width: ((x1 - x0) / 1000) * W, height: ((y1 - y0) / 1000) * H };
  }
  function bboxFromPx(left, top, width, height) {
    const W = frame.clientWidth, H = frame.clientHeight;
    let x0 = clamp(Math.round((left / W) * 1000)), y0 = clamp(Math.round((top / H) * 1000)),
      x1 = clamp(Math.round(((left + width) / W) * 1000)), y1 = clamp(Math.round(((top + height) / H) * 1000));
    if (x1 <= x0) x1 = Math.min(1000, x0 + 10);
    if (y1 <= y0) y1 = Math.min(1000, y0 + 10);
    return [y0, x0, y1, x1];
  }
  const area = (e) => { const [y0, x0, y1, x1] = e.bbox; return (x1 - x0) * (y1 - y0); };

  function normalize(obj) {
    if (typeof obj === "string") obj = JSON.parse(obj);
    for (const k of ["caption", "data", "result", "output"]) {
      if (obj && typeof obj[k] === "object" && obj[k] && (obj[k].compositional_deconstruction || obj[k].high_level_description)) {
        const inner = normalize(obj[k]);
        if (inner.aspect_ratio === undefined && obj.aspect_ratio !== undefined) inner.aspect_ratio = obj.aspect_ratio;
        if (inner.size === undefined && obj.size !== undefined) inner.size = obj.size;
        return inner;
      }
    }
    const hd = obj.high_level_description;
    if (typeof hd === "string" && hd.trim().startsWith("{")) {
      try { const inner = JSON.parse(hd); if (inner && inner.compositional_deconstruction) return normalize(inner); } catch (e) {}
    }
    return obj;
  }
  function loadCaption(raw) {
    const o = normalize(raw);
    if (typeof o.aspect_ratio === "string" && /^\d+:\d+$/.test(o.aspect_ratio.trim())) setAR(o.aspect_ratio.trim());
    else if (o.size) { const r = ratioFromSize(o.size); if (r) setAR(r); }
    hld = o.high_level_description || "";
    const cd = o.compositional_deconstruction || {};
    bg = cd.background || "";
    els = (cd.elements || []).map((e, i) => {
      uid++;
      return { id: uid, type: e.type === "text" ? "text" : "obj",
        hasBbox: Array.isArray(e.bbox) && e.bbox.length === 4,
        bbox: Array.isArray(e.bbox) && e.bbox.length === 4 ? e.bbox.map(Number) : defBbox("obj"),
        desc: e.desc || "", text: e.text || "", z: i + 1 };
    });
    hadLegacyStyle = !!(o.style_description && (o.style_description.aesthetics || o.style_description.lighting || o.style_description.photo || o.style_description.art_style || o.style_description.color_palette));
    sel = els.length ? els[0].id : null;
  }

  function render() {
    frame.querySelectorAll(".bx").forEach((n) => n.remove());
    els.forEach((e) => {
      if (!e.hasBbox) return;
      const p = pxFromBbox(e.bbox), d = document.createElement("div");
      d.className = "bx " + e.type + (e.id === sel ? " sel" : "");
      d.style.left = p.left + "px"; d.style.top = p.top + "px"; d.style.width = p.width + "px"; d.style.height = p.height + "px";
      d.style.zIndex = e.id === sel ? 1000 : e.z; d.style.pointerEvents = "auto"; d.dataset.id = e.id;
      const tag = e.type === "text" ? "text: " + (e.text || "…") : "obj #" + e.id;
      d.innerHTML = '<span class="tag">' + esc(tag) + '</span><div class="h se"></div>';
      frame.appendChild(d); bindHandle(d, e);
    });
    renderList(); renderJSON(); renderValidation();
  }

  let lastHit = null, lastIdx = 0;
  frame.addEventListener("pointerdown", (ev) => {
    if (ev.target.classList.contains("se")) return;
    ev.preventDefault();
    const r = frame.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
    const hits = els.filter((e) => {
      if (!e.hasBbox) return false;
      const p = pxFromBbox(e.bbox);
      return px >= p.left && px <= p.left + p.width && py >= p.top && py <= p.top + p.height;
    }).sort((a, b) => area(a) - area(b));
    if (!hits.length) return;
    const key = hits.map((h) => h.id).join(",");
    if (key === lastHit) lastIdx = (lastIdx + 1) % hits.length; else { lastHit = key; lastIdx = 0; }
    const chosen = hits[lastIdx];
    selectEl(chosen.id); startDrag(chosen, ev, false);
  }, true);

  function startDrag(e, ev, isHandle) {
    const dnode = frame.querySelector('.bx[data-id="' + e.id + '"]');
    if (!dnode) return;
    const startX = ev.clientX, startY = ev.clientY, o = pxFromBbox(e.bbox), pid = ev.pointerId;
    try { dnode.setPointerCapture(pid); } catch (_) {}
    const move = (m) => {
      let dx = m.clientX - startX, dy = m.clientY - startY, left = o.left, top = o.top, w = o.width, h = o.height;
      if (isHandle) { w = Math.max(8, o.width + dx); h = Math.max(8, o.height + dy); } else { left = o.left + dx; top = o.top + dy; }
      left = Math.max(0, Math.min(frame.clientWidth - w, left)); top = Math.max(0, Math.min(frame.clientHeight - h, top));
      dnode.style.left = left + "px"; dnode.style.top = top + "px"; dnode.style.width = w + "px"; dnode.style.height = h + "px";
      e.bbox = bboxFromPx(left, top, w, h); updateBboxReadout(e);
    };
    const up = () => {
      try { dnode.releasePointerCapture(pid); } catch (_) {}
      dnode.removeEventListener("pointermove", move); dnode.removeEventListener("pointerup", up);
      renderJSON(); renderValidation();
    };
    dnode.addEventListener("pointermove", move); dnode.addEventListener("pointerup", up);
  }
  function bindHandle(dnode, e) {
    const handle = dnode.querySelector(".se");
    if (handle) handle.addEventListener("pointerdown", (ev) => { if (e.id !== sel) return; ev.stopPropagation(); startDrag(e, ev, true); });
  }
  function selectEl(id) {
    sel = id;
    frame.querySelectorAll(".bx").forEach((n) => {
      const on = n.dataset.id == sel; n.classList.toggle("sel", on);
      const el = els.find((x) => x.id == n.dataset.id);
      n.style.zIndex = on ? 1000 : (el ? el.z : 1); n.style.pointerEvents = "auto";
    });
    qa(".card").forEach((c) => c.classList.toggle("sel", c.dataset.id == sel));
  }
  function updateBboxReadout(e) {
    const c = q('.card[data-id="' + e.id + '"] .mini');
    if (c && c.childNodes[0]) c.childNodes[0].textContent = e.hasBbox ? "bbox [" + e.bbox.join(", ") + "] " : "bez bbox ";
  }
  function bumpZ(id, dir) {
    const sorted = [...els].sort((a, b) => a.z - b.z), i = sorted.findIndex((e) => e.id === id), j = i + (dir > 0 ? 1 : -1);
    if (j < 0 || j >= sorted.length) return;
    const t = sorted[i].z; sorted[i].z = sorted[j].z; sorted[j].z = t; sel = id; render();
  }
  function addEl(type) { uid++; els.push({ id: uid, type, hasBbox: true, bbox: defBbox(type), desc: "", text: "", z: uid }); sel = uid; render(); }

  function renderList() {
    const L = q("[data-list]"); L.innerHTML = "";
    const head = document.createElement("div"); head.className = "sec";
    head.innerHTML = "<h2>Prompt (v15)</h2>" +
      '<div class="field"><label class="lbl">aspect_ratio</label><input data-far value="' + esc(ar) + '"></div>' +
      '<div class="field"><label class="lbl">high_level_description <span class="ctr" data-hldctr></span></label><textarea data-fhld style="min-height:60px">' + esc(hld) + "</textarea></div>" +
      '<div class="field"><label class="lbl">background (tylko powłoka sceny)</label><textarea data-fbg style="min-height:72px">' + esc(bg) + "</textarea></div>";
    L.appendChild(head);
    if (!els.length) { const h = document.createElement("div"); h.className = "hint"; h.textContent = "Dodaj element + obj lub + text. Jeden podmiot = jeden element (części w desc)."; L.appendChild(h); }
    [...els].sort((a, b) => a.z - b.z).forEach((e) => {
      const c = document.createElement("div"); c.className = "card" + (e.id === sel ? " sel" : ""); c.dataset.id = e.id;
      c.innerHTML = '<div class="top"><b>' + (e.type === "text" ? "text" : "obj") + " #" + e.id + "</b>" +
        '<span style="display:flex;gap:4px;align-items:center">' +
        '<button class="zb" data-up="' + e.id + '" title="na wierzch">&#9650;</button>' +
        '<button class="zb" data-down="' + e.id + '" title="pod spód">&#9660;</button>' +
        '<button class="x" data-x="' + e.id + '">&times;</button></span></div>' +
        '<div class="mini" style="margin-bottom:8px">' + (e.hasBbox ? "bbox [" + e.bbox.join(", ") + "] " : "bez bbox ") +
        '&middot; <label style="cursor:pointer"><input type="checkbox" data-bb="' + e.id + '" ' + (e.hasBbox ? "checked" : "") + ' style="width:auto;vertical-align:middle"> bbox</label></div>' +
        (e.type === "text" ? '<div class="field" style="margin-bottom:8px"><label class="lbl">text (verbatim, \\n = nowa linia)</label><textarea data-f="text" data-id="' + e.id + '" style="min-height:38px">' + esc(e.text) + "</textarea></div>" : "") +
        '<div class="field"><label class="lbl">desc <span class="ctr" data-ctr="' + e.id + '"></span></label><textarea data-f="desc" data-id="' + e.id + '">' + esc(e.desc) + "</textarea></div>";
      c.addEventListener("click", (ev) => { if (ev.target.closest("[data-x],[data-up],[data-down],[data-bb],textarea,input")) return; selectEl(e.id); });
      L.appendChild(c);
    });
    bindInput("[data-far]", (v) => { if (/^\d+:\d+$/.test(v.trim())) setAR(v.trim()); });
    bindInput("[data-fhld]", (v) => { hld = v; updateCounters(); renderJSON(); renderValidation(); });
    bindInput("[data-fbg]", (v) => { bg = v; renderJSON(); renderValidation(); });
    qa("[data-x]").forEach((b) => (b.onclick = () => { els = els.filter((x) => x.id != b.dataset.x); if (sel == b.dataset.x) sel = null; render(); }));
    qa("[data-up]").forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); bumpZ(+b.dataset.up, +1); }));
    qa("[data-down]").forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); bumpZ(+b.dataset.down, -1); }));
    qa("[data-bb]").forEach((cb) => (cb.onchange = () => {
      const e = els.find((x) => x.id == cb.dataset.bb);
      if (e) { e.hasBbox = cb.checked; if (cb.checked && (!e.bbox || e.bbox.length != 4)) e.bbox = defBbox(e.type); render(); }
    }));
    qa("[data-f]").forEach((inp) => (inp.oninput = () => {
      const e = els.find((x) => x.id == inp.dataset.id); if (!e) return;
      e[inp.dataset.f] = inp.value;
      if (inp.dataset.f === "text") { const t = frame.querySelector('.bx[data-id="' + e.id + '"] .tag'); if (t) t.textContent = "text: " + (e.text || "…"); }
      updateCounters(); renderJSON(); renderValidation();
    }));
    updateCounters();
  }
  function bindInput(sel, fn) { const el = q(sel); if (el) el.oninput = () => fn(el.value); }
  function updateCounters() {
    const hc = q("[data-hldctr]");
    if (hc) { const n = wordCount(hld); hc.textContent = n + "/50 słów"; hc.classList.toggle("over", n > 50); }
    qa("[data-ctr]").forEach((s) => { const e = els.find((x) => x.id == s.dataset.ctr); if (!e) return; const n = wordCount(e.desc); s.textContent = n + "/60 słów"; s.classList.toggle("over", n > 60); });
  }

  function buildCaption() {
    return {
      aspect_ratio: ar, high_level_description: hld || "",
      compositional_deconstruction: {
        background: bg || "",
        elements: [...els].sort((a, b) => a.z - b.z).map((e) => {
          const o = { type: e.type };
          if (e.hasBbox) o.bbox = e.bbox;
          if (e.type === "text") o.text = e.text || "";
          o.desc = e.desc || "";
          return o;
        }),
      },
    };
  }
  function renderJSON() {
    const cap = buildCaption();
    q("[data-json]").textContent = JSON.stringify(cap, null, 2);
    if (widget) widget.value = JSON.stringify(cap);
    if (node.graph) node.graph.setDirtyCanvas(true, true);
  }

  function renderValidation() {
    const box = q("[data-valbox]"), v = [];
    if (hadLegacyStyle) v.push(["warn", "wczytano STARY format ze style_description (aesthetics/lighting/photo/paleta) — te pola NIE istnieją w v15 i zostały pominięte; przepisz styl prozą do high_level_description lub background"]);
    if (!ar || !/^\d+:\d+$/.test(ar)) v.push(["err", "aspect_ratio musi być w formacie W:H"]);
    if (!hld.trim()) v.push(["warn", "high_level_description jest puste"]);
    else { if (wordCount(hld) > 50) v.push(["warn", "HLD przekracza 50 słów (" + wordCount(hld) + ")"]); if (/\b(this image (shows|depicts)|depicts|captures)\b/i.test(hld)) v.push(["warn", "HLD nie powinno zaczynać się od shows/depicts/captures — zacznij od podmiotu"]); }
    if (WARM_RE.test(hld) || WARM_RE.test(bg)) v.push(["warn", 'słowo "warm" jako gradacja jest odradzane w fotorealizmie (amber/AI look) — opisz źródło światła konkretnie']);
    if (BG_POST_RE.test(bg)) v.push(["warn", "background zawiera efekt post-processingu — przenieś do high_level_description"]);
    if (BG_ARR_RE.test(bg)) v.push(["err", "background opisuje rozmieszczone meble/ludzi — to treść pierwszego planu, zrób z tego elementy"]);
    let textCount = 0;
    els.forEach((e) => {
      const tag = "(" + e.type + " #" + e.id + ") ";
      if (e.type === "text") { textCount++; if (!e.text.trim()) v.push(["warn", tag + "pusty text"]); }
      if (wordCount(e.desc) > 60) v.push(["warn", tag + "desc > 60 słów (" + wordCount(e.desc) + ")"]);
      if (RENDER_RE.test(e.desc)) v.push(["err", tag + "desc zawiera język kamery/cienia (DOF, lens, shadow…) — przenieś do HLD/background"]);
      if (WARM_RE.test(e.desc)) v.push(["warn", tag + '"warm" w desc — odradzane']);
      if (PART_WORDS.test(e.desc) && e.type === "obj") v.push(["warn", tag + "desc wygląda na pojedynczą część podmiotu — jeden podmiot = jeden element"]);
      if (FLOOR_WORDS.test(e.desc)) v.push(["err", tag + "opis nawierzchni/podłogi/kałuży jako element — przenieś do background (inaczej renderer wkopie nogi w grunt)"]);
      if (HEDGE_RE.test(e.desc)) v.push(["warn", tag + "hedging (such as/various/implied…) — commit do konkretnej wartości"]);
      if (e.hasBbox) { const [y0, x0, y1, x1] = e.bbox; if (!(y0 < y1 && x0 < x1)) v.push(["err", tag + "bbox: wymagane y1<y2 oraz x1<x2"]); }
    });
    if (textCount === 0 && BUILT_RE.test(hld + " " + bg)) v.push(["warn", "scena wygląda na built environment / designed artifact, a nie ma elementów text — realne sceny niosą tekst niemal wszędzie"]);
    if (!v.length) { box.innerHTML = '<div class="v ok"><span class="ico">&#10003;</span><span>Brak ostrzeżeń — zgodne z wytycznymi v15</span></div>'; return; }
    box.innerHTML = v.map(([k, m]) => '<div class="v ' + k + '"><span class="ico">' + (k === "err" ? "&times;" : "!") + "</span><span>" + esc(m) + "</span></div>").join("");
  }

  // toolbar wiring
  q("[data-ar]").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) setAR(b.dataset.arv); });
  q("[data-arcustom]").addEventListener("change", (ev) => { const v = ev.target.value.trim(); if (/^\d+:\d+$/.test(v)) setAR(v); });
  qa("[data-add]").forEach((b) => (b.onclick = () => addEl(b.dataset.add)));
  const impbar = q("[data-impbar]");
  q("[data-imp]").onclick = () => { impbar.style.display = impbar.style.display === "none" ? "flex" : "none"; };
  q("[data-impcancel]").onclick = () => { impbar.style.display = "none"; q("[data-impmsg]").textContent = ""; };
  q("[data-impload]").onclick = () => {
    const msg = q("[data-impmsg]");
    try { loadCaption(q("[data-imptxt]").value); impbar.style.display = "none"; msg.textContent = ""; fitFrame(); }
    catch (e) { msg.style.color = "var(--err)"; msg.textContent = "Błąd parsowania JSON (" + e.message + ")"; }
  };
  const flash = (sel, on, off) => { const b = q(sel); b.textContent = on; setTimeout(() => (b.textContent = off), 1200); };
  q("[data-copy]").onclick = () => { navigator.clipboard.writeText(JSON.stringify(buildCaption())); flash("[data-copy]", "Skopiowano ✓", "Kopiuj JSON (minified)"); };
  q("[data-copypretty]").onclick = () => { navigator.clipboard.writeText(JSON.stringify(buildCaption(), null, 2)); flash("[data-copypretty]", "OK ✓", "Pretty"); };
  q("[data-dl]").onclick = () => { const blob = new Blob([JSON.stringify(buildCaption())], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "caption_v15.json"; a.click(); };

  // attach + init
  node.addDOMWidget("ideo_editor", "div", root, { serialize: false, hideOnZoom: false });
  node.size = [Math.max(node.size?.[0] || 0, 480), Math.max(node.size?.[1] || 0, 720)];
  const ro = new ResizeObserver(() => fitFrame());
  ro.observe(root.querySelector(".canvas-host"));

  setTimeout(() => {
    let seeded = false;
    if (widget && widget.value && widget.value.trim() && widget.value.trim() !== "{}") {
      try { loadCaption(widget.value); seeded = true; } catch (e) {}
    }
    if (!seeded && els.length === 0) addEl("obj");
    fitFrame();
  }, 0);
}

app.registerExtension({
  name: "ideogram4.bbox.editor",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData?.name !== "Ideogram4BboxEditor") return;
    injectStyleOnce();
    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
      buildEditor(this);
      return r;
    };
  },
});
