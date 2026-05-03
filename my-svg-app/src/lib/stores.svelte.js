// Svelte 5 runes-based global state (state module pattern)

export const GRID = 10;

export const PRESETS = [
  { name: "Home", path: "M3,12 L12,3 L21,12 M5,10 L5,21 L19,21 L19,10" },
  {
    name: "User",
    path: "M12,4 a4,4 0 1,0 0,8 a4,4 0 1,0 0,-8 M4,21 C4,17 8,14 12,14 C16,14 20,17 20,21",
  },
  {
    name: "⚙",
    path: "M12,8 a4,4 0 1,0 0,8 a4,4 0 1,0 0,-8 M12,2 L12,4 M12,20 L12,22 M4.22,4.22 L5.64,5.64 M18.36,18.36 L19.78,19.78 M2,12 L4,12 M20,12 L22,12",
  },
  {
    name: "Search",
    path: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  },
  {
    name: "Bell",
    path: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  },
  {
    name: "Heart",
    path: "M12,21 C12,21 3,13.5 3,8 a5,5 0 0,1 9,-2 a5,5 0 0,1 9,2 C21,13.5 12,21 12,21",
  },
  {
    name: "Star",
    path: "M12,2 L15.09,8.26 L22,9.27 L17,14.14 L18.18,21.02 L12,17.77 L5.82,21.02 L7,14.14 L2,9.27 L8.91,8.26 Z",
  },
  { name: "Mail", path: "M4,4 L20,4 L20,18 L4,18 Z M4,4 L12,13 L20,4" },
  {
    name: "Lock",
    path: "M8,11 L8,7 a4,4 0 0,1 8,0 L16,11 M5,11 L19,11 L19,21 L5,21 Z",
  },
  { name: "✓", path: "M4,12 L9,17 L20,6" },
  { name: "✕", path: "M5,5 L19,19 M19,5 L5,19" },
  { name: "→", path: "M5,12 L19,12 M13,6 L19,12 L13,18" },
];

// ── Canvas ──────────────────────────────────────────────────────────────────
export const canvas = $state({
  width: 500,
  height: 400,
  bgMode: "checker", // 'checker' | 'solid' | 'image' | 'none'
  bgColor: "#ffffff",
  bgImageData: null,
  bgFit: "cover",
  bgOpacity: 1,
});

// ── Shapes ───────────────────────────────────────────────────────────────────
export const editor = $state({
  shapes: [],
  selectedId: null,
  nextId: 1,
  undoStack: [],
  redoStack: [],
});

// ── Tools ────────────────────────────────────────────────────────────────────
export const tools = $state({
  current: "rect", // shape to add
  active: "select", // 'select' | 'pen'
  zoom: 100,
  gridVisible: false,
  snapEnabled: false,
  aspectLocked: false,
});

// ── Control panel (mirrors selected shape) ───────────────────────────────────
export const panel = $state({
  x: 0,
  y: 0,
  w: 80,
  h: 80,
  rx: 0,
  ry: 0,
  fillType: "solid",
  fillColor: "#2222dd",
  gradType: "linear",
  gradColor1: "#4a90e2",
  gradColor2: "#00c9a7",
  strokeColor: "#000000",
  strokeWidth: 0,
  strokeDash: "solid",
  opacity: 100,
  rotation: 0,
  shadow: 0,
  blur: 0,
});

// ── Modals ───────────────────────────────────────────────────────────────────
export const modals = $state({
  code: false,
  animate: false,
  project: false,
  shortcuts: false,
  pasteUrl: false,
});

// ── Toast ─────────────────────────────────────────────────────────────────────
export const toastState = $state({ message: "", visible: false });
let toastTimer;
export function showToast(msg) {
  toastState.message = msg;
  toastState.visible = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastState.visible = false;
  }, 2200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function snapVal(v) {
  return tools.snapEnabled ? Math.round(v / GRID) * GRID : v;
}

export function syncPanelFromShape(s) {
  if (!s) return;
  panel.x = s.x;
  panel.y = s.y;
  panel.w = s.w;
  panel.h = s.h;
  panel.rx = s.rx ?? 0;
  panel.ry = s.ry ?? 0;
  panel.fillType = s.fillType ?? "solid";
  panel.fillColor = !s.fill || s.fill === "none" ? "#000000" : s.fill;
  panel.gradType = s.gradType ?? "linear";
  panel.gradColor1 = s.gradColor1 ?? "#4a90e2";
  panel.gradColor2 = s.gradColor2 ?? "#00c9a7";
  panel.strokeColor = s.stroke ?? "#000000";
  panel.strokeWidth = s.strokeWidth ?? 0;
  panel.strokeDash = s.strokeDash ?? "solid";
  panel.opacity = Math.round((s.opacity ?? 1) * 100);
  panel.rotation = s.rotation ?? 0;
  panel.shadow = s.shadow ?? 0;
  panel.blur = s.blur ?? 0;
}

export function saveUndo() {
  editor.undoStack.push(JSON.stringify(editor.shapes));
  editor.redoStack = [];
  if (editor.undoStack.length > 80) editor.undoStack.shift();
}

export function undo() {
  if (!editor.undoStack.length) return;
  editor.redoStack.push(JSON.stringify(editor.shapes));
  editor.shapes = JSON.parse(editor.undoStack.pop());
  editor.selectedId = null;
}

export function redo() {
  if (!editor.redoStack.length) return;
  editor.undoStack.push(JSON.stringify(editor.shapes));
  editor.shapes = JSON.parse(editor.redoStack.pop());
  editor.selectedId = null;
}

export function selectShape(id) {
  editor.selectedId = id;
  const s = editor.shapes.find((x) => x.id === id);
  syncPanelFromShape(s);
}

export function makeShape(type, x, y, w, h) {
  const id = "s" + editor.nextId++;
  return {
    id,
    type,
    x: snapVal(Math.round(x)),
    y: snapVal(Math.round(y)),
    w: Math.round(w) || 80,
    h: Math.round(h) || 80,
    fill: panel.fillType === "none" ? "none" : panel.fillColor,
    fillType: panel.fillType,
    gradColor1: panel.gradColor1,
    gradColor2: panel.gradColor2,
    gradType: panel.gradType,
    stroke: panel.strokeColor,
    strokeWidth: panel.strokeWidth,
    strokeDash: panel.strokeDash,
    opacity: 1,
    rotation: 0,
    rx: 0,
    ry: 0,
    shadow: 0,
    blur: 0,
    flipH: false,
    flipV: false,
    visible: true,
    locked: false,
    animation: null,
    name: type + " " + (editor.nextId - 1),
  };
}
