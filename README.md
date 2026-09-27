# Smellclub · Online store

A premium perfume store with a catalogue, decants, a cart, orders, stock and a private admin panel.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage) · Vercel.

> The site copy is in Spanish. Anything marked **[PLACEHOLDER]** in the code or the database is sample content. Replace it before going live (see the checklist at the end).

---

## 1. Architecture (summary)

```
Browser ──► Next.js on Vercel
            ├─ Public pages (static/ISR, cached catalogue) ──► Supabase (publishable key, read-only through RLS)
            ├─ Server Action "place order" ─► rate limit ─► SQL function create_order (secret key, server only)
            │                                             · recalculates prices from the DB
            │                                             · locks and deducts stock atomically
            └─ /admin ─► proxy (session + admin role) ─► layout (checks again) ─► actions (check again)
                                                         └─► Supabase with the admin's session: RLS is the final barrier
```

- **Products and variants:** one perfume is one product. Formats (full bottle, 5 ml decant, 10 ml decant…) are **variants**, each with its own price and stock. Products are never duplicated per size.
- **Prices:** stored in cents (whole numbers). A price of 0 shows as "Precio por confirmar" (price to be confirmed) and can't be bought.
- **Orders:** the browser sends only variant IDs and quantities. The server ignores any price that comes from the client.
- **No card data** is ever stored. Payment is arranged with the customer (transfer, payment link…).

### Folder structure

```
supabase/
  migrations/0001_schema.sql      Tables, relations, indexes, constraints
  migrations/0002_rls.sql         Grants + Row Level Security policies
  migrations/0003_functions.sql   create_order, admin_set_order_status, rate_limit_hit
  migrations/0004_storage.sql     "product-images" bucket + policies
  seed.sql                        13 sample products (placeholders)
  config.toml                     Local Supabase (optional, needs Docker)
src/
  proxy.ts                        Protects /admin (first layer)
  config/site.ts                  ✏️ BRAND COPY (tagline, benefits, testimonials, legal details)
  app/(store)/…                   Public store: /, /shop, /product/[slug], /decants,
                                  /recommendations, /cart, /checkout, /contact, /legal/*
  app/admin/…                     Private panel: login, dashboard, orders, products, categories, messages
  components/                     Reusable UI (store, cart, admin)
  lib/                            Supabase clients, auth, validation (zod), catalogue, security
```

---

## 2. What you need (all free to start)

1. A **GitHub** account: https://github.com
2. A **Supabase** account: https://supabase.com
3. A **Vercel** account (sign up with GitHub): https://vercel.com
4. Optional, only for running it on your computer: **Node.js 20 or later** (https://nodejs.org → "LTS" button).

---

## 3. Set up Supabase (step by step)

### 3.1 Create the project
1. Go to https://supabase.com/dashboard → **New project**.
2. Name: `smellclub`. **Database Password**: click "Generate a password" and **save it** in a safe place.
3. Region: pick the one closest to your customers (for Spain, `West EU (Ireland)` or `Central EU (Frankfurt)`).
4. Click **Create new project** and wait about 2 minutes.

### 3.2 Create the tables and security (SQL)
Repeat this for each file, **in this order**:
`supabase/migrations/0001_schema.sql` → `0002_rls.sql` → `0003_functions.sql` → `0004_storage.sql` → `supabase/seed.sql`

1. On GitHub (or on your computer), open the file and copy **all** of its contents.
2. In Supabase, left sidebar: **SQL Editor** → **New query**.
3. Paste the contents and click **Run** (bottom right).
4. It should say `Success. No rows returned`. If you see an error, stop and send it to me.

> `seed.sql` is optional: it creates the 13 sample products (Asad, Khamrah, CDN Intense…) with price 0 and stock 0. You can edit or delete them from the panel.

### 3.3 Turn off public sign-ups (important)
1. Left sidebar: **Authentication** → **Sign In / Providers** (or **Settings**, depending on the version).
2. Turn **OFF** "**Allow new users to sign up**".
3. Leave the **Email** provider **ON** (you log in to the panel with it).
4. Click **Save**.

### 3.4 Copy the keys
1. Left sidebar: **Project Settings** (gear icon) → **Data API** → copy the **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`.
2. **Project Settings** → **API Keys**:
   - **Publishable key** (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** (`sb_secret_…`, click "Reveal") → `SUPABASE_SECRET_KEY` 🔒
   - If you only see "anon" and "service_role" (legacy keys): anon → publishable, service_role → secret.

> 🔒 **Never** paste the secret key into code, chats, screenshots or any variable that starts with `NEXT_PUBLIC_`.

### 3.5 Create the first administrator
1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter your email and a **strong password** (16+ characters). Tick **Auto Confirm User**. Click **Create user**.
3. Go to **SQL Editor** → **New query**, paste this (replacing the email with yours) and click **Run**:

```sql
insert into public.admin_users (user_id, role)
select id, 'owner' from auth.users where email = 'YOUR-EMAIL@example.com';
```

4. It should say `Success. 1 row`. If it says `0 rows`, the email doesn't match the user exactly.

Add more admins the same way (with `'admin'` instead of `'owner'`). To remove one:
```sql
delete from public.admin_users where user_id = (select id from auth.users where email = 'EMAIL');
```

---

## 4. Upload the code to GitHub

The code is already in the repository `smellclub/smell-club-claude`, on the branch `claude/smellclub-ecommerce-build-it4497`.

1. Open the repository on GitHub. You'll see a yellow bar "…had recent pushes" → **Compare & pull request** → **Create pull request** → **Merge pull request** → **Confirm merge**. That puts the code on the main branch (`main`).
2. Check that **no `.env.local` file** appears in the repository (the `.gitignore` already blocks it).

---

## 5. Deploy on Vercel

1. Go to https://vercel.com/new → **Import Git Repository** → choose `smell-club-claude` → **Import**.
2. Framework: it should detect **Next.js** automatically. Don't change anything under "Build and Output Settings".
3. Open **Environment Variables** and add, one by one (Name → Value):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` (while you don't have one: the `https://…vercel.app` URL Vercel gives you) |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (step 3.4) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` 🔒 | Secret key |
| `RATE_LIMIT_SALT` 🔒 | A long random text (40+ characters). Generate one at https://1password.com/password-generator |
| `NEXT_PUBLIC_CURRENCY` | `EUR` (or `USD`, `MXN`, `COP`, `CLP`, `ARS`…) |
| `NEXT_PUBLIC_LOCALE` | `es-ES` (or `es-MX`, `es-CO`, `es-AR`…) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits only with country code, e.g. `34600111222` (leave empty until you have it) |
| `NEXT_PUBLIC_INSTAGRAM_URL` | e.g. `https://www.instagram.com/your_account` (leave empty until you have it) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Your contact email (optional) |

4. Click **Deploy** and wait 1–2 minutes.
5. Open the URL Vercel shows you. Go to `/admin` and log in with the admin you created.

**Whenever you change a variable in Vercel:** Project → **Deployments** → the latest one → "⋯" → **Redeploy**. `NEXT_PUBLIC_*` variables are applied at build time.

### Your own domain
Vercel → Project → **Settings** → **Domains** → **Add** → type your domain and follow the DNS records it shows you (you add them at the provider where you bought the domain). Then update `NEXT_PUBLIC_SITE_URL` and redeploy.

Also in Supabase → **Authentication** → **URL Configuration** → **Site URL**: put your final URL.

---

## 6. Using the admin panel

- **Products → + Nuevo producto (new product):** fill in the details, formats (bottle / 5 ml decant / 10 ml decant), price and stock. Save, then upload photos (compressed automatically; vertical 4:5 recommended).
- **Estado (status):** only "Publicado" (published) products show in the store. "Borrador" (draft) hides it while you work on it. "Archivado" (archived) removes it from the store without deleting it.
- **Destacado / Nuevo / Recomendado (featured / new / recommended):** control the home sections and `/recommendations`.
- **Precio anterior (previous price):** if it's higher than the price, the discount shows automatically.
- **Pedidos (orders):** change the status (Pendiente → Confirmado → Preparando → Enviado → Entregado). If you **cancel**, stock is restored automatically and the order can't be reopened.
- **Stock:** it goes down automatically with each order. You can adjust it by hand in each variant.
- **Brand copy (tagline, benefits, testimonials, legal details):** edit `src/config/site.ts` (on GitHub: open the file → pencil icon → change it → "Commit changes"; Vercel redeploys on its own).

---

## 7. Running it on your computer (optional)

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # open http://localhost:3000
npm run check                # types + lint + production build
```

With Docker installed you can use a local Supabase: `npx supabase start` (it applies `migrations/` and `seed.sql`).

---

## 8. Security: what's implemented

| Risk | Protection |
|---|---|
| Unauthorised admin access | 3 layers: `proxy.ts` + panel `layout` + `requireAdmin()` in every action. RLS in the DB (`is_admin()`). Public sign-ups turned off |
| Privilege escalation | `admin_users` has no write policies: nobody can promote themselves through the API. Only by SQL in the dashboard |
| Price tampering | The client sends only IDs and quantities. `create_order` reads prices from the DB (tested: an item tampered to €0.01 was charged at its real price) |
| Stock tampering / overselling | `FOR UPDATE` lock + `stock >= 0` constraint. Tested with 8 simultaneous orders on stock 1 → 1 accepted, 7 rejected |
| IDOR | The public can't read orders (RLS + no GRANT). There is no public endpoint to look up orders |
| SQL injection | supabase-js parameterised queries + SQL functions with `search_path = ''`. LIKE wildcards are escaped |
| XSS | React escapes everything; the only `dangerouslySetInnerHTML` is JSON-LD with `<` escaped. Inputs cleaned (control characters, bidi) |
| CSRF | Server Actions with Origin checking (Next.js) + `SameSite=Lax` cookies |
| Sessions | `httpOnly`, `Secure` (in production), `SameSite=Lax` cookies. Token validated against Supabase Auth (`getUser`) |
| Abuse / bots | Rate limiting in PostgreSQL: orders 5/10 min, contact 3/15 min, login 10/15 min per IP and 5/15 min per email. Honeypot field |
| Uploads | Admin only; real type checked by magic bytes (JPG/PNG/WebP/AVIF, no SVG); max 3.5 MB; random names; bucket with MIME and size limits; EXIF/GPS removed |
| Secrets | Only in env variables; `server-only` stops them being imported in the browser; `.env*` in `.gitignore`. Checked: the client bundle contains no secrets |
| Headers | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP. `/admin` with `noindex` and `no-store` |
| Errors | Generic messages for the user; technical details only in server logs (error codes, no personal data) |
| Personal data | IPs stored only as a salted SHA-256 hash. No card data |

**CSP note:** `script-src` includes `'unsafe-inline'` because Next.js needs it without nonces. Using nonces would force every page to render on each request (slower). Every other directive is strict.

---

## 9. ✅ Final security checklist

- [ ] Public sign-ups **turned off** in Supabase (step 3.3).
- [ ] Only your user is in `admin_users` (`select * from admin_users;`).
- [ ] Admin password of 16+ characters, not used anywhere else.
- [ ] (Recommended) Turn on MFA/2FA on your **Supabase**, **Vercel** and **GitHub** accounts.
- [ ] `SUPABASE_SECRET_KEY` and `RATE_LIMIT_SALT` exist **only** in Vercel (never with `NEXT_PUBLIC_`).
- [ ] No `.env.local` in the GitHub repository.
- [ ] Supabase → **Advisors → Security Advisor**: no critical warnings.
- [ ] Supabase → **Database → Tables**: every table shows "RLS enabled".
- [ ] Open `/admin` in a private window → it must redirect to the login page.
- [ ] If a key ever leaks: Supabase → API Keys → **Roll/Revoke** it, update Vercel and redeploy.

## 10. ✅ Before going live

- [ ] Real prices, stock, sizes, descriptions and notes for every product (remove the `[PLACEHOLDER]` text and the `[TAMAÑO POR CONFIRMAR]` label).
- [ ] Brands marked `[VERIFICAR MARCA]` (Emeer, CDN Bling) confirmed.
- [ ] Real photos uploaded.
- [ ] `src/config/site.ts`: tagline, benefits (shipping!), **real testimonials or an empty list**, legal details.
- [ ] Legal pages (`/legal/…`) reviewed and adapted to your country (they are guidance templates, not legal advice).
- [ ] Decant FAQ (`/decants`) and business hours (`/contact`) filled in.
- [ ] WhatsApp, Instagram and email set in Vercel, then redeploy.
- [ ] `NEXT_PUBLIC_SITE_URL` with the final domain, and the Site URL in Supabase updated.
- [ ] Place a real test order from your phone, check it in `/admin`, and cancel it (stock goes back).
- [ ] Try the site on iPhone and Android, including opening a link from Instagram.
- [ ] Supabase: check your plan's backups (Database → Backups).
