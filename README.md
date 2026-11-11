# My_Portfolio

Static copy of the published portfolio site (https://artful-frame-journey.lovable.app/), saved exactly as it is currently deployed.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Hosting

Asset paths are absolute (`/assets/...`), so the site must be served from the domain root
(e.g. a custom domain on GitHub Pages, Netlify, or Vercel). `.nojekyll` keeps the `__l5e` folder
available on GitHub Pages.
