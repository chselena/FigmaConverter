// index.js
import readline from "readline-sync";
import fs from "fs";
import { fetchFigmaFile } from "./figmaClient.js";
import { normalizeNode } from "./normalizer.js";
import { generateHTML } from "./htmlGenerator.js";
import { generateCSS } from "./cssGenerator.js";

function extractFileKey(str) {
  if (/^[A-Za-z0-9]{20,40}$/.test(str)) return str;
  const m = str.match(/\/(?:file|design)\/([A-Za-z0-9]+)\//);
  return m ? m[1] : null;
}

(async () => {
  const input = readline.question("Enter Figma file URL or key: ").trim();
  const key = extractFileKey(input);

  if (!key) {
    console.error("Invalid Figma key/URL");
    process.exit(1);
  }

  if (!process.env.FIGMA_API_TOKEN) {
    console.error("FIGMA_API_TOKEN not set.");
    process.exit(1);
  }

  const json = await fetchFigmaFile(key, process.env.FIGMA_API_TOKEN);

  const page = json.document.children[0];
  const normalized = normalizeNode(page);

  const html = generateHTML(normalized);
  const css = generateCSS(normalized);

  fs.mkdirSync("output", { recursive: true });
  fs.writeFileSync("output/index.html", `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
${html}
</body>
</html>
`);
  fs.writeFileSync("output/styles.css", css);

  console.log("Open output/index.html in your browser.");
})();
