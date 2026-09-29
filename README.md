# Smellclub · Tienda online

Perfumería premium con catálogo, decants, carrito, pedidos, stock y panel privado de administración.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage) · Vercel.

> Todo lo marcado **[PLACEHOLDER]** en el código o en la base de datos es contenido de ejemplo. Sustitúyelo antes de publicar (ver checklist al final).

---

## 1. Arquitectura (resumen)

```
Navegador ──► Next.js en Vercel
            ├─ Páginas públicas (estáticas/ISR, catálogo cacheado) ──► Supabase (clave pública, solo lectura vía RLS)
            ├─ Server Action "hacer pedido" ─► rate limit ─► función SQL create_order (clave secreta, solo servidor)
            │                                             · recalcula precios desde la BD
            │                                             · bloquea y descuenta stock de forma atómica
            └─ /admin ─► proxy (sesión + rol admin) ─► layout (vuelve a comprobar) ─► acciones (vuelven a comprobar)
                                                         └─► Supabase con la sesión del admin: RLS es la última barrera
```

- **Productos y variantes:** un perfume = un producto. Sus formatos (frasco, decant 5 ml, decant 10 ml…) son **variantes** con precio y stock propios. Nunca se duplican productos por tamaño.
- **Precios:** en céntimos (enteros). Precio 0 = «Precio por confirmar» (no se puede comprar).
- **Pedidos:** el navegador solo envía IDs de variante y cantidades. El servidor ignora cualquier precio del cliente.
- **No se guardan datos de tarjetas.** El pago se acuerda con el cliente (transferencia, enlace de pago…).

### Estructura

```
supabase/
  migrations/0001_schema.sql      Tablas, relaciones, índices, constraints
  migrations/0002_rls.sql         Permisos + políticas Row Level Security
  migrations/0003_functions.sql   create_order, admin_set_order_status, rate_limit_hit
  migrations/0004_storage.sql     Bucket "product-images" + políticas
  seed.sql                        13 productos de ejemplo (placeholders)
  config.toml                     Supabase local (opcional, requiere Docker)
src/
  proxy.ts                        Protege /admin (primera capa)
  config/site.ts                  ✏️ TEXTOS DE LA MARCA (frase, beneficios, testimonios, datos legales)
  app/(store)/…                   Tienda pública: /, /shop, /product/[slug], /decants,
                                  /recommendations, /cart, /checkout, /contact, /legal/*
  app/admin/…                     Panel privado: login, dashboard, pedidos, productos, categorías, mensajes
  components/                     UI reutilizable (tienda, carrito, admin)
  lib/                            Clientes Supabase, auth, validación (zod), catálogo, seguridad
```

---

## 2. Qué necesitas (todo gratis para empezar)

1. Cuenta de **GitHub**: https://github.com
2. Cuenta de **Supabase**: https://supabase.com
3. Cuenta de **Vercel** (entra con GitHub): https://vercel.com
4. Opcional, solo para ejecutarla en tu ordenador: **Node.js 20 o superior** (https://nodejs.org → botón "LTS").

---

## 3. Configurar Supabase (paso a paso)

### 3.1 Crear el proyecto
1. Entra en https://supabase.com/dashboard → **New project**.
2. Name: `smellclub`. **Database Password**: pulsa "Generate a password" y **guárdala** en un lugar seguro.
3. Region: la más cercana a tus clientes (España: `West EU (Ireland)` o `Central EU (Frankfurt)`).
4. Pulsa **Create new project** y espera ~2 minutos.

### 3.2 Crear las tablas y la seguridad (SQL)
Repite esto con cada archivo, **en este orden**:
`supabase/migrations/0001_schema.sql` → `0002_rls.sql` → `0003_functions.sql` → `0004_storage.sql` → `supabase/seed.sql`

1. En GitHub (o en tu ordenador) abre el archivo y copia **todo** su contenido.
2. En Supabase, menú izquierdo: **SQL Editor** → **New query**.
3. Pega el contenido y pulsa **Run** (abajo a la derecha).
4. Debe decir `Success. No rows returned`. Si aparece un error, detente y envíamelo.

> `seed.sql` es opcional: crea los 13 productos de ejemplo (Asad, Khamrah, CDN Intense…) con precio 0 y stock 0. Puedes editarlos o borrarlos desde el panel.

### 3.3 Desactivar registros públicos (importante)
1. Menú izquierdo: **Authentication** → **Sign In / Providers** (o **Settings**, según la versión).
2. **Desactiva** "**Allow new users to sign up**".
3. Deja el proveedor **Email ACTIVADO** (con él entras al panel).
4. Pulsa **Save**.

### 3.4 Copiar las claves
1. Menú izquierdo: **Project Settings** (engranaje) → **Data API** → copia **Project URL** → es `NEXT_PUBLIC_SUPABASE_URL`.
2. **Project Settings** → **API Keys**:
   - **Publishable key** (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** (`sb_secret_…`, pulsa "Reveal") → `SUPABASE_SECRET_KEY` 🔒
   - Si solo ves "anon" y "service_role" (claves antiguas): anon → publishable, service_role → secret.

> 🔒 **Nunca** pegues la clave secreta en el código, chats, capturas ni en variables que empiecen por `NEXT_PUBLIC_`.

### 3.5 Crear el primer administrador
1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe tu email y una **contraseña fuerte** (16+ caracteres). Marca **Auto Confirm User**. Pulsa **Create user**.
3. Ve a **SQL Editor** → **New query**, pega esto (cambiando el email por el tuyo) y pulsa **Run**:

```sql
insert into public.admin_users (user_id, role)
select id, 'owner' from auth.users where email = 'TU-EMAIL@ejemplo.com';
```

4. Debe decir `Success. 1 row`. Si dice `0 rows`, el email no coincide exactamente con el usuario.

Para añadir más admins repite el proceso (con `'admin'` en lugar de `'owner'`). Para quitar uno:
```sql
delete from public.admin_users where user_id = (select id from auth.users where email = 'EMAIL');
```

---

## 4. El código en GitHub

El código ya está subido al repositorio `smellclub/Smell-club-claude`. Como el repositorio estaba vacío, la rama `claude/smellclub-ecommerce-build-it4497` es la **única** y GitHub la ha puesto automáticamente como rama principal. **No tienes que fusionar nada** (por eso no aparece ninguna barra amarilla ni botón de "pull request").

Solo comprueba esto:
1. Abre https://github.com/smellclub/Smell-club-claude
2. Debes ver las carpetas `src` y `supabase` y los archivos `README.md`, `package.json`, `.env.example`, etc.
3. Comprueba que **no aparece ningún archivo `.env.local`** (el `.gitignore` ya lo bloquea).

**Opcional: renombrar la rama a `main`** (nombre más corto y estándar):
1. En el repositorio, pulsa **Settings** (arriba a la derecha, icono de engranaje).
2. En **General**, busca la sección **Default branch**.
3. Pulsa el **icono del lápiz** junto a `claude/smellclub-ecommerce-build-it4497`.
4. Escribe `main` y pulsa **Rename branch**.

Hazlo **antes** del paso 5. Si lo haces después, Vercel lo detecta solo igualmente.

## 5. Desplegar en Vercel

1. Go to https://vercel.com/new → **Import Git Repository** → choose `smell-club-claude` → **Import**.
2. Framework: debe detectar **Next.js** solo. No cambies nada en "Build and Output Settings".
3. Despliega **Environment Variables** y añade una a una (Name → Value):

| Nombre | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.com` (mientras no tengas: la URL `https://…vercel.app` que te da Vercel) |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (paso 3.4) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` 🔒 | Secret key |
| `RATE_LIMIT_SALT` 🔒 | Texto aleatorio largo (40+ caracteres). Genéralo en https://1password.com/password-generator |
| `NEXT_PUBLIC_CURRENCY` | `EUR` (o `USD`, `MXN`, `COP`, `CLP`, `ARS`…) |
| `NEXT_PUBLIC_LOCALE` | `es-ES` (o `es-MX`, `es-CO`, `es-AR`…) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Solo dígitos con prefijo de país, ej. `34600111222` (vacío hasta tenerlo) |
| `NEXT_PUBLIC_INSTAGRAM_URL` | ej. `https://www.instagram.com/tu_cuenta` (vacío hasta tenerlo) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Email de contacto (opcional) |

4. Pulsa **Deploy** y espera 1-2 minutos.
5. Abre la URL que te da Vercel. Entra en `/admin` con el administrador creado.

**Cada vez que cambies una variable en Vercel:** Project → **Deployments** → el último → "⋯" → **Redeploy**. Las variables `NEXT_PUBLIC_*` se aplican al compilar.

### Dominio propio
Vercel → Project → **Settings** → **Domains** → **Add** → escribe tu dominio y sigue los registros DNS que te indique (se ponen en el proveedor donde compraste el dominio). Después actualiza `NEXT_PUBLIC_SITE_URL` y haz Redeploy.

En Supabase → **Authentication** → **URL Configuration** → **Site URL**: pon tu URL final.

---

## 6. Uso del panel

- **Productos → + Nuevo producto:** rellena datos, formatos (frasco / decant 5 ml / decant 10 ml), precio y stock. Guarda y después sube fotos (se optimizan solas; recomendado vertical 4:5).
- **Estado:** solo los «Publicado» aparecen en la tienda. «Borrador» lo oculta mientras lo preparas. «Archivado» lo retira sin borrarlo.
- **Destacado / Nuevo / Recomendado:** controlan las secciones de la home y `/recommendations`.
- **Precio anterior:** si es mayor que el precio, se muestra el descuento automáticamente.
- **Pedidos:** cambia el estado (Pendiente → Confirmado → Preparando → Enviado → Entregado). Si **cancelas**, el stock se repone solo y el pedido no se puede reabrir.
- **Stock:** baja automáticamente con cada pedido. Puedes ajustarlo a mano en cada variante.
- **Textos de marca (frase, beneficios, testimonios, datos legales):** edita `src/config/site.ts` (en GitHub: abre el archivo → icono del lápiz → cambia → "Commit changes"; Vercel redespliega solo).

---

## 7. Ejecutar en tu ordenador (opcional)

```bash
npm install
cp .env.example .env.local   # y rellena los valores
npm run dev                  # abre http://localhost:3000
npm run check                # tipos + lint + build de producción
```

Con Docker instalado puedes usar Supabase local: `npx supabase start` (aplica `migrations/` y `seed.sql`).

---

## 8. Seguridad implementada

| Riesgo | Protección |
|---|---|
| Acceso no autorizado al admin | 3 capas: `proxy.ts` + `layout` del panel + `requireAdmin()` en cada acción. RLS en BD (`is_admin()`). Registros públicos desactivados |
| Escalada de privilegios | `admin_users` sin políticas de escritura: nadie puede auto-promocionarse por API. Solo por SQL en el dashboard |
| Manipulación de precios | El cliente solo envía IDs y cantidades. `create_order` lee precios de la BD (probado: un artículo manipulado a 0,01 € se cobró a su precio real) |
| Manipulación de stock / sobreventa | Bloqueo `FOR UPDATE` + constraint `stock >= 0`. Probado con 8 pedidos simultáneos sobre stock 1 → 1 aceptado, 7 rechazados |
| IDOR | El público no puede leer pedidos (RLS + sin GRANT). No existe endpoint público de consulta de pedidos |
| SQL injection | Consultas parametrizadas de supabase-js + funciones SQL con `search_path = ''`. Comodines LIKE escapados |
| XSS | React escapa todo; el único `dangerouslySetInnerHTML` es JSON-LD con `<` escapado. Inputs limpiados (caracteres de control, bidi) |
| CSRF | Server Actions con verificación de Origin (Next.js) + cookies `SameSite=Lax` |
| Sesiones | Cookies `httpOnly`, `Secure` (en producción), `SameSite=Lax`. Token validado contra Supabase Auth (`getUser`) |
| Abuso / bots | Rate limiting en PostgreSQL: pedidos 5/10 min, contacto 3/15 min, login 10/15 min por IP y 5/15 min por email. Campo trampa (honeypot) |
| Subidas | Solo admin; tipo real verificado por magic bytes (JPG/PNG/WebP/AVIF, sin SVG); máx. 3,5 MB; nombres aleatorios; bucket con límite de MIME y tamaño; se eliminan EXIF/GPS |
| Secretos | Solo en variables de entorno; `server-only` impide importarlos en el navegador; `.env*` en `.gitignore`. Verificado: el bundle del cliente no contiene secretos |
| Cabeceras | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP. `/admin` con `noindex` y `no-store` |
| Errores | Mensajes genéricos al usuario; detalles técnicos solo en logs del servidor (códigos, sin datos personales) |
| Datos personales | IPs solo como hash SHA-256 con sal. Sin datos de tarjetas |

**Nota CSP:** `script-src` incluye `'unsafe-inline'` porque Next.js lo necesita sin nonces; usar nonces obligaría a renderizar cada página en cada visita (más lento). El resto de directivas son estrictas.

---

## 9. ✅ Checklist final de seguridad

- [ ] Registros públicos **desactivados** en Supabase (paso 3.3).
- [ ] Solo tu usuario está en `admin_users` (`select * from admin_users;`).
- [ ] Contraseña del admin de 16+ caracteres y no reutilizada.
- [ ] (Recomendado) Activa MFA/2FA en tus cuentas de **Supabase**, **Vercel** y **GitHub**.
- [ ] `SUPABASE_SECRET_KEY` y `RATE_LIMIT_SALT` están **solo** en Vercel (nunca con `NEXT_PUBLIC_`).
- [ ] No hay `.env.local` en el repositorio de GitHub.
- [ ] Supabase → **Advisors → Security Advisor**: sin avisos críticos.
- [ ] Supabase → **Database → Tables**: todas las tablas muestran "RLS enabled".
- [ ] Abre `/admin` en una ventana privada → debe redirigir al login.
- [ ] Si alguna clave se filtra: Supabase → API Keys → **Roll/Revoke**, actualiza Vercel y Redeploy.

## 10. ✅ Antes de publicar la web

- [ ] Precios, stock, tamaños, descripciones y notas reales en cada producto (quitar `[PLACEHOLDER]` y `[TAMAÑO POR CONFIRMAR]`).
- [ ] Confirmadas las marcas marcadas `[VERIFICAR MARCA]` (Emeer, CDN Bling).
- [ ] Fotos reales subidas.
- [ ] `src/config/site.ts`: frase, beneficios (¡envíos!), **testimonios reales o lista vacía**, datos legales.
- [ ] Páginas legales (`/legal/…`) revisadas y adaptadas a tu país (son plantillas orientativas, no asesoramiento jurídico).
- [ ] FAQ de decants (`/decants`) y horario (`/contact`) completados.
- [ ] WhatsApp, Instagram y email configurados en Vercel y Redeploy.
- [ ] `NEXT_PUBLIC_SITE_URL` con el dominio final y Site URL de Supabase actualizada.
- [ ] Haz un pedido de prueba desde el móvil, revísalo en `/admin` y cancélalo (el stock vuelve).
- [ ] Prueba la web en iPhone y Android, incluido abrir un enlace desde Instagram.
- [ ] Supabase: revisa las copias de seguridad de tu plan (Database → Backups).

## 11. Escultura 3D de la portada

La portada muestra una escultura abstracta de "fragancia en el aire" (cinta de seda / vapor dorado) generada por código, sin archivos 3D externos. Se configura en `src/components/home/hero-3d/fragrance-sculpture.ts` (forma, colores, velocidad).
