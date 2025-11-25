
// cssGenerator.js

//
// Generate CSS for a single node
// - Positions each node using absolute coords RELATIVE TO ITS PARENT
// - Root node fills the phone box
//
function cssForNode(node, opts = {}) {
  const { parentAbs = null, isRoot = false } = opts;
  const className = `.node-${node.id.replace(":", "-")}`;
  let css = `${className} {\n`;

  const isText = node.type === "TEXT";
  const abs = node.absolute;

  // ---- Layout / positioning ----
  if (isRoot && abs) {
    // Root frame: fill the phone-simulator box
    css += `  position: relative;\n`;
    css += `  width: 100%;\n`;
    css += `  height: 100%;\n`;
    css += `  box-sizing: border-box;\n`;
  } else if (abs) {
    // Child nodes: absolute relative to parent
    let left = abs.x;
    let top = abs.y;

    if (parentAbs) {
      left -= parentAbs.x;
      top -= parentAbs.y;
    }

    css += `  position: absolute;\n`;
    css += `  left: ${left}px;\n`;
    css += `  top: ${top}px;\n`;
    css += `  width: ${abs.width}px;\n`;
    css += `  height: ${abs.height}px;\n`;
  } else if (node.autoLayout && !isRoot) {
    // Fallback: if we ever see an auto-layout node without absoluteBoundingBox
    css += `  display: flex;\n`;
    css += `  flex-direction: ${
      node.autoLayout.mode === "HORIZONTAL" ? "row" : "column"
    };\n`;
    const p = node.autoLayout.padding;
    css += `  padding: ${p.top}px ${p.right}px ${p.bottom}px ${p.left}px;\n`;
    css += `  gap: ${node.autoLayout.itemSpacing}px;\n`;
  }

  // ---- Backgrounds (non-text) ----
  if (!isText) {
    if (node.style?.backgroundGradient) {
      const grad = node.style.backgroundGradient;
      const stops = grad.stops
        .map(s => `${s.color} ${Math.round(s.position * 100)}%`)
        .join(", ");

      const angle = grad.angleDeg ?? 135;
      css += `  background: linear-gradient(${angle}deg, ${stops});\n`;
    } else if (node.style?.backgroundColor) {
      css += `  background-color: ${node.style.backgroundColor};\n`;
    }
  }

  // ---- Border ----
  if (node.style?.borderWidth && node.style.borderWidth > 0) {
    const color = node.style.borderColor || "rgba(0,0,0,1)";
    css += `  border: ${node.style.borderWidth}px solid ${color};\n`;
  }

  // ---- Border radius ----
  if (node.style?.borderRadius !== undefined) {
    if (Array.isArray(node.style.borderRadius)) {
      const [tl, tr, br, bl] = node.style.borderRadius;
      css += `  border-radius: ${tl}px ${tr}px ${br}px ${bl}px;\n`;
    } else {
      css += `  border-radius: ${node.style.borderRadius}px;\n`;
    }
  }

// ---- Text styles ----
if (node.text) {
  const fontSize = node.text.fontSize;
  const lineHeight = node.text.lineHeight || fontSize;

  css += `  font-family: ${node.text.fontFamily}, sans-serif;\n`;
  css += `  font-size: ${fontSize}px;\n`;
  css += `  font-weight: ${node.text.fontWeight};\n`;
  css += `  line-height: ${lineHeight}px;\n`;
  css += `  letter-spacing: ${node.text.letterSpacing}px;\n`;
  css += `  text-align: ${node.text.textAlign};\n`;
  css += `  color: ${node.text.color};\n`;
  css += `  white-space: pre-wrap;\n`;

  // raise higher (more centered)
  const baseOffset = (lineHeight - fontSize) / 2;
  const boostedOffset = baseOffset * 5.0;   
  css += `  transform: translateY(-${boostedOffset}px);\n`;
}


  // ---- Shadow ----
  if (node.style?.boxShadow) {
    css += `  box-shadow: ${node.style.boxShadow};\n`;
  }

  css += `}\n\n`;
  return css;
}

//
// Walk the tree and accumulate CSS.
// parentAbs is the parent's absoluteBoundingBox (global Figma coords).
//
function walk(node, parentAbs, isRoot) {
  let css = cssForNode(node, { parentAbs, isRoot });

  if (node.children && node.children.length > 0) {
    const thisAbs = node.absolute || parentAbs;
    for (const child of node.children) {
      css += walk(child, thisAbs, false);
    }
  }

  return css;
}

//
// Generate full CSS, including phone-simulator + body reset
//
export function generateCSS(rootNode) {
  const frameWidth = rootNode.absolute?.width || 393;
  const frameHeight = rootNode.absolute?.height || 852;

  let css = `/* ===== Global page + phone wrapper ===== */\n`;
  css += `body {\n`;
  css += `  margin: 0;\n`;
  css += `  background: #111;\n`;
  css += `  display: flex;\n`;
  css += `  justify-content: center;\n`;
  css += `  align-items: flex-start;\n`;
  css += `  padding: 40px 0;\n`;
  css += `}\n\n`;

  css += `#phone-simulator {\n`;
  css += `  width: ${frameWidth}px;\n`;
  css += `  height: ${frameHeight}px;\n`;
  css += `  border-radius: 32px;\n`;
  css += `  overflow: hidden;\n`; // no huge scroll
  css += `  background: #000;\n`;  // background; inner frame has its own bg
  css += `  box-shadow: 0 0 30px rgba(0,0,0,0.4);\n`;
  css += `  position: relative;\n`;
  css += `}\n\n`;

  // Now the actual Figma frame + children
  css += walk(rootNode, rootNode.absolute, true);

  return css;
}
