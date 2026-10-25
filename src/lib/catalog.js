/** Helpers puros para busca, filtragem, harmonização e cálculo de mesa do cardápio Pastus. */
export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/&/g, " e ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function formatCurrency(value) {
  const num = Number(value) || 0;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

function scoreDish(dish, query, tokens) {
  const title = normalizeText(dish.title);
  const category = normalizeText(dish.categoryLabel || dish.category);
  const code = normalizeText(dish.code);
  const description = normalizeText(dish.description);
  const tags = normalizeText((dish.tags || []).join(" "));
  const portion = normalizeText(dish.portion);
  const haystack = [title, category, code, description, tags, portion].join(" ");
  if (!tokens.every((token) => haystack.includes(token))) return -1;
  if (code === query) return 120;
  if (title === query) return 110;
  if (category === query) return 100;
  if (title.startsWith(query)) return 90;
  if (category.startsWith(query)) return 80;
  if (code.startsWith(query)) return 75;
  if (title.includes(query)) return 65;
  if (tags.includes(query)) return 60;
  if (description.includes(query)) return 45;
  return 10;
}

export function searchCatalog(list, rawQuery) {
  const query = normalizeText(rawQuery);
  if (!query) return list;
  const tokens = query.split(" ");
  return list
    .map((dish, index) => ({ dish, index, score: scoreDish(dish, query, tokens) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ dish }) => dish);
}

/** Retorna sugestões reais do cardápio que harmonizam com o prato ou categoria atual. */
export function curatedPairingSuggestions(catalog, dishOrCode, limit = 6) {
  const byCode = new Map(catalog.map((item) => [item.code, item]));
  const target = typeof dishOrCode === "string" ? byCode.get(dishOrCode) : dishOrCode;
  if (!target) return [];
  const suggestions = [];
  const seen = new Set([target.code]);
  for (const code of target.pairings || []) {
    const match = byCode.get(code);
    if (match && !seen.has(match.code)) {
      seen.add(match.code);
      suggestions.push(match);
    }
  }
  if (suggestions.length < limit) {
    for (const item of catalog) {
      if (seen.has(item.code)) continue;
      if (target.category === "PARRILLA" && item.category === "ACOMPANHAMENTOS" && item.featured) {
        seen.add(item.code);
        suggestions.push(item);
      } else if (item.featured && item.category !== target.category) {
        seen.add(item.code);
        suggestions.push(item);
      }
      if (suggestions.length >= limit) break;
    }
  }
  return suggestions.slice(0, limit);
}

export function filtersForCategorySelection(categoryKey, categoryLabel = "") {
  const cleanKey = String(categoryKey || "").trim();
  return {
    section: cleanKey,
    tag: "",
    favoritesOnly: false,
    query: "",
    category: cleanKey ? { type: "section", value: cleanKey, label: categoryLabel || cleanKey } : null,
  };
}

export function countActiveFilterChips({ section = "", tag = "", favoritesOnly = false, category = null } = {}) {
  let count = 0;
  if (section && category?.type !== "section") count += 1;
  if (tag) count += 1;
  if (favoritesOnly) count += 1;
  if (category && ["curated", "tag"].includes(category.type)) count += 1;
  return count;
}

export function filtersToggleLabel(count) {
  return count > 0 ? `Filtros (${count})` : "Filtros";
}

export function filterCatalog(
  catalog,
  { query = "", section = "", tag = "", favoritesOnly = false, favoriteCodes = new Set(), category = null } = {}
) {
  const list = catalog.filter((dish) => {
    if (section && dish.category !== section) return false;
    if (tag) {
      const normalizedTag = normalizeText(tag);
      const dishTags = (dish.tags || []).map(normalizeText);
      if (!dishTags.some((t) => t === normalizedTag || t.includes(normalizedTag))) return false;
    }
    if (favoritesOnly && !favoriteCodes.has(dish.code)) return false;
    if (category?.type === "section" && dish.category !== category.value) return false;
    if (category?.type === "curated" && Array.isArray(category.codes)) {
      if (!category.codes.includes(dish.code)) return false;
    }
    if (category?.type === "tag") {
      const targetTag = normalizeText(category.value);
      const dishTags = (dish.tags || []).map(normalizeText);
      if (!dishTags.some((t) => t === targetTag || t.includes(targetTag))) return false;
    }
    return true;
  });
  return searchCatalog(list, query);
}

export function calculateTableTotal(catalog, tableItems, { includeService = false, splitCount = 1 } = {}) {
  const byCode = new Map(catalog.map((item) => [item.code, item]));
  let subtotal = 0;
  let totalItems = 0;
  for (const entry of tableItems || []) {
    const code = typeof entry === "string" ? entry : entry.code;
    const qty = typeof entry === "object" && entry.qty ? Math.max(1, Number(entry.qty)) : 1;
    const dish = byCode.get(code);
    if (!dish) continue;
    subtotal += dish.price * qty;
    totalItems += qty;
  }
  const serviceFee = includeService ? subtotal * 0.1 : 0;
  const total = subtotal + serviceFee;
  const people = Math.max(1, Number(splitCount) || 1);
  const perPerson = total / people;
  return {
    totalItems,
    subtotal: Number(subtotal.toFixed(2)),
    serviceFee: Number(serviceFee.toFixed(2)),
    total: Number(total.toFixed(2)),
    perPerson: Number(perPerson.toFixed(2)),
  };
}
