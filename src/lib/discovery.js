import { normalizeText } from "./catalog.js";

export function catalogCategories(dishes) {
  const seen = new Map();
  for (const dish of dishes) {
    const key = dish.category;
    const name = dish.categoryLabel || dish.category;
    if (key && !seen.has(key)) seen.set(key, name);
  }
  return [...seen.entries()].map(([key, name]) => ({ key, name }));
}

export function filterCategories(categories, query) {
  const normalized = normalizeText(query);
  if (!normalized) return categories;
  return categories.filter(({ name, key }) =>
    normalizeText(name).includes(normalized) || normalizeText(key).includes(normalized)
  );
}

export function buildDiscoveryQueue(dishes, selectedCategories = [], featuredDishes = []) {
  const chosenKeys = new Set(selectedCategories.map((c) => normalizeText(c)));
  const byCategory = new Map();
  for (const dish of dishes) {
    const catKey = normalizeText(dish.category);
    const catLabel = normalizeText(dish.categoryLabel);
    if (!chosenKeys.has(catKey) && !chosenKeys.has(catLabel)) continue;
    if (!byCategory.has(catKey)) byCategory.set(catKey, []);
    byCategory.get(catKey).push(dish);
  }

  const personal = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const [, list] of byCategory.entries()) {
      const next = list.shift();
      if (next) {
        personal.push({ ...next, source: "Categoria escolhida" });
        remaining = true;
      }
    }
  }

  const chef = (featuredDishes.length ? featuredDishes : dishes.filter((d) => d.featured)).map((entry) => {
    const dish = typeof entry === "string" ? dishes.find((item) => item.code === entry) : entry;
    return dish ? { ...dish, source: "Sugestão do Chef" } : null;
  }).filter(Boolean);

  const result = [];
  const seen = new Set();
  let personalIndex = 0;
  let chefIndex = 0;
  while (personalIndex < personal.length || chefIndex < chef.length) {
    for (let i = 0; i < 2 && personalIndex < personal.length; i++) {
      const dish = personal[personalIndex++];
      if (!seen.has(dish.code)) {
        result.push(dish);
        seen.add(dish.code);
      }
    }
    if (chefIndex < chef.length) {
      const dish = chef[chefIndex++];
      if (!seen.has(dish.code)) {
        result.push(dish);
        seen.add(dish.code);
      }
    }
  }
  return result;
}

export function sanitizeDiscoveryState(value, dishCodes) {
  const allowed = new Set(dishCodes.map(String));
  const validStrings = (items, max = 500) =>
    Array.isArray(items)
      ? [...new Set(items.filter((item) => typeof item === "string").map(String))].slice(0, max)
      : [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyDiscoveryState();
  const categories = validStrings(value.categories, 10);
  const queue = validStrings(value.queue).filter((code) => allowed.has(code));
  const list = validStrings(value.list).filter((code) => allowed.has(code));
  const seen = validStrings(value.seen).filter((code) => allowed.has(code));
  const passed = validStrings(value.passed).filter((code) => allowed.has(code));
  const history = Array.isArray(value.history)
    ? value.history
        .slice(-1)
        .map((entry) => {
          if (
            !entry ||
            !["pass", "choose"].includes(entry.action) ||
            typeof entry.code !== "string" ||
            !allowed.has(entry.code)
          )
            return null;
          return {
            action: entry.action,
            code: entry.code,
            index: Number.isInteger(entry.index) ? Math.max(0, entry.index) : 0,
          };
        })
        .filter(Boolean)
    : [];
  return {
    version: 1,
    categories,
    queue,
    index: Math.max(0, Math.min(Number.isInteger(value.index) ? value.index : 0, queue.length)),
    seen,
    passed,
    list,
    history,
  };
}

export function emptyDiscoveryState() {
  return { version: 1, categories: [], queue: [], index: 0, seen: [], passed: [], list: [], history: [] };
}
