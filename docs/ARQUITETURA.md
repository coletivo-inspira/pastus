# Arquitetura e Manutenção do Cardápio

O projeto segue a mesma arquitetura enxuta, modular e sem dependências pesadas de runtime adotada em `coletivo-inspira/bardacassia`:

- **Build Tool:** Vite com múltiplas entradas HTML (`index.html`, `o-restaurante.html`, `eventos.html`) e `base: "./"` para compatibilidade imediata com GitHub Pages (`/pastus/`) ou domínio próprio.
- **Fonte de verdade do cardápio:** `data/cardapio.csv` → processado por `scripts/import-menu.js` → gera `public/data/menu.json`.
- **Módulos puros testados (`src/lib/`):**
  - `src/lib/catalog.js`: normalização textual, score de relevância, filtros combinados, sugestões de harmonização e cálculo financeiro da mesa.
  - `src/lib/discovery.js`: fila de cartões intercalando seções escolhidas pelo cliente e pratos assinatura do chef Cristóvão Laruça.
  - `src/lib/discovery-swipe.js`: física de arraste horizontal/vertical para cartões no mobile e desktop.
