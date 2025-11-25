// figmaClient.js
import fetch from "node-fetch";

async function fetchWithRetry(url, token, attempt = 1) {
  const res = await fetch(url, {
    headers: { "X-Figma-Token": token }
  });

  if (res.status === 429) {
    if (attempt >= 3) {
      throw new Error("Figma rate limit hit too many times.");
    }
    console.log(`Rate limit. Waiting 60s...`);
    await new Promise(r => setTimeout(r, 60000));
    return fetchWithRetry(url, token, attempt + 1);
  }

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Figma API request failed (${res.status}): ${msg}`);
  }

  return res.json();
}

// fetch file
export async function fetchFigmaFile(fileKey, token) {
  const url = `https://api.figma.com/v1/files/${fileKey}`;
  return fetchWithRetry(url, token);
}
