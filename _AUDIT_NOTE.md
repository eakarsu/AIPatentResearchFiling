# Audit Apply Note — AIPatentResearchFiling

Source: `_AUDIT/reports/batch_06.md` section 10.

## Original Recommendations
### Missing AI counterparts
- `/claim-broadness-score`
- `/market-threat-score`
- `/rejection-predict`
- `/competitor-innovation-track`
- `/infringement-risk-score`

### Missing non-AI
- USPTO integration (filing/status); foreign/PCT coordination; PubMed/arXiv integration; inventor mgmt; portfolio valuation/licensing market

### Custom suggestions
- Agentic patent prosecution; novelty scoring engine; competitor threat intelligence; international filing optimizer; claim infringement checker

## Implemented
Added three endpoints in `server/src/routes/ai.js`:
- `POST /api/ai/claim-broadness-score`
- `POST /api/ai/rejection-predict`
- `POST /api/ai/infringement-risk-score`

Reused `callOpenRouter`, `parseAIJson`, `persistAIAnalysis`, `authenticate`, `aiRateLimiter`, ESM style.

## Backlog
| Item | Tag |
|---|---|
| `/market-threat-score` | MECHANICAL |
| `/competitor-innovation-track` | MECHANICAL |
| USPTO PAIR/EFS integration | NEEDS-CREDS |
| PCT filing coordinator | NEEDS-PRODUCT-DECISION |
| PubMed/arXiv integration | NEEDS-CREDS |
| Inventor & assignment tracking | MECHANICAL but multi-file |
| Patent licensing marketplace | NEEDS-PRODUCT-DECISION |

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired.
- **Stack:** Express ESM backend (`server/src`) + Vite-React frontend (`client/src`).
- **Coverage:** `client/src/pages/AIPredictive.jsx` provides forms for the three predictive `/api/ai/*` endpoints (claim-broadness-score, rejection-predict, infringement-risk-score). `client/src/pages/AIHistory.jsx` reads `/api/ai/history`. `FeaturePage.jsx` invokes `${feature.apiPath}/ai-analyze` per resource (separate from the dedicated `/ai/prior-art-search` and `/ai/patent-search-analyze`, which functionally overlap). Backend `ai.js` is registered in `server/src/index.js`.
- **Files modified:** none.
- **Note:** Dedicated wiring for `/ai/prior-art-search` and `/ai/patent-search-analyze` not added — overlapping functionality is reachable via the per-feature `ai-analyze` flow already in place.

## Apply pass 4 (mechanical backlog)

- **Action:** IMPLEMENTED — 2 mechanical features (the two MECHANICAL items in the backlog table above).
- **Features added:**
  1. `POST /api/ai/market-threat-score` (`server/src/routes/ai.js`) — inputs `{ technology_domain?, market_segment?, our_position?, competitor_signals?, patent_id? }`; returns JSON with `market_threat_score_0_100`, `threat_tier`, drivers, vulnerabilities, recommended actions.
  2. `POST /api/ai/competitor-innovation-track` (`server/src/routes/ai.js`) — inputs `{ competitor_name, technology_focus?, time_window_months?, recent_filings?, recent_products?, patent_id? }`; returns JSON with innovation velocity, focus areas, filing trend, white-space opportunities, response actions.
- **FE wiring:** added two tabs (`market-threat`, `competitor-track`) to `client/src/pages/AIPredictive.jsx` with form fields that match the BE schema; multi-line text fields are split to arrays before posting; explicit 503 handling routes to a clear "AI service unavailable" message.
- **503 handling:** both endpoints check `OPENROUTER_API_KEY` (and reject `your_openrouter_key_here`) before calling the LLM, returning HTTP 503 with `{ error: ... }`. They also translate the upstream `success: false` shape returned by `callOpenRouter` into 503.
- **Files modified:** `server/src/routes/ai.js`, `client/src/pages/AIPredictive.jsx`.
- **Smoke test:** PASS — backend started on :3001, login as `admin@patentai.com` succeeded, `POST /api/ai/market-threat-score` returned a populated `analysis` JSON. Backend cleaned up.
- **Backlog still deferred:** USPTO PAIR/EFS integration (NEEDS-CREDS), PCT filing coordinator (NEEDS-PRODUCT-DECISION), PubMed/arXiv integration (NEEDS-CREDS), inventor/assignment tracking (multi-file), patent licensing marketplace (NEEDS-PRODUCT-DECISION).
