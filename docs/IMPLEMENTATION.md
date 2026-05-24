# laravel-ai-price-intelligence-admin — Implementation Specification (IMPLEMENTATION.md)

> **Implementazione runtime** del web admin panel: package PHP wrapper, auth Sanctum, client API
> typed (OpenAPI), data fetching con TanStack Query, real-time alerts (SSE), state, deployment, CI,
> testing. Il **design/UX** è in **TEMPLATE.md** (leggi quello prima per il contesto UI).

- **Package**: `padosoft/laravel-ai-price-intelligence-admin`
- **Core consumato**: `padosoft/laravel-ai-price-intelligence` (API `/api/v1`, vedi PROJECT.md §7)

---

## 1. Anatomia del package (dual: PHP + frontend)

Come `laravel-pii-redactor-admin`, è **un solo package** che contiene sia il lato PHP (monta route,
serve l'app, opzionale proxy/auth) sia il frontend React (build Vite servito).

```
laravel-ai-price-intelligence-admin/
├─ composer.json            require: php^8.3, illuminate/support, laravel/sanctum,
│                                   padosoft/laravel-ai-price-intelligence
├─ package.json             (stack TEMPLATE.md §0)
├─ vite.config.ts · tsconfig.json · vitest.config.ts · playwright.config.ts
├─ index.html
├─ src/                     PHP side
│  ├─ PriceIntelligenceAdminServiceProvider.php
│  ├─ Http/Controllers/{PanelController,AssetsController}.php
│  ├─ Http/Middleware/EnsureAdmin.php
│  └─ Config/price-intelligence-admin.php
├─ resources/
│  ├─ views/app.blade.php   wrapper che monta l'SPA + inietta config runtime
│  └─ dist/                 output `vite build` (asset hashed)
├─ src-ui/  (oppure src/ frontend — vedi nota)   React app (TEMPLATE.md §9)
├─ tests/   Feature(PHPUnit) · unit(Vitest) · e2e(Playwright)
├─ screens/
└─ docs/    TEMPLATE.md · IMPLEMENTATION.md
```

> **Nota cartelle**: per evitare collisione tra `src/` PHP (PSR-4) e `src/` React, il frontend
> vive in `resources/js/` **oppure** in `src-ui/`. Scegliere coerentemente con
> `laravel-pii-redactor-admin` durante lo scaffolding (Phase 0). In questo doc: `resources/js/`.

### 1.1 ServiceProvider (PHP)
- Registra route panel (`/admin/price-intelligence/{any?}` → `PanelController@index`).
- `EnsureAdmin` middleware (Sanctum + ability `admin`).
- Pubblica config + asset (`vendor:publish`).
- Inietta in Blade la **runtime config** (base API URL, feature flags letti da core
  `GET /tenants/me`, locale, csrf cookie name).

---

## 2. Autenticazione

**Sanctum SPA cookie** (stesso dominio/sottodominio dell'host Laravel che monta sia core sia admin):

1. `php artisan sanctum:install` lato host; `SANCTUM_STATEFUL_DOMAINS` + `SESSION_DOMAIN` configurati.
2. Flow login:
   - `GET /sanctum/csrf-cookie` → set XSRF-TOKEN (httpOnly session cookie).
   - `POST /login` (route host o package) con credenziali → sessione autenticata.
   - Tutte le chiamate `/api/v1` usano il cookie di sessione + header `X-XSRF-TOKEN`.
3. **Fallback headless**: per deployment cross-domain o uso senza cookie, supporto
   `Authorization: Bearer <token>` (token Sanctum personale). Selezione via runtime config
   `auth.mode = 'cookie' | 'bearer'`.
4. **Logout**: `POST /logout` invalida sessione; client pulisce cache TanStack Query.

RBAC: scopes/abilities Sanctum mappati alle sezioni (es. `repricer:write`, `apikeys:manage`).
La UI nasconde/disabilita azioni in base alle ability presenti nel token (`GET /tenants/me`).

---

## 3. Client API typed (OpenAPI-driven)

1. Il core espone `GET /api/v1/openapi.json` (OpenAPI 3.1).
2. Build step `npm run api:gen` → genera `src/lib/api/generated/` (types + client) via
   `openapi-typescript` + `openapi-fetch` (leggero, no runtime pesante).
3. Wrapper `src/lib/api/client.ts`:
```ts
import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";

export const api = createClient<paths>({
  baseUrl: window.__PI_ADMIN__.apiBaseUrl,      // iniettato da Blade
  credentials: "include",                        // cookie Sanctum
  headers: { Accept: "application/json" },
});
// interceptor: inietta X-XSRF-TOKEN, gestisce 401 → redirect login, 419 → refresh csrf
```
4. Errori: il core risponde `application/problem+json` (RFC-7807) → mapper a `ApiError` tipizzato,
   mostrato via Toast.

---

## 4. Data fetching & server state (TanStack Query)

Pattern: **TanStack Query è l'unico server-state store** (niente Redux). Context React solo per
auth/theme/i18n; Zustand solo per filtri di pagina pesanti.

```ts
// src/hooks/usePriceHistory.ts
export function usePriceHistory(targetId: string, range: Range) {
  return useQuery({
    queryKey: ["prices", targetId, range],
    queryFn: () => api.GET("/observations/prices", {
      params: { query: { target_id: targetId, from: range.from, to: range.to, aggregate: range.agg } },
    }).then(unwrap),
    staleTime: 60_000,
  });
}
```

Convenzioni:
- **Query keys** strutturate `[resource, ...params]` per invalidation mirata.
- **Mutations** con optimistic update dove sensato (es. match approve/reject, alert ack):
  ```ts
  const approve = useMutation({
    mutationFn: (id) => api.POST("/matches/{id}/approve", { params: { path: { id } } }),
    onMutate: async (id) => { /* optimistic remove dalla queue */ },
    onError: rollback, onSettled: () => qc.invalidateQueries({ queryKey: ["matches"] }),
  });
  ```
- **Pagination cursor**: `useInfiniteQuery` con `getNextPageParam` dal `meta.next_cursor`.
- **Polling leggero** (dashboard KPI) `refetchInterval` configurabile; alerts via SSE (no polling).
- **Prefetch** su hover delle righe tabella (competitor detail).

---

## 5. Real-time alerts (SSE)

Il core espone `GET /api/v1/alerts/stream` (Server-Sent Events, tenant-scoped).

```ts
// src/lib/realtime/alertsStream.ts
export function subscribeAlerts(onAlert: (a: Alert) => void) {
  const es = new EventSource(`${base}/api/v1/alerts/stream`, { withCredentials: true });
  es.addEventListener("alert", (e) => onAlert(JSON.parse(e.data)));
  es.addEventListener("heartbeat", () => {/* keep-alive */});
  return () => es.close();
}
```
- Hook `useAlertsStream()` monta la subscription a livello AppShell; nuovi alert →
  `queryClient.setQueryData(["alerts"], …)` (prepend) + toast + bump badge nel TopBar.
- **Fallback**: se SSE non disponibile (proxy/buffering), degrade a `useQuery` polling 30s.
- **Alternativa**: se l'host usa **Laravel Reverb / laravel-websockets**, supporto opzionale
  `laravel-echo` (config `realtime.driver = 'sse' | 'echo'`). Default SSE (zero infra extra).

---

## 6. State management

| Tipo di stato | Soluzione |
|---|---|
| Server data (catalog, prices, matches, ...) | **TanStack Query** |
| Auth (user, abilities, tenant) | React Context `AuthProvider` (idratato da `/tenants/me`) |
| Theme (dark/light) | Context + `localStorage` |
| i18n (locale) | i18next |
| Filtri pagina complessi (Prices explorer, Catalog) | **Zustand** store per-route (URL-synced) |
| URL state (tab attivo, range) | search params (`useSearchParams`) per deep-link |

Niente stato globale ridondante: la fonte di verità è il server (Query) o l'URL.

---

## 7. Feature flags & sezioni condizionali

`GET /tenants/me` ritorna `{ features: { review_insight, repricer, ai_act, ... }, abilities: [...] }`.
`AuthProvider` espone `useFeature('repricer')` e `useAbility('repricer:write')`. SideNav e route
guard nascondono Reviews/Repricer/Compliance se i flag del core sono off. **Single source of truth =
config del core** (mai duplicare la decisione lato UI).

---

## 8. Build & deploy

- `npm run dev` — Vite dev server (proxy `/api` → host Laravel locale).
- `npm run build` — output in `resources/dist/` con filename hashed.
- `npm run api:gen` — rigenera client da `openapi.json` (CI controlla che sia aggiornato).
- `PanelController@index` serve `resources/views/app.blade.php` con `@vite` o riferimento ai
  manifest di `dist/`. Versioning via hash → cache-busting automatico.
- Deploy: `composer require padosoft/laravel-ai-price-intelligence-admin` nell'host →
  `vendor:publish` asset → pannello su `/admin/price-intelligence`.

---

## 9. Testing

| Livello | Tool | Cosa |
|---|---|---|
| Unit/component | **Vitest** + Testing Library | primitives `ds/`, hooks, formatters, mappers API error |
| API mocking | **MSW** | tutte le route renderizzano con mock realistici (anche per dev senza core) |
| E2E | **Playwright** | flussi: login, crea target, **approva match**, price history, ack alert, rule simulate |
| a11y | `@axe-core/playwright` | scan su ogni route |
| PHP | **PHPUnit** | ServiceProvider, route panel, EnsureAdmin middleware, config injection |
| Contract | check `openapi.json` ↔ client generato aggiornato | CI fallisce se drift |

E2E gira contro una **Laravel di test** che monta core+admin con DB seedato (fixtures), oppure
contro MSW per i flussi puramente UI.

---

## 10. CI (GitHub Actions) + PR review loop

Replica del workflow di `laravel-pii-redactor-admin`. **Nessun task è completo finché non passano
tutti i gate**, locali e in Actions:

1. `composer validate`
2. PHPUnit
3. `tsc --noEmit` (typecheck)
4. Vitest
5. `vite build`
6. Playwright (+ axe)
7. `npm run api:gen --check` (client API allineato all'OpenAPI del core)

PR: usare la skill `copilot-pr-review-loop` (richiedere GitHub Copilot Code Review, attendere CI +
feedback, risolvere tutto prima del merge). PR piccoli e focalizzati dopo il bootstrap.

---

## 11. Sequenza implementativa (admin)

> Da eseguire dopo che il core espone almeno auth + `/tenants/me` + `openapi.json`.

1. **Scaffold** package (PHP provider + Vite app), CI, config injection Blade. Replica struttura
   `laravel-pii-redactor-admin`.
2. **Auth flow** Sanctum cookie + AuthProvider + route guard + login screen.
3. **API client** OpenAPI gen + wrapper + error mapper + TanStack Query provider.
4. **Design system** `ds/` primitives + demo page + Vitest (vedi TEMPLATE.md §3).
5. **AppShell** SideNav/TopBar/CommandPalette/TenantSwitcher + theming + i18n IT/EN.
6. **Schermate** (TEMPLATE.md §5) con MSW mock, una PR per gruppo:
   a. Dashboard + Catalog + Targets
   b. Matches review + Competitor detail (price chart)
   c. Prices explorer + Anomalies + Forecasts
   d. Narrative + Assortment + Content gap
   e. Alerts + Webhooks + API keys + Compliance + Settings
   f. Reviews + Repricer (condizionali)
7. **Real-time alerts** SSE + fallback.
8. **a11y pass** + responsive + dark/light QA su tutte le route.
9. **E2E Playwright** dei flussi chiave + axe.
10. **README** con screenshot + link COMPETITIVE-MATRIX (il pannello che i competitor non danno
    self-hosted).

---

## 12. Runtime config iniettata (Blade → window)

```blade
{{-- resources/views/app.blade.php --}}
<script>
  window.__PI_ADMIN__ = {
    apiBaseUrl: @json(config('price-intelligence-admin.api_base_url', '/api/v1')),
    auth: { mode: @json(config('price-intelligence-admin.auth_mode', 'cookie')) },
    locale: @json(app()->getLocale()),
    csrfCookie: 'XSRF-TOKEN',
    realtime: { driver: @json(config('price-intelligence-admin.realtime', 'sse')) },
  };
</script>
@vite(['resources/js/main.tsx'])
```

I **feature flags** non vanno iniettati qui (cambiano per tenant): si leggono a runtime da
`GET /tenants/me` dopo il login.

---

## 13. Definition of Done (implementation-side)

- [ ] Login Sanctum funzionante (cookie + fallback bearer).
- [ ] Client API generato da `openapi.json`, CI verifica drift.
- [ ] TanStack Query su tutte le route, optimistic update su match/alert.
- [ ] SSE alerts live + fallback polling.
- [ ] Feature flags da `/tenants/me` governano sezioni condizionali.
- [ ] Tutti i gate CI verdi (composer, phpunit, tsc, vitest, build, playwright, api:gen check).
- [ ] E2E dei 5 flussi chiave + axe pass.
- [ ] README + screenshot + deploy guide (`composer require` → `vendor:publish` → `/admin`).

---

*Design/UX di riferimento: TEMPLATE.md. Contratto API: `laravel-ai-price-intelligence/docs/PROJECT.md` §7 + `/api/v1/openapi.json`.*
