<script>
  import { editor, tools, PRESETS, saveUndo, selectShape } from '$lib/stores.svelte.js';

  let { onaddshape, onaddpreset, onreorder, onalign } = $props();

  const SHAPE_TOOLS = [
    { id: 'rect',     label: 'Rect' },
    { id: 'circle',   label: 'Circle' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'line',     label: 'Line' },
    { id: 'dot',      label: 'Dot' },
    { id: 'star',     label: 'Star' },
    { id: 'diamond',  label: 'Diamond' },
    { id: 'hexagon',  label: 'Hex' },
    { id: 'arrow',    label: 'Arrow' },
  ];

  let alignTab = $state('align');

  function toggleVis(id) {
    const s = editor.shapes.find(x => x.id === id);
    if (s) s.visible = !s.visible;
  }
  function toggleLock(id) {
    const s = editor.shapes.find(x => x.id === id);
    if (s) s.locked = !s.locked;
  }
  function deleteShape(id) {
    saveUndo();
    const idx = editor.shapes.findIndex(x => x.id === id);
    if (idx !== -1) editor.shapes.splice(idx, 1);
    if (editor.selectedId === id) editor.selectedId = null;
  }
  function renameLayer(id, el) {
    el.contentEditable = true; el.focus();
    el.onblur = () => {
      el.contentEditable = false;
      const s = editor.shapes.find(x => x.id === id);
      if (s) s.name = el.textContent.trim() || s.type;
    };
    
  }

</script>

<div class="right-panel">
  <div class="sec-title">Shape Library</div>
  <div class="shape-grid">
    {#each SHAPE_TOOLS as t}
      <div class="shape-item" class:active={tools.current === t.id} onclick={() => tools.current = t.id} title={t.label}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          {#if t.id === 'rect'}    <rect x="2" y="4" width="20" height="16" rx="1"/>
          {:else if t.id === 'circle'}  <circle cx="12" cy="12" r="9"/>
          {:else if t.id === 'triangle'}<polygon points="12,2 22,22 2,22"/>
          {:else if t.id === 'line'}    <line x1="2" y1="22" x2="22" y2="2"/>
          {:else if t.id === 'dot'}     <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>
          {:else if t.id === 'star'}    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          {:else if t.id === 'diamond'} <polygon points="12,2 22,12 12,22 2,12"/>
          {:else if t.id === 'hexagon'} <polygon points="12,2 21,7 21,17 12,22 3,17 3,7"/>
          {:else if t.id === 'arrow'}   <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13,6 19,12 13,18"/>
          {/if}
        </svg>
        <span class="shape-label">{t.label}</span>
      </div>
    {/each}
  </div>

  <div class="sec-title">Icon Presets</div>
  <div class="preset-grid">
    {#each PRESETS as p}
      <div class="preset-item" title={p.name} onclick={() => onaddpreset(p)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d={p.path}/>
        </svg>
        <span>{p.name}</span>
      </div>
    {/each}
  </div>

  <div class="layers-title sec-title">
    <span>Layers</span>
    <button class="del-btn" onclick={() => { if(editor.selectedId) deleteShape(editor.selectedId); }}>🗑</button>
  </div>
  <div class="layers-list">
    {#each [...editor.shapes].reverse() as s (s.id)}
      <div class="layer-item" class:active-layer={s.id === editor.selectedId}>
        <button class="layer-vis"  onclick={() => toggleVis(s.id)}>{s.visible ? '👁' : '🚫'}</button>
        <span   class="layer-name" onclick={() => selectShape(s.id)} ondblclick={e => renameLayer(s.id, e.target)}>
          {s.type === 'image' ? '🖼' : '◻'} {s.name || s.type}
        </span>
        <button class="layer-lock" onclick={() => toggleLock(s.id)}>{s.locked ? '🔒' : '🔓'}</button>
        <button class="layer-del"  onclick={() => deleteShape(s.id)}>✕</button>
      </div>
    {/each}
  </div>

  <div class="sec-title">Align &amp; Arrange</div>
  <div class="align-tabs">
    <button class="atab" class:active={alignTab === 'align'}   onclick={() => alignTab = 'align'}>Align</button>
    <button class="atab" class:active={alignTab === 'arrange'} onclick={() => alignTab = 'arrange'}>Order</button>
  </div>

  <div class="align-grid">
    {#if alignTab === 'align'}
      <button class="abtn" onclick={() => onalign('left')}>⬅</button>
      <button class="abtn" onclick={() => onalign('center')}>↔</button>
      <button class="abtn" onclick={() => onalign('right')}>➡</button>
      <button class="abtn" onclick={() => onalign('top')}>⬆</button>
      <button class="abtn" onclick={() => onalign('middle')}>↕</button>
      <button class="abtn" onclick={() => onalign('bottom')}>⬇</button>
      <button class="abtn" onclick={() => onalign('duplicate')}>⧉</button>
            
        
      <button class="abtn" onclick={onaddshape}>＋</button>
      <button class="abtn" onclick={() => onreorder('top')}>⬆⬆</button>
    {:else}
      <button class="abtn" onclick={() => onreorder('top')}>⬆⬆</button>
      <button class="abtn" onclick={() => onreorder('fwd')}>⬆</button>
      <button class="abtn" onclick={() => onreorder('bwd')}>⬇</button>
      <button class="abtn" onclick={() => onreorder('bot')}>⬇⬇</button>
    {/if}
  </div>
</div>

<style>
  .right-panel { width: 220px; background: var(--panel); border-left: 1px solid var(--border); overflow-y: auto; flex-shrink: 0; }
  .right-panel::-webkit-scrollbar { width: 3px; }
  .right-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .sec-title { font-size: 10px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 1.2px; padding: 16px 16px 8px; }
  .layers-title { display: flex; align-items: center; justify-content: space-between; padding-right: 14px; }
  .del-btn { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 13px; }
  .shape-grid  { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; padding: 0 14px 12px; }
  .shape-item  { background: var(--panel2); border: 1px solid var(--border); border-radius: 7px; padding: 10px 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: all 0.15s; }
  .shape-item:hover { background: var(--hover); border-color: var(--accent); }
  .shape-item.active { background: var(--selected); border-color: var(--accent); }
  .shape-item svg { width: 20px; height: 20px; color: var(--text2); }
  .shape-item.active svg { color: var(--accent); }
  .shape-label { font-size: 9px; color: var(--text2); }
  .shape-item.active .shape-label { color: var(--accent); }
  .preset-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; padding: 0 14px 12px; }
  .preset-item { background: var(--panel2); border: 1px solid var(--border); border-radius: 6px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; transition: all 0.15s; }
  .preset-item:hover { background: var(--hover); border-color: var(--accent); }
  .preset-item svg { width: 18px; height: 18px; color: var(--text2); }
  .preset-item span { font-size: 8px; color: var(--text2); }
  .layers-list { padding: 0 14px 10px; }
  .layer-item  { display: flex; align-items: center; gap: 5px; border-radius: 5px; padding: 6px 8px; margin-bottom: 3px; cursor: pointer; border: 1px solid transparent; transition: all 0.12s; }
  .layer-item:hover { background: var(--hover); }
  .layer-item.active-layer { background: var(--selected); border-color: var(--accent); }
  .layer-vis, .layer-lock, .layer-del { background: none; border: none; cursor: pointer; font-size: 11px; color: var(--text2); padding: 0; flex-shrink: 0; }
  .layer-del:hover { color: #e74c3c; }
  .layer-name { flex: 1; font-size: 11px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .align-tabs { display: flex; gap: 3px; padding: 0 14px 8px; }
  .atab { background: none; border: none; color: var(--text2); font-size: 11px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
  .atab.active { background: var(--selected); color: var(--accent); }
  .align-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; padding: 0 14px 12px; }
  .abtn { background: var(--panel2); border: 1px solid var(--border); color: var(--text); padding: 7px 4px; border-radius: 5px; cursor: pointer; font-size: 13px; text-align: center; transition: all 0.12s; }
  .abtn:hover { background: var(--hover); border-color: var(--accent); }
</style>
