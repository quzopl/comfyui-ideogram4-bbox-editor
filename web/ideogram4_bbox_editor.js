const { app } = window.comfyAPI.app;

const STYLE = `
.ideo4{--bg:#0e0f12;--panel:#16181d;--panel2:#1d2026;--line:#2a2e36;--txt:#e6e7ea;
  --mut:#9aa0aa;--acc:#d8743a;--acc2:#3aa0d8;--grid:rgba(255,255,255,.06);
  --mono:ui-monospace,Menlo,Consolas,monospace;--sans:system-ui,sans-serif;
  background:var(--bg);color:var(--txt);font:14px/1.45 var(--sans);
  display:flex;flex-direction:column;gap:8px;padding:8px;border-radius:8px;height:100%;box-sizing:border-box}
.ideo4 *{box-sizing:border-box}
.ideo4 .toolbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ideo4 .seg{display:flex;border:1px solid var(--line);border-radius:7px;overflow:hidden}
.ideo4 .seg button{background:var(--panel);color:var(--mut);border:0;padding:6px 13px;cursor:pointer;font:14px var(--sans)}
.ideo4 .seg button.on{background:var(--acc);color:#1a0d05;font-weight:600}
.ideo4 .btn{background:var(--panel2);color:var(--txt);border:1px solid var(--line);padding:6px 13px;border-radius:7px;cursor:pointer;font:14px var(--sans)}
.ideo4 .btn:hover{border-color:var(--acc)}
.ideo4 .btn.acc{background:var(--acc);color:#1a0d05;border-color:var(--acc);font-weight:600}
.ideo4 .canvas-host{flex:1;display:flex;align-items:center;justify-content:center;
  background:repeating-linear-gradient(45deg,#101216 0 10px,#0d0f12 10px 20px);
  border:1px solid var(--line);border-radius:10px;min-height:220px;padding:10px;overflow:hidden}
.ideo4 .frame{position:relative;background:#1a1d22;box-shadow:0 0 0 1px var(--line);
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:10% 10%,10% 10%}
.ideo4 .bx{position:absolute;border:1.5px solid var(--acc);background:rgba(216,116,58,.12);cursor:move;border-radius:2px}
.ideo4 .bx.sel{border-color:#fff;background:rgba(216,116,58,.22);box-shadow:0 0 0 1px var(--acc)}
.ideo4 .bx .tag{position:absolute;top:-11px;left:6px;background:var(--acc);color:#1a0d05;font:600 12px/1.4 var(--sans);padding:2px 7px;border-radius:5px;white-space:nowrap;pointer-events:none}
.ideo4 .bx.text{border-color:var(--acc2);background:rgba(58,160,216,.12)}
.ideo4 .bx.text .tag{background:var(--acc2);color:#04161f}
.ideo4 .h{position:absolute;width:11px;height:11px;background:#fff;border:1px solid var(--acc);border-radius:2px}
.ideo4 .h.se{right:-6px;bottom:-6px;cursor:nwse-resize}
.ideo4 .hint{color:var(--mut);font-size:12px}
.ideo4 label.lbl{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.5px}
.ideo4 input,.ideo4 textarea{background:var(--panel2);color:var(--txt);border:1px solid var(--line);border-radius:6px;padding:6px 8px;font:13px var(--sans);width:100%}
.ideo4 textarea{resize:vertical;min-height:48px;font:13px var(--mono)}
.ideo4 .field{display:flex;flex-direction:column;gap:3px;margin-bottom:6px}
.ideo4 details.cap{border:1px solid var(--line);border-radius:8px;padding:6px 9px;background:var(--panel)}
.ideo4 details.cap summary{cursor:pointer;color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.5px}
.ideo4 .list{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow:auto}
.ideo4 .card{border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--panel2)}
.ideo4 .card.sel{border-color:var(--acc)}
.ideo4 .card .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.ideo4 .mini{font:12px var(--mono);color:var(--mut)}
.ideo4 .x{background:transparent;border:0;color:var(--mut);cursor:pointer;font-size:17px;line-height:1}
.ideo4 .x:hover{color:var(--acc)}
.ideo4 .zb{background:var(--panel);border:1px solid var(--line);color:var(--mut);cursor:pointer;font-size:11px;border-radius:4px;padding:3px 6px}
.ideo4 .zb:hover{color:var(--acc);border-color:var(--acc)}
.ideo4 .pal{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}
.ideo4 .sw{width:16px;height:16px;border-radius:4px;border:1px solid var(--line)}
.ideo4 pre.json{margin:0;background:#0b0c0e;border:1px solid var(--line);border-radius:7px;padding:9px;font:12px var(--mono);color:#cdd2da;max-height:140px;overflow:auto;white-space:pre-wrap;word-break:break-word}
`;

function injectStyleOnce() {
  if (document.getElementById("ideo4-bbox-style")) return;
  const s = document.createElement("style");
  s.id = "ideo4-bbox-style";
  s.textContent = STYLE;
  document.head.appendChild(s);
}

const AR = { "4:5": [4, 5], "16:9": [16, 9], "1:1": [1, 1] };
const clamp = (v) => Math.max(0, Math.min(1000, v));
const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const parseHex = (s) => (s || "").split(",").map((x) => x.trim()).filter((x) => /^#[0-9A-Fa-f]{6}$/.test(x)).map((x) => x.toUpperCase());

function buildEditor(node) {
  const widget = (node.widgets || []).find((w) => w.name === "caption_json");
  if (widget) { widget.type = "hidden"; widget.computeSize = () => [0, -4]; }

  // ---- state ----
  let ar = "4:5";
  let els = [];
  let sel = null;
  let uid = 0;
  let cap = {
    high_level_description: "",
    style_description: { aesthetics: "", lighting: "", photo: "", art_style: "", medium: "photograph", color_palette: [] },
    background: "",
  };

  // ---- DOM ----
  const root = document.createElement("div");
  root.className = "ideo4";
  root.innerHTML = `
    <div class="toolbar">
      <div class="seg" data-ar>
        <button data-arv="4:5" class="on">4:5</button>
        <button data-arv="16:9">16:9</button>
        <button data-arv="1:1">1:1</button>
      </div>
      <button class="btn acc" data-add="obj">+ obj</button>
      <button class="btn" data-add="text">+ text</button>
      <button class="btn" data-del>Delete</button>
      <button class="btn" data-imp>Paste JSON</button>
    </div>
    <div data-impbar style="display:none;flex-direction:column;gap:6px">
      <textarea data-imptxt placeholder="Paste caption JSON (also doubly-encoded — it gets unwrapped)" style="min-height:70px"></textarea>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn acc" data-impload>Load</button>
        <button class="btn" data-impcancel>Cancel</button>
        <span class="hint" data-impmsg></span>
      </div>
    </div>
    <div class="canvas-host"><div class="frame" data-frame></div></div>
    <details class="cap"><summary>caption fields (high level / style / background)</summary>
      <div style="margin-top:8px">
        <div class="field"><label class="lbl">high_level_description</label><textarea data-cap="high_level_description"></textarea></div>
        <div class="field"><label class="lbl">background</label><textarea data-cap="background"></textarea></div>
        <div class="field"><label class="lbl">aesthetics</label><input data-capsd="aesthetics"></div>
        <div class="field"><label class="lbl">lighting</label><input data-capsd="lighting"></div>
        <div class="field"><label class="lbl">photo</label><input data-capsd="photo"></div>
        <div class="field"><label class="lbl">medium</label><input data-capsd="medium"></div>
        <div class="field"><label class="lbl">style color_palette (hex, comma)</label><input data-cappal></div>
      </div>
    </details>
    <div class="list" data-list></div>
    <pre class="json" data-json></pre>
  `;

  const frame = root.querySelector("[data-frame]");
  const listEl = root.querySelector("[data-list]");
  const jsonEl = root.querySelector("[data-json]");
  const $ = (s) => root.querySelector(s);

  // Keep pointer/wheel interactions inside the editor — otherwise LiteGraph
  // pans the canvas / drags the node while you move or resize boxes.
  root.addEventListener("pointerdown", (e) => e.stopPropagation());
  root.addEventListener("wheel", (e) => e.stopPropagation());

  // ---- import normalize (verbatim) ----
  function normalize(obj) {
    if (typeof obj === "string") obj = JSON.parse(obj);
    const hld = obj.high_level_description;
    if (typeof hld === "string" && hld.trim().startsWith("{")) {
      try { const inner = JSON.parse(hld); if (inner && inner.compositional_deconstruction) return normalize(inner); } catch (e) {}
    }
    return obj;
  }
  function loadCaption(raw) {
    const o = normalize(raw);
    cap.high_level_description = o.high_level_description || "";
    const sd = o.style_description || {};
    cap.style_description = {
      aesthetics: sd.aesthetics || "", lighting: sd.lighting || "",
      photo: sd.photo || "", art_style: sd.art_style || "",
      medium: sd.medium || "photograph", color_palette: sd.color_palette || [],
    };
    const cd = o.compositional_deconstruction || {};
    cap.background = cd.background || "";
    els = (cd.elements || []).map((e, i) => {
      uid++;
      return { id: uid, type: e.type === "text" ? "text" : "obj",
        bbox: Array.isArray(e.bbox) && e.bbox.length === 4 ? e.bbox.map(Number) : [40, 250, 1000, 750],
        desc: e.desc || "", text: e.text || "", palette: (e.color_palette || []).join(","), z: i + 1 };
    });
    sel = els.length ? els[0].id : null;
    syncCapFields();
  }

  // ---- geometry (verbatim) ----
  function fitFrame() {
    const host = frame.parentElement;
    const pad = 20;
    const availW = host.clientWidth - pad;
    const availH = host.clientHeight - pad;
    const [aw, ah] = AR[ar];
    let w = availW, h = (w * ah) / aw;
    if (h > availH) { h = availH; w = (h * aw) / ah; }
    frame.style.width = Math.max(120, w) + "px";
    frame.style.height = Math.max(120, h) + "px";
    render();
  }
  function pxFromBbox(b) {
    const W = frame.clientWidth, H = frame.clientHeight;
    const [y0, x0, y1, x1] = b;
    return { left: (x0 / 1000) * W, top: (y0 / 1000) * H, width: ((x1 - x0) / 1000) * W, height: ((y1 - y0) / 1000) * H };
  }
  function bboxFromPx(left, top, width, height) {
    const W = frame.clientWidth, H = frame.clientHeight;
    let x0 = Math.round((left / W) * 1000), y0 = Math.round((top / H) * 1000);
    let x1 = Math.round(((left + width) / W) * 1000), y1 = Math.round(((top + height) / H) * 1000);
    x0 = clamp(x0); y0 = clamp(y0); x1 = clamp(x1); y1 = clamp(y1);
    if (x1 <= x0) x1 = Math.min(1000, x0 + 10);
    if (y1 <= y0) y1 = Math.min(1000, y0 + 10);
    return [y0, x0, y1, x1];
  }
  function area(e) { const [y0, x0, y1, x1] = e.bbox; return (x1 - x0) * (y1 - y0); }

  function addEl(type) {
    uid++;
    let b;
    if (type === "text") { b = [120, 300, 260, 700]; }
    else { b = ar === "16:9" ? [80, 400, 1000, 620] : ar === "4:5" ? [30, 230, 1000, 770] : [40, 250, 1000, 750]; }
    els.push({ id: uid, type, bbox: b, desc: "", text: "", palette: "", z: uid });
    sel = uid;
    render();
  }

  function render() {
    frame.querySelectorAll(".bx").forEach((n) => n.remove());
    els.forEach((e) => {
      const p = pxFromBbox(e.bbox);
      const d = document.createElement("div");
      d.className = "bx " + e.type + (e.id === sel ? " sel" : "");
      d.style.left = p.left + "px"; d.style.top = p.top + "px";
      d.style.width = p.width + "px"; d.style.height = p.height + "px";
      d.style.zIndex = e.id === sel ? 1000 : e.z;
      d.style.pointerEvents = "auto";
      d.dataset.id = e.id;
      const tag = e.type === "text" ? "text: " + (e.text || "…") : "obj #" + e.id;
      d.innerHTML = '<span class="tag">' + esc(tag) + '</span><div class="h se"></div>';
      frame.appendChild(d);
      bindDrag(d, e);
    });
    renderList();
    serialize();
  }

  // ---- overlap click-cycle selection (verbatim) ----
  let lastHit = null, lastIdx = 0;
  frame.addEventListener("pointerdown", (ev) => {
    if (ev.target.classList.contains("se")) return;
    ev.preventDefault();
    const r = frame.getBoundingClientRect();
    const px = ev.clientX - r.left, py = ev.clientY - r.top;
    const hits = els.filter((e) => {
      const p = pxFromBbox(e.bbox);
      return px >= p.left && px <= p.left + p.width && py >= p.top && py <= p.top + p.height;
    }).sort((a, b) => area(a) - area(b));
    if (!hits.length) return;
    const key = hits.map((h) => h.id).join(",");
    if (key === lastHit) { lastIdx = (lastIdx + 1) % hits.length; } else { lastHit = key; lastIdx = 0; }
    const chosen = hits[lastIdx];
    selectEl(chosen.id);
    startDrag(chosen, ev, false);
  }, true);

  function bumpZ(id, dir) {
    const sorted = [...els].sort((a, b) => a.z - b.z);
    const i = sorted.findIndex((e) => e.id === id);
    const j = i + (dir > 0 ? 1 : -1);
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    const t = a.z; a.z = b.z; b.z = t;
    sel = id; render();
  }

  function startDrag(e, ev, isHandle) {
    const dnode = frame.querySelector('.bx[data-id="' + e.id + '"]');
    if (!dnode) return;
    const startX = ev.clientX, startY = ev.clientY;
    const o = pxFromBbox(e.bbox);
    const move = (m) => {
      let dx = m.clientX - startX, dy = m.clientY - startY;
      let left = o.left, top = o.top, w = o.width, h = o.height;
      if (isHandle) { w = Math.max(8, o.width + dx); h = Math.max(8, o.height + dy); }
      else { left = o.left + dx; top = o.top + dy; }
      left = Math.max(0, Math.min(frame.clientWidth - w, left));
      top = Math.max(0, Math.min(frame.clientHeight - h, top));
      dnode.style.left = left + "px"; dnode.style.top = top + "px";
      dnode.style.width = w + "px"; dnode.style.height = h + "px";
      e.bbox = bboxFromPx(left, top, w, h);
      updateBboxReadout(e);
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      serialize();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }
  function bindDrag(dnode, e) {
    const handle = dnode.querySelector(".se");
    if (handle) handle.addEventListener("pointerdown", (ev) => {
      if (e.id !== sel) return;
      ev.stopPropagation();
      startDrag(e, ev, true);
    });
  }

  function selectEl(id) {
    sel = id;
    frame.querySelectorAll(".bx").forEach((n) => {
      const on = n.dataset.id == sel;
      n.classList.toggle("sel", on);
      n.style.zIndex = on ? 1000 : 10;
      n.style.pointerEvents = on ? "auto" : "none";
    });
    listEl.querySelectorAll(".card").forEach((c) => c.classList.toggle("sel", c.dataset.id == sel));
  }
  function updateBboxReadout(e) {
    const c = listEl.querySelector('.card[data-id="' + e.id + '"] .mini');
    if (c) c.textContent = "bbox [" + e.bbox.join(", ") + "]";
  }

  function palSw(s) { return parseHex(s).map((h) => '<span class="sw" style="background:' + h + '"></span>').join(""); }

  function renderList() {
    listEl.innerHTML = "";
    if (!els.length) { listEl.innerHTML = '<div class="hint">Add an element with “+ obj” or “+ text”.</div>'; return; }
    els.forEach((e) => {
      const c = document.createElement("div");
      c.className = "card" + (e.id === sel ? " sel" : "");
      c.dataset.id = e.id;
      c.innerHTML =
        '<div class="top"><b>' + (e.type === "text" ? "text" : "obj") + " #" + e.id + "</b>" +
        '<span style="display:flex;gap:4px;align-items:center">' +
        '<button class="zb" data-up="' + e.id + '" title="up">▲</button>' +
        '<button class="zb" data-down="' + e.id + '" title="down">▼</button>' +
        '<button class="x" data-x="' + e.id + '">×</button></span></div>' +
        '<div class="mini" style="margin-bottom:6px">bbox [' + e.bbox.join(", ") + "]</div>" +
        (e.type === "text" ? '<div class="field"><label class="lbl">text (literal)</label><input data-f="text" data-id="' + e.id + '" value="' + esc(e.text) + '"></div>' : "") +
        '<div class="field"><label class="lbl">desc</label><textarea data-f="desc" data-id="' + e.id + '">' + esc(e.desc) + "</textarea></div>" +
        '<div class="field"><label class="lbl">palette (hex, comma)</label><input data-f="palette" data-id="' + e.id + '" value="' + esc(e.palette) + '" placeholder="#0A0A0C,#C8772E"></div>' +
        '<div class="pal">' + palSw(e.palette) + "</div>";
      c.addEventListener("click", (ev) => { if (ev.target.dataset.x) return; selectEl(e.id); });
      listEl.appendChild(c);
    });
    listEl.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => { els = els.filter((x) => x.id != b.dataset.x); if (sel == b.dataset.x) sel = null; render(); }));
    listEl.querySelectorAll("[data-up]").forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); bumpZ(+b.dataset.up, +1); }));
    listEl.querySelectorAll("[data-down]").forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); bumpZ(+b.dataset.down, -1); }));
    listEl.querySelectorAll("[data-f]").forEach((inp) => {
      inp.oninput = () => {
        const e = els.find((x) => x.id == inp.dataset.id);
        if (e) { e[inp.dataset.f] = inp.value; serialize();
          if (inp.dataset.f === "text") { const n = frame.querySelector('.bx[data-id="' + e.id + '"] .tag'); if (n) n.textContent = "text: " + (e.text || "…"); } }
      };
    });
  }

  // ---- caption fields binding (added) ----
  function syncCapFields() {
    $('[data-cap="high_level_description"]').value = cap.high_level_description || "";
    $('[data-cap="background"]').value = cap.background || "";
    $('[data-capsd="aesthetics"]').value = cap.style_description.aesthetics || "";
    $('[data-capsd="lighting"]').value = cap.style_description.lighting || "";
    $('[data-capsd="photo"]').value = cap.style_description.photo || "";
    $('[data-capsd="medium"]').value = cap.style_description.medium || "";
    $("[data-cappal]").value = (cap.style_description.color_palette || []).join(",");
  }
  root.querySelectorAll("[data-cap]").forEach((inp) => (inp.oninput = () => { cap[inp.dataset.cap] = inp.value; serialize(); }));
  root.querySelectorAll("[data-capsd]").forEach((inp) => (inp.oninput = () => { cap.style_description[inp.dataset.capsd] = inp.value; serialize(); }));
  $("[data-cappal]").oninput = (ev) => { cap.style_description.color_palette = parseHex(ev.target.value); serialize(); };

  // ---- build (verbatim) ----
  function buildCaption() {
    const sd = cap.style_description;
    const style = { aesthetics: sd.aesthetics || "", lighting: sd.lighting || "" };
    if (sd.art_style && !sd.photo) { style.medium = sd.medium || "painting"; style.art_style = sd.art_style; }
    else { style.photo = sd.photo || ""; style.medium = sd.medium || "photograph"; }
    if ((sd.color_palette || []).length) style.color_palette = sd.color_palette;
    return {
      high_level_description: cap.high_level_description || "",
      style_description: style,
      compositional_deconstruction: {
        background: cap.background || "",
        elements: els.map((e) => {
          const o = { type: e.type, bbox: e.bbox };
          if (e.type === "text") o.text = e.text || "";
          o.desc = e.desc || "";
          const pal = parseHex(e.palette);
          if (pal.length) o.color_palette = pal.slice(0, 5);
          return o;
        }),
      },
    };
  }
  function serialize() {
    const s = JSON.stringify(buildCaption(), null, 2);
    jsonEl.textContent = s;
    if (widget) widget.value = JSON.stringify(buildCaption());
    if (node.graph) node.graph.setDirtyCanvas(true, true);
  }

  // ---- toolbar wiring ----
  root.querySelector("[data-ar]").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b) return;
    root.querySelectorAll("[data-ar] button").forEach((x) => x.classList.remove("on"));
    b.classList.add("on"); ar = b.dataset.arv; fitFrame();
  });
  root.querySelectorAll("[data-add]").forEach((b) => (b.onclick = () => addEl(b.dataset.add)));
  root.querySelector("[data-del]").onclick = () => { if (sel) { els = els.filter((x) => x.id != sel); sel = null; render(); } };
  const impbar = root.querySelector("[data-impbar]");
  root.querySelector("[data-imp]").onclick = () => { impbar.style.display = impbar.style.display === "none" ? "flex" : "none"; };
  root.querySelector("[data-impcancel]").onclick = () => { impbar.style.display = "none"; root.querySelector("[data-impmsg]").textContent = ""; };
  root.querySelector("[data-impload]").onclick = () => {
    const msg = root.querySelector("[data-impmsg]");
    try { loadCaption(root.querySelector("[data-imptxt]").value); impbar.style.display = "none"; msg.textContent = ""; fitFrame(); }
    catch (e) { msg.style.color = "#e0544a"; msg.textContent = "Error: " + e.message; }
  };

  // ---- attach + init ----
  node.addDOMWidget("ideo_editor", "div", root, { serialize: false, hideOnZoom: false });
  node.size = [Math.max(node.size?.[0] || 0, 460), Math.max(node.size?.[1] || 0, 620)];

  const ro = new ResizeObserver(() => fitFrame());
  ro.observe(root.querySelector(".canvas-host"));

  // Deferred init: when loading a saved workflow, ComfyUI applies widget values
  // via configure() AFTER onNodeCreated, so read the value on the next tick to
  // pick up a restored caption; otherwise seed a single obj for a fresh node.
  setTimeout(() => {
    let seeded = false;
    if (widget && widget.value && widget.value.trim() && widget.value.trim() !== "{}") {
      try { loadCaption(widget.value); seeded = true; } catch (e) {}
    }
    if (!seeded && els.length === 0) addEl("obj");
    syncCapFields();
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
