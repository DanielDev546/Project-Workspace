<script>
  import { editor, canvas, tools, panel, GRID, selectShape, showToast, snapVal } from '$lib/stores.svelte.js';
  import { starPts, hexPts, scalePathToBox } from '$lib/shapeUtils.js';

  let { onpencomplete, ondropfile, ondropurl } = $props();

  let canvasEl = $state(null);
  let dragging = false, dragOffX = 0, dragOffY = 0;
  let resizing = false, resizeHandle = '', resizeStartX = 0, resizeStartY = 0, resizeOrig = null;
  let rubberActive = false, rbStart = null;
  let rbRect = $state({ left: 0, top: 0, width: 0, height: 0 });
  let showRubber = $state(false);
  let penPoints = $state([]);
  let isPenDrawing = false;
  let isDragOver = $state(false);

  const DIRS    = ['nw','n','ne','e','se','s','sw','w'];
  const CURSORS = { nw:'nwse-resize', n:'ns-resize', ne:'nesw-resize', e:'ew-resize', se:'nwse-resize', s:'ns-resize', sw:'nesw-resize', w:'ew-resize' };

  const bgStyle = $derived(() => {
    if (canvas.bgMode === 'solid') return canvas.bgColor;
    if (canvas.bgMode === 'none')  return 'transparent';
    return '#fff';
  });

  function svgPt(e) {
    const rect = canvasEl.getBoundingClientRect(), sc = tools.zoom / 100;
    return [(e.clientX - rect.left) / sc, (e.clientY - rect.top) / sc];
  }

  // ── Drag ────────────────────────────────────────────────────────────────────
  function startDrag(e, id) {
    if (tools.active !== 'select') return;
    e.stopPropagation(); e.preventDefault();
    const s = editor.shapes.find(x => x.id === id);
    if (s?.locked) return;
    selectShape(id);
    const rect = canvasEl.getBoundingClientRect(), sc = tools.zoom / 100;
    dragging = true;
    dragOffX = (e.clientX - rect.left) / sc - s.x;
    dragOffY = (e.clientY - rect.top)  / sc - s.y;
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup',   onDragEnd);
  }

  function onDragMove(e) {
    if (!dragging || !editor.selectedId) return;
    const s = editor.shapes.find(x => x.id === editor.selectedId); if (!s) return;
    const rect = canvasEl.getBoundingClientRect(), sc = tools.zoom / 100;
    s.x = snapVal((e.clientX - rect.left) / sc - dragOffX);
    s.y = snapVal((e.clientY - rect.top)  / sc - dragOffY);
    panel.x = s.x; panel.y = s.y;
  }

  function onDragEnd() {
    dragging = false;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup',   onDragEnd);
  }

  // ── Resize ───────────────────────────────────────────────────────────────────
  function startResize(e, id, dir) {
    e.stopPropagation(); e.preventDefault();
    resizing = true; resizeHandle = dir;
    resizeStartX = e.clientX; resizeStartY = e.clientY;
    const s = editor.shapes.find(x => x.id === id);
    resizeOrig = { ...s };
    selectShape(id);
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup',   onResizeEnd);
  }

  function onResizeMove(e) {
    if (!resizing || !editor.selectedId) return;
    const s = editor.shapes.find(x => x.id === editor.selectedId); if (!s) return;
    const sc = tools.zoom / 100;
    const dx = (e.clientX - resizeStartX) / sc;
    const dy = (e.clientY - resizeStartY) / sc;
    const o = resizeOrig, dir = resizeHandle;
    let { x, y, w, h } = o;
    if (dir.includes('e')) w = Math.max(4, o.w + dx);
    if (dir.includes('s')) h = Math.max(4, o.h + dy);
    if (dir.includes('w')) { x = o.x + dx; w = Math.max(4, o.w - dx); }
    if (dir.includes('n')) { y = o.y + dy; h = Math.max(4, o.h - dy); }
    s.x = snapVal(Math.round(x)); s.y = snapVal(Math.round(y));
    s.w = snapVal(Math.round(w)); s.h = snapVal(Math.round(h));
    panel.x = s.x; panel.y = s.y; panel.w = s.w; panel.h = s.h;
  }

  function onResizeEnd() {
    resizing = false;
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup',   onResizeEnd);
  }

  // ── Canvas mousedown ─────────────────────────────────────────────────────────
  function onCanvasMousedown(e) {
    const onBg = e.target === canvasEl || e.target.tagName === 'svg';
    if (onBg) editor.selectedId = null;
    if (tools.active === 'pen') { startPenDraw(e); return; }
    if (tools.active === 'select' && onBg) startRubberband(e);
  }

  // ── Pen ──────────────────────────────────────────────────────────────────────
  function startPenDraw(e) {
    isPenDrawing = true; penPoints = [svgPt(e)];
    window.addEventListener('mousemove', onPenMove);
    window.addEventListener('mouseup',   onPenUp);
  }
  function onPenMove(e) { if (isPenDrawing) penPoints = [...penPoints, svgPt(e)]; }
  function onPenUp() {
    isPenDrawing = false;
    window.removeEventListener('mousemove', onPenMove);
    window.removeEventListener('mouseup',   onPenUp);
    if (penPoints.length >= 2) { onpencomplete(penPoints); }
    penPoints = [];
  }

  // ── Rubberband ───────────────────────────────────────────────────────────────
  function startRubberband(e) {
    const rect = canvasEl.getBoundingClientRect();
    rbStart = [e.clientX - rect.left, e.clientY - rect.top];
    rubberActive = true; showRubber = true;
    window.addEventListener('mousemove', onRbMove);
    window.addEventListener('mouseup',   onRbEnd);
  }
  function onRbMove(e) {
    if (!rubberActive) return;
    const rect = canvasEl.getBoundingClientRect();
    const pt = [e.clientX - rect.left, e.clientY - rect.top];
    rbRect = { left: Math.min(rbStart[0], pt[0]), top: Math.min(rbStart[1], pt[1]), width: Math.abs(pt[0]-rbStart[0]), height: Math.abs(pt[1]-rbStart[1]) };
  }
  function onRbEnd() {
    rubberActive = false; showRubber = false;
    window.removeEventListener('mousemove', onRbMove);
    window.removeEventListener('mouseup',   onRbEnd);
  }

  // ── Drop ─────────────────────────────────────────────────────────────────────
  function onDrop(e) {
    e.preventDefault(); isDragOver = false;
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) { ondropfile(files[0]); return; }
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url?.startsWith('http')) ondropurl(url);
  }

  function getDash(s) {
    if (s.strokeDash === 'dashed') return `${Math.max(4, s.strokeWidth * 3)},${Math.max(2, s.strokeWidth * 2)}`;
    if (s.strokeDash === 'dotted') return `${s.strokeWidth},${Math.max(3, s.strokeWidth * 2)}`;
    return null;
  }

  // Expose canvas element for export
  export function getCanvasEl() { return canvasEl; }
</script>

<div class="canvas-area"
  onmousedown={onCanvasMousedown}
  onwheel={e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); tools.zoom = Math.max(10, Math.min(400, tools.zoom + (e.deltaY > 0 ? -10 : 10))); } }}
  ondragover={e => { e.preventDefault(); isDragOver = true; }}
  ondragleave={() => isDragOver = false}
  ondrop={onDrop}
>
  <div class="canvas-bg"></div>
  {#if isDragOver}
    <div class="drop-overlay"><span>Drop image here</span></div>
  {/if}
  {#if showRubber}
    <div class="rubberband" style="left:{rbRect.left}px;top:{rbRect.top}px;width:{rbRect.width}px;height:{rbRect.height}px;"></div>
  {/if}

  <div class="canvas-wrap" style="transform:scale({tools.zoom/100});transform-origin:center center;">
    <svg
      bind:this={canvasEl}
      width={canvas.width}
      height={canvas.height}
      style="background:{bgStyle()};border-radius:3px;box-shadow:0 4px 30px #0009;display:block;cursor:{tools.active==='pen'?'crosshair':'default'}"
    >
      <defs>
        <!-- bg image pattern -->
        {#if canvas.bgMode === 'image' && canvas.bgImageData}
          <pattern id="bgImgPattern" patternUnits="userSpaceOnUse" x="0" y="0" width={canvas.width} height={canvas.height}>
            <image href={canvas.bgImageData} x="0" y="0" width={canvas.width} height={canvas.height}
              preserveAspectRatio={canvas.bgFit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
              opacity={canvas.bgOpacity}
            />
          </pattern>
        {/if}

        <!-- gradients -->
        {#each editor.shapes.filter(s => s.fillType === 'gradient') as s (s.id)}
          {#if s.gradType === 'radial'}
            <radialGradient id="grad_{s.id}" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color={s.gradColor1}/>
              <stop offset="100%" stop-color={s.gradColor2}/>
            </radialGradient>
          {:else}
            <linearGradient id="grad_{s.id}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stop-color={s.gradColor1}/>
              <stop offset="100%" stop-color={s.gradColor2}/>
            </linearGradient>
          {/if}
        {/each}

        <!-- filters -->
        {#each editor.shapes.filter(s => s.shadow > 0 || s.blur > 0) as s (s.id)}
          <filter id="flt_{s.id}" x="-50%" y="-50%" width="200%" height="200%">
            {#if s.blur   > 0}<feGaussianBlur stdDeviation={s.blur} result="blur"/>{/if}
            {#if s.shadow > 0}<feDropShadow dx="0" dy={s.shadow*0.5} stdDeviation={s.shadow*0.5} flood-opacity="0.5"/>{/if}
          </filter>
        {/each}
      </defs>

      <!-- bg rect for image -->
      <rect width={canvas.width} height={canvas.height}
        fill={canvas.bgMode === 'image' && canvas.bgImageData ? 'url(#bgImgPattern)' : 'none'}
        style="pointer-events:none"
      />

      <!-- Grid -->
      {#if tools.gridVisible}
        <g style="pointer-events:none">
          {#each Array.from({length: Math.floor(canvas.width / GRID) + 1}, (_,i) => i*GRID) as x}
            <line x1={x} y1="0" x2={x} y2={canvas.height} stroke="#4a90e222" stroke-width="0.5"/>
          {/each}
          {#each Array.from({length: Math.floor(canvas.height / GRID) + 1}, (_,i) => i*GRID) as y}
            <line x1="0" y1={y} x2={canvas.width} y2={y} stroke="#4a90e222" stroke-width="0.5"/>
          {/each}
        </g>
      {/if}

      <!-- Shapes -->
      {#each editor.shapes.filter(s => s.visible) as s (s.id)}
        {@const cx = s.x + s.w/2}
        {@const cy = s.y + s.h/2}
        {@const fill = s.fillType === 'gradient' ? `url(#grad_${s.id})` : s.fill}
        {@const dash = getDash(s)}
        {@const filt = (s.shadow > 0 || s.blur > 0) ? `url(#flt_${s.id})` : null}
        {@const tr = `rotate(${s.rotation},${cx},${cy})${s.flipH ? ` scale(-1,1) translate(${-2*cx},0)` : ''}${s.flipV ? ` scale(1,-1) translate(0,${-2*cy})` : ''}`}
        <g transform={tr} style="cursor:{s.locked?'not-allowed':'move'}" onmousedown={e => startDrag(e, s.id)}>
          {#if s.type === 'image'}
            <image x={s.x} y={s.y} width={s.w} height={s.h}
              href={s.imageData} preserveAspectRatio={s.preserveAspectRatio||'xMidYMid meet'}
              opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'rect'}
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} ry={s.ry}
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              stroke-linecap="round" opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'circle'}
            <ellipse cx={s.x+s.w/2} cy={s.y+s.h/2} rx={s.w/2} ry={s.h/2}
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'triangle'}
            <polygon points="{s.x+s.w/2},{s.y} {s.x+s.w},{s.y+s.h} {s.x},{s.y+s.h}"
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              stroke-linecap="round" opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'line'}
            <line x1={s.x} y1={s.y+s.h/2} x2={s.x+s.w} y2={s.y+s.h/2}
              stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              stroke-linecap="round" opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'dot'}
            <circle cx={s.x+s.w/2} cy={s.y+s.h/2} r={Math.min(s.w,s.h)/2}
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'star'}
            <polygon points={starPts(s.x+s.w/2, s.y+s.h/2, Math.min(s.w,s.h)/2, Math.min(s.w,s.h)/4, 5)}
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              stroke-linecap="round" opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'diamond'}
            <polygon points="{s.x+s.w/2},{s.y} {s.x+s.w},{s.y+s.h/2} {s.x+s.w/2},{s.y+s.h} {s.x},{s.y+s.h/2}"
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              stroke-linecap="round" opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'hexagon'}
            <polygon points={hexPts(s.x+s.w/2, s.y+s.h/2, Math.min(s.w,s.h)/2)}
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              stroke-linecap="round" opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'arrow'}
            <polyline
              points="{s.x},{s.y+s.h/2} {s.x+s.w*0.7},{s.y+s.h/2} {s.x+s.w*0.7},{s.y+s.h*0.2} {s.x+s.w},{s.y+s.h/2} {s.x+s.w*0.7},{s.y+s.h*0.8} {s.x+s.w*0.7},{s.y+s.h/2}"
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              stroke-linecap="round" opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'path'}
            <path d={scalePathToBox(s.pathData, s.x, s.y, s.w, s.h)}
              {fill} stroke={s.stroke} stroke-width={s.strokeWidth} stroke-dasharray={dash}
              stroke-linecap="round" stroke-linejoin="round" opacity={s.opacity} filter={filt}
            />
          {:else if s.type === 'freehand'}
            <polyline points={s.points.map(p => p.join(',')).join(' ')}
              fill="none" stroke={s.stroke} stroke-width={s.strokeWidth}
              stroke-linecap="round" opacity={s.opacity} filter={filt}
            />
          {/if}
        </g>
      {/each}

      <!-- Pen preview -->
      {#if isPenDrawing && penPoints.length > 1}
        <polyline points={penPoints.map(p => p.join(',')).join(' ')}
          fill="none" stroke="#4a90e2" stroke-width="2" stroke-dasharray="4,2" opacity="0.8"
          style="pointer-events:none"
        />
      {/if}

      <!-- Selection handles -->
      {#if editor.selectedId}
        {@const sel = editor.shapes.find(x => x.id === editor.selectedId)}
        {#if sel?.visible}
          {@const pad = 5}
          {@const rx = sel.x - pad}
          {@const ry = sel.y - pad}
          {@const rw = sel.w + pad*2}
          {@const rh = sel.h + pad*2}
          {@const cx2 = sel.x + sel.w/2}
          {@const cy2 = sel.y + sel.h/2}
          <g transform="rotate({sel.rotation},{cx2},{cy2})" style="pointer-events:none">
            <rect x={rx} y={ry} width={rw} height={rh}
              fill="none" stroke="#4a90e2" stroke-width="1.5" stroke-dasharray="5,3"
            />
          </g>
          <!-- handles need pointer events — separate group -->
          <g transform="rotate({sel.rotation},{cx2},{cy2})">
            {#each [[rx,ry],[rx+rw/2,ry],[rx+rw,ry],[rx+rw,ry+rh/2],[rx+rw,ry+rh],[rx+rw/2,ry+rh],[rx,ry+rh],[rx,ry+rh/2]] as [hx,hy], i}
              <rect x={hx-5} y={hy-5} width="10" height="10"
                fill="#fff" stroke="#4a90e2" stroke-width="1.5" rx="2"
                style="cursor:{CURSORS[DIRS[i]]}"
                onmousedown={e => startResize(e, sel.id, DIRS[i])}
              />
            {/each}
          </g>
        {/if}
      {/if}
    </svg>
  </div>
</div>

<style>
  .canvas-area { flex: 1; background: #2e2e2e; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
  .canvas-bg { background: repeating-conic-gradient(#3a3a3a 0% 25%, #2e2e2e 0% 50%) 0 0/20px 20px; width: 100%; height: 100%; position: absolute; }
  .canvas-wrap { position: relative; z-index: 1; }
  .rubberband { position: absolute; border: 1.5px dashed var(--accent); background: #4a90e210; pointer-events: none; z-index: 10; }
  .drop-overlay { position: absolute; inset: 0; background: #4a90e222; border: 3px dashed var(--accent); display: flex; align-items: center; justify-content: center; z-index: 50; pointer-events: none; border-radius: 4px; }
  .drop-overlay span { font-size: 18px; color: var(--accent); font-weight: 700; }
</style>
