# PROJECT_MEMORY.md

## Project Overview
সাজঘর (Shajghor): MERN e-commerce / product-ordering platform for Bangladesh. Products: clothing (পোশাক).
Mobile-first, Bangla default (EN toggle), guest checkout (no customer registration), admin-controlled CMS,
live order tracking, chatbot, email marketing. Language: JavaScript (no TypeScript).

## Current Phase
Phase 10A-2 — Product reviews: IMPLEMENTED (verified-purchase submission, moderation, public approved reviews, rating recomputation, admin review page). Server syntax checked; MongoDB/browser runtime not yet verified.
Phases 1–9B complete

## Completed Features
- Phase 1: monorepo scaffold, Express base, Vite+React+Tailwind, design tokens, theme + bn/en toggle, netlify.toml
- Phase 2: Mongoose models (Counter, Admin, Category, Product w/ embedded variants, Customer, Order, Payment, TrackingEvent, SiteSetting, AuditLog)
- Phase 2 auth: login (lockout 5 attempts/15 min), refresh-token rotation w/ reuse detection, logout, logout-all, change password, forgot/reset password, /me
- Phase 2 security: Helmet, CORS allow-list, rate limits (api 300/15m, auth 10/15m), mongo-sanitize, Zod validate middleware, CSRF header check (X-Requested-With) on cookie-authed writes, bcryptjs(12), global error handler
- RBAC: permissions map (owner, super_admin, admin + 5 future staff roles), requireAuth / can() / requireRole
- Order number service (SAJ-YYYY-000001), audit service, email service stub, owner seeder (npm run seed:owner)
- Phase 3 client: AuthContext (silent refresh on load), axios 401→refresh→retry (single-flight), lazy-loaded /admin/* app, ProtectedRoute + RequirePermission
- Phase 3 UI: Login, Forgot/Reset password, AdminLayout (desktop sidebar, mobile bottom nav + "More" drawer, top bar with theme/lang), Dashboard (real counts + skeleton/error/empty states), Admins management page (bottom-sheet form), honest ComingSoon placeholders, Toast, Input, BottomSheet, format utils, admin i18n (admin.bn.json / admin.en.json)
- Phase 3 server: GET /api/admin/dashboard/summary; admins list/create/update (owner-only, owner account protected); errorHandler maps CastError/ValidationError/duplicate key/bad JSON to 4xx
- Phase 4A server: Category CRUD (admin) + public GET /api/categories; unicode slugify (Bangla-safe) + unique slug; 2-level hierarchy; delete blocked if products/subcategories exist; old image destroyed on replace/delete (best-effort)
- Phase 4A upload: POST /api/admin/uploads/sign → Cloudinary signed upload (no SDK; sha1 signature; folder allow-list shajghor/{categories|products|banners|ads|reviews|content|misc}); API secret stays server-side
- Phase 4A client: ImageUploader (client-side resize to ≤1600px WebP before upload, direct browser→Cloudinary via plain fetch), utils/cloudinary.js (cld() transformation helper), utils/uploadImage.js, Categories admin page (cards, bottom-sheet form, delete confirm), canAny() middleware
- Phase 4B server: Product admin CRUD (list w/ search+filters+pagination, get, create, update, delete), sanitize-html on descriptions, variant duplicate check, sizes/colors derived from variants, removed gallery images destroyed on Cloudinary, delete blocked when orders reference the product, SKU unique (partial index), inventory endpoint + stock patch; model virtuals price/discountPercent/stockStatus/totalStock
- Phase 4B public API: GET /api/products (filters: category slug incl. subcategories, q, brand, size, color, price range, rating, inStock, featured, isNew, bestSeller; sort newest|price_asc|price_desc|popular|rating; pagination, aggregation w/ effective price), GET /api/products/suggest?q=, GET /api/products/:slug (+related)
- Phase 4B client: Products list (search debounce, filter chips, category filter, load more, delete confirm), ProductForm (sections, sticky save bar, gallery editor w/ multi-upload/reorder/main/captions, variant editor w/ color×size generator + per-variant stock/price/SKU/image, specs, features, tags, flags, status, SEO), Inventory page (low/out/all + quick stock edit), nav item Inventory
- Phase 5A server: GET /api/settings/public (safe subset of SiteSetting incl. active announcement + maintenance); SiteSetting gained `about` and `announcement` {enabled,text,link,background,startAt,endAt}; isDemo flag on Product/Category; seeder `npm run seed:demo` (10 products, 6 categories, no photos) and `npm run seed:demo -- --clear`
- Phase 5A client: PublicLayout (SettingsProvider + CartProvider, skip link, maintenance mode page, AnnouncementBar, Navbar, Footer, BackToTop); Navbar (sticky, blur on scroll, search overlay w/ suggestions, cart badge, lang/theme, mobile drawer); SearchOverlay; Footer (categories from API, contact/social only when set in settings, payment chips); ProductCard (sale/new/best badges, hover 2nd image, out-of-stock overlay, placeholder when no photo); Home = Hero (typographic, deep aubergine, Tiro Bangla display font), TrustBadges, CategoryGrid, ProductRail ×2 (featured, new), HowItWorks, FinalCta; useApi hook; CartContext (localStorage guest cart: add/setQty/remove/clear/count/subtotal); format helpers (localized())
- Public routes: / (Home); /shop, /product/:slug, /cart show an honest "being built" page for now
- Phase 5B server: GET /api/products/filters (brands/sizes/colors/price range of active products); GET /api/products supports ?slugs=a,b (recently viewed)
- Phase 5B client: Shop page (URL-driven state: q, category, brand, size, color, minPrice, maxPrice, minRating, inStock, featured, isNew, bestSeller, sort, page; FilterPanel = desktop sidebar (instant, debounced price) + mobile bottom-sheet with draft/apply; removable filter chips; pagination; skeleton/empty/error states)
- Phase 5B Product page: breadcrumb, ProductGallery (scroll-snap swipe, thumbnails, desktop hover-zoom, fullscreen lightbox w/ keyboard + pinch), color/size chips with unavailable state, variant-specific price/stock/image jump, quantity stepper capped by stock, Add to cart (CartContext + toast), Buy now (→ /checkout), mobile sticky buy bar, description (RichText), features, specs table, delivery note, related products, recently viewed (localStorage recent:v1), JSON-LD Product schema + title/meta/OG/canonical via hooks/useSeo
- Shared: ProductScroller, useSeo hook
- Phase 6A server: Coupon model (percent|fixed, maxDiscount, minOrder, start/expiry, usageLimit/usedCount, product/category restriction, isActive); services/pricing.service.js priceCart() = single source of truth for money (live DB prices, stock, variant rules, delivery zone charge, coupon); utils/pricingMath.js (pure, unit-tested: unitPrice, couponCheck); POST /api/cart/quote (public, rate-limited); POST /api/orders (guest checkout: re-prices server-side, honeypot, expectedTotal→409 price_changed, atomic stock reservation with compensating rollback, atomic coupon claim, Customer upsert by normalised BD phone, Order snapshot items, Payment record, first TrackingEvent, audit meta ip/UA/device/browser/os); phone + user-agent utils; strict payment schema (rejects pin/otp/password fields)
- Phase 6A client: CartContext now holds deliveryArea + couponCode + drawer state (localStorage cart:v1, cart:meta:v1); useQuote hook (debounced, keeps previous quote while loading) + mergeLines(); CartLine; CartDrawer (navbar cart icon + after Add to cart); Cart page (lines w/ qty, per-line issues with fix buttons, delivery zone radio cards from settings, coupon box w/ error messages, summary, sticky mobile checkout bar); demo seeder also creates coupon DEMO10
- Phase 6B server: SiteSetting.payment {codEnabled, bkash{number,accountType}, nagad{…}, bank{bankName,accountName,accountNumber,branch}, other{instructions}} exposed via /api/settings/public; POST /api/orders rejects a payment method the owner has not configured; validate middleware now returns nested-path error keys ("customer.phone") AND top-level keys (admin forms unchanged); Bangla digits accepted in phone/postal code; `npm run settings:apply` (+ server/settings.example.json, git-ignored settings.local.json) = stop-gap to set contact/deliveryZones/payment until the Phase 11 admin editor
- Phase 6B client: Checkout page (customer form w/ 64 districts (bn stored), delivery zone select auto-synced from district for standard dhaka/outside keys, PaymentSection (method cards only for configured methods; bKash/Nagad number with copy button + senderPhone/TrxID/amount; Bank details + fields; Other instructions + fields; "never type PIN/OTP" notice), consent checkboxes (unchecked by default), honeypot, collapsible summary on phones + sticky confirm bar, client validation with server-error mapping, handles 409 cart_issues/coupon_error/price_changed/400 field errors); OrderSuccess page (animated check, big order ID + copy, items/totals, payment status text, Track button, WhatsApp link only if configured); /track is a placeholder route until Phase 8; sessionStorage order:last
- Phase 7A server: utils/orderFlow.js (pure, unit-tested: MAIN_FLOW pending→confirmed→processing→packed→shipped→out_for_delivery→delivered; forward to any later step; cancel only before shipped (pending…packed), failed packed…out_for_delivery, returned shipped…delivered; cancelled/failed/returned are FINAL; no backwards moves; DEFAULT_MESSAGES bn/en), utils/time.js (BD day boundaries, tested), services/inventory.service.js (reserveStock/releaseStock shared by checkout + admin), adminOrders controller: list (q matches orderNo/name/phone/TrxID/reference; status csv; paymentStatus; method; range today|7d|30d; counts per status + paymentCheck), detail (order+payment+events+customer stats+allowedNext; id or orderNo), status update (compare-and-set claim → releases stock once via Order.releasedAt, coupon usedCount-1 on cancel, customer orderCount/totalSpent decrement, COD delivered ⇒ payment verified, TrackingEvent w/ default or custom message + visibleToCustomer + ETA), custom tracking message, payment status (verify/reject/refund; refund only from verified), internal note; all audit-logged
- Phase 7A client: Orders page (search, tabs w/ counts incl. "payment to verify", time range, cards w/ call link, load more), OrderDetail (status actions w/ confirm sheet + message/ETA/notify toggle + restock warning, customer card w/ call/WhatsApp/copy address, items+totals, payment card w/ TrxID copy + amount-mismatch warning + verify/reject/refund confirm sheets, tracking timeline + add update, internal note, technical metadata), ConfirmSheet, StatusBadge components, constants/orderStatus.js
- Phase 7B server: Notification model (type, permission, title/body {bn,en}, link, dedupeKey, readBy[]; 60-day TTL) + services/notification.service.js notify() (never throws; 24h dedupe) ; hooks: new order, payment submitted (non-COD), low/out of stock after checkout (inventory.service checkLowStock); GET /api/admin/notifications?limit&unreadOnly → {unreadCount, notifications[]} filtered by the admin's permissions, POST /api/admin/notifications/read {ids|all}; Customers API (list w/ search+sort+summary, detail w/ last 30 orders, notes; new permission customers:write for order_manager/support_manager/admin/owner); dashboard summary adds paymentCheck + lowStock (per-variant rows, same rule as Inventory page); GET /api/admin/analytics?range=7d|30d|90d (KPIs with % change vs previous equal period, per-BD-day series zero-filled, status/payment/district breakdowns, top products + categories; no fake "conversion" metric); utils/mongoExprs.js (TOTAL_STOCK, PRICE) shared
- Phase 7B client: Dashboard (attention cards → payment verification / inventory, animated count-up stat cards, range chips, KPI cards w/ deltas, bar chart (tap/drag a day; revenue|orders), ranked bar lists), components/charts (BarChart, HBarList, no chart library), NotificationBell in admin top bar (unread badge, polls every 60s while tab visible, sheet list, mark read/all, opens linked page), Customers list (search, sort, summary) + CustomerDetail (contact, addresses, consent, recent orders, notes), Orders page honours ?tab=
- Phase 8 server: POST /api/tracking/lookup {orderNo, phoneLast4} (validators/tracking.validators.js; Bangla digits OK). Requires BOTH order ID and last 4 phone digits (stricter than the original "optional verification" because order numbers are sequential). Same 404 for wrong ID or wrong digits; 5 wrong digit guesses lock that order's tracking 30 min (Order.trackFails/trackLockUntil → 429 code "locked"); trackLimiter 40/15min/IP. Returns customer-safe fields only (no address/phone/email/IP/admin note/admin names/hidden events) + `lastMainStatus` (orderFlow.lastMainStatus, tested) so progress stays truthful even if some updates are hidden
- Phase 8 client: /track page (form → result: status badge, placed date, ETA, animated vertical timeline ✓ done / ● current (pulse) / ○ upcoming; cancelled/failed/returned end in a red step; items, total, payment status, update history, support buttons only if configured, silent auto-refresh every 90 s while visible and keeps last good result on failed refresh), TrackTimeline component, TrackBox on Home (order ID → /track?order=), navbar + footer "Track order" links, success page links to /track?order=<id> and the tracking page auto-fills the digits from sessionStorage order:last (same tab only) and looks up immediately
- Phase 9A server: models ContactMessage (new/read/replied/closed), SupportTicket (TKT-YYYY-NNNNNN via Counter; open/pending/resolved; priority low/normal/high/urgent + sortable priorityRank; internal notes[]; orderRef set ONLY when the typed order's phone matches the ticket phone), FAQ (bn/en question+answer, category, order, active, isDemo); public POST /api/contact, POST /api/support/tickets (contactLimiter 8/h/IP, honeypot `website`, all text stripped of HTML via cleanText), GET /api/faqs; admin /api/admin/support/messages|tickets (list+counts, detail — opening a "new" message marks it read —, status/priority update, ticket notes) [support:manage]; admin /api/admin/faqs CRUD + POST /faqs/reorder [content:manage]; notifications new_message/new_ticket with deep links /admin/support?tab=…&open=<id>; dashboard summary adds newMessages/openTickets; seedDemo adds 4 demo FAQs (only statements true by design)
- Phase 9A client: /contact (contact cards + address + Google Maps embed (validated src) / map link — each shown only when configured; tabs "Send message" / "Support request" (category, optional order ID); validation; success states; ticket number shown), /faq (accordion, search, category chips, FAQPage JSON-LD), Home FaqSection, navbar + footer links (FAQ, Contact), admin Support page (Tickets|Messages tabs with counts, search, sort by priority, detail sheets with call/WhatsApp/email buttons, linked-order link or "unlinked" warning, notes timeline), admin FAQ page (add/edit/delete, show/hide, move up/down), nav item FAQ, dashboard attention cards for open tickets/new messages; utils safeUrl()/mapEmbedSrc() (tested) now used for all admin-entered links
- Phase 9B server: ChatbotKnowledge (title, keywords[], answer{bn,en}, active, hits) + ChatUnanswered (scrubbed sample, count, 90-day TTL); POST /api/chatbot/message {message≤300, lang, dry?} (stateless, chatLimiter 40/10min/IP, HTML stripped) → services/chatbot.service.js answer(): order = (1) owner-taught knowledge (keyword substring match; counts hits unless dry) (2) order tracking → link to /track only, NEVER reads orders (3) FAQ (needs ≥2 shared meaningful words) (4) live shop facts from SiteSetting: delivery charges, configured payment methods (no account numbers revealed), contact details — delivery TIME is never guessed (5) product search over name/tags/brand/category → price/discount/sizes/colors/stock from DB, answers only what was asked (6) greeting/thanks (7) honest fallback with exact wording + call/WhatsApp/Messenger (only if configured; https-only) + support-request link, and logs the question with digit runs scrubbed; utils/chatMatch.js (pure, tested: normalize incl. Bangla digits, whole-word rule for short English keywords, Bangla inflection by substring, FAQ scoring, order-id detection, intent lists, scrubForLog); admin API /api/admin/chatbot/knowledge CRUD + /unanswered list/delete [chatbot:manage]
- Phase 9B client: SupportFab = ONE floating button (end side, 7.5rem above bottom → clear of back-to-top and sticky cart/buy/checkout bars) opening a small menu Chat / WhatsApp / Call (only those configured; if only chat exists it opens chat directly); ChatPanel (bottom sheet on phones, 24rem card on desktop; welcome + quick-reply chips; typing dots; product cards; action buttons; offline/slow-down handling with contact buttons; history in sessionStorage; privacy note); admin Chatbot page (bot tester with dry run showing which source answered, taught answers CRUD with keywords, "unanswered questions" list with Teach-this button prefilling the form)

## Pending Features
Phase 10 Marketing: coupons admin CRUD, newsletter/subscribers (+ public subscribe box, unsubscribe link), email service (provider abstraction: order confirmation, status/tracking updates, password reset (currently dev-console only), contact/ticket notifications), campaigns (audience, schedule, queue/rate-limit), advertisements (positions, schedule, frequency control), reviews (+ moderation, verified-purchase, new_review notification). Phase 11 CMS: admin Settings editor (site name/logo/favicon, contact + map, social, delivery zones, payment accounts, announcement bar, maintenance toggle, SEO), banners + hero slider, homepage sections (enable/disable/reorder), policies (privacy/terms/return/exchange/delivery/payment) + public policy pages + cookie consent, About text, rich-text editor w/ sanitization, audit-log viewer, admin own-password-change page. Phase 12 polish: custom cursor, page transitions, microinteractions, PWA, sitemap/robots/prerender, dynamic OG, performance (image sizes, code-split audit), a11y audit. Phase 13 testing. Phase 14 deployment + Bangla docs (SETUP_GUIDE_BN, DEPLOYMENT_GUIDE_BN, API/DB docs, ZIP). Not built: admin order editing/manual orders, bank receipt upload, push notifications, live human chat handoff (future-ready only: support-request link), customer-visible ticket status. Delivery charge defaults (70/130) are PLACEHOLDERS (chatbot + checkout quote them!) → `npm run settings:apply`. Models still to add: Banner, Advertisement, HomepageSection, Subscriber, MarketingCampaign, Policy.

## Current Architecture
- API base: /api (health at /api/health). Response shape: { success, message, data }
- Auth plan: access token 15m + refresh token 7d, both HTTP-only cookies, refresh hash stored in DB
- Variants embedded inside Product document (no separate collection)
- Order ID: {ORDER_PREFIX}-{YEAR}-{6-digit serial}, e.g. SAJ-2026-000125 (Counter model, Phase 2)
- Cross-site cookies (Netlify↔Render): SameSite=None; Secure in production

## Folder Structure
client/src: api, components/ui, contexts, i18n, layouts, customer/pages, admin, routes, sections, hooks, utils, constants, styles
server/src: config(env, db, permissions), controllers(auth), middleware(auth, validate, rateLimiters, errorHandler), models, routes(index, auth, admin), services(audit, email, orderNumber), utils(tokens, cookies, ApiError, asyncHandler), validators(auth), seeders(seedOwner)

## Database Models
Counter, Admin, Category, Product, Customer, Order, Payment, TrackingEvent, SiteSetting, AuditLog, Review, ChatbotKnowledge, ChatUnanswered (see server/src/models). Shared sub-schemas in models/_shared.js (localized {bn,en}, image, seo).

## API Routes
GET  /api/health
GET  /api/categories · GET /api/products (+filters, ?slugs=), /api/products/filters, /api/products/suggest, /api/products/:slug · GET /api/settings/public (all public)
POST /api/cart/quote · POST /api/orders (public, rate-limited)
POST /api/auth/login | refresh | logout | forgot-password | reset-password
GET  /api/auth/me · POST /api/auth/logout-all | change-password (auth)
GET  /api/admin/ping | /api/admin/dashboard/summary (dashboard:view)
GET/POST /api/admin/admins, PATCH /api/admin/admins/:id (admins:manage)
GET  /api/admin/categories (categories:write|products:read|products:write)
POST /api/admin/categories · PATCH/DELETE /api/admin/categories/:id (categories:write)
GET/PATCH /api/admin/support/messages[/:id] · GET/PATCH /api/admin/support/tickets[/:id] · POST /api/admin/support/tickets/:id/notes [support:manage] · GET/POST/PATCH/DELETE /api/admin/faqs, POST /faqs/reorder [content:manage] · GET/POST/PATCH/DELETE /api/admin/chatbot/knowledge, GET/DELETE /chatbot/unanswered [chatbot:manage]
GET  /api/admin/analytics?range (dashboard:view) · GET/POST /api/admin/notifications[/read] (any admin, permission-filtered) · GET /api/admin/customers, /customers/:id (customers:read) · PATCH /api/admin/customers/:id (customers:write)
GET  /api/admin/orders, /api/admin/orders/:id (orders:read) · PATCH /api/admin/orders/:id/status|note (orders:update) · POST /api/admin/orders/:id/tracking (tracking:write) · PATCH /api/admin/orders/:id/payment (payments:update)
GET  /api/admin/products, /api/admin/products/:id, /api/admin/inventory (products:read)
POST /api/admin/products · PATCH/DELETE /api/admin/products/:id · PATCH /api/admin/products/:id/stock (products:write)
POST /api/admin/uploads/sign (categories:write|products:write|content:manage|ads:manage|reviews:moderate)
GET  /api/reviews/product/:productId · POST /api/reviews (delivered-order verification + moderation queue)
GET/PATCH/DELETE /api/admin/reviews · POST /api/admin/reviews/recalculate [reviews:moderate]
POST /api/newsletter/subscribe (public, rate limited) · GET/PATCH/DELETE /api/admin/subscribers [marketing:manage]

## Environment Variables
server: PORT, NODE_ENV, MONGO_URI, CLIENT_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (required in production), ORDER_PREFIX, SEED_OWNER_NAME/EMAIL/PASSWORD, CLOUDINARY_*, EMAIL_*
client: VITE_API_URL, VITE_SITE_URL, VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET

## Known Issues
- npm install / runtime NOT verified (authoring env has no network). Server: node --check. Client: tsc syntax parse only.
- Render free tier sleeps after idle (cold start 30–50s); client timeout set to 45s.
- SPA meta tags for SEO need prerender/meta strategy (Phase 12).
- 2FA schema-ready only. No per-session list/revoke UI (only logout-all).
- Admin Admins page: role change/disable forces that admin to re-login (refresh tokens cleared); their current access token lives up to 15 min.

## Bugs
None reported.

## Last Completed Task
Phase 10B-1 — Newsletter subscribers: public subscribe/resubscribe endpoint, persistent subscriber model, admin list/status/delete management, notifications and footer signup UI.

Previous: Phase 10A-2 — Product reviews: verified-purchase public submission, admin moderation, approved-review listing, product rating recomputation, admin review page.

## Next Task
Phase 10B-4 — Campaign scheduling/automation plus unsubscribe/consent lifecycle hardening, after controlled Gmail SMTP delivery verification.

## Important Decisions
- Brand: সাজঘর; JS only; Tailwind v3; custom i18n instead of i18next (fewer deps)
- RBAC: start Owner + Admin; permission-based middleware so roles can be added later
- Theme/i18n/design tokens set up in Phase 1 (moved earlier from Phase 12)
- Auth cookies: sg_at (access, path /), sg_rt (refresh, path /api/auth); SameSite=None;Secure in production
- bcryptjs chosen over argon2 (no native build on Render); CSRF via custom header + strict CORS
- Effective permissions = role permissions ∪ Admin.permissions[]
- Admin code is lazy-loaded (/admin/*) with its own AuthProvider; customer bundle stays small
- Nav is permission-driven (client/src/constants/adminNav.js); bottom bar shows allowed "primary" items + More
- Images: only https://res.cloudinary.com/ URLs accepted by validators; publicId must start with "shajghor/"; Cloudinary env vars needed: CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET (server only — client needs none)
- Slugs are unicode (Bangla letters + vowel signs kept); slug never auto-changes on rename
- Variants are embedded in Product; variant _id is kept across edits (orders will reference variantId). Product stock field is ignored when variants exist (totalStock = sum of variants)
- Effective price = salePrice only when 0 < salePrice < regularPrice; storefront price filter/sort use an aggregation-computed price
- Draft products are never public; public list returns card-shaped objects (toCard)
- Storefront never shows invented business claims: contact/social blocks appear only when set in SiteSetting; trust badges use generic, true-by-design copy; hero copy is interim default i18n text until the CMS banner phase
- Display font Tiro Bangla (headings/brand), body Hind Siliguri; hero stays deep aubergine in both themes
- Public pages wrap in PublicLayout; /admin/* is outside it, so maintenance mode never blocks admin
- Shop filters live in the URL (shareable, back-button friendly); draft/apply only inside the mobile sheet
- Cart item price on the client is display-only; the server must recompute prices from the DB at order time (Phase 6)
- Product text is sanitised on write (server) and rendered via RichText (HTML only if tags present, else whitespace-pre-line)
- Money rule: the browser never decides prices. Cart quote and order creation both go through priceCart(); order stores item snapshots (name/price/qty/variant) and reserves stock at order time (cancel must restock — Phase 7)
- Order stock reservation uses per-line atomic $inc with guard, rolled back by compensation (no multi-doc transactions required)
- Payment record created for every order (COD = pending, others = submitted); Payment.amount = customer-reported amount or order total
- Guest order abuse controls: honeypot field `website`, 20 orders/hour/IP, quote 60/min/IP
- Payment methods are offered at checkout only when configured in SiteSetting.payment (never invent business payment details); server enforces the same rule
- Checkout state (deliveryArea, couponCode) lives in CartContext; district "ঢাকা" ⇒ zone dhaka, else outside (only when those standard keys exist)
- Tooling note: tsc check filters "cannot find module" errors, so also run the relative-import resolver (python script used in Phase 6B) after adding files — a missing file once slipped through
- Order status changes use compare-and-set so two admins cannot apply conflicting transitions; stock/coupon/customer totals are released at most once (Order.releasedAt)
- Returned orders are restocked automatically (admin should adjust inventory if returned items are damaged)
- Admin order UI trusts server `allowedNext` — transition rules live only in orderFlow.js
- Notifications are shared rows with per-admin read state (readBy); visibility = Notification.permission ∈ admin's permissions
- Analytics are computed live from orders (no placeholder data); revenue excludes cancelled/failed/returned
- Process note: an interrupted earlier 7B run left overlapping files; they were merged into ONE design (single notify() API: permission/body/dedupeKey). When resuming after an interruption, run the duplicate-export/import + named-import checks before writing new code.
- Tracking privacy: order ID alone never reveals an order; phone digits travel in a POST body (never URL/logs); public response is an allow-list of fields
- Customer progress is derived from ALL events (incl. hidden) but only visible messages are shown
- Anything customers type is treated as plain text (HTML stripped on write, React escapes on read); admin-entered links go through safeUrl(); map iframe only for https://www.google.com/maps/embed
- Tickets only link to an order when the phone matches (prevents probing which order IDs exist)
- Chatbot is deterministic (no LLM): every fact is read from the database at answer time; business rules the system cannot know (returns, delivery time) must be taught by the owner, otherwise the bot falls back honestly. Chat history lives only in the visitor's tab (sessionStorage).
- One floating support button (not three) to avoid covering the screen; chat widget lives in PublicLayout so it never appears in /admin
- Unbuilt sections render an honest "being built" page, never fake data

## Design System
Palette (light / dark): Primary aubergine #5B1F4E / lifted plum; Accent antique brass #B8913A / #D6B05C;
Background pearl #F6F5F8 / #150F1B; Ink #1D1523; success #1F9D6B, warning #E09614, danger #D03E3E, info #3476D6.
Font: Hind Siliguri. Radius: card 1.25rem, control 0.75rem. Tokens are CSS variables in client/src/styles/index.css.

## Deployment Status
Not deployed.

## Phase 10B-3 — Gmail SMTP campaign sending
- Added Nodemailer-backed Gmail SMTP transport in `server/src/services/email.service.js`; provider credentials are read only from server env.
- Added `EMAIL_PROVIDER`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM`, and `EMAIL_CAMPAIGN_MAX_RECIPIENTS` support in `server/src/config/env.js` / `.env.example`.
- Campaign model now tracks `sending`, `sent`, `partial`, and `failed` states plus sent/failed counts, sentAt and lastError.
- Admin send endpoint requires explicit `{ confirm: true }`, verifies SMTP, deduplicates eligible recipients, enforces a safety cap, sends through Gmail SMTP, updates subscriber `lastCampaignAt`, and audits the result.
- Admin campaign UI now exposes manual Send Now for draft/scheduled campaigns and bilingual send/status feedback.
- Runtime Gmail delivery remains unverified until a real Gmail App Password is configured; no credentials are committed.

## Phase 10B-2 — Marketing campaign foundation
- Added `server/src/models/Campaign.js` for draft/scheduled/cancelled email campaigns.
- Added audience segmentation using newsletter `Subscriber` records and `Customer.marketingConsent.email`.
- Added protected admin campaign APIs: list/create/update, audience preview and cancellation under `marketing:manage`.
- Campaign sending endpoint intentionally returns a provider-not-configured error; no real campaign emails are sent in this phase.
- Added admin `/admin/campaigns` UI with bilingual campaign drafting, audience selection, recipient preview and cancellation.
- Added campaign navigation and bilingual translations.

## Phase 10B-4 — Campaign scheduling and consent lifecycle
- Added `server/src/services/campaignScheduler.service.js`; the server checks due `scheduled` campaigns every 60 seconds and processes them through the same Gmail SMTP send path as manual sends.
- Added `server/src/services/marketing.service.js` with HMAC-signed unsubscribe tokens derived from the normalized email and the server refresh secret; no email address is embedded in a plain URL parameter.
- Campaign emails now include a signed unsubscribe link and a plain-text equivalent.
- Added public `GET /api/newsletter/unsubscribe?token=...`; it marks the newsletter subscriber unsubscribed and also sets `Customer.marketingConsent.email=false` for matching customer records.
- Added client `/unsubscribe` page to process the token and show a simple success/error state.
- Scheduler and unsubscribe reuse existing campaign/subscriber/customer/email architecture; no duplicate marketing system was introduced.
- Scheduled sending and unsubscribe delivery remain runtime-unverified until MongoDB and Gmail SMTP credentials are configured.

## Phase 10C-1 — Ads & Promotions
- Added `Ad` model with localized title/body, desktop/mobile images, link, placement, scheduling, priority, active state and impression/click counters.
- Added public ads API with active/date filtering plus impression/click counters.
- Added admin ads CRUD protected by existing `ads:manage` permission and audit logging.
- Added `/admin/ads` UI and admin navigation route; no duplicate CMS structure created.
- Real image upload remains compatible with existing Cloudinary upload flow; ad records accept image URLs.
- Runtime/MongoDB/browser testing remains pending because dependencies are not installed in the supplied ZIP environment.


## Phase 10C-2 — Public Ads Integration
- Added `client/src/components/AdSlot.jsx` for active scheduled ads.
- Integrated `home_banner`, `shop_banner`, and `product_banner` placements into Home, Shop, and Product pages.
- Impression tracking uses IntersectionObserver with a fallback for unsupported browsers; click tracking calls the existing public ad endpoints.
- Supports internal paths, anchors, and external HTTP(S) links; responsive mobile image support is included.

## Phase 10C-3 — Popup + Home Hero Ads
- Added public `home_hero` rendering on the Home page using the existing `AdSlot`.
- Added `AdPopup` for scheduled `popup` ads with session-level dismissal, impression/click tracking, responsive images, safe links, and accessible close behavior.
- No new backend API or duplicate ad model was introduced.
- Full Vite build was attempted after dependency installation, but the client dependency install exceeded the execution timeout; runtime/browser verification remains pending.


## Phase 10C-4 — Ads Analytics
- Added `AdMetricEvent` to retain timestamped impression/click events for date-range reporting.
- Existing cumulative `Ad.impressions` / `Ad.clicks` counters remain for fast all-time display; public impression/click endpoints now increment both the counter and event history.
- Added protected `GET /api/admin/ads/analytics?from=&to=&placement=` using `ads:manage`, returning totals, CTR, and per-ad metrics.
- Extended `/admin/ads` with 7/30/90-day performance summaries and per-ad CTR table.
- Fixed the existing Ads admin page to use the project's real `api/client.js`; the previous `../../utils/api.js` import did not exist.
- Date-range analytics only includes events recorded after `AdMetricEvent` was introduced; historical cumulative counters are not retroactively convertible into dated events.
