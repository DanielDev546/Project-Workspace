<script>
  import { modals, editor, showToast } from '$lib/stores.svelte.js';

  let { onexport } = $props();
  let exportOpen = $state(false);

  function openAnimate() {
    if (!editor.selectedId) { showToast('Select a shape first!'); return; }
    modals.animate = true;
  }
</script>

<svelte:window onclick={() => { exportOpen = false; }} />

<header>
  <div class="logo-dots">
    <span class="dot blue"></span><span class="dot gray"></span><span class="dot white"></span>
  </div>
  <span class="app-title">SVG Icon Generator</span>

  <div class="header-center">
    <button class="hbtn" onclick={openAnimate}>✦ Animate</button>
    <button class="hbtn" onclick={() => modals.code = true}>{'{ }'} Code</button>
    <button class="hbtn" onclick={() => modals.project = true}>💾 Project</button>
    <button class="hbtn" onclick={() => modals.shortcuts = true}>⌨ Keys</button>
  </div>

  <div class="header-right">
    <div class="export-wrap">
      <button class="export-btn" onclick={(e) => { e.stopPropagation(); exportOpen = !exportOpen; }}>
        Export ▾
      </button>
      {#if exportOpen}
        <div class="export-dropdown">
          {#each [
            ['svg',     '🗂 Download SVG',    ''],
            ['svg-opt', '⚡ Optimized SVG',   'CLEAN'],
            ['png',     '🖼 PNG @1x',          ''],
            ['png2x',   '🖼 PNG @2x',          ''],
            ['jsx',     '⚛ React JSX',        'NEW'],
            ['datauri', '🔗 Copy Data URI',   ''],
            ['json',    '📦 Export JSON',     ''],
          ] as [fmt, label, tag]}
            <div class="export-option" onclick={() => { onexport(fmt); exportOpen = false; }}>
              {label}{#if tag}<span class="exp-tag">{tag}</span>{/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  header { background: var(--panel); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 16px; height: 48px; gap: 10px; flex-shrink: 0; }
  .logo-dots { display: flex; gap: 5px; }
  .dot { width: 13px; height: 13px; border-radius: 50%; }
  .dot.blue  { background: #2255dd; }
  .dot.gray  { background: #888; }
  .dot.white { background: #ddd; border: 1px solid #555; }
  .app-title { font-size: 14px; font-weight: 700; color: #ddd; margin-left: 4px; }
  .header-center { margin-left: auto; margin-right: auto; display: flex; gap: 4px; }
  .hbtn { background: none; border: none; color: var(--text2); font-size: 12px; padding: 5px 12px; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
  .hbtn:hover { background: var(--hover); color: var(--text); }
  .header-right { display: flex; gap: 6px; align-items: center; }
  .export-wrap { position: relative; }
  .export-btn { background: var(--accent); color: #fff; border: none; padding: 7px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
  .export-btn:hover { background: #3a7ad5; }
  .export-dropdown { position: absolute; top: calc(100% + 4px); right: 0; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 5px; z-index: 200; min-width: 180px; box-shadow: 0 8px 24px #0007; }
  .export-option { padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 12px; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .export-option:hover { background: var(--hover); }
  .exp-tag { font-size: 9px; background: var(--accent); color: #fff; padding: 1px 5px; border-radius: 3px; margin-left: auto; }
</style>
