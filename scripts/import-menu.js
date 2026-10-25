#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const csvPath = join(root, "data", "cardapio.csv");
const outJson = join(root, "public", "data", "menu.json");

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const raw = readFileSync(csvPath, "utf-8").trim().split(/\r?\n/);
const headers = parseCsvLine(raw[0]);
const items = raw.slice(1).filter(Boolean).map((line) => {
  const cols = parseCsvLine(line);
  const row = Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
  const price = Number(row.price) || 0;
  return {
    code: row.code.trim(),
    category: row.category.trim(),
    categoryLabel: row.categoryLabel.trim(),
    title: row.title.trim(),
    description: row.description.trim(),
    price,
    priceFormatted: `R$ ${price.toFixed(2).replace(".", ",")}`,
    portion: row.portion.trim(),
    tags: row.tags ? row.tags.split("|").filter(Boolean) : [],
    sauces: row.sauces ? row.sauces.split("|").filter(Boolean) : [],
    pairings: row.pairings ? row.pairings.split("|").filter(Boolean) : [],
    featured: row.featured === "true",
  };
});

writeFileSync(outJson, JSON.stringify(items, null, 2) + "\n", "utf-8");
console.log(`Importados ${items.length} itens do cardápio em ${outJson}`);
