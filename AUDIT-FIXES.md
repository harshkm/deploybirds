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

### 2. Paste the Web3Forms access key (F-02)

Web3Forms is fully wired. One value is missing, in `contact.html`:

```html
<input type="hidden" name="access_key" value="PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE">
```

**To get it:** go to https://web3forms.com, enter `support@deploybirds.com`, and the
key arrives by email as a UUID. Paste it over the placeholder and commit — the key
is safe to commit publicly, it only permits sending to your own verified address.

**Until then**, submitting opens a pre-filled `mailto:` — nothing is lost, and it
never claims a delivery it cannot verify.

**⚠ If the key is ever wrong**, Web3Forms answers `403` with no CORS header, so the
browser reports only `Failed to fetch` and the real cause is invisible in the UI.
Verified against the live API from the `deploybirds.com` origin on 26 Aug 2026.
The handler prints an explicit diagnostic to the console for exactly this case —
check there first, then check the key.

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
| F-27 | No case studies or pricing | Content, not code. **Team is now done** — see below |
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


---

## Team section — real people replacing invented ones (F-27, partial)

The team grids on `about.html` and `launchpad.html` listed **three people who do
not exist**: Vikram Sharma, Ananya Roy and Rohan Mehta. Atul Jha was also listed
at "12+ years". Six fabricated entries across two pages.

Replaced with the four real engineers:

| Initials | Name | Role | Experience |
|---|---|---|---|
| AJ | Atul Jha | Founder · Cloud & Cybersecurity | 6+ years |
| AS | Anurag Singh | Lead SRE | 6+ years |
| HM | Harsh Mohur | Full-Stack Engineer | 5+ years |
| MS | Mohit Sharma | Security & Cloud | 12+ years |

Also added to the homepage JSON-LD as `employee` entries plus
`numberOfEmployees`, so search engines can associate real people with the
organisation.

**The bios are deliberately minimal.** They restate only the years and the domain
that were supplied — nothing else. That is the opposite of the previous copy,
which invented specifics ("Terraform infrastructure-as-code, multi-cloud
Kubernetes orchestration, and cost optimization audits") for a person who does
not exist. Expand them with real detail when you have it; do not let anyone
re-add invented credentials to a site that sells security audits.

**Two things to confirm:**
- **"Harsh Mohur"** is spelled exactly as supplied. The GitHub handle is
  `harshkm`, so check this is right before it goes any further.
- **Atul Jha's title** keeps "Founder" from the previous markup and pairs it with
  the Cloud & Cybersecurity specialism supplied. The old "Principal Architect"
  claim was dropped rather than carried forward unverified.

Still missing for full F-27: client names, case studies, a founding year, and any
pricing signal. Photographs would replace the initial avatars.


---

## Web3Forms integration (26 Aug 2026)

Wired against the documented API contract, not from memory:

```
POST https://api.web3forms.com/submit
Accept: application/json
body: FormData (multipart/form-data)
success: 200 {"success": true,  "message": "..."}
error:   4xx {"success": false, "message": "..."}
```

**Fields posted** — verified by intercepting a real request:
`access_key, subject, from_name, name, email, service, message, nda_consent`

**What changed from the first pass:**

- The honeypot was renamed `company_url` → **`botcheck`**, which is Web3Forms'
  *reserved* name. Their server now rejects a filled honeypot too, so a bot has
  to defeat both their check and ours. An unchecked checkbox is correctly absent
  from the FormData, so only a *filled* honeypot ever appears in the payload.
- `subject` and `from_name` added so the notification email is readable rather
  than arriving as "Notifications".
- The endpoint moved from a JS constant into the form's `action` attribute, so a
  **no-JS submit still posts correctly** (it lands on Web3Forms' own success
  page — adding a `redirect` field pointing at a thank-you page would improve
  that, but no such page exists yet).
- The key is read **at submit time**, not at page load, so it stays correct if
  the markup is ever templated.
- Error handling now reads the JSON body on the failure path and surfaces
  Web3Forms' own message, instead of discarding it and reporting a bare status
  code.

**Two findings worth recording:**

1. **The free tier is browser-only.** A `curl` POST from a server IP is rejected
   with *"This method is not allowed. Use our API in client side"* — regardless
   of whether the key is valid. Fine for this use (it is a browser form), but it
   means the success path cannot be smoke-tested from a script or from CI.
2. **An invalid key is indistinguishable from being offline**, in the UI. See the
   warning above.

**What could not be verified without the real key:** the success path. Everything
up to and including the API's rejection is verified. The moment the key is pasted,
submit the form once from the live site and confirm the email arrives.


---

## OG image cache busting (27 Aug 2026)

The social preview image is **content-hashed**: `assets/og-image.81a78ce4.png`.

**Why.** Facebook, LinkedIn and WhatsApp cache a preview image against its URL,
and the caches cannot be purged without an authenticated request:

- Facebook's scrape API needs an access token
  (`POST graph.facebook.com/?id=<url>&scrape=true&access_token=...`)
- LinkedIn's Post Inspector has no API at all — it needs a logged-in session

So when the accent green changed and the image was regenerated under the same
filename, every already-cached preview kept serving the old green. Changing the
URL sidesteps the problem entirely: there is nothing cached against the new one.

**If you regenerate the image, re-hash the filename.** Reusing a name puts you
straight back into the stale-cache problem.

```bash
# after regenerating assets/og-image.png
HASH=$(shasum -a 256 assets/og-image.png | cut -c1-8)
git mv assets/og-image.png "assets/og-image.$HASH.png"
# then update the 17 references across the 8 pages:
#   og:image, twitter:image, and the JSON-LD "image" field on index.html
grep -rln 'og-image' *.html | xargs sed -i '' "s|og-image\.[a-f0-9]*\.png|og-image.$HASH.png|g"
```

**Still worth doing manually once after any change**, because these platforms
also cache the *page metadata* separately from the image bytes:

| Platform | Where | Notes |
|---|---|---|
| Facebook / WhatsApp | developers.facebook.com/tools/debug/ | "Scrape Again" |
| LinkedIn | linkedin.com/post-inspector/ | needs to be logged in |
| Slack | — | self-expires in roughly 30 minutes |
| X / Twitter | — | card validator retired; refreshes on its own |
