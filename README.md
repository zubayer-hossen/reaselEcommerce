# সাজঘর (Shajghor) — E-Commerce Platform

MERN stack, mobile-first, Bangla-default clothing (পোশাক) store with a fully admin-controlled CMS.

## Tech stack
React + Vite · Tailwind CSS · Motion · Express · MongoDB (Mongoose) · JWT (HTTP-only cookies) · Cloudinary
Deploy: Netlify (client) · Render (server) · MongoDB Atlas

## Quick start (Phase 1)
```bash
npm run install:all
cp server/.env.example server/.env     # fill MONGO_URI at minimum
cp client/.env.example client/.env
npm run dev:server    # http://localhost:5000/api/health
npm run dev:client    # http://localhost:5173
```
The home page shows a server connection status, theme toggle and বাংলা/English toggle.

## Order ID format
`{ORDER_PREFIX}-{YEAR}-{SERIAL}` → e.g. `SAJ-2026-000125` (prefix set via `ORDER_PREFIX` in server/.env).

## Status
See PROJECT_MEMORY.md for current phase and next task.

## First admin (Phase 2)
Set `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` (min 8 chars, letter + number) in `server/.env`, then:
```bash
cd server && npm run seed:owner
```

## Demo data (optional)
```bash
cd server
npm run seed:demo             # 10 sample products (no photos) so the shop is not empty
npm run seed:demo -- --clear  # removes only the demo data
```

## Business settings before launch (until the admin Settings page exists)
```bash
cd server
cp settings.example.json settings.local.json   # fill in your real delivery charges, bKash/Nagad/bank details, contact info
npm run settings:apply
```
Checkout only offers payment methods that are filled in here (Cash on delivery is on by default).

## Chatbot
The 24/7 assistant answers from real data (your products, FAQs, delivery charges, payment methods, contact details). For your own rules —
returns, exchanges, delivery time — teach it in **Admin → Chatbot** (use "Test the bot" to try it). Questions it could not answer are listed
there so you can teach it.

## Payment & delivery policy (production)
- Checkout accepts only configured bKash or Nagad; Cash on Delivery, bank transfer, and other methods are disabled.
- Every order requires a Tk 150 advance. The customer submits sender phone, TrxID, and amount; the payment remains pending admin verification.
- Delivery charge is enforced as Tk 0 server-side for every valid delivery zone.
- Configure both bKash and Nagad recipient numbers in Admin Settings before launch. Remaining balance is shown as order total minus the Tk 150 advance.

Before opening checkout to customers, configure both real bKash/Nagad recipient numbers in Admin Settings and test an order end-to-end. The system records the customer-reported sender number and TrxID; it does not automatically verify transfers through a payment gateway.
