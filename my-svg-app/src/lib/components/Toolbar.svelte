<script>
  import { tools, canvas, showToast } from '$lib/stores.svelte.js';

  let { onaddshape, onundo, onredo } = $props();

  function changeZoom(d) { tools.zoom = Math.max(10, Math.min(400, tools.zoom + d)); }

  function setTool(t) {
    tools.active = t;
    showToast(t === 'pen' ? '✏ Pen tool — draw freely on canvas' : '▷ Select tool');
  }

  function setCanvasSize(e) {
    const val = e.target.value;
    if (val === 'custom') {
      const w = prompt('Width:', canvas.width);
      const h = prompt('Height:', canvas.height);
      if (w && h) { canvas.width = parseInt(w); canvas.height = parseInt(h); }
      return;
    }
    const [w, h] = val.split('x');
    canvas.width = parseInt(w); canvas.height = parseInt(h);
    showToast(`Canvas: ${w}×${h}`);
  }
</script>

<div class="toolbar">
  <button class="tbtn" class:active-tool={tools.active === 'select'} onclick={() => setTool('select')}>▷ Select</button>
  <button class="tbtn" class:active-tool={tools.active === 'pen'}    onclick={() => setTool('pen')}>✏ Pen</button>
  <div class="tool-sep"></div>
  <button class="tbtn" onclick={onundo}>↩ Undo</button>
  <button class="tbtn" onclick={onredo}>↪ Redo</button>
  <div class="tool-sep"></div>
  <button class="tbtn" onclick={() => changeZoom(-10)}>−</button>
  <div class="zoom-box">{tools.zoom}%</div>
  <button class="tbtn" onclick={() => changeZoom(10)}>+</button>
  <button class="tbtn" onclick={() => tools.zoom = 100}>⊡ Fit</button>
  <div class="tool-sep"></div>
  <select class="canvas-size-select" onchange={setCanvasSize}>
    <option value="500x400">500×400</option>
    <option value="512x512">512×512 Icon</option>
    <option value="256x256">256×256</option>
    <option value="64x64">64×64</option>
    <option value="32x32">32×32</option>
    <option value="24x24">24×24</option>
    <option value="custom">Custom…</option>
  </select>
  <div class="tool-sep"></div>
  <button class="tbtn" class:active-tool={tools.gridVisible} onclick={() => tools.gridVisible = !tools.gridVisible}>⊞ Grid</button>
  <button class="tbtn" class:active-tool={tools.snapEnabled} onclick={() => { tools.snapEnabled = !tools.snapEnabled; showToast(tools.snapEnabled ? 'Snap ON' : 'Snap OFF'); }}>⊠ Snap</button>
  <button class="tbtn add-btn" onclick={onaddshape}>＋ Add</button>
</div>

<style>
  .toolbar { background: var(--panel); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: center; gap: 6px; padding: 7px 16px; flex-shrink: 0; flex-wrap: wrap; }
  .tool-sep { width: 1px; height: 20px; background: var(--border); margin: 0 2px; }
  .tbtn { background: var(--panel2); border: 1px solid var(--border); color: var(--text); padding: 5px 12px; border-radius: 5px; cursor: pointer; font-size: 12px; transition: all 0.15s; white-space: nowrap; }
  .tbtn:hover { background: var(--hover); }
  .tbtn.active-tool { background: var(--selected); border-color: var(--accent); color: var(--accent); }
  .zoom-box { background: var(--panel2); border: 1px solid var(--border); padding: 5px 10px; border-radius: 5px; font-size: 12px; min-width: 58px; text-align: center; }
  .canvas-size-select { background: var(--panel2); border: 1px solid var(--border); color: var(--text); padding: 5px 8px; border-radius: 5px; font-size: 12px; cursor: pointer; outline: none; }
  .add-btn { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
  .add-btn:hover { background: #3a7ad5; }
</style>
