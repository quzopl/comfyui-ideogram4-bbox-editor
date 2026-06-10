const { app } = window.comfyAPI.app;
const { api } = window.comfyAPI.api;

// Live editor instances + the most recent generated image, captured from the
// frontend (no graph wiring — see docs/.../image-backdrop-design.md for why an
// IMAGE input would create a dependency loop).
const EDITORS = new Set();
let LAST_BG = null;

function imageUrl(img) {
  const p = new URLSearchParams({ filename: img.filename || "", subfolder: img.subfolder || "", type: img.type || "output" });
  p.set("t", Date.now());           // bust cache so a re-run with same name refreshes
  return api.apiURL("/view?" + p.toString());
}

api.addEventListener("executed", (e) => {
  const imgs = e.detail?.output?.images;
  if (!imgs || !imgs.length) return;        // keep the last image-bearing node of the run
  LAST_BG = imageUrl(imgs[imgs.length - 1]);
  EDITORS.forEach((fn) => { try { fn(LAST_BG); } catch (_) {} });
});

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
.ideo4 .bgbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;color:var(--mut)}
.ideo4 .bgbar label.chk{display:flex;gap:5px;align-items:center;cursor:pointer;color:var(--txt)}
.ideo4 .bgbar input[type=checkbox]{width:auto}
.ideo4 .bgbar input[type=range]{width:120px}
.ideo4 .bgbar .badge{font-family:var(--mono);font-size:11px;padding:2px 7px;border-radius:5px;border:1px solid var(--line);background:var(--panel2)}
.ideo4 .bgbar .badge.on{border-color:var(--ok);color:var(--ok)}
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
  // Snapshot the saved caption NOW, before any render() (e.g. via ResizeObserver)
  // can overwrite widget.value with the empty initial state and clobber it.
  const initialCaption = widget && widget.value != null ? String(widget.value) : "";
  let initDone = false;
  if (widget) {
    widget.type = "hidden";
    widget.computeSize = () => [0, -4];
    widget.hidden = true;
    if (widget.element) widget.element.style.display = "none"; // belt & suspenders for DOM-backed widgets
  }

  let ar = "1:1", hld = "", bg = "", els = [], sel = null, uid = 0;
  let autoAR = true, bgUrl = null, bgOpacity = 0.85;
  // optional v14 style_description (off by default; v15 has no style_description)
  let styleOn = false, styleKind = "photo", sty = { aesthetics: "", lighting: "", medium: "", photo: "", art_style: "", palette: "" };

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
      <input class="arInput" data-arcustom value="1:1" title="custom W:H">
      <button class="btn acc" data-add="obj">+ obj</button>
      <button class="btn" data-add="text">+ text</button>
      <button class="btn" data-imp>Paste JSON</button>
    </div>
    <div data-impbar style="display:none;flex-direction:column;gap:6px">
      <textarea data-imptxt placeholder="Paste a prompt JSON (old or new format, even broken / double-encoded — it will be unwrapped and converted to v15)" style="min-height:80px"></textarea>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn acc" data-impload>Load</button>
        <button class="btn" data-impcancel>Cancel</button>
        <span class="hint" data-impmsg></span>
      </div>
    </div>
    <div class="canvas-host"><div class="frame" data-frame></div></div>
    <div class="bgbar">
      <label class="chk" title="Grid proportions from the generated image (or, when there is none, from width/height)"><input type="checkbox" data-auto checked> Auto size</label>
      <span class="badge" data-bgstat>no backdrop</span>
      <span style="display:flex;gap:5px;align-items:center">opacity <input type="range" data-bgop min="0.2" max="1" step="0.05" value="0.85"></span>
      <button class="btn" data-bgclear>Clear backdrop</button>
    </div>
    <div class="hint">Click a box = select + drag (centre moves, corner resizes). Clicking again cycles overlapping boxes. Arrows on a card = z-order. Coordinates 0–1000. After a run the generated image loads as a backdrop.</div>
    <div class="list" data-list></div>
    <div class="out">
      <div class="vList" data-valbox></div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <button class="btn acc" data-copy style="flex:1">Copy JSON (minified)</button>
        <button class="btn" data-copypretty>Pretty</button>
        <button class="btn" data-dl>Download</button>
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

  // optional width/height widgets: when both > 0 they drive the aspect ratio
  // (so the editor reflects the actual target size). 0 = use the editor's AR.
  const wW = (node.widgets || []).find((w) => w.name === "width");
  const hW = (node.widgets || []).find((w) => w.name === "height");
  function syncFromWH() {
    if (!wW || !hW) return false;
    if (!autoAR || bgUrl) return false;   // image (if present) and manual mode take priority
    const w = Number(wW.value) || 0, h = Number(hW.value) || 0;
    if (w > 0 && h > 0) { const g = gcd(w, h) || 1; setAR(w / g + ":" + h / g); return true; }
    return false;
  }
  for (const W of [wW, hW]) {
    if (!W) continue;
    const prev = W.callback;
    W.callback = function () { const r = prev ? prev.apply(this, arguments) : undefined; syncFromWH(); return r; };
  }

  // backdrop: paint the generated image behind the bboxes, scaled to the frame.
  function applyBackdrop() {
    const stat = q("[data-bgstat]");
    if (!bgUrl) {
      frame.style.backgroundImage = "";   // fall back to the CSS grid-only frame
      frame.style.backgroundSize = ""; frame.style.backgroundRepeat = ""; frame.style.backgroundPosition = "";
      if (stat) { stat.textContent = "no backdrop"; stat.classList.remove("on"); }
      return;
    }
    const dim = (1 - bgOpacity).toFixed(2);
    frame.style.backgroundImage =
      'linear-gradient(var(--grid) 1px,transparent 1px),' +
      'linear-gradient(90deg,var(--grid) 1px,transparent 1px),' +
      'linear-gradient(rgba(26,29,34,' + dim + '),rgba(26,29,34,' + dim + ')),' +
      'url("' + bgUrl + '")';
    frame.style.backgroundSize = "10% 10%,10% 10%,cover,cover";
    frame.style.backgroundRepeat = "repeat,repeat,no-repeat,no-repeat";
    frame.style.backgroundPosition = "0 0,0 0,center,center";
    if (stat) { stat.textContent = "backdrop loaded"; stat.classList.add("on"); }
  }
  function onNewImage(url) {
    bgUrl = url;
    const im = new Image();
    im.onload = () => {
      if (autoAR && im.naturalWidth && im.naturalHeight) {
        const g = gcd(im.naturalWidth, im.naturalHeight) || 1;
        setAR(im.naturalWidth / g + ":" + im.naturalHeight / g);   // setAR → fitFrame → render
      }
      applyBackdrop();
    };
    im.onerror = () => applyBackdrop();
    im.src = url;
  }
  function manualOverride() { autoAR = false; const cb = q("[data-auto]"); if (cb) cb.checked = false; }
  function reSyncAuto() {
    if (!autoAR) return;
    if (bgUrl) { onNewImage(bgUrl); } else if (!syncFromWH()) { fitFrame(); }
  }

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
    const sd = o.style_description;
    if (sd && typeof sd === "object") {
      styleOn = true;
      styleKind = sd.art_style !== undefined && sd.photo === undefined ? "art_style" : "photo";
      sty = {
        aesthetics: sd.aesthetics || "", lighting: sd.lighting || "", medium: sd.medium || "",
        photo: sd.photo || "", art_style: sd.art_style || "",
        palette: Array.isArray(sd.color_palette) ? sd.color_palette.join(", ") : "",
      };
    } else {
      styleOn = false;
    }
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
    // topmost first (higher z wins; smaller area breaks ties so a small box on
    // top of a big one is grabbable).
    const hits = els.filter((e) => {
      if (!e.hasBbox) return false;
      const p = pxFromBbox(e.bbox);
      return px >= p.left && px <= p.left + p.width && py >= p.top && py <= p.top + p.height;
    }).sort((a, b) => b.z - a.z || area(a) - area(b));
    if (!hits.length) return;
    const key = hits.map((h) => h.id).join(",");
    let chosen;
    if (key === lastHit) {
      // repeated click on the same overlapping stack → reveal the box underneath
      lastIdx = (lastIdx + 1) % hits.length;
      chosen = hits[lastIdx];
    } else {
      // fresh click: re-grab the currently selected box if it's here, else topmost
      lastHit = key;
      const si = hits.findIndex((h) => h.id === sel);
      lastIdx = si >= 0 ? si : 0;
      chosen = hits[lastIdx];
    }
    selectEl(chosen.id); startDrag(chosen, ev, false);
  }, true);

  function startDrag(e, ev, isHandle) {
    const dnode = frame.querySelector('.bx[data-id="' + e.id + '"]');
    if (!dnode) return;
    const startX = ev.clientX, startY = ev.clientY, o = pxFromBbox(e.bbox), pid = ev.pointerId;
    let moved = false;
    try { dnode.setPointerCapture(pid); } catch (_) {}
    const move = (m) => {
      let dx = m.clientX - startX, dy = m.clientY - startY, left = o.left, top = o.top, w = o.width, h = o.height;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
      if (isHandle) { w = Math.max(8, o.width + dx); h = Math.max(8, o.height + dy); } else { left = o.left + dx; top = o.top + dy; }
      left = Math.max(0, Math.min(frame.clientWidth - w, left)); top = Math.max(0, Math.min(frame.clientHeight - h, top));
      dnode.style.left = left + "px"; dnode.style.top = top + "px"; dnode.style.width = w + "px"; dnode.style.height = h + "px";
      e.bbox = bboxFromPx(left, top, w, h); updateBboxReadout(e);
    };
    const up = () => {
      try { dnode.releasePointerCapture(pid); } catch (_) {}
      dnode.removeEventListener("pointermove", move); dnode.removeEventListener("pointerup", up);
      if (moved) lastHit = null; // after a real drag, next click re-evaluates fresh (no cycle)
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
    if (c && c.childNodes[0]) c.childNodes[0].textContent = e.hasBbox ? "bbox [" + e.bbox.join(", ") + "] " : "no bbox ";
  }
  function bumpZ(id, dir) {
    const sorted = [...els].sort((a, b) => a.z - b.z), i = sorted.findIndex((e) => e.id === id), j = i + (dir > 0 ? 1 : -1);
    if (j < 0 || j >= sorted.length) return;
    const t = sorted[i].z; sorted[i].z = sorted[j].z; sorted[j].z = t; sel = id; render();
  }
  function addEl(type) {
    uid++;
    // cascade new boxes so they don't land exactly on top of existing ones
    const off = Math.min(els.length, 8) * 30, b = defBbox(type).slice();
    if (off) { b[0] = clamp(b[0] + off); b[1] = clamp(b[1] + off); b[2] = clamp(b[2] + off); b[3] = clamp(b[3] + off); }
    els.push({ id: uid, type, hasBbox: true, bbox: b, desc: "", text: "", z: uid }); sel = uid; render();
  }

  function styleSecHtml() {
    const opt = (v, l) => '<option value="' + v + '"' + (styleKind === v ? " selected" : "") + ">" + l + "</option>";
    let f = '<div class="field"><label class="lbl" style="text-transform:none;letter-spacing:0">' +
      '<label style="cursor:pointer"><input type="checkbox" data-styon ' + (styleOn ? "checked" : "") +
      ' style="width:auto;vertical-align:middle"> include style_description (optional, v14)</label></label></div>';
    if (!styleOn) return f;
    const fld = (name, label, ph) => '<div class="field"><label class="lbl">' + label + '</label><input data-sty="' + name +
      '" value="' + esc(sty[name]) + '"' + (ph ? ' placeholder="' + ph + '"' : "") + "></div>";
    f += '<div class="field"><label class="lbl">style kind</label><select data-stykind>' + opt("photo", "photo") + opt("art_style", "art_style") + "</select></div>";
    f += fld("aesthetics", "aesthetics") + fld("lighting", "lighting") + fld("medium", "medium");
    f += styleKind === "photo" ? fld("photo", "photo") : fld("art_style", "art_style");
    f += fld("palette", "color_palette (#hex, comma-separated)", "#1A2B3C, #FFAA00");
    return f;
  }

  function renderList() {
    const L = q("[data-list]"); L.innerHTML = "";
    const head = document.createElement("div"); head.className = "sec";
    head.innerHTML = "<h2>Prompt (v15)</h2>" +
      '<div class="field"><label class="lbl">aspect_ratio</label><input data-far value="' + esc(ar) + '"></div>' +
      '<div class="field"><label class="lbl">high_level_description <span class="ctr" data-hldctr></span></label><textarea data-fhld style="min-height:60px">' + esc(hld) + "</textarea></div>" +
      '<div class="field"><label class="lbl">background (scene shell only)</label><textarea data-fbg style="min-height:72px">' + esc(bg) + "</textarea></div>";
    L.appendChild(head);
    const styleSec = document.createElement("div"); styleSec.className = "sec";
    styleSec.innerHTML = "<h2>Style (optional)</h2>" + styleSecHtml();
    L.appendChild(styleSec);
    if (!els.length) { const h = document.createElement("div"); h.className = "hint"; h.textContent = "Add an element with + obj or + text. One subject = one element (parts go in desc)."; L.appendChild(h); }
    [...els].sort((a, b) => a.z - b.z).forEach((e) => {
      const c = document.createElement("div"); c.className = "card" + (e.id === sel ? " sel" : ""); c.dataset.id = e.id;
      c.innerHTML = '<div class="top"><b>' + (e.type === "text" ? "text" : "obj") + " #" + e.id + "</b>" +
        '<span style="display:flex;gap:4px;align-items:center">' +
        '<button class="zb" data-up="' + e.id + '" title="to front">&#9650;</button>' +
        '<button class="zb" data-down="' + e.id + '" title="to back">&#9660;</button>' +
        '<button class="x" data-x="' + e.id + '">&times;</button></span></div>' +
        '<div class="mini" style="margin-bottom:8px">' + (e.hasBbox ? "bbox [" + e.bbox.join(", ") + "] " : "no bbox ") +
        '&middot; <label style="cursor:pointer"><input type="checkbox" data-bb="' + e.id + '" ' + (e.hasBbox ? "checked" : "") + ' style="width:auto;vertical-align:middle"> bbox</label></div>' +
        (e.type === "text" ? '<div class="field" style="margin-bottom:8px"><label class="lbl">text (verbatim, \\n = new line)</label><textarea data-f="text" data-id="' + e.id + '" style="min-height:38px">' + esc(e.text) + "</textarea></div>" : "") +
        '<div class="field"><label class="lbl">desc <span class="ctr" data-ctr="' + e.id + '"></span></label><textarea data-f="desc" data-id="' + e.id + '">' + esc(e.desc) + "</textarea></div>";
      c.addEventListener("click", (ev) => { if (ev.target.closest("[data-x],[data-up],[data-down],[data-bb],textarea,input")) return; selectEl(e.id); });
      L.appendChild(c);
    });
    bindInput("[data-far]", (v) => { if (/^\d+:\d+$/.test(v.trim())) { manualOverride(); setAR(v.trim()); } });
    bindInput("[data-fhld]", (v) => { hld = v; updateCounters(); renderJSON(); renderValidation(); });
    bindInput("[data-fbg]", (v) => { bg = v; renderJSON(); renderValidation(); });
    { const c = q("[data-styon]"); if (c) c.onchange = () => { styleOn = c.checked; render(); }; }
    { const s = q("[data-stykind]"); if (s) s.onchange = () => { styleKind = s.value; render(); }; }
    qa("[data-sty]").forEach((inp) => (inp.oninput = () => { sty[inp.dataset.sty] = inp.value; renderJSON(); renderValidation(); }));
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
    if (hc) { const n = wordCount(hld); hc.textContent = n + "/50 words"; hc.classList.toggle("over", n > 50); }
    qa("[data-ctr]").forEach((s) => { const e = els.find((x) => x.id == s.dataset.ctr); if (!e) return; const n = wordCount(e.desc); s.textContent = n + "/60 words"; s.classList.toggle("over", n > 60); });
  }

  function styleDescription() {
    // KJ key order: photo -> {aesthetics,lighting,photo,medium,color_palette?};
    // art_style -> {aesthetics,lighting,medium,art_style,color_palette?}
    const sd = { aesthetics: sty.aesthetics || "", lighting: sty.lighting || "" };
    if (styleKind === "photo") { sd.photo = sty.photo || ""; sd.medium = sty.medium || ""; }
    else { sd.medium = sty.medium || ""; sd.art_style = sty.art_style || ""; }
    const pal = (sty.palette || "").split(",").map((s) => s.trim()).filter(Boolean)
      .map((c) => (c[0] === "#" ? c : "#" + c).toUpperCase());
    if (pal.length) sd.color_palette = pal;
    return sd;
  }
  function buildCaption() {
    const cap = { aspect_ratio: ar, high_level_description: hld || "" };
    if (styleOn) cap.style_description = styleDescription();
    cap.compositional_deconstruction = {
      background: bg || "",
      elements: [...els].sort((a, b) => a.z - b.z).map((e) => {
        const o = { type: e.type };
        if (e.hasBbox) o.bbox = e.bbox;
        if (e.type === "text") o.text = e.text || "";
        o.desc = e.desc || "";
        return o;
      }),
    };
    return cap;
  }
  function renderJSON() {
    const cap = buildCaption();
    q("[data-json]").textContent = JSON.stringify(cap, null, 2);
    if (widget && initDone) widget.value = JSON.stringify(cap); // don't clobber the saved value before init reads it
    if (node.graph) node.graph.setDirtyCanvas(true, true);
  }

  function renderValidation() {
    const box = q("[data-valbox]"), v = [];
    if (!ar || !/^\d+:\d+$/.test(ar)) v.push(["err", "aspect_ratio must be in W:H format"]);
    if (!hld.trim()) v.push(["warn", "high_level_description is empty"]);
    else { if (wordCount(hld) > 50) v.push(["warn", "HLD exceeds 50 words (" + wordCount(hld) + ")"]); if (/\b(this image (shows|depicts)|depicts|captures)\b/i.test(hld)) v.push(["warn", "HLD should not start with shows/depicts/captures — start with the subject"]); }
    if (WARM_RE.test(hld) || WARM_RE.test(bg)) v.push(["warn", 'the word "warm" as a grade is discouraged in photorealism (amber/AI look) — describe the light source concretely']);
    if (BG_POST_RE.test(bg)) v.push(["warn", "background contains a post-processing effect — move it to high_level_description"]);
    if (BG_ARR_RE.test(bg)) v.push(["err", "background describes arranged furniture/people — that is foreground content, turn it into elements"]);
    let textCount = 0;
    els.forEach((e) => {
      const tag = "(" + e.type + " #" + e.id + ") ";
      if (e.type === "text") { textCount++; if (!e.text.trim()) v.push(["warn", tag + "empty text"]); }
      if (wordCount(e.desc) > 60) v.push(["warn", tag + "desc > 60 words (" + wordCount(e.desc) + ")"]);
      if (RENDER_RE.test(e.desc)) v.push(["err", tag + "desc contains camera/shadow language (DOF, lens, shadow…) — move it to HLD/background"]);
      if (WARM_RE.test(e.desc)) v.push(["warn", tag + '"warm" in desc — discouraged']);
      if (PART_WORDS.test(e.desc) && e.type === "obj") v.push(["warn", tag + "desc looks like a single part of the subject — one subject = one element"]);
      if (FLOOR_WORDS.test(e.desc)) v.push(["err", tag + "describing pavement/floor/puddle as an element — move it to background (otherwise the renderer sinks legs into the ground)"]);
      if (HEDGE_RE.test(e.desc)) v.push(["warn", tag + "hedging (such as/various/implied…) — commit to a concrete value"]);
      if (e.hasBbox) { const [y0, x0, y1, x1] = e.bbox; if (!(y0 < y1 && x0 < x1)) v.push(["err", tag + "bbox: requires y1<y2 and x1<x2"]); }
    });
    if (textCount === 0 && BUILT_RE.test(hld + " " + bg)) v.push(["warn", "the scene looks like a built environment / designed artifact but has no text elements — real scenes carry text almost everywhere"]);
    if (!v.length) { box.innerHTML = '<div class="v ok"><span class="ico">&#10003;</span><span>No warnings — compliant with the v15 guidelines</span></div>'; return; }
    box.innerHTML = v.map(([k, m]) => '<div class="v ' + k + '"><span class="ico">' + (k === "err" ? "&times;" : "!") + "</span><span>" + esc(m) + "</span></div>").join("");
  }

  // toolbar wiring
  q("[data-ar]").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) { manualOverride(); setAR(b.dataset.arv); } });
  q("[data-arcustom]").addEventListener("change", (ev) => { const v = ev.target.value.trim(); if (/^\d+:\d+$/.test(v)) { manualOverride(); setAR(v); } });
  // backdrop controls
  q("[data-auto]").addEventListener("change", (ev) => { autoAR = ev.target.checked; reSyncAuto(); });
  q("[data-bgop]").addEventListener("input", (ev) => { bgOpacity = parseFloat(ev.target.value); applyBackdrop(); });
  q("[data-bgclear]").addEventListener("click", () => { bgUrl = null; applyBackdrop(); if (autoAR) reSyncAuto(); });
  EDITORS.add(onNewImage);
  const onRemoved = node.onRemoved;
  node.onRemoved = function () { EDITORS.delete(onNewImage); return onRemoved ? onRemoved.apply(this, arguments) : undefined; };
  qa("[data-add]").forEach((b) => (b.onclick = () => addEl(b.dataset.add)));
  const impbar = q("[data-impbar]");
  q("[data-imp]").onclick = () => { impbar.style.display = impbar.style.display === "none" ? "flex" : "none"; };
  q("[data-impcancel]").onclick = () => { impbar.style.display = "none"; q("[data-impmsg]").textContent = ""; };
  q("[data-impload]").onclick = () => {
    const msg = q("[data-impmsg]");
    try { loadCaption(q("[data-imptxt]").value); impbar.style.display = "none"; msg.textContent = ""; fitFrame(); }
    catch (e) { msg.style.color = "var(--err)"; msg.textContent = "JSON parse error (" + e.message + ")"; }
  };
  const flash = (sel, on, off) => { const b = q(sel); b.textContent = on; setTimeout(() => (b.textContent = off), 1200); };
  q("[data-copy]").onclick = () => { navigator.clipboard.writeText(JSON.stringify(buildCaption())); flash("[data-copy]", "Copied ✓", "Copy JSON (minified)"); };
  q("[data-copypretty]").onclick = () => { navigator.clipboard.writeText(JSON.stringify(buildCaption(), null, 2)); flash("[data-copypretty]", "OK ✓", "Pretty"); };
  q("[data-dl]").onclick = () => { const blob = new Blob([JSON.stringify(buildCaption())], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "caption_v15.json"; a.click(); };

  // per-node onExecuted payload (from build()'s ui): import_json caption, reference
  // image backdrop, and resolved dims.
  node.__ig4_exec = (m) => {
    if (!m) return;
    if (m.caption && m.caption[0]) { try { loadCaption(m.caption[0]); fitFrame(); } catch (e) {} }
    if (m.bg_image && m.bg_image[0]) onNewImage(imageUrl(m.bg_image[0]));
    else if (m.dims && m.dims.length === 2 && autoAR && !bgUrl) {
      const w = m.dims[0], h = m.dims[1], g = gcd(w, h) || 1;
      if (w > 0 && h > 0) setAR(w / g + ":" + h / g);
    }
  };

  // attach + init
  node.addDOMWidget("ideo_editor", "div", root, { serialize: false, hideOnZoom: false });
  node.size = [Math.max(node.size?.[0] || 0, 480), Math.max(node.size?.[1] || 0, 720)];
  const ro = new ResizeObserver(() => fitFrame());
  ro.observe(root.querySelector(".canvas-host"));

  setTimeout(() => {
    let seeded = false;
    if (initialCaption && initialCaption.trim() && initialCaption.trim() !== "{}") {
      try { loadCaption(initialCaption); seeded = true; } catch (e) {}
    }
    if (!seeded && els.length === 0) addEl("obj");
    initDone = true;            // from here renderJSON may persist to the widget
    syncFromWH();               // real W/H (if set) win over the caption's aspect ratio
    fitFrame();
    if (LAST_BG) onNewImage(LAST_BG);   // adopt the most recent generated image
    renderJSON();               // sync widget.value with the loaded state
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
    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message) {
      const r = onExecuted ? onExecuted.apply(this, arguments) : undefined;
      try { this.__ig4_exec && this.__ig4_exec(message); } catch (e) {}
      return r;
    };
  },
});
