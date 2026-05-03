<script>
  import { toastState } from '$lib/stores.svelte.js';
</script>

<div class="toast" class:show={toastState.visible}>{toastState.message}</div>

<style>
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: #222; border: 1px solid var(--border); color: var(--text); padding: 8px 20px; border-radius: 8px; font-size: 12px; opacity: 0; transition: all 0.3s; z-index: 500; pointer-events: none; white-space: nowrap; }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>
