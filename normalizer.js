// normalizer.js

//
// Convert Figma 0–1 color to CSS rgba()
//
function figmaPaintToRgba(paint) {
  if (!paint || !paint.color) return null;

  const { r, g, b, a = 1 } = paint.color;
  const opacity = paint.opacity !== undefined ? paint.opacity : 1;

  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a * opacity})`;
}

//
// Compute gradient  
//
function computeGradientAngle(fill) {
  if (!fill.gradientHandlePositions || fill.gradientHandlePositions.length < 2)
    return 90;

  const p0 = fill.gradientHandlePositions[0];
  const p1 = fill.gradientHandlePositions[1];

  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;

  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (angle + 360) % 360;
}

//
// Extract the correct fill (solid, gradient, or background)
//
function extractFill(node) {
  if (Array.isArray(node.fills) && node.fills.length > 0) return node.fills[0];
  if (Array.isArray(node.background) && node.background.length > 0) return node.background[0];
  if (node.backgroundColor)
    return { type: "SOLID", color: node.backgroundColor, opacity: 1 };
  return null;
}

//
// Extract styles: bg, border, radius, shadow
//
function extractStyle(node) {
  const style = {};

  const fill = extractFill(node);
  if (fill) {
    if (fill.type === "SOLID") {
      style.backgroundColor = figmaPaintToRgba(fill);
    } else if (fill.type === "GRADIENT_LINEAR") {
      style.backgroundGradient = {
        type: "linear",
        angleDeg: computeGradientAngle(fill),
        stops: fill.gradientStops.map(s => ({
          color: figmaPaintToRgba({ color: s.color, opacity: 1 }),
          position: s.position
        }))
      };
    }
  }

  // Border
  if (node.strokes?.length > 0) {
    style.borderColor = figmaPaintToRgba(node.strokes[0]);
    style.borderWidth = node.strokeWeight || 0;
  }

  // Corner radius
  if (Array.isArray(node.rectangleCornerRadii))
    style.borderRadius = node.rectangleCornerRadii.slice();
  else if (typeof node.cornerRadius === "number")
    style.borderRadius = node.cornerRadius;

  // Shadow
  if (node.effects?.length > 0) {
    const shadow = node.effects.find(e => e.type === "DROP_SHADOW");
    if (shadow) {
      style.boxShadow = `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${figmaPaintToRgba({
        color: shadow.color,
        opacity: 1
      })}`;
    }
  }

  return style;
}

//
// Extract text styling + correct Figma metrics
//
function extractText(node) {
  if (node.type !== "TEXT" || !node.style) return null;

  const fill = node.fills?.[0];
  const color = fill?.type === "SOLID"
    ? figmaPaintToRgba(fill)
    : "rgba(0,0,0,1)";

  return {
    fontFamily: node.style.fontFamily,
    fontSize: node.style.fontSize,
    fontWeight: node.style.fontWeight,
    lineHeight: node.style.lineHeightPx,
    letterSpacing: node.style.letterSpacing,
    textAlign: node.style.textAlignHorizontal.toLowerCase(),
    color,
    content: node.characters
  };
}

//
// Main normalizer
//
export function normalizeNode(node) {
  return {
    id: node.id,
    type: node.type,
    name: node.name,

    absolute: node.absoluteBoundingBox
      ? {
          x: node.absoluteBoundingBox.x,
          y: node.absoluteBoundingBox.y,
          width: node.absoluteBoundingBox.width,
          height: node.absoluteBoundingBox.height
        }
      : null,

    autoLayout: (!node.layoutMode || node.layoutMode === "NONE")
      ? null
      : {
          mode: node.layoutMode,
          primaryAxisAlign: node.primaryAxisAlignItems,
          counterAxisAlign: node.counterAxisAlignItems,
          itemSpacing: node.itemSpacing || 0,
          padding: {
            top: node.paddingTop || 0,
            right: node.paddingRight || 0,
            bottom: node.paddingBottom || 0,
            left: node.paddingLeft || 0
          }
        },

    style: extractStyle(node),
    text: extractText(node),

    children: node.children?.map(normalizeNode) || []
  };
}
