# Audit fixes — 26 August 2026

Branch: `fix/audit-p0-p2` · Commit: `9a8aaef` · 24 of 29 findings closed.

Full audit report: https://claude.ai/code/artifact/fd160a01-2d33-43a3-a6ad-e4ed70b2412a

---

## ⚠️ Two things need YOU before this goes live

### 1. The site is still down — DNS (F-01)

The `CNAME` file in this repo points GitHub Pages at `deploybirds.com`, so every
URL under `harshkm.github.io/deploybirds/` now `301`s there. That domain has **no
address record at all**:

```
$ dig +short deploybirds.com A       (empty)
$ dig +short deploybirds.com AAAA    (empty)
$ curl http://deploybirds.com/       000 — connection failed
```

Only `MX` (GoDaddy mail) and an SPF `TXT` exist. Nameservers are
`ns21/ns22.domaincontrol.com`, so the records go in **GoDaddy DNS**:

```
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
CNAME  www    harshkm.github.io
```

Then: repo → **Settings → Pages → Enforce HTTPS** (wait ~15 min for the cert).
The redirect currently targets `http://`, so without this every visitor takes an
insecure hop.

**If the domain isn't ready yet**, deleting the `CNAME` file restores the
`github.io` URL in about a minute. I left the file untouched — removing it
changes production routing, and that's your call, not mine.

### 2. The contact form needs an endpoint (F-02)

The form no longer fakes success, but it can't deliver anything until you set one
line in `js/main.js`:

```js
const FORM_ENDPOINT = '';   // ← set this
```

Options:

| Service | Endpoint | Notes |
|---|---|---|
| Web3Forms | `https://api.web3forms.com/submit` | free, needs an `access_key` hidden field |
| Formspree | `https://formspree.io/f/xxxxxxxx` | free tier is 50/month |
| Getform | `https://getform.io/f/xxxxxxxx` | free tier is 50/month |
| Lambda + SES | your own | keeps leads inside your AWS account |

**Until it's set**, submitting opens a pre-filled `mailto:` to
`support@deploybirds.com`. Slower, but it never claims a delivery it can't verify.

---

## What changed

### Blocking

| ID | Finding | Fix |
|---|---|---|
| F-01 | Site 301s to a domain with no DNS | **Not fixed — see above.** Needs a DNS change |
| F-02 | Form discarded every enquiry | Real `fetch`, error handling, `mailto:` fallback, `name=` attributes, honeypot, `aria-live` status |
| F-03 | No mobile nav below 360px; CTA covered the wordmark | Header CTA hidden below 768px; hamburger given `flex-shrink: 0` |

### High

| ID | Finding | Fix |
|---|---|---|
| F-04 | Copy clipped at 320px | `min-width: 0` on flex/grid children; `minmax(min(360px,100%),1fr)`; `minmax(0,1fr)` tracks; section top padding |
| F-05 | 5 service deep-links pointed at nothing | `id` added to all 12 service cards + `scroll-margin-top` |
| F-06 | 12 `?service=` links never read | `URLSearchParams` pre-fills the dropdown |
| F-07 | 8 dead `href="#"` links | Repointed to the matching service anchors |
| F-08 | No reduced-motion; loop never paused | `prefers-reduced-motion` block; `visibilitychange` pause |
| F-09 | No keyboard focus ring | `:focus-visible` on all interactive elements + skip link |
| F-10 | three.js parser-blocking, no SRI | `defer` + `integrity` + `crossorigin` |
| F-11 | Fonts on a 4-hop `@import` chain | Moved to `<head>` with `preconnect`; dropped IBM Plex Sans (requested, never used) |

### Medium

| ID | Finding | Before | After |
|---|---|---|---|
| F-12 | `--text-muted` failed AA | 3.61:1 | **5.69:1** |
| F-13 | Card text failed over the 3D scene | 3.73:1 worst case | **6.22:1** |
| F-14 | Borders below 3:1 | 1.27 / 2.19:1 | `--border-field` at **3.32:1** on interactive edges |
| F-15 | Inputs triggered iOS auto-zoom | 15.2px | **16px** |
| F-16 | 18 declarations below the 12px floor | down to 9.6px | **13px minimum** |
| F-17 | 27 ad-hoc sizes, 2 fluid | — | 8 tokens, 4 fluid; 54 inline sizes migrated |
| F-18 | Zero images, favicon 404 | — | favicon set + 1200×630 OG image |
| F-19 | No canonical/OG/JSON-LD/robots/sitemap/404 | — | all added |
| F-20 | Heading levels skipped | `h1→h3`, `h2→h4` | no skips on any page |
| F-21 | Personal Gmail ×14 | — | `support@deploybirds.com` |

### Low

| ID | Finding | Fix |
|---|---|---|
| F-22 | Countdown never expired | Fixed `COHORT_CLOSES` date + expiry state. **Update each cohort** |
| F-23 | Header CTA renamed on 5 of 6 pages | "Get a Quote" everywhere |
| F-25 | Drawer had no way out | Closes on link / Escape / outside tap; `aria-expanded`; scroll lock |
| F-26 | No privacy policy | `privacy.html` added, linked from every footer and the consent line |
| F-28 | `innerWidth` read in the scroll path | Cached, refreshed on resize |
| F-29 | No WebGL fallback | `.no-webgl` guard + static gradient backdrop |

### Left open deliberately

| ID | Finding | Why |
|---|---|---|
| F-24 | Homepage is ~10 screens tall | Cutting 9 stages to 5 is an editorial call |
| F-27 | No case studies, team, or pricing | Content, not code — and the highest-leverage thing left |
| F-28 | 156 inline `style=` attributes | Partly addressed (font sizes migrated); full extraction is a refactor |
| F-10 | three.js is still r128 (2021) | `three-scene.js` uses APIs that changed after r155; needs its own pass |

---

## Verification

Everything below was measured, not assumed.

```
32 page/viewport combinations   1440 / 768 / 390 / 320 px × 8 pages
  → no clipped or overflowing elements
  → no text below 12px
  → no skipped heading levels
  → no console errors, no 4xx requests
  → hamburger reachable at 320px, 76px clear of the wordmark

Behaviour
  → drawer: opens, Escape closes, link closes, aria-expanded tracks, body locks
  → form: 6 named fields, ?service=security pre-fills, honeypot present,
           does NOT claim success without an endpoint
  → #security anchor resolves, lands 104px down (clear of the header)
  → reduced motion: 0 canvases created, layer hidden, content still visible
  → first Tab lands on the skip link with a 2px focus ring

Performance
  FCP        788ms → 520ms
  Requests   7 → 6          (favicon 404 gone)
  Fonts      0 loaded → 25 faces, 2 families (was 3 requested)
  Hidden tab 60fps loop → 0.002s CPU over 2s
```

Reproduce locally:

```bash
python3 -m http.server 8899
open http://localhost:8899/
```

---

## Notes for whoever picks this up

- **`css/style.css`** — the audit fixes are appended in four clearly commented
  blocks at the end of the file, so they win on equal specificity. Read them
  before editing the rules above; several exist specifically to override
  something earlier in the sheet.
- **Type scale** — use `--fs-xs` … `--fs-4xl` only. Any new hard-coded
  `font-size` re-introduces F-17.
- **`--border-card` vs `--border-field`** — `card` is decorative (1.66:1),
  `field` is for anything a user must see to operate (3.32:1). Don't swap them.
- **The `sr-only` headings** on services / insights / about / 404 exist to keep
  the heading outline unbroken without changing the visual design. Removing them
  re-introduces F-20.
- **`COHORT_CLOSES`** in `js/main.js` is a real date now. It will genuinely
  expire, which is the point — put a reminder somewhere.
