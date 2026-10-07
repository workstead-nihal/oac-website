<!-- Purpose: beginner setup, editing, testing and handover guide for the OAC website. -->
# Odisha Anime Community website

A lightweight website for anime and pop-culture fans in Bhubaneswar, Odisha. It uses HTML, CSS and JavaScript directly: no packages, framework or build step.

## Current status

All five implementation phases are present: the requested pages plus Showcase, the OAC theme, real community photos, editable JSON, all four Apps Script form actions, static SEO metadata and automated checks. Live submissions still require deployment/configuration, and the official URL is https://joinoac.in/; launch still requires hosting/DNS/HTTPS and real browser/Lighthouse verification. The existing Google signup form remains a fallback. Sample profiles, draft policies and unverified donation details are clearly labelled.

This repository is ready for your final review and remaining account/domain setup; it has not been published by this coding session. Do not treat local mock checks as proof of live integration or a Lighthouse score.

## Folder guide

### OAC visual identity

Use black `#0C0C0C`, OAC red `#D91515`, and deeper gold `#F3B334` (deepened from the supplied `#FFC859`). The original yellow remains the gold hover shade. Warm off-white and lighter red support readable text. Theme colours live at the top of `css/style.css`; future pages must reuse them. The original manga-style speed lines, bold panel lettering, wheel motif and welcoming anime-family language connect anime fandom with Odisha without copyrighted characters. Brand red is used for accents and a white-text header button, rather than small red text on black.

- `index.html`: Home structure and generic event fallback; actual event details come only from JSON.
- `events.html` and `tickets.html`: catalogue and ticket tier pages; both read the same event JSON.
- `join.html`: membership form and existing Google Form fallback.
- `checkin.html`: volunteer-only direct link, deliberately absent from public navigation and marked noindex. The backend—not link hiding—enforces its code and opening window.
- `volunteers.html`, `donate.html`, `about.html`, `contact.html`: volunteer profiles/application, donation explanation, story/rules/social links, and partnership enquiries/FAQ.
- `CNAME`: GitHub Pages custom domain, containing only `joinoac.in`. This platform configuration cannot contain a purpose comment; its purpose is documented here instead.
- `404.html`: lost-page recovery. Its labelled `<base href="/">` supports nested missing URLs on a root/custom-domain site; change it to `/REPOSITORY-NAME/` for a GitHub Pages project site before deployment.
- `css/style.css`: theme variables at the top, then shared components and responsive layouts.
- `js/home.js`: reads JSON safely and updates the countdown.
- `js/content.js`: shared JSON reader, safe ticket URLs and India-date event grouping.
- `js/events.js`: event cards, ticket tiers, calendar links and retry handling.
- `js/forms.js`: signup/check-in validation, confirmed receipts, retry and double-click prevention.
- `js/photos.js`: lazy-loaded community photo panels selected through JSON.
- `showcase.html`: winners, artwork and community highlights; accessible from desktop navigation and mobile More.
- `data/showcase.json`: editable showcase entries with category, title, creator credit, detail, sample flag and optional local image metadata.
- `js/community.js`: volunteer cards, story, rules, FAQ, social links and verified-only donation rendering.
- `js/config.js`: the one clearly labelled place for the public Apps Script URL; currently empty.
- `data/events.json`: editable sample event and ticket details.
- `data/announcements.json`: Home noticeboard content.
- `data/links.json`: verified community social URLs; currently placeholders.
- `data/photos.json`: photo paths, descriptions and captions that you can edit without touching page code.
- `data/volunteers.json`: editable showcase entries; currently labelled sample profiles with initials.
- `data/community.json`: editable story, draft code of conduct, FAQ and disabled donation settings.
- `assets/images/web/`: compressed copies of your original community photographs. Large originals stay in your local `assets/images` folder and are excluded from Git. Only publish the web copies.
- `assets/favicon.svg`: small original wheel motif. Home artwork uses inline SVG and CSS, requiring no image downloads.
- `assets/og-cover.jpg`: original 1200×630 OAC sharing card (about 71 KB), used by static Open Graph metadata.
- `sitemap.xml` and `robots.txt`: public-page indexing list and crawler guidance. Check-in/tests are excluded from discovery; robots.txt is not authentication.
- `AGENTS.md`: rules for future coding sessions.
- `CONTRIBUTING.md`: branch, review and code-style instructions.
- `.gitignore`: excludes credentials and local temporary files.
- `apps-script/`: backend, detailed deployment guide and dependency-free mock Sheet checks.
- `.github/workflows/checks.yml`: formatting, syntax, local/public link and backend checks on push/PR.
- `checks/`: browser fixtures and a dependency-free Node source/link/accessibility checker.
- `.editorconfig` and `.gitattributes`: consistent two-space indentation and portable text line endings.
- `.nojekyll`: disables Jekyll processing for plain GitHub Pages hosting.

## Run locally

JSON loading needs an HTTP server; double-clicking `index.html` is not enough. If Python is already installed, open a terminal in this folder and run:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Stop the server with Ctrl+C. Python is an optional local utility, not a website dependency. If it isn't installed, ask for approval before installing any tool; an existing editor preview server can also serve this folder.

## Edit events, announcements and links

Open the corresponding file in `/data`, change the text inside quotes, save, then refresh the website. Keep commas between entries and never add a trailing comma. `_comment` explains the file and is not displayed. Prices are numbers without a rupee symbol. Dates use the formats shown in the sample.

The Halloween event is entirely editable SAMPLE data: 31 October 2026, Esplanade One, Bhubaneswar, horror cosplay and a chill party, early bird from ₹249. Confirm all details before release. `countdownDate` uses midnight in India to count toward the date; it does not claim an event start time. `startTime` and `endTime` stay null until confirmed. Calendar links create an all-day reminder with a warning until both times are supplied. Confirmed ISO timestamps such as `2026-10-31T18:00:00+05:30` create timed entries; the end must follow the start. Opening a calendar link does not automatically save an event: visitors review and save it in Google Calendar themselves.

Add an event by copying one object in the `events` array and giving it a unique `id`. Events are grouped and sorted by India calendar date; the current date remains upcoming until midnight. Invalid event dates are omitted. Home picks the next upcoming event. Past events appear in the archive without booking buttons. `tickets.html?event=YOUR-ID` selects a particular upcoming event; an unknown or past ID shows an unavailable message.

Each tier has `name`, `price` and `description`. The sample includes early bird ₹249, group pricing to be confirmed, and premium pricing to be confirmed with take-home goodies. A `null` price displays “Price to be confirmed”; do not invent an unapproved price. Set `ticketUrl` to the organiser-approved HTTPS ticketing URL. All tiers link to that platform, where visitors choose and pay; no financial details enter this site. Empty or unsafe URLs display a sales-unavailable notice. `sample: true` visibly labels catalogue details; only switch it off after confirmation.

Announcements have `date`, `title`, and `text`. Social URLs must start with `https://`; empty URLs show a coming-soon label. Do not guess official social handles. Home's fallback is intentionally generic, so an event edit requires only JSON and cannot leave an old venue/date visible after a failed download. The sample badge hides when `sample` is false. A confirmed start time becomes the countdown target; otherwise the date-only reminder remains.

## Volunteers

Edit `data/volunteers.json`. Each entry has `name`, `initials`, `role`, `line`, `photo` and `sample`. Replace the labelled sample names with approved real profiles, then set `sample` to false. `photo: null` displays initials; an approved path such as `assets/images/web/volunteer-name.jpg` displays a lazy-loaded photo. Missing photos fall back to initials. Use a small square photo, obtain permission, and never put phone/email details in public JSON.

The application form collects name, email, city, help area, availability, a short message and consent. Applications go to the private `OAC_Volunteers` tab only after a confirmed receipt. Submission is not a promise of a volunteer role. Organisers review the tab and reply privately; there is no automatic email sender.

## About, FAQ, contact and donations

Edit `story`, `rules` and `faq` in `data/community.json`. Each rule has `title` and `text`; each FAQ has `question` and `answer`. FAQ uses native expandable `<details>` controls so keyboard support needs no library. The About copy avoids invented founding dates and member counts; its draft policies require team approval.

The Contact form is for venue/mall partnerships, sponsors, brands and community enquiries. It collects name, email, organisation (individuals can write “Individual”), topic, message and consent; it does not need a phone number. Confirmed submissions go to `OAC_Enquiries`. Contact is not an emergency channel and no response time is promised.

Donations start disabled. In `data/community.json`, fill `donation.upiId`, `recipientName`, and a local `qrImage` path under `assets/images/web`, then set `verified: true` ONLY after checking that the QR and ID both lead to the approved recipient. Also review funding descriptions and the note. Blank, invalid or unverified settings keep a visibly non-scannable placeholder. Recheck the displayed recipient inside your own UPI app before public release; do not make a test payment unless the team explicitly authorises it. The website does not process payments, store banking details, or invent tax/refund claims.

Desktop navigation reaches every public page. On mobile, More jumps to the footer's accessible community links; there is no JavaScript menu to maintain. Check-in remains absent from public navigation. The root `404.html` is recognised by common static hosts; verify actual missing-path routing after deployment, since hosting settings differ.

## Google Sheet and Apps Script

Follow [the complete setup guide](apps-script/README.md). Start with a test Sheet, confirm the Members row-1 headers, map existing headers without renaming Google Form columns, add private Script Properties, run `setupOAC`, deploy a public web app and paste its `/exec` URL into `js/config.js`. Member records, the Sheet ID and volunteer access code never belong in this repository. Live success/error testing requires your actual endpoint and Sheet.

Your existing signup link is recorded in `data/links.json` and shown on Join. Keep the legacy check-in form URL in private team notes, not public website files. It is an independent Google Form: close its responses separately when check-in is not in use.

For the website, set `CHECKIN_ENABLED`, `CHECKIN_OPENS_AT`, `CHECKIN_CLOSES_AT`, `ACTIVE_EVENT_IDS` and a private `CHECKIN_CODE` in Apps Script Properties. The page remains closed unless the backend says the window is open. The backend rejects requests outside the window, even if someone discovers the URL or leaves the form open. You can toggle it off immediately and schedule automatic opening a few hours before the event. Only share `checkin.html` with volunteers; do not add it to public navigation.

Website submissions validate on both ends, use a honeypot, disable double submits, and require a matching server receipt. An uncertain request stays in the tab for retry with the same request ID. Membership is unique by phone; attendance is unique by event/phone under a shared write lock. No names or contact lists are returned by check-in. The success screen uses your approved WhatsApp/Discord JSON links; until supplied, it honestly labels them as coming soon.

### Community photos

Home, Events, Join, Volunteers and About reuse three selected group photographs from your local archive. Responsive JPEG copies range from roughly 50–232 KB instead of multi-megabyte downloads; image metadata is not carried into the web copies. JSON selects each photo and its caption/alt text. These are real past memories, not images of the sample Halloween event. Confirm participant permission before public release. Originals remain untouched and local; publish only `/assets/images/web` from the image archive. Failed photo downloads hide their panel; responsive choices are assigned before the fallback image to reduce unnecessary downloads.

To replace a photo, save small 480px and 960px wide copies in `assets/images/web`, using a photo tool you already have. Aim for about 250 KB or less per copy. Set its `src`, `small`, `width`, `height`, `alt` and `caption` in `data/photos.json`; the width/height describe the large copy. Keep the record's `id` unchanged to reuse the current panel. Give alt text a concise description of the scene; do not identify members by name without permission. Whole frames are displayed to avoid cropping people out.

## Free hosting and custom domain

The website needs no package install or compilation. Keep the Apps Script deployed separately; a static host cannot execute `.gs` files.

For GitHub Pages:

1. Create a public repository on the team's GitHub account. This folder already has Git history; do not reinitialise it. Set your own author identity before new commits.
2. Add the repository's remote URL with `git remote add origin YOUR-REPOSITORY-URL` if none exists. Push your existing branch. The initial commits used `master`; choose that branch in hosting settings, or deliberately rename it to `main` with `git branch -m main` and push that branch.
3. Open repository Settings → Pages. Select deployment from a branch, choose your actual branch and `/ (root)`, then save. `.nojekyll` keeps this a plain static site. Follow [GitHub's Pages guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) if the dashboard changes.
4. Review the published URL and Actions results. For a project URL such as `https://TEAM.github.io/REPOSITORY/`, change the labelled `<base href="/">` in `404.html` to `/REPOSITORY/`. Root/custom-domain sites keep `/`.
5. Open a missing nested address and check that 404 links, styles and navigation still work. No deployment has been performed here.

For Cloudflare Pages, import the repository through Workers & Pages → Create application → Pages → Import an existing Git repository. Select the actual branch, no framework preset, `exit 0` as the optional no-op build command and the repository root (`.`) as the output directory. This does not introduce a website build step. See [Cloudflare's static HTML guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/).

For Netlify, import the Git repository, leave the build command empty and set the publish directory to the repository root (`.`). If uploading manually, use a clean copy of the tracked website files, never the local original-photo archive or credentials. See [Netlify's deployment guide](https://docs.netlify.com/deploy/create-deploys/). A Git connection is easier to hand over because it publishes reviewed commits.

For a custom domain:

1. Add the owned domain in the host's domain settings; select your preferred root or `www` address.
2. Copy the exact current DNS records from that provider's instructions into your registrar's DNS settings. Do not guess record values. GitHub has [custom-domain guidance](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).
3. Wait for domain verification and HTTPS activation, then enable HTTPS enforcement where offered.
4. Use the final HTTPS address in the metadata steps below and retest the forms from that origin.
5. Keep domain renewal and recovery access with the team. Hosting can be free while domain registration costs money; provider plan limits and policies can change.

### Selected host: GitHub Pages at joinoac.in

The team selected GitHub Pages. Local preparation is complete, but the GitHub owner is `workstead-nihal`, but repository creation and authenticated account access are still pending, and DNS/HTTPS have not been changed or verified. `CNAME` declares the custom domain for branch-based Pages publishing; it does not publish the site by itself.

1. Create or select a public repository owned by the OAC team. Push this existing Git history and tracked files; do not upload ignored original photos, private Sheet exports or credentials.
2. In repository Settings → Pages, choose Deploy from a branch, `master`, `/ (root)` (or the actual branch if renamed). The existing Website checks workflow validates changes; Pages itself handles publishing without a website build step.
3. Verify domain ownership in the GitHub account/organisation Pages settings using the exact TXT record GitHub generates. Keep that verification record. In the repository Pages settings, save `joinoac.in` as the custom domain **before changing the website DNS records**.
4. Open the domain's DNS dashboard through your Google Workspace/domain account. Public DNS checked during preparation points to Squarespace nameservers; the actual domain DNS dashboard must be confirmed in your account. Keep the existing nameservers for this approach.
5. Replace the existing root website A records with the following GitHub Pages records. Set `www` to the owning GitHub username/organisation's `.github.io` hostname (no protocol or repository path). The chosen GitHub owner is `workstead-nihal`; the planned repository is `oac-website`.

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | workstead-nihal.github.io |

Preserve Workspace email MX records, SPF/DKIM/DMARC TXT records, domain-verification records and unrelated services. Review existing root AAAA records too: old website IPv6 targets must not remain pointed at a different host. GitHub's optional IPv6 records and current instructions are in its [custom-domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

6. Wait for the Pages DNS check and certificate provisioning. DNS propagation and HTTPS availability can take up to 24 hours. Enable Enforce HTTPS when available.
7. Verify `https://joinoac.in/`, `https://www.joinoac.in/` (redirecting to the official root), HTTPS redirects, certificate validity, all page/image paths, a missing nested URL and the GitHub checks run. Retest Google forms from this origin once the endpoint is configured. Record actual results before calling the site live.

### SEO and sharing setup

The confirmed official domain is `https://joinoac.in/`. Canonical links, `og:url`, `og:image`, sitemap entries and the robots sitemap line use this HTTPS address. Domain configuration in these files does not confirm that DNS or hosting is live.

Configure `joinoac.in` in your chosen hosting provider and follow its exact DNS instructions. If the domain changes later, update the absolute URLs in all HTML files, `sitemap.xml` and `robots.txt` together. Normal event/profile/photo updates still need only JSON edits.

Each public page has a title, description, canonical link, Open Graph tags and a large-image card. Crawlers can read these without running JavaScript. Keep a new page's sharing title/description aligned with its HTML title/description, and add its absolute URL to `sitemap.xml`. Never put Check-in or test pages in the sitemap. Follow [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) for submission after release.

With an existing Node runtime, run `node checks/site-check.cjs --release` after configuring the domain and Apps Script URL. It rejects those setup placeholders but cannot confirm DNS, Google permissions, response readability or live writes. Test those separately. Use the browser's Lighthouse panel in mobile mode on each public page, save the results privately with the release notes, and fix actual failures until the target of 90+ is met. No Lighthouse run or score is claimed here.

## Add a page

Copy the Home HTML structure into a new `.html` file. Replace the main content, title and description; keep the skip link, shared CSS, header/footer and labelled navigation. Set `aria-current="page"` only on the current page link. Use relative URLs and add the new page to both desktop and mobile navigation. Add editable content to `/data` and explain it here. Do this only in the page's approved phase.

## Testing checklist

- Serve over HTTP and open Home at 360px, 768px and desktop widths; check for horizontal scrolling.
- Tab through the page; confirm visible focus and the skip link. Verify all targets are easy to tap.
- Confirm all public navigation links and mobile More work; Check-in must have no public navigation entry.
- Change an announcement or social link in JSON, refresh and confirm the change appears.
- Confirm countdown text refers to the sample date. Test invalid/past dates with the runnable check below.
- Temporarily block a JSON request in browser developer tools; verify retry messaging and readable fallback content.
- Disable JavaScript: generic event fallback and navigation remain readable; no stale event details should be presented as current.
- Enable reduced motion in OS/browser settings; no smooth scrolling or transitions should remain.
- Inspect the browser console and Network panel. No missing local files or unexpected errors should appear during normal use.
- Before launch, run mobile Lighthouse and fix issues. Scores of 90+ are targets, not verified results yet.

`checks/home-check.html` runs the countdown and social-URL checks in a browser using the actual Home script. Open it through your local server and look for “All checks passed”. No test dependency is required.

For Phase 2, open Events and Tickets from both navigation bars. Confirm three sample tiers, no invented group/premium prices, and no booking button until a verified URL exists. Open the Google Calendar link and inspect the sample date, venue and all-day warning without saving it. Add a temporary past event to JSON and check the archive; restore it afterwards. Block the JSON request and test the Retry button. Open `checks/events-check.html` for calendar encoding, India date boundaries and safe URL checks.

For Phase 3, open `checks/forms-check.html` in your HTTP preview; its fetch calls are mocked, and it should display “All checks passed”. If Node is already installed, `node apps-script/checks.cjs` verifies the backend against a fake Sheet without sending real data. Do not install a runtime without approval. Follow the backend guide's test-copy checklist for real integration: closed/wrong-code/expired checks must not write attendance, retries must not duplicate rows, and a green confirmation must match a row in the test Sheet. Check 360px layout, keyboard labels and photo loading manually.

For Phase 4, check all new pages at 360px and desktop. Try mobile More and keyboard FAQ controls. Edit a volunteer role or FAQ in JSON and refresh; verify sample labels and missing-photo initials. Ensure Donate shows a non-payment placeholder by default. Open `checks/community-check.html` for safe text/image rendering and donation state checks. Test volunteer/contact validation, honeypots, consent and duplicate retry against the test deployment; run `setupOAC()` and redeploy the updated backend first. Open `/404.html` directly locally; test a missing nested URL on the deployed host, not just the development server.

## Known limitations

- Website forms need a deployed endpoint and confirmed Members headers. No live Google Sheet submissions have been verified. The existing signup form remains available.
- Social links, event information and tickets are placeholders; do not treat them as confirmed.
- Hidden navigation/noindex does not secure check-in. Apps Script enforces a shared private code, allowed event IDs and a bounded time window. A shared code has no per-volunteer identity, and a public endpoint can still receive spam traffic. Close the independent legacy Google Form separately. See the backend guide for detailed limits.
- In-tab retention prevents silent loss during a network failure while the tab stays open, but does not survive a PC shutdown, crash or reload. No personal details or access codes are stored in localStorage.
- Google Fonts requires an external request; system fonts work if it fails. No analytics are installed.
- JSON needs an HTTP connection. Failed downloads show a refresh/retry message; offline caching is not implemented.
- Canonical/social/sitemap URLs use the confirmed domain `joinoac.in`; DNS, hosting and HTTPS still require verification before launch.
- The custom CI checker is intentionally narrow: formatting, tag pairing, selected labels/contrast, syntax, paths and asset budgets. It does not replace standards validators, screen-reader testing, visual review or Lighthouse. External reachability checks do not prove form submissions work.
- The workflow is written and its commands are tested locally; its actual GitHub run is pending a repository push. Browser/Lighthouse and live Google Sheet validation remain pending; no score or production-readiness claim is made.

## Phase 1 verification record

Passed: JSON parsing, JavaScript syntax, Home local-file/anchor references, countdown future/past/invalid inputs, HTTPS-only social links, content loading over the preview HTTP server, and offline retry states. Logic checks used the existing Node runtime and a small DOM stub; they do not replace browser layout or accessibility testing. No dependencies were installed. Browser inspection was unavailable in this coding session, so 360px/desktop visual checks, keyboard behavior and Lighthouse remain manual checks for review.

Git was initialized for this project. If no author identity is configured, the first agent commit uses the command-scoped author `Codex <codex@localhost>`; this does not change your global Git settings. Future maintainers should set their own name and email before committing.

## Phase 2 verification record

Passed: JavaScript syntax, local page links and anchors, current-page navigation labels, India calendar-day boundaries, all-day and timed calendar URL generation, safe ticket URLs, three editable ticket tiers, unavailable event IDs, offline retry messaging and recovery. Checks ran against the actual scripts with a minimal DOM stub, not a browser. Browser layout, keyboard interaction and a real Google Calendar preview still require manual review. No dependencies were added.

## Phase 3 verification record

Passed against local mocks: membership validation and formula escaping, phone normalization, duplicate registration/attendance prevention, closed/expired-window rejection, wrong-code rejection before reading Members, event authorization, unknown-member results and busy-lock handling. Frontend checks covered entry retention, retry ID reuse, double-submit prevention, matching receipts and incorrect-receipt rejection. All page references and JSON/JavaScript syntax passed; no public check-in links were found. Three photos were compressed with Windows' built-in image APIs, preserving originals and requiring no dependencies. Browser layout and a live Google Sheet/CORS deployment remain unverified.

## Phase 4 verification record

Passed: all ten pages' local file links, anchors and unique IDs; JSON/JavaScript syntax; absence of public check-in links; backend validation and retry deduplication for all four actions; application/enquiry frontend retries and receipt success using mock DOM/fetch; literal volunteer text; safe local image paths; and disabled/verified/revoked donation rendering. Regression checks covered existing membership and attendance backend behavior. No dependencies were added. Visual browser, keyboard FAQ behavior, live Google Sheet submissions and hosting-specific missing-path handling still require manual checks. Phase 5 was pending at this checkpoint; see the final record below.

## Phase 5 verification record

Passed: source formatting and JavaScript syntax, all ten pages' local links/anchors/tag pairing, JSON content paths, selected accessibility and colour-contrast checks, image/script size budgets, sitemap exclusions and reachability of the existing public signup link. Backend mock checks passed for all four actions. Updated Home rendering and form success/error focus passed with DOM stubs. No dependencies were added. The GitHub workflow runs these same commands after a push; it has not yet run on GitHub. Browser layout, screen-reader/keyboard review, Lighthouse, domain hosting/HTTPS and live Google Sheet integration remain release checks.

## Handover guide

Give the next team repository access, hosting/domain ownership details and the list of official social links. Transfer Google Sheet and Apps Script ownership privately, never through commits. Explain which sample values still need confirmation. Walk through one JSON edit, one local preview and the testing checklist together. Review access when a student leaves. Record the approved phase and outstanding work in this README so the next maintainer can continue safely.

### Before the next team launches

1. Connect the confirmed domain `joinoac.in` to the host, verify HTTPS and test a missing nested URL on the host.
2. Confirm Members column headers; deploy and configure the Apps Script endpoint using `apps-script/README.md`. Use a test Sheet for the full receipt/retry checklist before accepting real members.
3. Replace all sample events, volunteer profiles, social/ticket links and donation placeholders with approved community content. Confirm permission to publish participant photos.
4. Record hosting, domain renewal, Sheet and script owners in a private team handover document. Share account access through the providers, never passwords in this repository.
5. Complete the browser/mobile/Lighthouse checklist, push the repository and inspect the Website checks run before launch.
6. For each event, let the event lead set and close the backend check-in window, rotate the private code and close the independent legacy check-in form.

At handover, demonstrate editing one JSON file, previewing the page, running the existing checks and reverting an accidental edit with Git. Keep unresolved release checks above visible until they have evidence of completion.

## Showcase updates

Edit `data/showcase.json` to add winners, artwork or other community highlights. Each item has `category` (`winners`, `artwork` or `highlights`), `title`, `creator` (public credit), `detail` and `sample`. Set `sample: false` only after the team confirms the entry. No real awards or artwork were invented; initial entries are labelled layout samples. Remove them when adding approved submissions.

For an image, place a compressed JPG/PNG/WebP under `assets/images/web/` (under 300 KB). Use a filename with letters, digits, hyphens or underscores, put its path in `image`, and supply descriptive `alt` plus its actual pixel `width` and `height`. Keep `image: null` for a visible placeholder. Images preserve their proportions and lazy-load. Publish only work/photos approved by the creator and people shown; obtain permission for any third-party material. Contact is an enquiry route, not an upload form.

Review Showcase at 360px and desktop, follow its links from desktop and mobile More, and test retry with its JSON request blocked. Open `checks/community-check.html` to check literal text, unsafe image rejection and empty categories. Local source/link checks and renderer DOM-stub checks passed; visual/browser review remains pending.

## Social platform links and icons

The user-supplied official Instagram, Discord invite and WhatsApp group HTTPS URLs are configured in `data/links.json`. Update them there when accounts or invite links change. Keep an empty URL until verified; the website shows a coming-soon label instead of sending visitors to an invented account. Home and About show all three platforms; membership success offers the configured WhatsApp and Discord links. Small local SVG platform symbols live in `assets/icons/`, require no external icon request or package, and are decorative beside readable text. These are simplified monochrome symbols, not downloaded official brand artwork.

Test an actual link after editing JSON, including whether group invites have expired. Review icon alignment at 360px and desktop and tab through the social buttons. Do not publish an invite intended to remain private.

### Home photograph

Home uses the `home` entry in `data/photos.json`, sourced from the team-provided `assets/images/DSC00453.JPG`. Compressed 480px and 960px copies live at `assets/images/web/oac-home-480.jpg` and `oac-home-960.jpg`; the original stays local and ignored by Git. Edit this entry to change Home’s photo, alt text or caption. The other pages retain their own photo entries. Preview Home at phone and desktop widths to check the picture and caption.
