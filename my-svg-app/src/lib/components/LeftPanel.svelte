<script>
  import { editor, panel, canvas, tools, modals, showToast, saveUndo, selectShape } from '$lib/stores.svelte.js';

  let { onaddshape, onimportimage } = $props();

  // AI
  let aiPrompt = $state('');
  let aiGenerating = $state(false);
  let aiStatus = $state('');
  let aiHistory = $state([]);

  async function generateWithAI() {
    if (!aiPrompt) { showToast('Please enter a description!'); return; }
    aiGenerating = true; aiStatus = 'AI is thinking...';
    await new Promise(r => setTimeout(r, 1500));
    onaddshape();
    aiHistory = [{ prompt: aiPrompt, time: new Date().toLocaleTimeString() }, ...aiHistory.slice(0, 4)];
    aiGenerating = false; aiStatus = 'Ready for next prompt.';
    showToast('AI Generated your icon!');
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onimportimage({ dataUrl: ev.target.result, name: file.name });
    reader.readAsDataURL(file);
  }

  function handleBgFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { canvas.bgImageData = ev.target.result; canvas.bgMode = 'image'; showToast('Background image set!'); };
    reader.readAsDataURL(file);
  }

  // Update selected shape from panel
  function updateShape(key, val) {
    const s = editor.shapes.find(x => x.id === editor.selectedId);
    if (s) { s[key] = val; }
  }

  function setFillType(type) {
    panel.fillType = type;
    const s = editor.shapes.find(x => x.id === editor.selectedId);
    if (s) { s.fillType = type; if (type === 'none') s.fill = 'none'; }
  }

  function updateColor(v) {
    panel.fillColor = v;
    updateShape('fill', v);
  }

  function updateGradient() {
    updateShape('gradColor1', panel.gradColor1);
    updateShape('gradColor2', panel.gradColor2);
  }

  function setGradType(type) {
    panel.gradType = type;
    updateShape('gradType', type);
  }

  function setStrokeDash(type) {
    panel.strokeDash = type;
    updateShape('strokeDash', type);
  }

  function updatePropW(v) {
    const nw = Math.max(1, parseFloat(v));
    const s = editor.shapes.find(x => x.id === editor.selectedId);
    if (!s) return;
    if (tools.aspectLocked) { s.h = Math.round((nw * s.h) / s.w); panel.h = s.h; }
    s.w = nw; panel.w = nw;
  }

  function updatePropH(v) {
    const nh = Math.max(1, parseFloat(v));
    const s = editor.shapes.find(x => x.id === editor.selectedId);
    if (!s) return;
    if (tools.aspectLocked) { s.w = Math.round((nh * s.w) / s.h); panel.w = s.w; }
    s.h = nh; panel.h = nh;
  }

  function flipShape(dir) {
    const s = editor.shapes.find(x => x.id === editor.selectedId);
    if (!s) return;
    if (dir === 'h') s.flipH = !s.flipH; else s.flipV = !s.flipV;
  }

  function deleteSelected() {
    if (!editor.selectedId) return;
    saveUndo();
    editor.shapes = editor.shapes.filter(s => s.id !== editor.selectedId);
    editor.selectedId = null;
  }

  function duplicate() {
    const s = editor.shapes.find(x => x.id === editor.selectedId);
    if (!s) return;
    saveUndo();
    const copy = JSON.parse(JSON.stringify(s));
    copy.id = 's' + editor.nextId++;
    copy.x += 15; copy.y += 15; copy.name = s.name + ' copy';
    editor.shapes.push(copy);
    selectShape(copy.id);
  }

  const gradPreview = $derived(
    panel.gradType === 'radial'
      ? `radial-gradient(circle,${panel.gradColor1},${panel.gradColor2})`
      : `linear-gradient(90deg,${panel.gradColor1},${panel.gradColor2})`
  );

  const selectedShape = $derived(editor.shapes.find(s => s.id === editor.selectedId));
</script>

<div class="left-panel">
  <!-- AI -->
  <div class="sec-title accent">✨ AI Magic Prompt</div>
  <div class="cgroup">
    <div class="clabel">Describe your icon</div>
    <textarea bind:value={aiPrompt} class="cinp" style="height:80px;resize:none;margin-bottom:10px;font-family:inherit" placeholder="e.g. A red star with a gold border..."></textarea>
    <button class="icon-btn accent-btn" disabled={aiGenerating} onclick={generateWithAI}>
      {aiGenerating ? 'Generating...' : 'Generate Icon'}
    </button>
    <div class="ai-status">{aiStatus}</div>
    <div class="sec-title small">AI History</div>
    <div class="ai-history">
      {#if aiHistory.length === 0}
        <span>No icons generated yet.</span>
      {:else}
        {#each aiHistory as h}
          <div class="ai-hist-item">
            <span class="ai-hist-prompt">{h.prompt}</span>
            <span class="ai-hist-time">{h.time}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Image Import -->
  <div class="sec-title accent">🖼 Import Image / Icon</div>
  <div class="cgroup">
    <label class="import-zone">
      <span class="import-zone-icon">📁</span>
      <span class="import-zone-label">Click to browse or drag &amp; drop<br>PNG, JPG, SVG, WEBP, GIF</span>
      <input type="file" accept="image/*,.svg" onchange={handleImageFile} style="display:none" />
    </label>
    <div style="display:flex;gap:6px">
      <label class="icon-btn" style="flex:1;text-align:center;cursor:pointer">
        📂 Browse<input type="file" accept="image/*,.svg" onchange={handleImageFile} style="display:none" />
      </label>
      <button class="icon-btn" style="flex:1" onclick={() => modals.pasteUrl = true}>🔗 URL</button>
    </div>
  </div>

  <!-- Canvas Background -->
  <div class="sec-title">🎨 Canvas Background</div>
  <div class="cgroup">
    <div class="bg-preview-row">
      {#each [['checker','bg-checker',''],['solid','bg-solid','■'],['image','bg-image-opt','🖼']] as [mode, cls, icon]}
        {#if mode === 'image'}
          <label class="bg-opt {cls}" class:active={canvas.bgMode === 'image'} title="Custom image" style="font-size:18px;cursor:pointer">
            {icon}<input type="file" accept="image/*" onchange={handleBgFile} style="display:none" />
          </label>
        {:else}
          <div class="bg-opt {cls}" class:active={canvas.bgMode === mode} onclick={() => canvas.bgMode = mode}>{icon}</div>
        {/if}
      {/each}
    </div>
    {#if canvas.bgMode === 'solid'}
      <div class="swatch" style="margin-top:8px">
        <input type="color" bind:value={canvas.bgColor} />
      </div>
    {/if}
    {#if canvas.bgMode === 'image'}
      <div style="margin-top:8px">
        <div class="pill-row" style="margin-top:0">
          {#each ['cover','contain','tile'] as fit}
            <button class="pill-btn" class:active={canvas.bgFit === fit} onclick={() => canvas.bgFit = fit}>
              {fit.charAt(0).toUpperCase() + fit.slice(1)}
            </button>
          {/each}
        </div>
        <div class="clabel" style="margin-top:8px">Opacity <span class="clabel-val">{Math.round(canvas.bgOpacity * 100)}%</span></div>
        <input type="range" class="slider" min="0" max="100" value={Math.round(canvas.bgOpacity * 100)}
          oninput={e => canvas.bgOpacity = Number(e.target.value) / 100} />
        <div style="display:flex;gap:6px;margin-top:6px">
          <label class="icon-btn" style="flex:1;text-align:center;cursor:pointer">
            Change<input type="file" accept="image/*" onchange={handleBgFile} style="display:none" />
          </label>
          <button class="icon-btn danger" style="flex:1" onclick={() => { canvas.bgImageData = null; canvas.bgMode = 'checker'; }}>Clear</button>
        </div>
      </div>
    {/if}
    <button class="icon-btn" style="margin-top:8px" onclick={() => canvas.bgMode = 'none'}>✕ No Background</button>
  </div>

  <!-- Control Panel -->
  <div class="sec-title">Control Panel</div>

  <div class="cgroup">
    <div class="clabel">Position</div>
    <div class="crow">
      <div class="cinp-wrap"><label>X</label>
        <input class="cinp" type="number" value={panel.x} onchange={e => { panel.x = +e.target.value; updateShape('x', panel.x); }} />
      </div>
      <div class="cinp-wrap"><label>Y</label>
        <input class="cinp" type="number" value={panel.y} onchange={e => { panel.y = +e.target.value; updateShape('y', panel.y); }} />
      </div>
    </div>
  </div>

  <div class="cgroup">
    <div class="clabel">
      Size
      <span class="lock-btn" onclick={() => tools.aspectLocked = !tools.aspectLocked}
        title="Lock aspect ratio">{tools.aspectLocked ? '🔒' : '🔓'}</span>
    </div>
    <div class="crow">
      <div class="cinp-wrap"><label>W</label>
        <input class="cinp" type="number" value={panel.w} min="1" onchange={e => updatePropW(e.target.value)} />
      </div>
      <div class="cinp-wrap"><label>H</label>
        <input class="cinp" type="number" value={panel.h} min="1" onchange={e => updatePropH(e.target.value)} />
      </div>
    </div>
  </div>

  {#if selectedShape?.type === 'rect'}
    <div class="cgroup">
      <div class="clabel">Border Radius</div>
      <div class="crow">
        <div class="cinp-wrap"><label>RX</label>
          <input class="cinp" type="number" value={panel.rx} min="0" onchange={e => { panel.rx = +e.target.value; updateShape('rx', panel.rx); }} />
        </div>
        <div class="cinp-wrap"><label>RY</label>
          <input class="cinp" type="number" value={panel.ry} min="0" onchange={e => { panel.ry = +e.target.value; updateShape('ry', panel.ry); }} />
        </div>
      </div>
    </div>
  {/if}

  <div class="cgroup">
    <div class="clabel">Rotation <span class="clabel-val">{panel.rotation}°</span></div>
    <input type="range" class="slider" min="0" max="360" value={panel.rotation}
      oninput={e => { panel.rotation = +e.target.value; updateShape('rotation', panel.rotation); }} />
  </div>

  <div class="cgroup">
    <div class="clabel">Transform</div>
    <div class="crow">
      <button class="icon-btn" onclick={() => flipShape('h')} style="flex:1">↔ Flip H</button>
      <button class="icon-btn" onclick={() => flipShape('v')} style="flex:1">↕ Flip V</button>
    </div>
  </div>

  <div class="cgroup">
    <div class="clabel">Fill</div>
    <div class="pill-row">
      {#each ['solid','gradient','none'] as ft}
        <button class="pill-btn" class:active={panel.fillType === ft} onclick={() => setFillType(ft)}>
          {ft.charAt(0).toUpperCase() + ft.slice(1)}
        </button>
      {/each}
    </div>
    {#if panel.fillType === 'solid'}
      <div class="swatch" style="margin-top:8px">
        <input type="color" value={panel.fillColor} oninput={e => updateColor(e.target.value)} />
      </div>
    {/if}
    {#if panel.fillType === 'gradient'}
      <div style="margin-top:8px">
        <div class="pill-row" style="margin-top:0">
          {#each ['linear','radial'] as gt}
            <button class="pill-btn" class:active={panel.gradType === gt} onclick={() => setGradType(gt)}>
              {gt.charAt(0).toUpperCase() + gt.slice(1)}
            </button>
          {/each}
        </div>
        <div class="grad-row">
          <div class="grad-stop"><input type="color" value={panel.gradColor1} oninput={e => { panel.gradColor1 = e.target.value; updateGradient(); }} /></div>
          <span style="color:var(--text2)">→</span>
          <div class="grad-stop"><input type="color" value={panel.gradColor2} oninput={e => { panel.gradColor2 = e.target.value; updateGradient(); }} /></div>
        </div>
        <div class="grad-preview" style="background:{gradPreview}"></div>
      </div>
    {/if}
  </div>

  <div class="cgroup">
    <div class="clabel">Stroke Color</div>
    <div class="swatch">
      <input type="color" value={panel.strokeColor} oninput={e => { panel.strokeColor = e.target.value; updateShape('stroke', e.target.value); }} />
    </div>
    <div class="clabel" style="margin-top:10px">Stroke Width <span class="clabel-val">{panel.strokeWidth}px</span></div>
    <input type="range" class="slider" min="0" max="20" value={panel.strokeWidth}
      oninput={e => { panel.strokeWidth = +e.target.value; updateShape('strokeWidth', panel.strokeWidth); }} />
    <div class="clabel" style="margin-top:8px">Stroke Style</div>
    <div class="pill-row">
      {#each ['solid','dashed','dotted'] as sd}
        <button class="pill-btn" class:active={panel.strokeDash === sd} onclick={() => setStrokeDash(sd)}>
          {sd.charAt(0).toUpperCase() + sd.slice(1)}
        </button>
      {/each}
    </div>
  </div>

  <div class="cgroup">
    <div class="clabel">Opacity <span class="clabel-val">{panel.opacity}%</span></div>
    <input type="range" class="slider" min="0" max="100" value={panel.opacity}
      oninput={e => { panel.opacity = +e.target.value; updateShape('opacity', panel.opacity / 100); }} />
  </div>

  <div class="cgroup">
    <div class="clabel">Drop Shadow <span class="clabel-val">{panel.shadow}px</span></div>
    <input type="range" class="slider" min="0" max="30" value={panel.shadow}
      oninput={e => { panel.shadow = +e.target.value; updateShape('shadow', panel.shadow); }} />
  </div>

  <div class="cgroup">
    <div class="clabel">Blur <span class="clabel-val">{panel.blur}px</span></div>
    <input type="range" class="slider" min="0" max="20" value={panel.blur}
      oninput={e => { panel.blur = +e.target.value; updateShape('blur', panel.blur); }} />
  </div>

  <div class="cgroup">
    <div class="clabel">Actions</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="icon-btn" onclick={() => { const s = editor.shapes.find(x => x.id === editor.selectedId); if(s){s.fill='none';s.fillType='none';panel.fillType='none';} }}>◻ Make Transparent</button>
      <button class="icon-btn" onclick={duplicate}>⧉ Duplicate (Ctrl+D)</button>
      <button class="icon-btn danger" onclick={deleteSelected}>🗑 Delete (Del)</button>
    </div>
  </div>
</div>

<style>
  .left-panel { width: 230px; background: var(--panel); border-right: 1px solid var(--border); overflow-y: auto; flex-shrink: 0; }
  .left-panel::-webkit-scrollbar { width: 3px; }
  .left-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .sec-title { font-size: 10px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 1.2px; padding: 16px 16px 8px; }
  .sec-title.accent { color: var(--accent); }
  .sec-title.small { padding: 10px 0 6px; }
  .cgroup { padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .clabel { font-size: 10px; color: var(--text2); margin-bottom: 7px; display: flex; align-items: center; justify-content: space-between; }
  .clabel-val { color: var(--text); font-weight: 600; }
  .crow { display: flex; gap: 7px; }
  .cinp-wrap { flex: 1; }
  .cinp-wrap label { font-size: 9px; color: var(--text2); display: block; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
  .cinp { background: var(--input-bg); border: 1px solid var(--border); color: var(--text); width: 100%; padding: 5px 7px; border-radius: 5px; font-size: 12px; outline: none; }
  .cinp:focus { border-color: var(--accent); }
  .slider { width: 100%; accent-color: var(--accent); cursor: pointer; margin-top: 4px; height: 14px; }
  .swatch { width: 100%; height: 30px; border-radius: 5px; border: 1.5px solid var(--border); overflow: hidden; cursor: pointer; }
  .swatch input[type="color"] { width: 130%; height: 130%; margin: -15%; border: none; cursor: pointer; }
  .pill-row { display: flex; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); margin-top: 6px; }
  .pill-btn { flex: 1; padding: 6px; text-align: center; cursor: pointer; font-size: 11px; font-weight: 500; border: none; background: var(--panel2); color: var(--text2); transition: all 0.15s; }
  .pill-btn.active { background: var(--accent); color: #fff; }
  .icon-btn { width: 100%; background: var(--panel2); border: 1px solid var(--border); color: var(--text); padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.15s; }
  .icon-btn:hover { background: var(--hover); }
  .icon-btn.danger:hover { background: #e74c3c22; border-color: #e74c3c; color: #e74c3c; }
  .icon-btn.accent-btn { background: var(--accent); color: white; font-weight: bold; }
  .icon-btn.accent-btn:hover { background: #3a7ad5; }
  .icon-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lock-btn { cursor: pointer; font-size: 13px; }
  .grad-row { display: flex; gap: 6px; margin-top: 6px; align-items: center; }
  .grad-stop { flex: 1; height: 26px; border-radius: 4px; border: 1.5px solid var(--border); overflow: hidden; }
  .grad-stop input[type="color"] { width: 130%; height: 130%; margin: -15%; border: none; cursor: pointer; }
  .grad-preview { height: 18px; border-radius: 4px; margin-top: 6px; border: 1px solid var(--border); }
  .bg-preview-row { display: flex; gap: 6px; margin-bottom: 10px; }
  .bg-opt { flex: 1; height: 44px; border-radius: 6px; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: var(--text2); }
  .bg-opt:hover { border-color: var(--text2); }
  .bg-opt.active { border-color: var(--accent); }
  .bg-checker { background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0/12px 12px; }
  .bg-solid { background: var(--panel2); }
  .bg-image-opt { background: var(--panel2); border: 1px dashed var(--border) !important; }
  .import-zone { border: 2px dashed var(--border); border-radius: 8px; padding: 18px 12px; text-align: center; cursor: pointer; transition: all 0.15s; margin-bottom: 8px; display: block; }
  .import-zone:hover { border-color: var(--accent); background: var(--selected); }
  .import-zone-label { font-size: 11px; color: var(--text2); line-height: 1.6; pointer-events: none; }
  .import-zone-icon { font-size: 22px; display: block; margin-bottom: 6px; }
  .ai-status { font-size: 10px; color: var(--text2); margin-top: 8px; text-align: center; }
  .ai-history { font-size: 11px; color: var(--text2); }
  .ai-hist-item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--border); gap: 8px; }
  .ai-hist-prompt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .ai-hist-time { flex-shrink: 0; font-size: 10px; }
</style>
