# Shajghor Handover

## Current state
- Phase 9B chatbot + floating support is present.
- Phase 10A-2 reviews are implemented.
- Phase 10A-3 coupon administration is implemented in this working copy.
- Phase 10B-1 newsletter/subscribers foundation is implemented.
- Phase 10B-2 marketing campaign/audience foundation is implemented.
- Phase 10B-3 Gmail SMTP campaign sending is implemented; credentials are environment-only and real delivery remains unverified until a Gmail App Password is configured.
- Runtime/MongoDB/browser verification is still pending because dependencies were not available in the ZIP.

## Reviews implemented
- `server/src/models/Review.js`
- Verified-purchase submission requires delivered order + matching phone + ordered product.
- Public approved review listing: `GET /api/reviews/product/:productId`.
- Public submission: `POST /api/reviews`, rate limited.
- Admin moderation: list/update/delete/recalculate under `reviews:moderate`.
- Product `ratingAvg` and `ratingCount` are recalculated from approved reviews.
- Admin UI: `/admin/reviews`.
- Product UI: approved reviews + guest review submission form.

## Gmail SMTP campaign sending
- `server/src/services/email.service.js` now uses Nodemailer with Gmail SMTP when `EMAIL_PROVIDER=gmail`.
- Required server env: `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM`; optional `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_CAMPAIGN_MAX_RECIPIENTS`.
- Campaign send requires explicit `{ confirm: true }`, verifies SMTP first, deduplicates recipients, enforces a recipient safety cap, tracks sent/failed counts and campaign status, and writes an audit log.
- No Gmail password/App Password is stored in source code.

## Verification
- All server `.js` files pass `node --check`.
- i18n JSON files parse successfully.
- Full `npm install` timed out in the authoring environment, so Nodemailer runtime delivery could not be verified here.
- Vite build, MongoDB runtime, Gmail SMTP verification, and browser smoke tests have NOT been completed.

## Important
- Do not claim runtime verification without running it.
- Reuse existing architecture; do not create duplicate/V2 files.
- `reviews:moderate` permission already existed and was reused.


## Coupon administration implemented
- Existing `Coupon` model and storefront `pricing.service.js` / `pricingMath.js` were reused.
- Added `server/src/validators/coupon.validators.js` and `server/src/controllers/coupons.controller.js`.
- Added protected admin endpoints: `GET/POST/PATCH/DELETE /api/admin/coupons`.
- Uses existing `marketing:manage` RBAC and audit logging.
- Admin UI: `/admin/marketing` with bilingual coupon CRUD, activation, usage/date controls and product/category targeting.
- Used coupons cannot be deleted; they can be deactivated.

## Newsletter/subscribers implemented
- `server/src/models/Subscriber.js` stores email, subscribed/unsubscribed state, source and campaign timestamp metadata.
- Public `POST /api/newsletter/subscribe` is rate limited, validates email, supports resubscribe, and never stores payment credentials or other sensitive data.
- Admin `GET/PATCH/DELETE /api/admin/subscribers` uses `marketing:manage`.
- New subscriber notification reuses the existing notification system.
- Public footer contains a bilingual newsletter signup form.
- Admin UI: `/admin/subscribers`.

## Phase 10B-2 marketing campaigns
- `Campaign` model stores draft/scheduled/cancelled campaign metadata, bilingual content, audience and recipient preview count.
- Admin endpoints under `/api/admin/campaigns` support list/create/update, audience preview and cancellation with `marketing:manage`.
- Audiences: subscribed newsletter contacts, customers with `marketingConsent.email=true`, or their deduplicated union.
- `/admin/campaigns` provides bilingual draft creation, audience selection, preview and cancellation.
- Real campaign sending is intentionally disabled until a real email provider is configured and verified.

## Next task
- Phase 10B-4: campaign scheduling/automation and unsubscribe/consent lifecycle hardening, after Gmail SMTP credentials are configured and a controlled test email is verified.

## Phase 10B-4 — Scheduling + consent lifecycle
- Added `server/src/services/campaignScheduler.service.js`: checks due scheduled campaigns every 60 seconds and uses the existing Gmail SMTP campaign send path.
- Added `server/src/services/marketing.service.js`: creates/verifies HMAC-signed unsubscribe tokens using the server secret.
- Campaign emails now contain a signed unsubscribe link in both HTML and plain text.
- Added public `GET /api/newsletter/unsubscribe?token=...`; unsubscribe updates both `Subscriber.status` and matching `Customer.marketingConsent.email`.
- Added client `/unsubscribe` page for the email-link flow.
- Server `.js` syntax and i18n JSON checks pass. Runtime/MongoDB/Gmail delivery remain unverified in the authoring environment.

## Next task
- Phase 10C: marketing analytics/automation hardening or the next roadmap feature, after a controlled Gmail SMTP + scheduled-campaign test in the deployed environment.

## Current State — Phase 10C-1
Ads & Promotions foundation is implemented.
- Ad model/API/admin CRUD and `/admin/ads` page are present.
- Existing `ads:manage` permission is reused.
- Public active ads endpoint supports placement filtering and click/impression counters.
- No external ad network is integrated; these are first-party site promotions.
- Next logical task: integrate public ad placements into the customer-facing Home/Shop/Product layouts and verify click/impression behavior.


## Current state — Phase 10C-2
- Public ads are integrated on Home (`home_banner`), Shop (`shop_banner`), and Product (`product_banner`).
- `AdSlot.jsx` fetches scheduled active ads, renders responsive images, and tracks impressions/clicks through existing public endpoints.
- Internal and external ad links are supported.
- Next task: remaining Phase 10C work (popup/home hero behavior or analytics hardening) before moving to the next phase.

## Phase 10C-3 — Popup + Home Hero Ads
- Added public `home_hero` rendering on the Home page using the existing `AdSlot`.
- Added `AdPopup` for scheduled `popup` ads with session-level dismissal, impression/click tracking, responsive images, safe links, and accessible close behavior.
- No new backend API or duplicate ad model was introduced.
- Full Vite build was attempted after dependency installation, but the client dependency install exceeded the execution timeout; runtime/browser verification remains pending.


## Phase 10C-4 — Ads Analytics
- Added timestamped `AdMetricEvent` records for future impression/click history.
- Added admin analytics endpoint with date range + placement filter and CTR calculation.
- `/admin/ads` now shows 7/30/90-day impressions, clicks, CTR and per-ad breakdown.
- Fixed Ads page API import to use `client/src/api/client.js`.
- Historical date-range reports do not reconstruct pre-10C-4 events; cumulative Ad counters remain available.
- Next task: continue the Phase 10 roadmap after controlled verification of the ads analytics flow.
