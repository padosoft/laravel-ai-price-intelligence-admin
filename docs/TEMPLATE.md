# laravel-ai-price-intelligence-admin — Template Specification (TEMPLATE.md)

> **Web admin panel** per `laravel-ai-price-intelligence`. Questo documento copre il **template**:
> design system, tokens, componenti, schermate (wireframe), navigazione, theming, i18n,
> accessibilità. L'integrazione runtime (API, auth, state, real-time) è in **IMPLEMENTATION.md**.

- **Package**: `padosoft/laravel-ai-price-intelligence-admin`
- **Repo**: https://github.com/padosoft/laravel-ai-price-intelligence-admin
- **Consuma**: API `/api/v1` del core (vedi `laravel-ai-price-intelligence/docs/PROJECT.md` §7)

> **Nota di allineamento allo scaffold realizzato (A0).** Questo documento è la spec di design
> originale. Nel codice realizzato:
> - Il frontend vive in **`resources/js/`** (non `src/`, riservato al PHP PSR-4). Quindi
>   `src/components/ds/` → `resources/js/components/ds/`, `src/styles/globals.css` →
>   `resources/js/styles/globals.css`, ecc.
> - Le versioni nella colonna "Min" qui sotto sono **floor aspirazionali**; le versioni
>   effettivamente installate (latest stable al momento di `npm install`) sono pinnate in
>   `package.json`: React 19, Vite 6, TS 5.7, Tailwind 4, Vitest 2, Playwright 1.49, Recharts 3.

---

## 0. Stack & versioni

> **Sempre ultima stable al momento di `npm install`.** Versioni minime (coerenti con
> `laravel-pii-redactor-admin`):

| Tool | Min | Note |
|---|---|---|
| React | ≥ 19 | con React Compiler abilitato se stabile |
| Vite | ≥ 8 | dev server + build |
| TypeScript | ≥ 6 | strict mode |
| TailwindCSS | ≥ 4 | `@theme inline`, CSS-first config |
| Vitest | ≥ 4 | unit/component |
| Playwright | ≥ 1.59 | e2e |
| Lucide-react | latest | icone |
| @tanstack/react-query | latest | server state (vedi IMPLEMENTATION.md) |
| i18next + react-i18next | latest | IT/EN |
| Recharts | latest | charts (ECharts opt-in per dashboard heavy) |

UI **custom** (design system in-house in `src/components/ds/`), **no shadcn/no Mantine** — coerenza
con gli altri admin Padosoft. Node ≥ 24.

---

## 1. Design principles

1. **Data-dense ma respirabile** — è un tool da category manager/pricing analyst: tabelle grandi,
   ma con gerarchia visiva chiara (numeri tabulari, allineamento, micro-spacing).
2. **Price-first** — i numeri di prezzo sono protagonisti: font mono tabulare, delta colorati
   (verde scende / rosso sale, dal punto di vista "competitor più economico = minaccia").
3. **AI-transparent** — ogni contenuto AI ha un badge "AI" (requisito EU AI Act Art. 50).
4. **Trust & audit** — stato match, confidence, fonti, timestamp sempre visibili.
5. **Keyboard-first & accessibile** — WCAG 2.1 AA, focus visibile, nav da tastiera.
6. **Dark/light** — entrambe first-class via `data-theme`.

---

## 2. Design tokens (Tailwind 4 `@theme`)

`src/styles/globals.css`:
```css
@import "tailwindcss";

@theme inline {
  /* Neutrals (slate) */
  --color-bg:        light-dark(#ffffff, #0b0f17);
  --color-surface:   light-dark(#f8fafc, #111827);
  --color-surface-2: light-dark(#f1f5f9, #1a2332);
  --color-border:    light-dark(#e2e8f0, #243044);
  --color-text:      light-dark(#0f172a, #e5e9f0);
  --color-text-mut:  light-dark(#64748b, #94a3b8);

  /* Accents semantici */
  --color-primary:   #4f46e5;   /* indigo - azioni primarie, info */
  --color-success:   #16a34a;   /* prezzo competitor sceso (per noi: meno minaccia se siamo sotto) */
  --color-warning:   #d97706;
  --color-danger:    #dc2626;   /* undercut / minaccia / MAP violation */
  --color-ai:        #7c3aed;   /* badge AI-generated */

  /* Pricing semantics */
  --color-cheaper:   #dc2626;   /* competitor più economico di noi = rosso (attenzione) */
  --color-pricier:   #16a34a;   /* competitor più caro = verde (siamo competitivi) */

  /* Radii */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-2xl: 20px;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Elevation */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / .06);
  --shadow-md: 0 4px 12px rgb(0 0 0 / .10);
  --shadow-lg: 0 12px 32px rgb(0 0 0 / .16);
}

html[data-theme="dark"] { color-scheme: dark; }
html[data-theme="light"] { color-scheme: light; }

/* Numeri prezzo: tabular per allineamento perfetto in tabella */
.tabular { font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
```

Spacing scale: usare la default Tailwind (4/8/12/16/24/32/48). Breakpoints standard
(`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`). Layout admin ottimizzato per ≥1280.

---

## 3. Component library (`src/components/ds/`)

Tutti i primitives sono custom, headless-friendly, accessibili (ARIA), keyboard-nav, theme-aware.

| Componente | Note chiave |
|---|---|
| `Button` / `IconButton` | varianti: primary, secondary, ghost, danger, ai. size sm/md/lg. loading state |
| `Input` / `Textarea` | label, hint, error, prefix/suffix |
| `Select` / `Combobox` | con search, async options (per brand/category) |
| `MultiSelect` | tag chips (per paesi, domini) |
| `DateRangePicker` | preset (7d/30d/90d/custom) per price history |
| `Tag` / `Badge` | semantic colors; `<AiBadge/>` dedicato viola |
| `ConfidenceBadge` | 0–100 con scala colore (rosso<60, ambra 60–85, verde≥85) |
| `Tabs` | underline style, keyboard arrows |
| `Tooltip` / `Popover` | Radix-like behavior fatto in-house o `@radix-ui/react-*` se ammesso |
| `Dialog` / `Drawer` | focus-trap, ESC, overlay |
| `Toast` | queue, auto-dismiss, action |
| `Spinner` / `Skeleton` | loading states |
| `EmptyState` | icona + titolo + CTA |
| `Card` / `Stat` | KPI cards dashboard |
| `Table` | sortable, sticky header, **virtual scroll** (`@tanstack/react-virtual`), row selection, density toggle |
| `Pagination` | cursor-based (match API) |
| `Tree` | per categorie assortment |
| `Stepper` | wizard creazione target / rule builder |
| `Switch` / `Checkbox` / `RadioGroup` | form controls |
| `PriceDelta` | mostra Δ% con freccia e colore pricing-semantic |
| `ThemeToggle` / `LangSwitch` | dark/light, IT/EN |

### Chart kit (`src/components/charts/`)
- `PriceLineChart` — storico prezzo multi-competitor + nostra linea + banda promo.
- `ForecastChart` — linea storica + forecast tratteggiato + confidence interval shaded + badge AI.
- `AnomalyScatter` — dot plot con outlier evidenziati.
- `SentimentGauge` / `ThemeBars` — review insight aggregati.
- `AssortmentTreemap` — gap per categoria.

Default **Recharts**. Per dashboard con >10k punti, lazy-load `echarts-for-react` (opt-in).

---

## 4. App shell & navigazione

```
┌───────────────────────────────────────────────────────────────────────┐
│ TopBar:  [≡] Logo   [TenantSwitcher ▾]        [🔍 global search]  ⌘K    │
│                                          [🌙/☀]  [IT/EN]  [🔔3]  [user▾] │
├──────────────┬────────────────────────────────────────────────────────┤
│ SideNav      │  <Outlet/>  (route content)                             │
│              │                                                          │
│ ▸ Dashboard  │                                                          │
│ ▸ Catalog    │                                                          │
│ ▸ Targets    │                                                          │
│ ▸ Matches ⓷  │  (badge = review queue count)                           │
│ ▸ Competitors│                                                          │
│ ▸ Prices     │                                                          │
│ ── Intelligence ──                                                      │
│ ▸ Anomalies  │                                                          │
│ ▸ Forecasts  │                                                          │
│ ▸ Narrative  │                                                          │
│ ▸ Assortment │                                                          │
│ ▸ Content gap│                                                          │
│ ▸ Reviews    │  (visibile solo se modulo abilitato)                    │
│ ── Pricing ──                                                           │
│ ▸ Repricer   │  (visibile solo se repricer.enabled)                    │
│ ── System ── │                                                          │
│ ▸ Alerts     │                                                          │
│ ▸ Webhooks   │                                                          │
│ ▸ Compliance │  (EU AI Act / audit)                                    │
│ ▸ API keys   │                                                          │
│ ▸ Settings   │                                                          │
└──────────────┴────────────────────────────────────────────────────────┘
```

- **Command palette** (⌘K / Ctrl+K): jump a prodotto/target/route, azioni rapide.
- **TenantSwitcher**: visibile solo se utente ha più tenant (multi-tenant).
- **Sezioni condizionali**: Reviews/Repricer/Compliance appaiono in base ai flag del core
  (letti da `GET /tenants/me`).

---

## 5. Schermate (wireframe + UX)

> 15 route. Ogni wireframe è indicativo; rispettare tokens e primitives sopra.

### 5.1 Dashboard
```
┌ KPI row ───────────────────────────────────────────────────────────┐
│ [Targets attivi 4.812] [Competitor monitorati 38.104]               │
│ [Alert 24h 27] [% SKU in undercut 18%] [Top mover ▼ -12% Acme X1]   │
├ Charts ─────────────────────────────────────────────────────────────┤
│ [Trend prezzo medio mercato vs nostro]   [Distribuzione posizione   │
│  (line, 30d)                              prezzo: cheaper/at/pricier]│
├ Feed ───────────────────────────────────────────────────────────────┤
│ Latest alerts (live, SSE) · Latest anomalies · This week's narrative│
│                                                          [AI] preview │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Catalog
Tabella prodotti host: foto, name, brand, sku/gtin, categorie, our_price, # target, # competitor
matched, copertura paesi. Filtri: brand, category, country, `has_match`. Row → dettaglio prodotto.
Azioni bulk: crea target, import CSV/Excel (drawer upload con preview + mapping colonne).

### 5.3 Targets
Tabella MonitoringTarget: prodotto, paese (flag), frequency, status, last_check, next_check,
# competitor confirmed. Azioni: pausa/riprendi, "Discover now", "Scrape now", edit frequency.
Wizard creazione (Stepper): seleziona prodotto → paesi → frequency/cron → opzionale URL/domini
diretti → conferma.

### 5.4 Matches review  ⭐ (schermata critica)
Coda candidati 60–85% confidence. Layout **side-by-side**:
```
┌ Il TUO prodotto ──────────────┬ Candidato competitor ────────────────┐
│ [img]  Acme X1 64GB           │ [img]  Acme X1 64 GB Smartphone        │
│ GTIN 8001234567890            │ host: amazon.it  ASIN B0XYZ            │
│ Brand Acme · Model X1         │ Prezzo €189,00                         │
│ €199,00                       │ Match evidence:                        │
│                               │  • GTIN: ✗ non presente                │
│                               │  • Brand+Model: ✓                      │
│                               │  • Name sim: 0.82                      │
│                               │  • Visual: ✓ (AI) [AI]                 │
│                               │  Confidence: [78] ambra                │
├───────────────────────────────┴────────────────────────────────────────┤
│        [✗ Rigetta]   [✎ Modifica URL]   [✓ Conferma match]   (← → tasti) │
└──────────────────────────────────────────────────────────────────────────┘
```
Keyboard: `←/→` naviga, `A` approva, `R` rigetta. Contatore "12 di 47 rimanenti".

### 5.5 Competitors (lista) + Competitor Product detail
Detail con header (foto, title, host badge, stato match, confidence) e **Tabs**:
- **Prezzo**: `PriceLineChart` (storico + nostro + promo band) + tabella observations.
- **Contenuto**: snapshot timeline, diff title/desc, immagini, og/jsonld viewer.
- **Stock**: disponibilità + buy-box winner (Amazon) + seller.
- **Promo**: lista PromoObservation normalizzate.
- **Anomalie**: anomalie legate al prodotto.
- **Audit**: fetch_logs (status, latency, driver, robots).

### 5.6 Prices (analytics cross-target)
Esplorazione observations: filtri target/categoria/paese/range, aggregazione hourly/daily,
export CSV. `PriceLineChart` multi-serie. Tabella "biggest movers" ultime 24h/7d.

### 5.7 Anomalies
Feed filtrabile (tipo: price_error/batch_update/civetta/outlier, severità). `AnomalyScatter`.
Azione: acknowledge (mass-ack). Badge `[AI]` dove l'LLM judge è intervenuto.

### 5.8 Forecasts
Lista target con forecast 7/14/30gg. `ForecastChart` con confidence interval + badge `[AI]` +
disclaimer "previsione, non garanzia" (EU AI Act transparency).

### 5.9 Narrative (weekly digest)
Render markdown del digest LLM + highlights cards (top movers, nuove promo, anomalie). Selettore
settimana ISO. Badge `[AI-generated]` prominente + nota disclosure Art. 50.

### 5.10 Assortment gaps
`Tree` categorie con conteggio gap + `AssortmentTreemap`. Drill-down → lista prodotti competitor
non nel tuo catalogo, con importance_score. Azione: "ignora" / "esporta".

### 5.11 Content gaps
Per prodotto: card suggerimenti (`missing_attributes`, `title_recommendations`,
`description_recommendations`, `image_count_gap`) con seo_score_delta. Badge `[AI]`.

### 5.12 Reviews (condizionale, se modulo abilitato)
`SentimentGauge` + `ThemeBars` (pro/contro) aggregati anonimi. Banner GDPR: "Solo aggregati
anonimi, nessun dato personale memorizzato." Toggle attivazione per-domain con conferma esplicita.

### 5.13 Repricer (condizionale)
**No-code rule builder**: form visuale (filtro target → strategia → parametri con slider/input) +
preview `simulate` (tabella current → suggested price, margine risultante). Lista regole con
priorità drag-sort. Tab "Decisioni" (rule_decisions, applied vs suggested). Banner: "I prezzi non
vengono applicati automaticamente; vengono suggeriti via webhook."

### 5.14 Alerts inbox
Lista filtrabile (tipo, severità, ack). Mass-ack. Channel status badges (webhook/mail/slack
delivered?). Real-time append via SSE. Click → contesto (prodotto/competitor).

### 5.15 Webhooks / API keys / Compliance / Settings
- **Webhooks**: subscription manager (URL, eventi multiselect, secret), "Test", ultime 50 delivery.
- **API keys**: CRUD con scope picker, mostra key una volta sola.
- **Compliance**: vista EU AI Act (ai_decision_logs filtrable, disclosure status, human-review
  stats), audit fetch_logs, retention settings.
- **Settings**: currency base + FX provider, robots policy default, retention, notification
  channels per tipo alert, theme/lang default tenant.

---

## 6. Theming

- `data-theme` su `<html>`, toggle persistito in `localStorage` + rispetta `prefers-color-scheme`.
- Tutti i token via `light-dark()` — nessun colore hard-coded nei componenti.
- Charts: palette derivata dai token (no palette separata per dark).

---

## 7. Internationalization (i18n)

- `i18next` + `react-i18next` + `i18next-http-backend` (lazy load namespace).
- Default **IT**, fallback **EN**. File `src/lib/i18n/locales/{it,en}/{common,catalog,...}.json`.
- Numeri/valute/date via `Intl.NumberFormat`/`Intl.DateTimeFormat` con locale attivo.
- Estrazione chiavi via `i18next-parser` (script `i18n:extract`).
- Nessuna stringa hard-coded nei componenti: sempre `t('key')`.

---

## 8. Accessibilità (WCAG 2.1 AA)

- Contrasto ≥ 4.5:1 testo, ≥ 3:1 UI. Verificato in entrambi i temi.
- Focus visibile su tutti gli interattivi (`:focus-visible` ring token).
- Dialog/Drawer: focus-trap, `aria-modal`, ESC, return focus.
- Table: header scope, `aria-sort`, row selection annunciata.
- Icone decorative `aria-hidden`; icon-button con `aria-label`.
- Keyboard: tutta la nav + command palette + match review (←/→/A/R) senza mouse.
- Charts: alternativa tabellare accessibile (toggle "view as table").
- Test a11y automatici: `@axe-core/playwright` in e2e.

---

## 9. Struttura cartelle (frontend)

```
src/
├─ main.tsx · App.tsx
├─ routes/            (15 route components, vedi §5)
├─ components/
│  ├─ ds/             primitives (§3)
│  ├─ charts/         (§3 chart kit)
│  ├─ catalog/        ProductCard, CompetitorMatchCard, MatchReviewPanel
│  ├─ alerts/         AlertItem, AlertFeed (SSE)
│  └─ layout/         AppShell, SideNav, TopBar, TenantSwitcher, CommandPalette
├─ hooks/             (vedi IMPLEMENTATION.md)
├─ lib/               api/, auth/, i18n/, realtime/
├─ state/             context (auth/theme/i18n) + zustand (filtri pesanti)
├─ styles/globals.css
└─ types/             specchio DTO core (gen da openapi.json)
```

---

## 10. Definition of Done (template-side)

- [ ] Tutti i primitives `ds/` implementati + storybook-like demo page + Vitest snapshot.
- [ ] Tutte le 15 route renderizzano con dati mock (MSW) — vedi IMPLEMENTATION.md.
- [ ] Dark/light verificati su ogni schermata.
- [ ] i18n IT+EN completo, zero stringhe hard-coded.
- [ ] a11y: axe pass su tutte le route, nav da tastiera completa.
- [ ] Responsive ≥1280 ottimale, graceful ≥768.
- [ ] `tsc --noEmit` + Vitest + `vite build` verdi.

---

*Per auth, integrazione API, state server, real-time, deployment e CI → vedi IMPLEMENTATION.md.*
