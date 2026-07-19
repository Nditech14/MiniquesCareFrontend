# MiniquesCare — Next.js Frontend

A clean, production-ready Next.js 15 frontend for MiniquesCare — a healthcare platform combining a pharmacy, diagnostic laboratory, and supermarket.

## Tech Stack
- **Next.js 15** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Lucide React** (icons)
- **Google Fonts** — Playfair Display + DM Sans

## Brand Color
Primary: `#25D366` (WhatsApp green — healthcare trust)

## Project Structure

```
src/
├── app/
│   ├── page.tsx               ← Landing page (Hero, Services, Why Us, CTA)
│   ├── pharmacy/page.tsx      ← Drug catalog with search & category filter
│   ├── laboratory/page.tsx    ← Lab tests with sample type filter
│   ├── supermarket/page.tsx   ← Product catalog
│   ├── blog/
│   │   ├── page.tsx           ← Blog listing
│   │   └── [id]/page.tsx      ← Blog detail
│   └── admin/
│       ├── layout.tsx         ← Admin sidebar layout
│       ├── login/page.tsx     ← Admin login
│       ├── page.tsx           ← Dashboard
│       ├── drugs/page.tsx     ← Drug CRUD + image manager
│       ├── laboratory/page.tsx← Lab test CRUD
│       ├── supermarket/page.tsx← Product CRUD + image manager
│       ├── blogs/page.tsx     ← Blog CRUD + publish/unpublish
│       ├── categories/page.tsx← Category management
│       └── store-info/page.tsx← Store details form
├── components/
│   ├── Navbar.tsx             ← Sticky nav with mobile menu
│   ├── Footer.tsx             ← Full footer with links & contact
│   ├── WhatsAppButton.tsx     ← Fixed WhatsApp float button
│   ├── ui.tsx                 ← ProductCard, SearchBar, CategoryPill, PageHero, etc.
│   └── admin.tsx              ← AdminTable, Modal, Field, Input, etc.
├── lib/
│   ├── api.ts                 ← Full API client for all endpoints
│   └── auth.ts                ← Token management (localStorage)
└── types/index.ts             ← TypeScript interfaces
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local → set NEXT_PUBLIC_API_URL to your backend URL

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Public Pages (Customer-Facing)

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, services overview, WhatsApp CTA |
| `/pharmacy` | Browse drugs by category & name, enquire via WhatsApp |
| `/laboratory` | Browse lab tests by category & sample type |
| `/supermarket` | Browse supermarket products |
| `/blog` | Health articles listing |
| `/blog/[id]` | Individual blog post |

## Admin Pages (Protected)

| Route | Description |
|-------|-------------|
| `/admin/login` | Admin login |
| `/admin` | Dashboard |
| `/admin/drugs` | Drug CRUD, image upload/delete |
| `/admin/laboratory` | Lab test CRUD |
| `/admin/supermarket` | Product CRUD, image upload/delete |
| `/admin/blogs` | Blog CRUD, publish/unpublish, image management |
| `/admin/categories` | Category management (Drug/Lab/Supermarket) |
| `/admin/store-info` | Store contact info, opening hours, social links |

## Customer Actions

- ✅ Browse pharmacy drugs, lab tests, and supermarket products
- ✅ Filter by category (pills)
- ✅ Search by name
- ✅ Filter lab tests by sample type
- ✅ Enquire/book via WhatsApp (per item)
- ✅ Global WhatsApp floating button
- ✅ Read health blog posts
- ✅ View store contact info in footer

## Deploy

```bash
npm run build
npm start
```

Or deploy to Vercel — set `NEXT_PUBLIC_API_URL` in project settings.
