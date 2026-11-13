# Navidey

Free and simple video hosting (React + Vite + Cloudflare Pages) for **navidey.site**.

## Fitur

- Upload video via proxy ke videy.co
- **Video src otomatis** pakai domain Cloudflare kamu  
  Contoh: `https://cdn.navidey.site/xxx.mp4` atau `https://cdn.navidey.pages.dev/xxx.mp4`
- **Iklan load dari API sendiri** (`/api/ad_type`)
- **Cloudflare Turnstile** protection pada form upload (Managed mode)

## Setup

```bash
npm install
npm run dev
```

## Build & Deploy (Pages)

```bash
npm run build
npx wrangler pages deploy dist --project-name=navidey
```

Lalu di Cloudflare Dashboard → Pages → Custom domains → tambahkan `navidey.site`.

## Setup Turnstile (sudah terintegrasi)

1. Di Cloudflare Dashboard → Turnstile → buat / edit widget (nama: **Navidey Security**)
2. Hostname: `navidey.site` (dan `*.navidey.site` jika perlu)
3. Mode: **Managed** (Recommended)
4. Copy **Site key** → sudah dipasang di `src/pages/Home.jsx` (`TURNSTILE_SITE_KEY`)
5. (Opsional tapi direkomendasikan) Simpan **Secret key** sebagai environment variable di Pages:
   - Settings → Environment variables → `TURNSTILE_SECRET_KEY`
   - Lalu verifikasi di `functions/api/upload.js` (lihat komentar di file)

## Setup CDN subdomain (penting)

Agar `https://cdn.navidey.site/xxx.mp4` bekerja:

1. Deploy worker CDN:
   ```bash
   cd worker
   npx wrangler deploy
   ```

2. Di Cloudflare Dashboard → Workers & Pages → worker `navidey-cdn`  
   → Settings → Domains & Routes → Add Custom Domain:
   - `cdn.navidey.site`

Setelah itu video player akan otomatis request ke:
```
https://cdn.<hostname-kamu>/<id>.mp4
```

## Structure

- `src/pages/` — Home (dengan Turnstile), VideoPlayer, Terms, Privacy, Report
- `src/config.js` — logic dynamic CDN berdasarkan hostname
- `functions/api/upload.js` — proxy upload ke Videy (+ siap untuk Turnstile verify)
- `functions/api/ad_type.js` — ads API
- `worker/video-proxy.js` — Worker proxy CDN + upload
- `public/favicon.ico`
