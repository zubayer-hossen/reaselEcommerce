
## Admin login on mobile — production cookie requirement

For the most reliable production admin session across Android/iOS browsers, serve the frontend and API under the same registrable domain, for example:
- Frontend: `https://www.shajghor.com`
- API: `https://api.shajghor.com`

Set the server environment:
- `CLIENT_URL=https://www.shajghor.com`
- `AUTH_COOKIE_DOMAIN=.shajghor.com`

Set the client build environment:
- `VITE_API_URL=https://api.shajghor.com/api`

The backend cookies are Secure/HttpOnly and support partitioned cookies for browsers that require them. Using separate Netlify/Render hostnames can still be affected by browser third-party-cookie policies, especially on some mobile browsers; a same-site custom domain is the production-safe deployment architecture.

## Payment & delivery policy (production)
- Checkout accepts only configured bKash or Nagad; Cash on Delivery, bank transfer, and other methods are disabled.
- Every order requires a Tk 150 advance. The customer submits sender phone, TrxID, and amount; the payment remains pending admin verification.
- Delivery charge is enforced as Tk 0 server-side for every valid delivery zone.
- Configure both bKash and Nagad recipient numbers in Admin Settings before launch. Remaining balance is shown as order total minus the Tk 150 advance.

### Launch checklist: bKash/Nagad advance
- Admin Settings-এ বাস্তব bKash এবং Nagad receive number ও account type দিন। নম্বর ছাড়া সংশ্লিষ্ট payment option checkout-এ দেখাবে না।
- প্রতিটি অর্ডারে ঠিক ৳১৫০ advance, sender phone ও TrxID জমা হবে; Admin Orders থেকে payment যাচাই করুন।
- Delivery charge server-side ৳০ enforced; settings-এর zone charge field শুধু zero দেখায়।
- বাকি টাকা অর্ডার কনফার্মেশনের সময় গ্রাহককে জানাতে হবে; এটি স্বয়ংক্রিয় payment gateway নয়।
