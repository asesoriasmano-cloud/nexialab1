# Registro Pet/Vet Chile

Marketplace/directorio curado del ecosistema de negocios de mascotas en Chile:
veterinarias, pet shops, grooming, nutrición, seguros, transporte,
adiestramiento, accesorios y servicios funerarios.

Dos carriles de oferta — **empresas verificadas** (con sello) y
**emprendimientos con diferenciación** — y una cola de aprobación manual antes
de que cualquier ficha se publique. Fase 1 es directorio con leads; el modelo
de datos ya deja el espacio para las transacciones de fase 2.

Vive en `marketplace/` dentro de este repo. El sitio estático de la raíz
(Nexia Lab) no se toca.

## Levantarlo

```bash
cd marketplace
npm install       # el postinstall corre `prisma generate`
npm run dev       # http://localhost:3000
```

Sin `DATABASE_URL` la app arranca en **modo demo**: sirve los datos de
`prisma/seed-data.ts` desde memoria, con un aviso visible en la home. Sirve
para revisar el diseño de las cartillas sin levantar Postgres. Las
aprobaciones y los leads se aplican en memoria y se pierden al reiniciar.

### Con Postgres

```bash
cp .env.example .env      # completa DATABASE_URL (Supabase o Neon) y ADMIN_TOKEN
npm run db:push           # crea las tablas a partir de prisma/schema.prisma
npm run db:seed           # categorías reales + negocios de ejemplo (ficticios)
npm run dev
```

Con `DATABASE_URL` definida, cada lectura y escritura pasa por Prisma. El seed
es idempotente: se puede volver a correr sin duplicar ofertas ni logs.

### Variables de entorno

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Conexión a Postgres. Sin ella, la app corre en modo demo. |
| `ADMIN_TOKEN` | Clave de `/admin/revision`. Sin ella la cola queda abierta en desarrollo y **cerrada** en producción. |

## Páginas

| Ruta | Qué hace |
| --- | --- |
| `/` | Buscador, pestañas de categoría y los carriles (destacados, verificados, emprendimientos). |
| `/[categoria]` | Listado filtrado, mismo layout de cartillas. |
| `/[categoria]/[slug]` | Cartilla expandida: identificación, ofertas, contacto y formulario de lead. |
| `/sumar-negocio` | Autopostulación. Entra con `status: pending` y sin folio. |
| `/admin/revision` | Cola de aprobación con los datos de `ingestion_log` y botones aprobar/rechazar. |

## Componentes clave

`BusinessCard` (variantes `empresa` y `emprendimiento`), `CategoryTabs`,
`SearchBar`, `LeadForm`, `ReviewQueueTable`, `FolioBadge`.

## Decisiones de diseño

El objetivo es que la ficha se lea como una inscripción en un registro
oficial, no como una tarjeta de SaaS. En concreto:

- **Sin radius uniforme, sin sombra gris, sin gradientes de color.** Cada
  cartilla se define por sus reglas: filete superior en tinta para las
  empresas, borde de recorte lateral para los emprendimientos.
- **Folio real y correlativo.** Se asigna al aprobar (`nextFolio` en
  `lib/format.ts`), se muestra como `N° 0142` en cada ficha y no cambia.
- **Sello estampado**, rotado como un timbre, en toda ficha `empresa`. Es la
  única animación de la app: se estampa una vez al cargar, no en cada hover, y
  se apaga con `prefers-reduced-motion`.
- **Pestañas de carpeta**, no chips redondeados: la pestaña activa tapa la
  línea inferior para "abrir" la carpeta.
- **Separadores con filete vertical** (`.divisor-vertical`) en vez de `·` o `—`.
- **Sin mayúsculas sostenidas** en los rótulos de campo.
- Paleta y tipografía viven como tokens en `app/globals.css` (`@theme`); no se
  usan las escalas de color por defecto de Tailwind. Las clases del sistema van
  en `@layer components` para que las utilidades del marcado sigan ganando.

## Fase 2 sin migración estructural

`offer` ya trae `bookable` (por defecto `false`) y `priceClp`, así que activar
reservas y precios reales es cambiar datos, no el esquema. `media` y
`ingestion_log` están modelados aunque la fase 1 no los llene: el pipeline
OSINT escribe en `ingestion_log` y la cola de revisión ya lo lee.

## Verificado

- `npm run typecheck` y `npm run build` en limpio.
- Flujos end to end con Playwright: validación y envío de lead, autopostulación
  que cae en la cola, aprobación que asigna folio y publica la ficha.
- Las seis páginas revisadas con un chequeo automatizado: contraste AA en todo
  texto (compositando el alfa), foco de teclado visible en todos los elementos
  enfocables, un solo `h1` por página sin saltos de nivel, sin ids duplicados y
  sin desborde horizontal hasta 360 px.

## Estado

Fases 1 a 4 del spec están construidas. La fase 5 (pipeline OSINT como fuente
de `ingestion_log`) queda pendiente y no bloquea el lanzamiento: la cola de
revisión ya consume la tabla, así que conectar el pipeline es alimentarla.
