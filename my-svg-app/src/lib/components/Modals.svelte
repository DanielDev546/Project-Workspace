<script>
  import { modals, editor, showToast } from '$lib/stores.svelte.js';

  let { onapplyanim, onremoveanim, onswitchcodetab, onimporturl } = $props();

  let selectedAnim  = $state('spin');
  let animDuration  = $state(1);
  let codeTab       = $state('svg');
  let codeOutput    = $state('');
  let projectName   = $state('');
  let pasteUrl      = $state('');
  let projectList   = $state([]);

  export function setCodeOutput(text) { codeOutput = text; }

  $effect(() => {
    if (modals.project) {
      projectList = JSON.parse(localStorage.getItem('svgProjects') || '[]');
    }
  });

  function saveProject() {
    const name = projectName.trim() || 'Untitled ' + new Date().toLocaleDateString();
    const projects = JSON.parse(localStorage.getItem('svgProjects') || '[]');
    projects.unshift({ name, date: new Date().toLocaleDateString(), shapes: JSON.parse(JSON.stringify(editor.shapes)) });
    localStorage.setItem('svgProjects', JSON.stringify(projects.slice(0, 20)));
    projectList = projects.slice(0, 20);
    showToast(`💾 Saved: ${name}`);
    projectName = '';
  }

  function loadProject(i) {
    editor.shapes = projectList[i].shapes;
    editor.selectedId = null;
    modals.project = false;
    showToast(`📂 Loaded: ${projectList[i].name}`);
  }

  function deleteProject(i) {
    projectList.splice(i, 1);
    localStorage.setItem('svgProjects', JSON.stringify(projectList));
    projectList = [...projectList];
  }

  function importFromUrl() {
    if (!pasteUrl) { showToast('Please enter a URL'); return; }
    modals.pasteUrl = false;
    onimporturl(pasteUrl);
    pasteUrl = '';
  }

  function copySVGCode() {
    navigator.clipboard.writeText(codeOutput).then(() => showToast('📋 Copied!'));
  }

  const ANIM_TYPES = [
    { id: 'spin',   name: '🔄 Spin',    desc: 'Rotate continuously' },
    { id: 'pulse',  name: '💓 Pulse',   desc: 'Scale in and out' },
    { id: 'bounce', name: '⬆ Bounce',   desc: 'Move up and down' },
    { id: 'fade',   name: '🌫 Fade',    desc: 'Fade in and out' },
    { id: 'shake',  name: '📳 Shake',   desc: 'Horizontal shake' },
    { id: 'draw',   name: '✏ Draw',     desc: 'Stroke draw-on' },
  ];

  const SHORTCUTS = [
    ['Select tool','V'],['Pen / Freehand','P'],['Add shape','A'],['Import image','I'],
    ['Delete','Del'],['Duplicate','Ctrl+D'],['Undo','Ctrl+Z'],['Redo','Ctrl+Y'],
    ['Nudge shape','Arrow Keys'],['Nudge ×10','Shift+Arrow'],['Zoom','Ctrl+Scroll'],
    ['Fit canvas','F'],['Toggle grid','G'],['Bring forward',']'],['Send backward','['],
    ['Export SVG','Ctrl+E'],
  ];
</script>

<!-- Code Modal -->
{#if modals.code}
  <div class="overlay" onclick={e => { if(e.target===e.currentTarget) modals.code=false; }}>
    <div class="modal" style="min-width:480px">
      <h2>{'{ }'} SVG Code</h2>
      <div class="tab-row">
        {#each [['svg','SVG'],['jsx','React JSX'],['uri','Data URI']] as [id, label]}
          <button class="mbtn" class:active={codeTab===id}
            onclick={() => { codeTab = id; onswitchcodetab(id); }}>{label}</button>
        {/each}
      </div>
      <pre>{codeOutput}</pre>
      <div class="modal-btns">
        <button class="mbtn" onclick={copySVGCode}>📋 Copy</button>
        <button class="mbtn primary" onclick={() => modals.code = false}>Close</button>
      </div>
    </div>
  </div>
{/if}

<!-- Animate Modal -->
{#if modals.animate}
  <div class="overlay" onclick={e => { if(e.target===e.currentTarget) modals.animate=false; }}>
    <div class="modal">
      <h2>✦ Animate Shape</h2>
      <div class="anim-grid">
        {#each ANIM_TYPES as a}
          <div class="anim-opt" class:selected={selectedAnim===a.id} onclick={() => selectedAnim = a.id}>
            <div class="anim-name">{a.name}</div>
            <div class="anim-desc">{a.desc}</div>
          </div>
        {/each}
      </div>
      <div style="margin-bottom:12px">
        <div class="clabel">Duration: {animDuration.toFixed(1)}s</div>
        <input type="range" class="slider" min="0.2" max="5" step="0.1" bind:value={animDuration} />
      </div>
      <div class="modal-btns">
        <button class="mbtn danger" onclick={() => { onremoveanim(); modals.animate = false; }}>Remove</button>
        <button class="mbtn primary" onclick={() => { onapplyanim({ type: selectedAnim, duration: animDuration }); modals.animate = false; }}>Apply</button>
        <button class="mbtn" onclick={() => modals.animate = false}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<!-- Project Modal -->
{#if modals.project}
  <div class="overlay" onclick={e => { if(e.target===e.currentTarget) modals.project=false; }}>
    <div class="modal">
      <h2>💾 Projects</h2>
      <div class="tab-row">
        <input class="cinp" bind:value={projectName} placeholder="Project name…" style="flex:1" />
        <button class="mbtn primary" onclick={saveProject}>Save</button>
      </div>
      <div class="project-list">
        {#if projectList.length === 0}
          <div style="color:var(--text2);font-size:12px;padding:8px 0">No saved projects yet.</div>
        {:else}
          {#each projectList as p, i}
            <div class="project-row">
              <div style="flex:1">
                <div style="font-size:12px;color:var(--text)">{p.name}</div>
                <div style="font-size:10px;color:var(--text2)">{p.date} · {p.shapes.length} shapes</div>
              </div>
              <button class="mbtn" onclick={() => loadProject(i)} style="font-size:11px;padding:4px 10px">Load</button>
              <button class="mbtn danger" onclick={() => deleteProject(i)} style="font-size:11px;padding:4px 8px">✕</button>
            </div>
          {/each}
        {/if}
      </div>
      <div class="modal-btns">
        <button class="mbtn" onclick={() => modals.project = false}>Close</button>
      </div>
    </div>
  </div>
{/if}

<!-- Shortcuts Modal -->
{#if modals.shortcuts}
  <div class="overlay" onclick={e => { if(e.target===e.currentTarget) modals.shortcuts=false; }}>
    <div class="modal">
      <h2>⌨ Keyboard Shortcuts</h2>
      <div class="shortcuts">
        {#each SHORTCUTS as [label, key]}
          <div class="shortcut-row">
            <span style="font-size:11px;color:var(--text2)">{label}</span>
            <span class="kbd">{key}</span>
          </div>
        {/each}
      </div>
      <div class="modal-btns">
        <button class="mbtn primary" onclick={() => modals.shortcuts = false}>Close</button>
      </div>
    </div>
  </div>
{/if}

<!-- Paste URL Modal -->
{#if modals.pasteUrl}
  <div class="overlay" onclick={e => { if(e.target===e.currentTarget) modals.pasteUrl=false; }}>
    <div class="modal" style="min-width:360px">
      <h2>🔗 Import from URL</h2>
      <div style="font-size:10px;color:var(--text2);margin-bottom:6px">Image URL (PNG, JPG, SVG, WEBP)</div>
      <input class="cinp" bind:value={pasteUrl} placeholder="https://example.com/icon.png" style="margin-bottom:12px" />
      <div class="modal-btns">
        <button class="mbtn" onclick={() => modals.pasteUrl = false}>Cancel</button>
        <button class="mbtn primary" onclick={importFromUrl}>Import</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay { position: fixed; inset: 0; background: #0009; z-index: 300; display: flex; align-items: center; justify-content: center; }
  .modal { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 22px; min-width: 340px; max-width: 92vw; max-height: 85vh; overflow: auto; box-shadow: 0 20px 60px #0008; }
  .modal h2 { font-size: 15px; font-weight: 700; margin-bottom: 16px; color: var(--text); }
  pre { background: var(--input-bg); border: 1px solid var(--border); border-radius: 6px; padding: 12px; font-size: 11px; color: #a8d8a8; white-space: pre-wrap; max-height: 300px; overflow-y: auto; font-family: monospace; word-break: break-all; }
  .tab-row { display: flex; gap: 6px; margin-bottom: 10px; }
  .modal-btns { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
  .mbtn { padding: 7px 18px; border-radius: 6px; border: 1px solid var(--border); background: var(--panel2); color: var(--text); cursor: pointer; font-size: 12px; }
  .mbtn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  .mbtn:hover { background: var(--hover); }
  .mbtn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .mbtn.primary:hover { background: #3a7ad5; }
  .mbtn.danger { background: #e74c3c22; border-color: #e74c3c; color: #e74c3c; }
  .cinp { background: var(--input-bg); border: 1px solid var(--border); color: var(--text); width: 100%; padding: 5px 7px; border-radius: 5px; font-size: 12px; outline: none; display: block; }
  .cinp:focus { border-color: var(--accent); }
  .clabel { font-size: 10px; color: var(--text2); margin-bottom: 4px; }
  .slider { width: 100%; accent-color: var(--accent); cursor: pointer; }
  .anim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .anim-opt { background: var(--panel2); border: 1px solid var(--border); border-radius: 7px; padding: 10px 12px; cursor: pointer; transition: all 0.15s; }
  .anim-opt:hover, .anim-opt.selected { border-color: var(--accent); }
  .anim-opt.selected { background: var(--selected); }
  .anim-name { font-size: 12px; font-weight: 600; color: var(--text); }
  .anim-desc { font-size: 10px; color: var(--text2); margin-top: 2px; }
  .project-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; max-height: 220px; overflow-y: auto; }
  .project-row { display: flex; align-items: center; gap: 8px; background: var(--panel2); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; }
  .shortcuts { padding: 10px 0; }
  .shortcut-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid var(--border); }
  .shortcut-row:last-child { border: none; }
  .kbd { background: var(--panel2); border: 1px solid var(--border); border-radius: 3px; padding: 1px 5px; font-size: 10px; color: var(--text2); font-family: monospace; }
</style>
