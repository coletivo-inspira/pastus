import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeText,
  searchCatalog,
  curatedPairingSuggestions,
  filtersForCategorySelection,
  filterCatalog,
  countActiveFilterChips,
  filtersToggleLabel,
  calculateTableTotal,
} from "../src/lib/catalog.js";
import { buildDiscoveryQueue, catalogCategories, filterCategories, sanitizeDiscoveryState } from "../src/lib/discovery.js";

const catalog = [
  {
    code: "P03",
    category: "ENTRADAS",
    categoryLabel: "Entradas",
    title: "Steak Tartare",
    description: "Servido em brioche amanteigado",
    price: 66,
    portion: "Individual",
    tags: ["Assinatura do Chef"],
    pairings: ["P23"],
    featured: true,
  },
  {
    code: "P22",
    category: "PARRILLA",
    categoryLabel: "Cortes da Parrilla",
    title: "Picanha na Parrilla",
    description: "Corte nobre assado sobre brasas",
    price: 188,
    portion: "500g",
    tags: ["Brasa", "Compartilhar"],
    pairings: ["P39"],
    featured: true,
  },
  {
    code: "P23",
    category: "PARRILLA",
    categoryLabel: "Cortes da Parrilla",
    title: "Bife Ancho",
    description: "Contrafilé argentino marmorizado",
    price: 110,
    portion: "350g",
    tags: ["Brasa", "Clássico Parrillero"],
    pairings: ["P39"],
    featured: true,
  },
  {
    code: "P39",
    category: "ACOMPANHAMENTOS",
    categoryLabel: "Acompanhamentos",
    title: "Purê de Batata Trufado",
    description: "Purê cremoso finalizado com azeite de trufas",
    price: 38,
    portion: "Guarnição",
    tags: ["Vegetariano", "Assinatura do Chef"],
    pairings: ["P22", "P23"],
    featured: true,
  },
];

test("normaliza acentos, caixa e pontuação", () => {
  assert.equal(normalizeText("  FOGO & PARRILLA! Trufado "), "fogo e parrilla trufado");
});

test("encontra por prato, categoria, código e ingrediente na descrição", () => {
  assert.deepEqual(searchCatalog(catalog, "parrilla").map((d) => d.code), ["P22", "P23"]);
  assert.equal(searchCatalog(catalog, "P03")[0].title, "Steak Tartare");
  assert.equal(searchCatalog(catalog, "brioche")[0].code, "P03");
});

test("prioriza correspondência exata sobre correspondência parcial", () => {
  assert.equal(searchCatalog(catalog, "Bife Ancho")[0].code, "P23");
  assert.deepEqual(searchCatalog(catalog, "prato inexistente"), []);
});

test("sugestões de harmonização retornam itens reais do cardápio sem duplicação", () => {
  const suggestions = curatedPairingSuggestions(catalog, "P22", 3);
  assert.equal(suggestions[0].code, "P39");
  assert.ok(suggestions.every((item) => item.code !== "P22"));
});

test("lista e filtra categorias sem duplicar chaves", () => {
  const cats = catalogCategories(catalog);
  assert.equal(cats.length, 3);
  assert.deepEqual(filterCategories(cats, "parrilla").map((c) => c.key), ["PARRILLA"]);
});

test("monta fila de descoberta intercalando categorias escolhidas e sugestões do chef", () => {
  const queue = buildDiscoveryQueue(catalog, ["ENTRADAS"], [catalog[1]]);
  assert.deepEqual(queue.map((d) => d.code), ["P03", "P22"]);
});

test("recupera estado de descoberta validado contra os códigos ativos", () => {
  const state = sanitizeDiscoveryState(
    {
      version: 1,
      categories: ["PARRILLA"],
      queue: ["P22", "invalido"],
      index: 99,
      list: ["P22", "P39"],
      seen: ["P22"],
      passed: ["P22", "invalido"],
      history: [{ action: "choose", code: "P22", index: 0 }],
    },
    ["P03", "P22", "P23", "P39"]
  );
  assert.equal(state.index, 1);
  assert.deepEqual(state.queue, ["P22"]);
  assert.deepEqual(state.list, ["P22", "P39"]);
  assert.deepEqual(state.passed, ["P22"]);
});

test("combina seção, perfil/tag, favoritos e busca textual", () => {
  const options = {
    section: "PARRILLA",
    tag: "Compartilhar",
    favoritesOnly: true,
    favoriteCodes: new Set(["P22"]),
  };
  assert.deepEqual(filterCatalog(catalog, { ...options, query: "picanha" }).map((d) => d.code), ["P22"]);
  assert.deepEqual(filterCatalog(catalog, { ...options, query: "ancho" }), []);
});

test("seleção de categoria limpa filtros anteriores e atualiza rótulo de filtros", () => {
  const next = filtersForCategorySelection("PARRILLA", "Cortes da Parrilla");
  assert.equal(next.section, "PARRILLA");
  assert.equal(next.favoritesOnly, false);
  assert.equal(countActiveFilterChips(next), 0);
  assert.equal(filtersToggleLabel(2), "Filtros (2)");
});

test("calcula subtotal, taxa de serviço opcional e divisão por pessoa na mesa", () => {
  const summary = calculateTableTotal(
    catalog,
    [
      { code: "P22", qty: 1 },
      { code: "P39", qty: 2 },
    ],
    { includeService: true, splitCount: 2 }
  );
  assert.equal(summary.totalItems, 3);
  assert.equal(summary.subtotal, 264);
  assert.equal(summary.serviceFee, 26.4);
  assert.equal(summary.total, 290.4);
  assert.equal(summary.perPerson, 145.2);
});
