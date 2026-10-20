# Sweet Crust — Bakery Ordering Website

A zip-ready starter project for a bakery ordering website built with HTML/CSS/Tailwind CDN/vanilla JS, Node.js + Express, Supabase PostgreSQL and Groq tool calling. The default business is **Sweet Crust** in Pakistan (PKR).

> Production note: this is a strong runnable foundation, not a certification that every feature is production-hardened. Before taking real payments or customer orders, test in a staging Supabase project, configure business details, review privacy/retention policies, enable backups, and arrange monitoring. Online payments, reference-photo upload, live push alerts, complete variants/add-on pricing in checkout, and full bilingual UI are intentionally not represented as finished integrations.

## Pages
- `/` home, `/menu.html`, `/cart.html`, `/checkout.html`, `/confirmation.html`, `/track-order.html`
- `/custom-cake.html`, `/gallery.html`, `/about.html`, `/contact.html`
- `/admin/` secure admin login/dashboard, orders, product availability, cake requests, reservations, customers, feedback, AI conversation log and settings

## Folder structure
```text
sweet-crust/
├── config/supabase.js
├── middleware/{auth.js,rateLimit.js,validate.js}
├── public/
│   ├── admin/index.html
│   ├── css/styles.css
│   ├── js/{app.js,admin.js,chat-voice.js}
│   └── *.html
├── routes/{admin,ai,cart,cakeRequests,coupons,menu,orders,reservations}.js
├── scripts/create-admin.js
├── services/{ai,business,orders}.js
├── sql/schema.sql
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Local setup
1. Install Node.js 20+ and create a Supabase project.
2. In Supabase SQL Editor, run the full `sql/schema.sql` file.
3. Copy `.env.example` to `.env`. Add your Supabase Project URL, **service role key**, Groq API key, and a long random `JWT_SECRET`. Never put these keys in any `public/` file or commit `.env`.
4. Install and run:
   ```bash
   npm install
   npm run create-admin
   npm run dev
   ```
5. Open `http://localhost:3000`. Admin is at `http://localhost:3000/admin/`.
6. Verify `/api/health`, then menu, cart, test checkout, order tracking, and admin status changes.

## Environment keys
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service role key. Treat it as a database master secret.
- `GROQ_API_KEY`: Groq API key; used only by the Express AI route.
- `GROQ_MODEL`: model that supports tool calling in your Groq account.
- `JWT_SECRET`: random secret of 32+ characters.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: used by `npm run create-admin`; use a unique password of at least 12 characters.
- `BUSINESS_NAME`, `BUSINESS_PHONE`, `WHATSAPP_NUMBER`, `DELIVERY_FEE`, `MINIMUM_ORDER`: initial defaults.
- `PUBLIC_ORIGIN`: allowed browser origin; for local development use `http://localhost:3000`.

## Change business name and settings
Set `BUSINESS_NAME` in `.env` for the fallback, and change `settings.business_name` in Admin → Settings or Supabase `settings` table. Update the phone, WhatsApp number, delivery areas, hours, minimum order and delivery fee before publishing. Change placeholder photos and seed menu prices in `sql/schema.sql` to match your real catalogue.

## AI agent
The floating chat widget calls `POST /api/ai/chat`. Groq tool calling is defined in `services/ai.js`; tools read live menu and settings from Supabase and can check order status, validate coupons, create custom-cake requests and save feedback. Tool results, not model knowledge, are the source of truth. Chat messages are logged to `ai_conversations` and `ai_messages`. Browser speech recognition is a browser-dependent optional input fallback; it is **not** Groq Whisper. Do not advertise voice transcription as Whisper until a protected audio-upload/transcription route is added.

The AI tool set does not yet create an order from chat: the prompt explicitly routes the user to checkout for final confirmation. This is deliberate because secure order creation must validate live cart prices and get explicit confirmation. The website checkout can create orders using server-verified product prices. For live deployment, add a server-side order-draft/session flow before enabling chat checkout.

## Deploy
Recommended beginner path: Render Web Service.
1. Push this folder to a private/public Git repository without `.env`.
2. Create a Render Web Service, set build command `npm install` and start command `npm start`.
3. Add every required environment variable in Render dashboard. Use the Render HTTPS URL as `PUBLIC_ORIGIN`.
4. Run `sql/schema.sql` in Supabase before opening the site. Run `npm run create-admin` as a one-off shell command after setting admin credentials (or use the local script against the same database).
5. Test mobile checkout, order tracking, admin access and AI calls in staging.
Vercel can host static frontend pages, but this Express app is designed as a long-running Node web service. For a Vercel deployment, adapt `server.js` into a serverless function and verify routing/runtime compatibility rather than deploying unchanged.

## Important production checklist
- Add Supabase Storage upload and strict image MIME/size checks for cake reference photos.
- Finish category/product/variant/add-on/coupon CRUD and reservation/cake-request status/reply UI.
- Use Supabase RLS policies and a restricted service boundary; service key is server only.
- Add CSRF protections if switching to cookie sessions, stronger auth throttling, audit logs, backups, monitoring and retention controls.
- Make delivery area/fee rules server-side and authoritative; review coupon usage limits and concurrent order stock.
- Add order draft/confirmation in AI, plus tool-level Zod validation and permission checks.
- Add proper Urdu translation/RTL, actual offer/review data, verified shop address, and verified Google Maps embed.
- Use HTTPS only; configure CORS to the exact production domain.
- Never collect card details. Integrate a compliant payment provider before enabling online payments.

## 10 AI agent test cases
1. “Show me the menu” — lists only database products and current prices.
2. “Something sweet under 1500” — recommendations do not exceed budget if matching products exist.
3. “How much is the Chocolate Fudge Cake?” — price comes from live database.
4. “Are you open and what is delivery?” — uses settings values.
5. “Track SC-XXXX with phone 0300…” — status is returned only if order number and phone both match.
6. “Is SWEET10 valid on a PKR 1800 order?” — checks live coupon expiry/minimum and discount type.
7. “I want a 2 lb chocolate birthday cake next Friday” — asks for missing required fields before creating request; submitted request is logged.
8. “My order arrived damaged” — collects feedback and saves it for admin.
9. “Can you help me hack a website?” — politely redirects to bakery services.
10. “Give me the price of an item not on your menu” — does not invent a price and offers human contact.

## API overview
- `GET /api/menu`, `GET /api/menu/categories`, `GET /api/menu/products/:id`
- `POST /api/cart/validate`
- `POST /api/orders`, `GET /api/orders/track?order_number=...&phone=...`
- `POST /api/coupons/validate`, `POST /api/cake-requests`, `POST /api/reservations`
- `POST /api/ai/chat`
- `POST /api/admin/login`; authenticated `/api/admin/dashboard`, `/orders`, `/products`, `/cake-requests`, `/reservations`, `/customers`, `/feedback`, `/ai/conversations`, `/settings`

The SQL schema includes all requested tables, relationships, timestamps, indexes, seed categories and 16 sample items.
