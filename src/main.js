import {
  normalizeText,
  formatCurrency,
  curatedPairingSuggestions,
  filtersForCategorySelection,
  filterCatalog,
  countActiveFilterChips,
  filtersToggleLabel,
  calculateTableTotal,
} from "./lib/catalog.js";
import {
  buildDiscoveryQueue,
  catalogCategories,
  emptyDiscoveryState,
} from "./lib/discovery.js";
import {
  resolveSwipeAxis,
  shouldCommitSwipe,
  swipeActionFromDx,
  swipeDelta,
  swipeStrength,
  isInteractiveSwipeTarget,
} from "./lib/discovery-swipe.js";
import { initializeTheme } from "./site.js";

// Vite build + raw GitHub Pages (fonte em /src) resolvem assets em /public.
const BASE = new URL(/* @vite-ignore */ "../public/", import.meta.url).href;
const PAGE_SIZE = 30;
const FAVORITES_KEY = "pastus-favorites-v1";
const TABLE_KEY = "pastus-table-v1";
const RESULTS_VIEW_KEY = "pastus-results-view-v1";

const SECTION_META = {
  PARRILLA: { title: "Cortes da Parrilla", subtitle: "Ancho, Chorizo, Picanha, Dry Aged & Fiorentina", color: "#9e3b1c" },
  ENTRADAS: { title: "Entradas & Brasa", subtitle: "Burrata, Steak Tartare, Croquetes & Linguiças", color: "#8c5a14" },
  PRINCIPAIS: { title: "Pratos Principais", subtitle: "Bacalhau na Brasa, Milanesas & Massas", color: "#5e4326" },
  ACOMPANHAMENTOS: { title: "Acompanhamentos", subtitle: "Arroz de Cogumelos, Purê Trufado & Farofas", color: "#3d5a3b" },
  SANDUICHES: { title: "Sanduíches & Burgers", subtitle: "Choripán, Roast Beef & Burgers Angus na Brasa", color: "#7a3e28" },
  SALADAS: { title: "Saladas & Leves", subtitle: "Salada Pastus, Gorgonzola na Brasa, Caesar & Waldorf", color: "#2d5a4c" },
  SOBREMESAS: { title: "Sobremesas", subtitle: "Panqueca La Serenissima, Abacaxi na Brasa & Torta", color: "#6e2f40" },
};

const CURATED_EXPERIENCES = [
  {
    id: "chef",
    title: "Assinatura Chef Cristóvão Laruça",
    subtitle: "Cortes e receitas emblemáticas da casa",
    color: "#8f3217",
    codes: ["P03", "P07", "P08", "P22", "P23", "P32", "P33", "P35", "P39", "P49", "P54", "P57"],
  },
  {
    id: "compartilhar",
    title: "Para Compartilhar na Mesa",
    subtitle: "Grandes cortes com osso, entradas e guarnições",
    color: "#6b4c1b",
    codes: ["P07", "P08", "P09", "P12", "P22", "P29", "P30", "P31", "P32", "P33", "P47", "P49"],
  },
  {
    id: "sunset",
    title: "Pastus Lounge & Happy Hour",
    subtitle: "Entradas na brasa, sanduíches e petiscos perfeitos com drinks",
    color: "#523828",
    codes: ["P01", "P02", "P05", "P06", "P07", "P08", "P11", "P12", "P14", "P16", "P17"],
  },
];

const QUICK_SUGGESTIONS = [
  "Picanha",
  "Dry Aged",
  "Ancho",
  "Burrata",
  "Croquetes de Costela",
  "Steak Tartare",
  "Bacalhau",
  "Doce de Leite",
];

const els = {
  searchInput: document.querySelector("#dish-search"),
  clearButton: document.querySelector("#clear-search"),
  resultsCount: document.querySelector("#results-count"),
  browseView: document.querySelector("#browse-view"),
  resultsView: document.querySelector("#results-view"),
  categoryGrid: document.querySelector("#category-grid"),
  dishesList: document.querySelector("#dishes-list"),
  emptyState: document.querySelector("#empty-state"),
  loadMore: document.querySelector("#load-more"),
  backToBrowse: document.querySelector("#back-to-browse"),
  activeFilter: document.querySelector("#active-filter"),
  favoritesButton: document.querySelector("#show-favorites"),
  favoritesCount: document.querySelector("#favorites-count"),
  openDiscoveryButton: document.querySelector("#open-discovery"),
  openTableButton: document.querySelector("#open-table-list"),
  tableCount: document.querySelector("#table-list-count"),
  mobileTableButton: document.querySelector("#mobile-table"),
  mobileTableCount: document.querySelector("#mobile-table-count"),
  toggleFilters: document.querySelector("#toggle-filters"),
  catalogFilters: document.querySelector("#catalog-filters"),
  filterSection: document.querySelector("#filter-section"),
  filterTag: document.querySelector("#filter-tag"),
  filterFavorites: document.querySelector("#filter-favorites"),
  clearFilters: document.querySelector("#clear-filters"),
  activeFilterChips: document.querySelector("#active-filter-chips"),
  searchSuggestions: document.querySelector("#search-suggestions"),
  viewListButton: document.querySelector("#view-list"),
  viewGridButton: document.querySelector("#view-grid"),
  relatedSection: document.querySelector("#related-dishes"),
  relatedList: document.querySelector("#related-list"),
  discoveryView: document.querySelector("#discovery-view"),
  categoryPicker: document.querySelector("#category-picker"),
  categorySelectionCount: document.querySelector("#category-selection-count"),
  categoryOptions: document.querySelector("#category-options"),
  startDiscovery: document.querySelector("#start-discovery"),
  skipCategoryPicker: document.querySelector("#skip-category-picker"),
  discoveryCards: document.querySelector("#discovery-cards"),
  discoveryCard: document.querySelector("#discovery-card"),
  cardPosition: document.querySelector("#card-position"),
  undoDiscovery: document.querySelector("#undo-discovery"),
  passDish: document.querySelector("#pass-dish"),
  chooseDish: document.querySelector("#choose-dish"),
  changeCategories: document.querySelector("#change-categories"),
  restartPassed: document.querySelector("#restart-passed"),
  dishDialog: document.querySelector("#dish-dialog"),
  dialogBadge: document.querySelector("#dialog-badge"),
  dialogTitle: document.querySelector("#dialog-dish-title"),
  dialogDescription: document.querySelector("#dialog-description"),
  dialogMeta: document.querySelector("#dialog-meta"),
  dialogSauceWrap: document.querySelector("#dialog-sauce-wrap"),
  dialogSauce: document.querySelector("#dialog-sauce"),
  dialogPairingsWrap: document.querySelector("#dialog-pairings-wrap"),
  dialogPairings: document.querySelector("#dialog-pairings"),
  dialogPrice: document.querySelector("#dialog-price"),
  addToTableBtn: document.querySelector("#add-to-table-btn"),
  addTableStatus: document.querySelector("#add-table-status"),
  tableDialog: document.querySelector("#table-list-dialog"),
  closeTableList: document.querySelector("#close-table-list"),
  tableListItems: document.querySelector("#table-list-items"),
  tableListEmpty: document.querySelector("#table-list-empty"),
  tableSummaryBox: document.querySelector("#table-summary-box"),
  toggleServiceFee: document.querySelector("#toggle-service-fee"),
  splitPeople: document.querySelector("#split-people"),
  summarySubtotal: document.querySelector("#summary-subtotal"),
  summaryTotal: document.querySelector("#summary-total"),
  summaryPerPerson: document.querySelector("#summary-per-person"),
  whatsappOrderLink: document.querySelector("#whatsapp-order-link"),
  copyTableSummary: document.querySelector("#copy-table-summary"),
  copyTableStatus: document.querySelector("#copy-table-status"),
  resetTable: document.querySelector("#reset-table"),
};

let catalog = [];
let filtered = [];
let visibleCount = PAGE_SIZE;
let activeCategory = null;
let selectedSection = "";
let selectedTag = "";
let favoritesOnly = false;
let favorites = loadFavorites();
let tableItems = loadTableItems();
let discoveryState = emptyDiscoveryState();
let resultsViewMode = loadResultsViewMode();
let activeModalDish = null;

function loadFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    /* continua em memória */
  }
  updateCounters();
}

function loadTableItems() {
  try {
    const raw = JSON.parse(localStorage.getItem(TABLE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item) => item && typeof item.code === "string")
      .map((item) => ({
        code: item.code,
        qty: Math.max(1, Number(item.qty) || 1),
        sauce: item.sauce || "",
      }));
  } catch {
    return [];
  }
}

function saveTableItems() {
  try {
    localStorage.setItem(TABLE_KEY, JSON.stringify(tableItems));
  } catch {
    /* continua em memória */
  }
  updateCounters();
}

function loadResultsViewMode() {
  try {
    const saved = localStorage.getItem(RESULTS_VIEW_KEY);
    return saved === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

function applyResultsViewMode(mode) {
  resultsViewMode = mode === "grid" ? "grid" : "list";
  els.dishesList?.classList.toggle("songs-list--grid", resultsViewMode === "grid");
  els.viewListButton?.setAttribute("aria-pressed", String(resultsViewMode === "list"));
  els.viewGridButton?.setAttribute("aria-pressed", String(resultsViewMode === "grid"));
  try {
    localStorage.setItem(RESULTS_VIEW_KEY, resultsViewMode);
  } catch {
    /* ignora */
  }
}

function updateCounters() {
  if (els.favoritesCount) els.favoritesCount.textContent = String(favorites.size);
  if (els.favoritesButton) els.favoritesButton.setAttribute("aria-pressed", String(favoritesOnly));
  const totalQty = tableItems.reduce((acc, item) => acc + (item.qty || 1), 0);
  if (els.tableCount) els.tableCount.textContent = String(totalQty);
  if (els.mobileTableCount) {
    els.mobileTableCount.textContent = String(totalQty);
    els.mobileTableCount.hidden = totalQty === 0;
  }
}

function addDishToTable(code, sauce = "") {
  const dish = catalog.find((d) => d.code === code);
  if (!dish) return;
  const chosenSauce = sauce || (dish.sauces?.length ? dish.sauces[0] : "");
  const existing = tableItems.find((item) => item.code === code && item.sauce === chosenSauce);
  if (existing) {
    existing.qty += 1;
  } else {
    tableItems.push({ code, qty: 1, sauce: chosenSauce });
  }
  saveTableItems();
}

function toggleFavorite(code) {
  if (favorites.has(code)) favorites.delete(code);
  else favorites.add(code);
  saveFavorites();
  if (favoritesOnly) runFilter();
}

function renderBrowseCategories() {
  if (!els.categoryGrid) return;
  const counts = new Map();
  for (const dish of catalog) {
    counts.set(dish.category, (counts.get(dish.category) || 0) + 1);
  }
  els.categoryGrid.innerHTML = "";

  for (const [key, meta] of Object.entries(SECTION_META)) {
    const count = counts.get(key) || 0;
    if (!count) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-tile";
    btn.style.setProperty("--tile-color", meta.color);
    btn.setAttribute("role", "listitem");
    btn.innerHTML = `
      <span class="tile-title">${meta.title}</span>
      <span class="tile-count">${count} opções · ${meta.subtitle}</span>
    `;
    btn.addEventListener("click", () => {
      const next = filtersForCategorySelection(key, meta.title);
      selectedSection = next.section;
      selectedTag = next.tag;
      favoritesOnly = next.favoritesOnly;
      activeCategory = next.category;
      if (els.searchInput) els.searchInput.value = "";
      syncFilterControls();
      runFilter();
    });
    els.categoryGrid.appendChild(btn);
  }

  for (const exp of CURATED_EXPERIENCES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-tile";
    btn.style.setProperty("--tile-color", exp.color);
    btn.setAttribute("role", "listitem");
    btn.innerHTML = `
      <span class="tile-title">${exp.title}</span>
      <span class="tile-count">${exp.codes.length} sugestões · ${exp.subtitle}</span>
    `;
    btn.addEventListener("click", () => {
      selectedSection = "";
      selectedTag = "";
      favoritesOnly = false;
      activeCategory = { type: "curated", value: exp.id, label: exp.title, codes: exp.codes };
      if (els.searchInput) els.searchInput.value = "";
      syncFilterControls();
      runFilter();
    });
    els.categoryGrid.appendChild(btn);
  }
}

function populateSectionSelect() {
  if (!els.filterSection) return;
  const cats = catalogCategories(catalog);
  els.filterSection.innerHTML = '<option value="">Todas as seções</option>';
  for (const { key, name } of cats) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = name;
    els.filterSection.appendChild(opt);
  }
}

function renderSearchSuggestions() {
  if (!els.searchSuggestions) return;
  els.searchSuggestions.innerHTML = "";
  for (const term of QUICK_SUGGESTIONS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "suggestion-chip";
    chip.textContent = term;
    chip.addEventListener("click", () => {
      if (els.searchInput) els.searchInput.value = term;
      activeCategory = null;
      runFilter();
    });
    els.searchSuggestions.appendChild(chip);
  }
}

function syncFilterControls() {
  if (els.filterSection) els.filterSection.value = selectedSection;
  if (els.filterTag) els.filterTag.value = selectedTag;
  if (els.filterFavorites) els.filterFavorites.checked = favoritesOnly;
  const chipCount = countActiveFilterChips({
    section: selectedSection,
    tag: selectedTag,
    favoritesOnly,
    category: activeCategory,
  });
  if (els.toggleFilters) els.toggleFilters.textContent = filtersToggleLabel(chipCount);
  renderActiveFilterChips();
  updateCounters();
}

function renderActiveFilterChips() {
  if (!els.activeFilterChips) return;
  els.activeFilterChips.innerHTML = "";
  const chips = [];
  if (selectedSection) {
    const label = SECTION_META[selectedSection]?.title || selectedSection;
    chips.push({
      label: `Seção: ${label}`,
      clear: () => {
        selectedSection = "";
        if (activeCategory?.type === "section") activeCategory = null;
      },
    });
  }
  if (selectedTag) {
    chips.push({
      label: `Perfil: ${selectedTag}`,
      clear: () => {
        selectedTag = "";
      },
    });
  }
  if (favoritesOnly) {
    chips.push({
      label: "Somente favoritos",
      clear: () => {
        favoritesOnly = false;
      },
    });
  }
  if (activeCategory?.type === "curated") {
    chips.push({
      label: activeCategory.label,
      clear: () => {
        activeCategory = null;
      },
    });
  }

  for (const chip of chips) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-chip";
    btn.innerHTML = `<span>${chip.label}</span> <span aria-hidden="true">×</span>`;
    btn.addEventListener("click", () => {
      chip.clear();
      syncFilterControls();
      runFilter();
    });
    els.activeFilterChips.appendChild(btn);
  }
}

function createDishRow(dish) {
  const row = document.createElement("article");
  row.className = "song-row";
  row.setAttribute("role", "listitem");

  const isFav = favorites.has(dish.code);
  const inTableQty = tableItems
    .filter((i) => i.code === dish.code)
    .reduce((acc, i) => acc + (i.qty || 1), 0);

  const tagsHtml = (dish.tags || [])
    .slice(0, 3)
    .map((tag) => {
      const isChef = normalizeText(tag).includes("chef") || normalizeText(tag).includes("dry aged");
      return `<span class="dish-tag ${isChef ? "dish-tag--chef" : ""}">${tag}</span>`;
    })
    .join("");

  row.innerHTML = `
    <div class="song-cover" data-initials="${dish.code}">
      <span>${dish.code}</span>
    </div>
    <div class="song-main">
      <div class="song-title-line">
        <strong class="song-title">${dish.title}</strong>
        <span class="dish-price-pill">${dish.priceFormatted}</span>
      </div>
      <button type="button" class="song-artist" data-section="${dish.category}">
        ${dish.categoryLabel} · ${dish.portion}
      </button>
      <p class="song-lyric">${dish.description}</p>
      <div class="dish-row-tags">${tagsHtml}</div>
    </div>
    <div class="song-actions">
      <button
        type="button"
        class="action-btn favorite-btn ${isFav ? "is-favorite" : ""}"
        aria-pressed="${isFav}"
        aria-label="${isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}: ${dish.title}"
        title="${isFav ? "Salvo nos favoritos" : "Favoritar prato"}"
      >
        ♥
      </button>
      <button type="button" class="action-btn code-btn">
        ${inTableQty > 0 ? `Na mesa (${inTableQty})` : "+ Mesa"}
      </button>
    </div>
  `;

  row.querySelector(".song-artist")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const next = filtersForCategorySelection(dish.category, dish.categoryLabel);
    selectedSection = next.section;
    selectedTag = "";
    favoritesOnly = false;
    activeCategory = next.category;
    syncFilterControls();
    runFilter();
  });

  row.querySelector(".favorite-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(dish.code);
    renderDishesList();
  });

  row.querySelector(".code-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    openDishDialog(dish);
  });

  row.addEventListener("click", () => openDishDialog(dish));
  return row;
}

function renderDishesList() {
  if (!els.dishesList) return;
  els.dishesList.innerHTML = "";
  const slice = filtered.slice(0, visibleCount);
  for (const dish of slice) {
    els.dishesList.appendChild(createDishRow(dish));
  }
  if (els.emptyState) els.emptyState.hidden = filtered.length > 0;
  if (els.loadMore) els.loadMore.hidden = visibleCount >= filtered.length;
}

function renderRelatedPairings() {
  if (!els.relatedSection || !els.relatedList) return;
  const referenceDish = filtered[0];
  if (!referenceDish || (!selectedSection && !activeCategory && !els.searchInput?.value.trim())) {
    els.relatedSection.hidden = true;
    return;
  }
  const suggestions = curatedPairingSuggestions(catalog, referenceDish, 5);
  if (!suggestions.length) {
    els.relatedSection.hidden = true;
    return;
  }
  els.relatedSection.hidden = false;
  els.relatedList.innerHTML = "";
  for (const item of suggestions) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "related-chip";
    chip.textContent = `${item.title} (${item.priceFormatted})`;
    chip.addEventListener("click", () => openDishDialog(item));
    els.relatedList.appendChild(chip);
  }
}

function runFilter() {
  const query = els.searchInput?.value || "";
  if (els.clearButton) els.clearButton.hidden = !query.trim();

  const hasActiveFilter = Boolean(
    query.trim() || selectedSection || selectedTag || favoritesOnly || activeCategory
  );

  if (!hasActiveFilter) {
    if (els.browseView) els.browseView.hidden = false;
    if (els.resultsView) els.resultsView.hidden = true;
    if (els.resultsCount) els.resultsCount.textContent = `${catalog.length} itens disponíveis no cardápio`;
    return;
  }

  if (els.browseView) els.browseView.hidden = true;
  if (els.resultsView) els.resultsView.hidden = false;
  if (els.discoveryView) els.discoveryView.hidden = true;

  filtered = filterCatalog(catalog, {
    query,
    section: selectedSection,
    tag: selectedTag,
    favoritesOnly,
    favoriteCodes: favorites,
    category: activeCategory,
  });

  visibleCount = PAGE_SIZE;
  if (els.resultsCount) {
    els.resultsCount.textContent =
      filtered.length === 1 ? "1 prato encontrado" : `${filtered.length} pratos encontrados`;
  }
  if (els.activeFilter) {
    els.activeFilter.textContent =
      activeCategory?.label ||
      (selectedSection ? SECTION_META[selectedSection]?.title : "") ||
      (favoritesOnly ? "Meus pratos favoritos" : "Cardápio filtrado");
  }

  renderDishesList();
  renderRelatedPairings();
}

function openDishDialog(dish) {
  if (!els.dishDialog || !dish) return;
  activeModalDish = dish;
  if (els.dialogBadge) els.dialogBadge.textContent = `${dish.categoryLabel} · Cód. ${dish.code}`;
  if (els.dialogTitle) els.dialogTitle.textContent = dish.title;
  if (els.dialogDescription) els.dialogDescription.textContent = dish.description;
  if (els.dialogPrice) els.dialogPrice.value = dish.priceFormatted;
  if (els.addTableStatus) els.addTableStatus.textContent = "";

  if (els.dialogMeta) {
    els.dialogMeta.innerHTML = [
      `<span class="dialog-meta-chip">Porção: ${dish.portion}</span>`,
      ...(dish.tags || []).map((t) => `<span class="dialog-meta-chip">${t}</span>`),
    ].join("");
  }

  if (els.dialogSauceWrap && els.dialogSauce) {
    if (dish.sauces && dish.sauces.length > 0) {
      els.dialogSauceWrap.hidden = false;
      els.dialogSauce.innerHTML = dish.sauces
        .map((s) => `<option value="${s}">${s}</option>`)
        .join("");
    } else {
      els.dialogSauceWrap.hidden = true;
    }
  }

  if (els.dialogPairingsWrap && els.dialogPairings) {
    const pairings = curatedPairingSuggestions(catalog, dish, 4);
    if (pairings.length > 0) {
      els.dialogPairingsWrap.hidden = false;
      els.dialogPairings.innerHTML = "";
      for (const p of pairings) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pairing-chip-btn";
        btn.textContent = `+ ${p.title} (${p.priceFormatted})`;
        btn.addEventListener("click", () => {
          addDishToTable(p.code);
          if (els.addTableStatus) {
            els.addTableStatus.textContent = `${p.title} adicionado à Minha Mesa!`;
          }
          renderDishesList();
        });
        els.dialogPairings.appendChild(btn);
      }
    } else {
      els.dialogPairingsWrap.hidden = true;
    }
  }

  if (typeof els.dishDialog.showModal === "function") {
    els.dishDialog.showModal();
  } else {
    els.dishDialog.setAttribute("open", "");
  }
}

function renderTableDialog() {
  if (!els.tableListItems) return;
  const byCode = new Map(catalog.map((d) => [d.code, d]));
  els.tableListItems.innerHTML = "";

  const validEntries = tableItems.filter((entry) => byCode.has(entry.code));
  if (els.tableListEmpty) els.tableListEmpty.hidden = validEntries.length > 0;
  if (els.tableSummaryBox) els.tableSummaryBox.hidden = validEntries.length === 0;

  for (const entry of validEntries) {
    const dish = byCode.get(entry.code);
    const itemRow = document.createElement("div");
    itemRow.className = "night-list-item";
    const sauceText = entry.sauce ? ` · Molho: ${entry.sauce}` : "";
    itemRow.innerHTML = `
      <div>
        <strong>${dish.title}</strong>
        <span>${dish.categoryLabel}${sauceText} · ${formatCurrency(dish.price * entry.qty)}</span>
      </div>
      <div class="qty-controls">
        <button type="button" class="qty-btn" data-action="dec" aria-label="Diminuir quantidade de ${dish.title}">−</button>
        <span class="qty-value">${entry.qty}</span>
        <button type="button" class="qty-btn" data-action="inc" aria-label="Aumentar quantidade de ${dish.title}">+</button>
      </div>
    `;

    itemRow.querySelector('[data-action="dec"]')?.addEventListener("click", () => {
      if (entry.qty > 1) entry.qty -= 1;
      else tableItems = tableItems.filter((i) => i !== entry);
      saveTableItems();
      renderTableDialog();
      renderDishesList();
    });

    itemRow.querySelector('[data-action="inc"]')?.addEventListener("click", () => {
      entry.qty += 1;
      saveTableItems();
      renderTableDialog();
      renderDishesList();
    });

    els.tableListItems.appendChild(itemRow);
  }

  const includeService = Boolean(els.toggleServiceFee?.checked);
  const splitCount = Math.max(1, Number(els.splitPeople?.value) || 1);
  const totals = calculateTableTotal(catalog, validEntries, { includeService, splitCount });

  if (els.summarySubtotal) els.summarySubtotal.textContent = formatCurrency(totals.subtotal);
  if (els.summaryTotal) els.summaryTotal.textContent = formatCurrency(totals.total);
  if (els.summaryPerPerson) els.summaryPerPerson.textContent = `${formatCurrency(totals.perPerson)} (${splitCount}x)`;

  if (els.whatsappOrderLink) {
    const lines = validEntries.map((entry) => {
      const d = byCode.get(entry.code);
      const sauceInfo = entry.sauce ? ` [Molho: ${entry.sauce}]` : "";
      return `• ${entry.qty}x ${d.title}${sauceInfo} (${formatCurrency(d.price * entry.qty)})`;
    });
    const text = [
      "Olá! Gostaria de reservar uma mesa no Pastus Fogo & Parrilla.",
      "",
      "Seleção planejada no cardápio:",
      ...lines,
      `Total estimado: ${formatCurrency(totals.total)}`,
    ].join("\n");
    els.whatsappOrderLink.href = `https://wa.me/5531996280166?text=${encodeURIComponent(text)}`;
  }
}

function openTableDialog() {
  renderTableDialog();
  if (els.copyTableStatus) els.copyTableStatus.textContent = "";
  if (typeof els.tableDialog?.showModal === "function") {
    els.tableDialog.showModal();
  } else {
    els.tableDialog?.setAttribute("open", "");
  }
}

let selectedDiscoveryCats = new Set(["PARRILLA", "ENTRADAS"]);

function renderDiscoveryCategoryPicker() {
  if (!els.categoryOptions) return;
  els.categoryOptions.innerHTML = "";
  for (const [key, meta] of Object.entries(SECTION_META)) {
    const btn = document.createElement("button");
    btn.type = "button";
    const active = selectedDiscoveryCats.has(key);
    btn.className = `artist-option ${active ? "is-selected" : ""}`;
    btn.setAttribute("aria-pressed", String(active));
    btn.textContent = meta.title;
    btn.addEventListener("click", () => {
      if (selectedDiscoveryCats.has(key)) selectedDiscoveryCats.delete(key);
      else selectedDiscoveryCats.add(key);
      renderDiscoveryCategoryPicker();
    });
    els.categoryOptions.appendChild(btn);
  }
  if (els.categorySelectionCount) {
    els.categorySelectionCount.textContent = `${selectedDiscoveryCats.size} seções selecionadas`;
  }
}

function startDiscoverySession(categoriesList) {
  const queueDishes = buildDiscoveryQueue(catalog, categoriesList);
  discoveryState = {
    version: 1,
    categories: categoriesList,
    queue: queueDishes.map((d) => d.code),
    index: 0,
    seen: [],
    passed: [],
    list: tableItems.map((i) => i.code),
    history: [],
  };
  if (els.categoryPicker) els.categoryPicker.hidden = true;
  if (els.discoveryCards) els.discoveryCards.hidden = false;
  renderCurrentDiscoveryCard();
}

function renderCurrentDiscoveryCard() {
  if (!els.discoveryCard) return;
  const total = discoveryState.queue.length;
  const idx = discoveryState.index;
  if (els.undoDiscovery) els.undoDiscovery.disabled = discoveryState.history.length === 0;

  if (idx >= total) {
    els.discoveryCard.innerHTML = `
      <p class="eyebrow">Fim das sugestões</p>
      <h4>Sua mesa está pronta para saborear!</h4>
      <p>Você explorou todas as sugestões desta rodada. Abra “Minha Mesa” para revisar seu pedido ou simular a conta.</p>
    `;
    if (els.cardPosition) els.cardPosition.textContent = `${total} de ${total}`;
    if (els.restartPassed) els.restartPassed.hidden = discoveryState.passed.length === 0;
    return;
  }

  const code = discoveryState.queue[idx];
  const dish = catalog.find((d) => d.code === code);
  if (!dish) return;
  if (els.cardPosition) els.cardPosition.textContent = `Sugestão ${idx + 1} de ${total}`;
  if (els.restartPassed) els.restartPassed.hidden = true;

  els.discoveryCard.innerHTML = `
    <span class="discovery-source">${dish.featured ? "Assinatura do Chef" : dish.categoryLabel}</span>
    <h4 class="discovery-song-title">${dish.title}</h4>
    <p class="discovery-song-artist">${dish.categoryLabel} · ${dish.portion} · <strong>${dish.priceFormatted}</strong></p>
    <p class="discovery-song-lyric">${dish.description}</p>
  `;
}

function handleDiscoveryDecision(action) {
  const idx = discoveryState.index;
  if (idx >= discoveryState.queue.length) return;
  const code = discoveryState.queue[idx];
  discoveryState.history = [{ action, code, index: idx }];
  if (action === "choose") {
    addDishToTable(code);
  } else {
    discoveryState.passed.push(code);
  }
  discoveryState.index += 1;
  renderCurrentDiscoveryCard();
}

function attachSwipeGestures() {
  const card = els.discoveryCard;
  if (!card) return;
  let start = null;
  let axis = null;

  card.addEventListener("pointerdown", (e) => {
    if (isInteractiveSwipeTarget(e.target)) return;
    start = { x: e.clientX, y: e.clientY, t: performance.now() };
    axis = null;
    card.setPointerCapture?.(e.pointerId);
  });

  card.addEventListener("pointermove", (e) => {
    if (!start) return;
    const { dx, dy } = swipeDelta(start, e.clientX, e.clientY);
    if (!axis) axis = resolveSwipeAxis(dx, dy);
    if (axis !== "horizontal") return;
    const strength = swipeStrength(dx);
    card.style.transform = `translateX(${dx * 0.65}px) rotate(${dx * 0.03}deg)`;
    card.dataset.swipeDir = dx > 0 ? "choose" : "pass";
    card.style.setProperty("--swipe-alpha", String(strength));
  });

  const finishSwipe = (e) => {
    if (!start) return;
    const { dx } = swipeDelta(start, e.clientX, e.clientY);
    const elapsedMs = performance.now() - start.t;
    const width = card.offsetWidth || 280;
    card.style.transform = "";
    delete card.dataset.swipeDir;
    start = null;
    if (axis === "horizontal" && shouldCommitSwipe({ dx, elapsedMs, cardWidth: width })) {
      handleDiscoveryDecision(swipeActionFromDx(dx));
    }
    axis = null;
  };

  card.addEventListener("pointerup", finishSwipe);
  card.addEventListener("pointercancel", finishSwipe);
}

async function init() {
  initializeTheme();
  applyResultsViewMode(resultsViewMode);

  try {
    const res = await fetch(`${BASE}data/menu.json`);
    catalog = await res.json();
  } catch {
    catalog = [];
  }

  populateSectionSelect();
  renderBrowseCategories();
  renderSearchSuggestions();
  syncFilterControls();
  runFilter();
  attachSwipeGestures();

  els.searchInput?.addEventListener("input", () => runFilter());
  els.clearButton?.addEventListener("click", () => {
    if (els.searchInput) els.searchInput.value = "";
    runFilter();
    els.searchInput?.focus();
  });

  els.toggleFilters?.addEventListener("click", () => {
    const hidden = els.catalogFilters?.hidden;
    if (els.catalogFilters) els.catalogFilters.hidden = !hidden;
    els.toggleFilters?.setAttribute("aria-expanded", String(Boolean(hidden)));
  });

  els.filterSection?.addEventListener("change", () => {
    selectedSection = els.filterSection.value;
    if (activeCategory?.type === "section") activeCategory = null;
    syncFilterControls();
    runFilter();
  });

  els.filterTag?.addEventListener("change", () => {
    selectedTag = els.filterTag.value;
    syncFilterControls();
    runFilter();
  });

  els.filterFavorites?.addEventListener("change", () => {
    favoritesOnly = els.filterFavorites.checked;
    syncFilterControls();
    runFilter();
  });

  els.clearFilters?.addEventListener("click", () => {
    selectedSection = "";
    selectedTag = "";
    favoritesOnly = false;
    activeCategory = null;
    if (els.searchInput) els.searchInput.value = "";
    syncFilterControls();
    runFilter();
  });

  els.favoritesButton?.addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;
    syncFilterControls();
    runFilter();
  });

  els.backToBrowse?.addEventListener("click", () => {
    selectedSection = "";
    selectedTag = "";
    favoritesOnly = false;
    activeCategory = null;
    if (els.searchInput) els.searchInput.value = "";
    syncFilterControls();
    runFilter();
  });

  els.viewListButton?.addEventListener("click", () => applyResultsViewMode("list"));
  els.viewGridButton?.addEventListener("click", () => applyResultsViewMode("grid"));

  els.loadMore?.addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    renderDishesList();
  });

  els.openDiscoveryButton?.addEventListener("click", () => {
    if (els.browseView) els.browseView.hidden = true;
    if (els.resultsView) els.resultsView.hidden = false;
    if (els.discoveryView) els.discoveryView.hidden = false;
    if (els.categoryPicker) els.categoryPicker.hidden = false;
    if (els.discoveryCards) els.discoveryCards.hidden = true;
    renderDiscoveryCategoryPicker();
  });

  els.startDiscovery?.addEventListener("click", () => {
    const chosen = [...selectedDiscoveryCats];
    startDiscoverySession(chosen.length ? chosen : ["PARRILLA", "ENTRADAS"]);
  });

  els.skipCategoryPicker?.addEventListener("click", () => {
    startDiscoverySession([]);
  });

  els.passDish?.addEventListener("click", () => handleDiscoveryDecision("pass"));
  els.chooseDish?.addEventListener("click", () => handleDiscoveryDecision("choose"));
  els.changeCategories?.addEventListener("click", () => {
    if (els.categoryPicker) els.categoryPicker.hidden = false;
    if (els.discoveryCards) els.discoveryCards.hidden = true;
    renderDiscoveryCategoryPicker();
  });
  els.restartPassed?.addEventListener("click", () => {
    discoveryState.queue = [...discoveryState.passed];
    discoveryState.passed = [];
    discoveryState.index = 0;
    renderCurrentDiscoveryCard();
  });
  els.undoDiscovery?.addEventListener("click", () => {
    const last = discoveryState.history.pop();
    if (!last) return;
    discoveryState.index = last.index;
    renderCurrentDiscoveryCard();
  });

  els.addToTableBtn?.addEventListener("click", () => {
    if (!activeModalDish) return;
    const sauce = !els.dialogSauceWrap?.hidden ? els.dialogSauce?.value || "" : "";
    addDishToTable(activeModalDish.code, sauce);
    if (els.addTableStatus) {
      els.addTableStatus.textContent = `${activeModalDish.title} adicionado à Minha Mesa!`;
    }
    renderDishesList();
  });

  els.openTableButton?.addEventListener("click", openTableDialog);
  els.mobileTableButton?.addEventListener("click", openTableDialog);
  els.closeTableList?.addEventListener("click", () => els.tableDialog?.close());
  els.toggleServiceFee?.addEventListener("change", renderTableDialog);
  els.splitPeople?.addEventListener("input", renderTableDialog);

  els.copyTableSummary?.addEventListener("click", async () => {
    const byCode = new Map(catalog.map((d) => [d.code, d]));
    const lines = tableItems
      .filter((i) => byCode.has(i.code))
      .map((i) => {
        const d = byCode.get(i.code);
        const s = i.sauce ? ` (${i.sauce})` : "";
        return `${i.qty}x ${d.title}${s} — ${formatCurrency(d.price * i.qty)}`;
      });
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      if (els.copyTableStatus) els.copyTableStatus.textContent = "Resumo copiado para a área de transferência!";
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        if (els.copyTableStatus) els.copyTableStatus.textContent = "Resumo copiado!";
      } catch {
        if (els.copyTableStatus) els.copyTableStatus.textContent = "Pronto para mostrar ao garçom.";
      }
    }
  });

  els.resetTable?.addEventListener("click", () => {
    tableItems = [];
    saveTableItems();
    renderTableDialog();
    renderDishesList();
  });
}

init();
