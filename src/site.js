const THEME_KEY = "pastus-theme-v1";

export function applyTheme(theme, save = false) {
  const toggle = document.querySelector("#theme-toggle");
  document.documentElement.dataset.theme = theme;
  if (toggle) {
    const nextLabel = theme === "dark" ? "Modo claro" : "Modo noturno";
    const nextAction = theme === "dark" ? "Ativar tema claro" : "Ativar modo noturno";
    const label = toggle.querySelector(".theme-toggle-label");
    if (label) label.textContent = nextLabel;
    toggle.setAttribute("aria-label", nextAction);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "dark" ? "#141210" : "#faf6ee";
  if (save) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* funciona enquanto a página estiver aberta */
    }
  }
}

export function initializeTheme() {
  const toggle = document.querySelector("#theme-toggle");
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* usa a preferência do aparelho */
  }
  let manualThemeChoice = saved === "light" || saved === "dark";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const systemTheme = media.matches ? "dark" : "light";
  applyTheme(manualThemeChoice ? saved : document.documentElement.dataset.theme || systemTheme);

  const followSystem = (event) => {
    if (!manualThemeChoice) applyTheme(event.matches ? "dark" : "light");
  };
  if (media.addEventListener) media.addEventListener("change", followSystem);
  else media.addListener(followSystem);

  toggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    manualThemeChoice = true;
    applyTheme(next, true);
  });
}
