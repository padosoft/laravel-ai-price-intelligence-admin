# Admin / operator guide

A screen-by-screen walkthrough of the panel. Every action below hits a real core endpoint — there
are no placeholder buttons. AI-generated values carry an **AI** badge.

## Operate

- **Dashboard** — KPIs (active targets, competitor listings, pending matches, alerts/anomalies),
  multi-host price chart and a price-position breakdown. *Refresh* re-fetches the live metrics;
  *Export digest* opens a print-to-PDF of the page.
- **Catalog** — your SKUs (virtualized, infinite-scroll; brand chips with exact counts). *New SKU*
  adds a product; *Import CSV* bulk-uploads; *Export CSV* streams the full catalog. A row opens the
  Prices explorer for that product.
- **Targets** — what you monitor, per market. *New target* (product + ISO-2 country + frequency);
  per-row *Scrape now* and *Pause/Resume*.
- **Matches** — the human-review queue for borderline AI matches (60–85 confidence). Approve/reject
  with the full matcher evidence breakdown.
- **Competitors** — confirmed listings (virtualized, host-facet chips). *Add by URL* attaches a
  listing to a target; *Trigger discovery* queues a search for new competitor URLs. A row opens the
  competitor detail (price / stock / promo / audit tabs).
- **Prices** — multi-series price explorer per product, with competitor table and price-position
  chart. *Export CSV* streams the observation history.

## Intelligence

- **Anomalies** — statistical + LLM-judge outlier detections. *Acknowledge* a row, or *Bulk
  acknowledge* all unacknowledged in the current filter.
- **Forecasts**, **Narrative** (weekly LLM digest, *Export PDF*), **Assortment gaps** (treemap,
  *Export* to CSV), **Content gap**, **Reviews** (GDPR-safe aggregate sentiment) — feature-gated by
  the tenant's core flags.

## Pricing

- **Repricer** — advisory-only rules (never auto-applies prices; emits `repricing.suggested`).
  *New rule* (name + strategy + priority), *Simulate* a dry-run, pause/activate/delete.

## System

- **Alerts** — real-time inbox. The pill shows **Live** (SSE), **Polling** (SSE unavailable) or
  **Reconnecting**. Filter by severity / ack state; *Channels* jumps to notification settings.
- **Webhooks** — outbound subscriptions (HMAC-signed). *New subscription* (https URL + events),
  *Test*, delete.
- **API keys** — issue scoped keys (shown once), revoke. Requires the `apikeys:manage` ability.
- **Compliance** — EU AI Act posture: checks, PII/AI-Act bridge status, the **fetch audit log**, and
  the **AI decision log** (Art. 12 record-keeping; visible when the `ai_act` module is enabled).
  *Export attestation* prints the page.
- **Settings** — tenant identity (read-only) + editable preferences (alert email, table density) and
  notification-channel toggles, saved via `PATCH /tenants/me/settings` (optimistic, with rollback).

## Notes for large catalogs

Catalog and Competitors are virtualized and load more rows as you scroll; filters and chip counts are
computed server-side, so the panel stays responsive at 500k+ SKU. See
[the README "Built for scale" section](../README.md#built-for-scale-500k-sku).
