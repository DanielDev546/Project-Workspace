export function starPts(cx, cy, or_, ir, n) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const r = i % 2 === 0 ? or_ : ir;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

export function hexPts(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

export function scalePathToBox(d, x, y, w, h) {
  return d.replace(
    /(-?\d+\.?\d*),(-?\d+\.?\d*)/g,
    (_, a, b) =>
      `${((parseFloat(a) * w) / 24 + x).toFixed(2)},${((parseFloat(b) * h) / 24 + y).toFixed(2)}`
  );
}

export function snapVal(v, snapEnabled, GRID) {
  return snapEnabled ? Math.round(v / GRID) * GRID : v;
}

export function makeDefaultShape(type, x, y, w, h, fillColor, fillTypeVal, gradColor1Val, gradColor2Val, gradTypeVal, strokeColorVal, strokeWidthVal, strokeDashVal, nextIdVal) {
  return {
    id: 's' + nextIdVal,
    type,
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w) || 80,
    h: Math.round(h) || 80,
    fill: fillTypeVal === 'none' ? 'none' : fillColor,
    fillType: fillTypeVal,
    gradColor1: gradColor1Val,
    gradColor2: gradColor2Val,
    gradType: gradTypeVal,
    stroke: strokeColorVal,
    strokeWidth: strokeWidthVal,
    strokeDash: strokeDashVal,
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
    name: type + ' ' + nextIdVal,
  };
}

export function getCleanSVGString(canvasEl) {
  const el = canvasEl.cloneNode(true);
  const sel = el.querySelector('#selectionGroup');
  const pen = el.querySelector('#penGroup');
  const grid = el.querySelector('#gridG');
  if (sel) sel.innerHTML = '';
  if (pen) pen.innerHTML = '';
  if (grid) grid.innerHTML = '';
  el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  el.removeAttribute('style');
  return el.outerHTML;
}

export function toJSX(svg) {
  return `import React from 'react';\n\nexport const Icon = (props) => (\n  ${svg.replace(/class=/g, 'className=')}\n);\n\nexport default Icon;`;
}

export function formatSVG(svg) {
  return svg.replace(/></g, '>\n<').replace(/\n\s*\n/g, '\n');
}
