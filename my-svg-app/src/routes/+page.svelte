<script>
  import { onMount } from 'svelte';
  import Header    from '$lib/components/Header.svelte';
  import Toolbar   from '$lib/components/Toolbar.svelte';
  import LeftPanel from '$lib/components/LeftPanel.svelte';
  import Canvas    from '$lib/components/Canvas.svelte';
  import RightPanel from '$lib/components/RightPanel.svelte';
  import Modals    from '$lib/components/Modals.svelte';
  import Toast     from '$lib/components/Toast.svelte';

  import {
    editor, tools, canvas, panel, modals,
    saveUndo, undo, redo, selectShape, makeShape, showToast,
    PRESETS
  } from '$lib/stores.svelte.js';
  import { getCleanSVGString, toJSX, formatSVG } from '$lib/shapeUtils.js';

  let canvasRef  = $state(null);
  let modalsRef  = $state(null);

  // ── Add Shape ────────────────────────────────────────────────────────────────
  function addShape() {
    saveUndo();
    const s = makeShape(tools.current, canvas.width/2 - 40, canvas.height/2 - 40, 80, 80);
    editor.shapes.push(s);
    selectShape(s.id);
  }

  function addPreset(p) {
    saveUndo();
    const id = 's' + editor.nextId++;
    editor.shapes.push({
      id, type: 'path',
      x: canvas.width/2 - 40, y: canvas.height/2 - 40, w: 80, h: 80,
      fill: 'none', fillType: 'none',
      gradColor1: '#4a90e2', gradColor2: '#00c9a7', gradType: 'linear',
      stroke: panel.strokeColor || '#4a90e2', strokeWidth: 2, strokeDash: 'solid',
      opacity: 1, rotation: 0, rx: 0, ry: 0, shadow: 0, blur: 0,
      flipH: false, flipV: false, visible: true, locked: false, animation: null,
      name: p.name, pathData: p.path,
    });
    selectShape(id);
    showToast(`Added ${p.name}`);
  }

  // ── Image import ─────────────────────────────────────────────────────────────
  function placeImage(dataUrl, name) {
    const img = new Image();
    img.onload = () => {
      const maxW = Math.min(img.width,  canvas.width  * 0.6);
      const maxH = Math.min(img.height, canvas.height * 0.6);
      const sc   = Math.min(maxW / img.width, maxH / img.height, 1);
      const w    = Math.round(img.width  * sc);
      const h    = Math.round(img.height * sc);
      const id   = 's' + editor.nextId++;
      saveUndo();
      editor.shapes.push({
        id, type: 'image',
        x: Math.round((canvas.width  - w) / 2),
        y: Math.round((canvas.height - h) / 2),
        w, h,
        fill: 'none', fillType: 'none',
        gradColor1: '#4a90e2', gradColor2: '#00c9a7', gradType: 'linear',
        stroke: 'none', strokeWidth: 0, strokeDash: 'solid',
        opacity: 1, rotation: 0, rx: 0, ry: 0, shadow: 0, blur: 0,
        flipH: false, flipV: false, visible: true, locked: false, animation: null,
        name: name || 'Image', imageData: dataUrl,
        preserveAspectRatio: 'xMidYMid meet',
      });
      selectShape(id);
      showToast(`Image imported: ${name || 'image'}`);
    };
    img.src = dataUrl;
  }

  function handleImportImage({ dataUrl, name }) { placeImage(dataUrl, name); }

  function handleImportUrl(url) {
    fetch(url).then(r => r.blob()).then(blob => {
      const reader = new FileReader();
      reader.onload = e => placeImage(e.target.result, url.split('/').pop());
      reader.readAsDataURL(blob);
    }).catch(() => placeImage(url, url.split('/').pop()));
    showToast('Importing…');
  }

  function handleDropFile(file) {
    const reader = new FileReader();
    reader.onload = e => placeImage(e.target.result, file.name);
    reader.readAsDataURL(file);
  }

  // ── Pen complete ──────────────────────────────────────────────────────────────
  function handlePenComplete(points) {
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const id = 's' + editor.nextId++;
    saveUndo();
    editor.shapes.push({
      id, type: 'freehand',
      x: Math.min(...xs), y: Math.min(...ys),
      w: Math.max(1, Math.max(...xs) - Math.min(...xs)),
      h: Math.max(1, Math.max(...ys) - Math.min(...ys)),
      fill: 'none', fillType: 'none',
      gradColor1: '#4a90e2', gradColor2: '#00c9a7', gradType: 'linear',
      stroke: panel.strokeColor || '#4a90e2',
      strokeWidth: panel.strokeWidth || 2,
      strokeDash: 'solid', opacity: 1, rotation: 0, rx: 0, ry: 0,
      shadow: 0, blur: 0, flipH: false, flipV: false,
      visible: true, locked: false, animation: null,
      name: 'Path ' + editor.nextId, points,
    });
    selectShape(id);
  }

  // ── Delete / Duplicate ────────────────────────────────────────────────────────
  function deleteSelected() {
    if (!editor.selectedId) return;
    saveUndo();
    const i = editor.shapes.findIndex(s => s.id === editor.selectedId);
    if (i !== -1) editor.shapes.splice(i, 1);
    editor.selectedId = null;
  }

  function duplicate() {
    const s = editor.shapes.find(x => x.id === editor.selectedId); if (!s) return;
    saveUndo();
    const copy = JSON.parse(JSON.stringify(s));
    copy.id = 's' + editor.nextId++;
    copy.x += 15; copy.y += 15; copy.name = s.name + ' copy';
    editor.shapes.push(copy);
    selectShape(copy.id);
  }

  // ── Align / Reorder ───────────────────────────────────────────────────────────
  // Inside +page.svelte
function alignShapes(dir) {
  const s = editor.shapes.find(x => x.id === editor.selectedId);
  if (!s) return;

  if (dir === 'duplicate') {
    duplicate(); // Call your existing duplicate function
    return;
  }

  saveUndo();
  if (dir === 'left')   s.x = 0;
  if (dir === 'right')  s.x = canvas.width  - s.w;
  if (dir === 'center') s.x = (canvas.width  - s.w) / 2;
  if (dir === 'top')    s.y = 0;
  if (dir === 'bottom') s.y = canvas.height - s.h;
  if (dir === 'middle') s.y = (canvas.height - s.h) / 2;
  
  // Ensure the panel values sync up after alignment
  panel.x = s.x;
  panel.y = s.y;
}

  function reorder(dir) {
    const i = editor.shapes.findIndex(x => x.id === editor.selectedId); if (i < 0) return;
    saveUndo();
    const arr = editor.shapes;
    if      (dir === 'top') arr.push(arr.splice(i, 1)[0]);
    else if (dir === 'bot') arr.unshift(arr.splice(i, 1)[0]);
    else if (dir === 'fwd' && i < arr.length - 1) { const t = arr[i]; arr[i] = arr[i+1]; arr[i+1] = t; }
    else if (dir === 'bwd' && i > 0)              { const t = arr[i]; arr[i] = arr[i-1]; arr[i-1] = t; }
  }

  // ── Animation ─────────────────────────────────────────────────────────────────
  function applyAnimation({ type, duration }) {
    const s = editor.shapes.find(x => x.id === editor.selectedId);
    if (s) { s.animation = { type, duration }; showToast(`✦ ${type} animation applied`); }
  }
  function removeAnimation() {
    const s = editor.shapes.find(x => x.id === editor.selectedId);
    if (s) s.animation = null;
  }

  // ── Export / Code ─────────────────────────────────────────────────────────────
  function getCleanSVG() {
    const el = canvasRef?.getCanvasEl(); return el ? getCleanSVGString(el) : '';
  }

  function updateCodeOutput(tab) {
    const svg = getCleanSVG(); if (!svg) return;
    let out;
    if (tab === 'svg') out = formatSVG(svg);
    else if (tab === 'jsx') out = toJSX(svg);
    else out = 'data:image/svg+xml;base64,' + btoa(svg);
    modalsRef?.setCodeOutput(out);
  }

  function handleOpenCode() { modals.code = true; updateCodeOutput('svg'); }

  function handleExport(fmt) {
    const svg = getCleanSVG(); if (!svg) return;
    if (fmt === 'svg' || fmt === 'svg-opt') {
      dl(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), 'icon.svg');
      showToast('SVG exported!');
    } else if (fmt === 'png')    { pngExport(svg, 1); }
    else if (fmt === 'png2x')    { pngExport(svg, 2); }
    else if (fmt === 'jsx') {
      dl(URL.createObjectURL(new Blob([toJSX(svg)], { type: 'text/javascript' })), 'Icon.jsx');
      showToast('React component exported!');
    } else if (fmt === 'datauri') {
      navigator.clipboard.writeText('data:image/svg+xml;base64,' + btoa(svg)).then(() => showToast('Data URI copied!'));
    } else if (fmt === 'json') {
      dl(URL.createObjectURL(new Blob([JSON.stringify(editor.shapes, null, 2)], { type: 'application/json' })), 'icon.json');
      showToast('JSON exported!');
    }
  }

  function pngExport(svg, scale) {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width  = canvas.width  * scale;
      cv.height = canvas.height * scale;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      dl(cv.toDataURL('image/png'), 'icon' + (scale > 1 ? '@2x' : '') + '.png');
      URL.revokeObjectURL(url);
      showToast(`PNG @${scale}x exported!`);
    };
    img.src = url;
  }

  function dl(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  function handleKeydown(e) {
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || e.target.contentEditable === 'true') return;
    if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); return; }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return; }
      if (e.key === 'd') { e.preventDefault(); duplicate(); return; }
      if (e.key === 'e') { e.preventDefault(); handleExport('svg'); return; }
    } else {
      if (e.key === 'v') { tools.active = 'select'; return; }
      if (e.key === 'p') { tools.active = 'pen';    return; }
      if (e.key === 'a') { addShape(); return; }
      if (e.key === 'f') { tools.zoom = 100; return; }
      if (e.key === 'g') { tools.gridVisible = !tools.gridVisible; return; }
      if (e.key === ']') { reorder('fwd'); return; }
      if (e.key === '[') { reorder('bwd'); return; }
    }
    if (editor.selectedId) {
      const s = editor.shapes.find(x => x.id === editor.selectedId); if (!s) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); s.x -= step; panel.x = s.x; }
      if (e.key === 'ArrowRight') { e.preventDefault(); s.x += step; panel.x = s.x; }
      if (e.key === 'ArrowUp')    { e.preventDefault(); s.y -= step; panel.y = s.y; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); s.y += step; panel.y = s.y; }
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  onMount(() => {
    editor.shapes.push({
      id: 's1', type: 'circle',
      x: canvas.width/2 - 40, y: canvas.height/2 - 40, w: 80, h: 80,
      fill: '#2222dd', fillType: 'solid',
      gradColor1: '#4a90e2', gradColor2: '#00c9a7', gradType: 'linear',
      stroke: '#000000', strokeWidth: 0, strokeDash: 'solid',
      opacity: 1, rotation: 0, rx: 0, ry: 0, shadow: 0, blur: 0,
      flipH: false, flipV: false, visible: true, locked: false, animation: null,
      name: 'circle 1',
    });
    editor.nextId = 2;
    showToast('Welcome to SVG Icon Generator v2.1!');
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app">
  <Header
    onexport={handleExport}
    onopencode={handleOpenCode}
  />
  <Toolbar
    onaddshape={addShape}
    onundo={undo}
    onredo={redo}
  />
  <div class="main">
    <LeftPanel
      onaddshape={addShape}
      onimportimage={handleImportImage}
    />
    <Canvas
      bind:this={canvasRef}
      onpencomplete={handlePenComplete}
      ondropfile={handleDropFile}
      ondropurl={handleImportUrl}
    />
    <RightPanel
      onaddshape={addShape}
      onaddpreset={addPreset}
      onreorder={reorder}
      onalign={alignShapes}
    />
  </div>
  <Modals
    bind:this={modalsRef}
    onapplyanim={applyAnimation}
    onremoveanim={removeAnimation}
    onswitchcodetab={updateCodeOutput}
    onimporturl={handleImportUrl}
  />
  


  <!-- New Chill Footer Bar -->
  <footer class="footer-bar">
    <div class="footer-left">
      <span class="status-dot"></span>
      <span>System Ready</span>
    </div>
    <div class="footer-center"> 
      © 2026 SVG Icon Generator v2.1 by <span class="brand">DevLion</span>
    </div>
    <div class="footer-right">
      <span>v2.1.0</span>
      <span class="separator">|</span>
      <span>Lagos, NG</span>
    </div>
  </footer>

  <Modals bind:this={modalsRef} onapplyanim={applyAnimation} onremoveanim={removeAnimation} onswitchcodetab={updateCodeOutput} onimporturl={handleImportUrl} />
  <Toast />
</div>
  


<style>
.footer-bar {
  height: 28px;
  background: var(--panel);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 12px;
  color: var(--text2);
  letter-spacing: 0.5px;
  z-index: 50;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #4ade80; /* Success green */
  border-radius: 50%;
  box-shadow: 0 0 8px #4ade80;
}

.brand {
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
}

.footer-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.separator {
  color: var(--border);
}
  :global(*) { margin: 0; padding: 0; box-sizing: border-box; }
  :global(:root) {
    --bg: #1a1a1a; --panel: #242424; --panel2: #2e2e2e;
    --border: #3a3a3a; --accent: #4a90e2; --text: #e2e2e2;
    --text2: #888; --input-bg: #181818; --hover: #333;
    --selected: #4a90e218; --red: #e74c3c;
  }
  :global(body) { background: var(--bg); color: var(--text); font-family: 'Segoe UI', sans-serif; font-size: 12px; overflow: hidden; user-select: none; }
  .app  { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .main { display: flex; flex: 1; overflow: hidden; }

</style>
