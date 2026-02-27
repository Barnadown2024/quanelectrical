# Quan Electrical — quanelectricial.com

Professional electrician website for **Kilkenny, Ireland** (Larry Quan). Built with Astro, Tailwind CSS, and a full Git-based CMS so content can be updated without touching code.

## Stack

- **Astro** — static site, SEO-friendly
- **Tailwind CSS v4** — styling (`@tailwindcss/vite` + `@tailwindcss/typography`)
- **MDX** — rich content (e.g. blog)
- **Decap CMS** — admin at `/admin`; content in Git (GitHub backend)
- **Cloudflare Pages** — host + optional Functions (OAuth, contact form)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).  
CMS admin: [http://localhost:4321/admin](http://localhost:4321/admin).

## Build & deploy (Cloudflare Pages)

```bash
npm run build
npx wrangler pages deploy dist --project-name quanelectricial
```

Or connect this repo in the Cloudflare Pages dashboard for automatic deploys on push.

## CMS (Decap) on Cloudflare Pages

Decap uses the **GitHub** backend. For login to work on Cloudflare Pages you need a GitHub OAuth proxy:

1. **GitHub OAuth App**  
   Create an app at [GitHub Developer Settings](https://github.com/settings/developers).  
   Homepage: `https://quanelectricial.com` (or your Pages URL).  
   Callback: `https://your-site.pages.dev/api/auth` (or your proxy URL).

2. **OAuth proxy**  
   Use a Cloudflare Worker/Pages Function that implements the [GitHub OAuth flow](https://decapcms.org/docs/github-backend/) and exposes `GET/POST /api/auth`.  
   Example projects: [decap-proxy](https://github.com/sterlingwes/decap-proxy), [netlify-cms-cloudflare-pages](https://github.com/i40west/netlify-cms-cloudflare-pages).

3. **Config**  
   In `public/admin/config.yml` set:
   - `backend.repo` → your GitHub repo (e.g. `your-username/quanelectricial-site`)
   - `backend.base_url` → your Cloudflare Pages URL (where the OAuth proxy runs)
   - `backend.auth_endpoint` → `api/auth`

Until the proxy is set up, use the CMS locally with [Decap’s local development flow](https://decapcms.org/docs/local-development/) (e.g. `npx decap-server`).

## Content structure (CMS-managed)

- **Site settings** — `src/data/settings.json` (phone, email, address, hours, social)
- **Services** — `src/content/services/*.md`
- **Projects** — `src/content/projects/*.md`
- **Testimonials** — `src/content/testimonials/*.md`
- **FAQs** — `src/content/faqs/*.md`
- **Blog** — `src/content/blog/*.mdx`

Uploads go to `public/uploads/`.

## About / copy

The “About” and service copy can be refined once Larry confirms experience, certifications, and exact service list. Placeholder content is based on public snippets (Lead Foreman, domestic/commercial/industrial, Dublin Institute of Technology).

## Scripts

| Command        | Action           |
|----------------|------------------|
| `npm run dev`  | Start dev server |
| `npm run build`| Production build |
| `npm run preview` | Preview build |
