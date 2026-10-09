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

### Phase 11-9 — Public CMS Routing & Experience Audit (2026-10-09)
- Found and fixed a public CMS routing bug: `CmsPage` relied on `useParams().slug`, while the routes used fixed paths without a `:slug` parameter.
- Public CMS routes now pass explicit slugs (`about`, `privacy`, `terms`, `returns`, `shipping`, `payment`) to the shared `CmsPage` component.
- `CmsPage` still supports a URL param fallback, preserving reuse without creating duplicate page components.
- Added the existing Payment policy page to the public footer alongside the other policy links.
- No new model/API/CMS system was introduced.
- Verification: route/component structure inspected, translation key checked, and documentation updated; full Vite/browser/MongoDB runtime remains unverified.

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

## Current State — Phase 11-1 complete
- Site Settings admin panel implemented using the existing `SiteSetting` singleton.
- Protected settings GET/PATCH APIs added with `settings:read` / `settings:write` RBAC and Zod validation.
- Admin UI is `/admin/settings`.
- Next: continue Phase 11 CMS/content controls; avoid duplicating existing settings, marketing, ads, FAQ or chatbot systems.
- Runtime/build verification remains pending because this project snapshot has no server/client lockfiles for `npm ci` and dependencies are not installed in this working environment.

## Phase 11-4 — SEO & Metadata CMS
- Admin `/admin/settings` now exposes the existing SiteSetting SEO fields: localized default title, description, keywords and OG image URL.
- Public Settings already exposes safe SEO values; no duplicate SEO model/API was added.
- `SettingsContext` applies global default SEO metadata and dynamic favicon.
- `useSeo` now restores previous global metadata after page-specific SEO unmounts, preventing metadata leakage between pages.
- Existing product/category/page SEO overrides remain intact.
- Verification: server syntax + i18n JSON pass; client dependency installation timed out, so Vite/browser/MongoDB runtime remains unverified.

## Next task
- Phase 11-5: verify CMS/SEO integration and then continue remaining Phase 11 content controls without creating duplicate CMS models.

## Phase 11-5 — Homepage Hero CMS Integration (2026-10-09)
- The existing HomepageSection system now controls the actual Hero content: localized title/badge/subtitle/body, CTA/link, desktop/mobile image, and video URL.
- `Home.jsx` reuses `HomepageProvider` instead of making a duplicate homepage API request.
- `Hero.jsx` renders CMS media/content with safe fallback copy.
- No duplicate hero/banner model was created.
- Static syntax/content inspection completed; browser/MongoDB/runtime verification is still pending.
- Next: continue auditing remaining CMS content controls (policies/about/rich text/public pages) before polish/testing.

## Phase 11-6 — Policy Pages CMS
- Added localized policy fields to the existing `SiteSetting` singleton: privacy, terms, returns/refunds, shipping/delivery and payment.
- Public Settings exposes these safe fields; admin Settings edits them with existing `settings:read` / `settings:write` controls and Zod validation.
- Added public routes `/privacy`, `/terms`, `/returns`, `/shipping`, and `/payment` using a shared `CmsPage.jsx` instead of duplicate page components.
- Footer links now point to the policy pages.
- Policy content is rendered as plain text paragraphs, not raw HTML, to avoid introducing an unsanitized rich-text HTML surface.
- Verification: server syntax and i18n JSON pass; browser/Vite/MongoDB runtime remains unverified.

## Next task
- Phase 11-7: finish remaining public CMS content controls (About/store story and any existing hardcoded public copy), then move to integration testing/polish without duplicating existing systems.

## Phase 11-7A — Public hardcoded-copy audit (2026-10-09)
- Audited customer-facing copy after About/Policy CMS work.
- `client/src/customer/pages/Unsubscribe.jsx` now uses localized keys for loading, success, error and return-home copy.
- Existing examples/placeholders and technical/honeypot labels were intentionally not moved into CMS.
- No duplicate CMS model/API introduced.
- i18n JSON validation passed with Python `json.tool`.
- JSX/runtime/browser build was not executed in this step.
- Next: finish Phase 11 content audit/integration review, then proceed to broader integration testing/polish.
### Phase 11-8 — CMS Integration Audit
- Audited SiteSetting/About/Policy/SEO/Homepage CMS integration for duplicate or mismatched flows.
- Aligned `SiteSetting.seo` schema with the bilingual SEO structure used by the admin validator/UI (`title`, `description`, `keywords` as localized objects).
- Extended `settings:apply` allowed keys so policies, SEO, logo, favicon and defaultTheme can be applied through the existing settings utility.
- Applied global CMS SEO metadata from `SettingsContext` (title, description, keywords, OG tags, Twitter card, favicon).
- Hardened `useSeo` so page-specific metadata temporarily overrides global metadata and restores it on unmount.
- No new settings model, duplicate CMS API, or duplicate public page system introduced.
- Static syntax/i18n validation passed; browser build, MongoDB persistence and deployed runtime remain unverified.


### Phase 11-10 — CMS Completeness Audit (2026-10-09)
- Final audit of the Phase 11 CMS surface completed.
- Existing SiteSetting remains the single source for About, policy pages and global SEO; HomepageSection remains the source for homepage content.
- Verified Admin Settings → validator/model → public settings → customer page/routing chains for About, Privacy, Terms, Returns, Shipping and Payment.
- Verified Footer exposes all CMS pages and `CmsPage.jsx` receives explicit route slugs.
- No duplicate CMS models, APIs or page systems were introduced.
- Phase 11 CMS work is complete; next phase should prioritize integration/runtime testing and production-readiness rather than adding more CMS layers.


## Phase 25 — Integration Testing & Production-Readiness Audit

- Server JavaScript syntax validation passed for all `server/src/**/*.js` files.
- All client/server JSON files parsed successfully.
- Static relative-import audit initially found four stale `ToastContext.jsx` imports and a stale `rateLimiters` import in `review.routes.js`.
- Fixed those imports to the existing `components/ui/Toast.jsx` and `reviewLimiter` export.
- Re-ran relative-import audit successfully: all relative imports resolve.
- Dependency installation timed out before a reliable Vite build could run; client build, browser E2E, MongoDB, SMTP delivery, and deployed runtime remain unverified.

## Phase 11-12 — Build Recovery Audit (2026-10-09)

- Audited root/client/server package structure and dependency manifests.
- Root package-lock.json is metadata-only; client/server do not have lockfiles.
- No client/server node_modules are present in the snapshot.
- Dependency installation was attempted previously but timed out; therefore Vite build and runtime are not claimed as verified.
- Static relative-import audit reports 0 missing local JS/JSX/JSON import targets.
- No additional source changes were required in this recovery step.


## Phase 27 — Security/API Contract Audit
- Security audit completed at source level.
- Fixed `/api/auth/refresh` and `/api/auth/logout` so refresh-cookie operations require the existing CSRF custom header defence.
- No new auth model or duplicate middleware introduced.
- Runtime, production build, MongoDB, Gmail SMTP and deployed environment are still unverified.

## Phase 11-14 — Settings + Admin Mobile Auth Hardening
- Fixed Settings editor PATCH payload so Mongo/Mongoose metadata (`_id`, `key`, timestamps, `__v`) is never sent to the strict editable-settings contract.
- Hardened the server settings validator to ignore unknown root metadata and corrected `payment.other` to match the persisted Mongoose shape (`other.instructions`).
- Added configurable `AUTH_COOKIE_DOMAIN` and production `Partitioned` cookie support.
- Documented same-site custom-domain deployment as the reliable cross-browser/mobile admin-cookie architecture.
- Static server syntax and relative-import audits pass. Browser/MongoDB/runtime verification remains pending because dependencies are not installed in this snapshot.

## Payment & delivery policy (production)
- Checkout accepts only configured bKash or Nagad; Cash on Delivery, bank transfer, and other methods are disabled.
- Every order requires a Tk 150 advance. The customer submits sender phone, TrxID, and amount; the payment remains pending admin verification.
- Delivery charge is enforced as Tk 0 server-side for every valid delivery zone.
- Configure both bKash and Nagad recipient numbers in Admin Settings before launch. Remaining balance is shown as order total minus the Tk 150 advance.
