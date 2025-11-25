// htmlGenerator.js

function htmlForNode(node) {
  const className = `node-${node.id.replace(":", "-")}`;

  // TEXT → <p>
  if (node.text) {
    return `<p class="${className}">${node.text.content}</p>`;
  }

  // NON-TEXT → <div>
  let html = `<div class="${className}">`;

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      html += htmlForNode(child);
    }
  }

  html += `</div>`;
  return html;
}

export function generateHTML(rootNode) {
  const inner = htmlForNode(rootNode);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

<div id="phone-simulator">
  ${inner}
</div>

</body>
</html>`;
}

