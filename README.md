<!-- Purpose: beginner setup, editing, testing and handover guide for the OAC website. -->
# Odisha Anime Community website

A lightweight website for anime and pop-culture fans in Bhubaneswar, Odisha. It uses HTML, CSS and JavaScript directly: no packages, framework or build step.

## Current status

Phases 1–4 provide all requested pages, including Home, Events, Tickets, Join, private Check-in, Volunteers, Donate, About/Community, Contact/FAQ and 404. They share OAC's black/red/gold design, original artwork, real community photos and editable JSON. All four website form actions have backend code, but live submissions require deployment/configuration. The existing Google signup form remains a fallback. Sample profiles, draft policies and unverified donation details remain clearly labelled.

Phases 1–4 are implemented; live backend configuration/testing is outstanding. Next: Phase 5 — SEO/accessibility/performance/CI/final handover.

## Folder guide

### OAC visual identity

Use black `#0C0C0C`, OAC red `#D91515`, and deeper gold `#F3B334` (deepened from the supplied `#FFC859`). The original yellow remains the gold hover shade. Warm off-white and lighter red support readable text. Theme colours live at the top of `css/style.css`; future pages must reuse them. The original manga-style speed lines, bold panel lettering, wheel motif and welcoming anime-family language connect anime fandom with Odisha without copyrighted characters. Brand red is used for accents and a white-text header button, rather than small red text on black.

- `index.html`: Home structure and static fallback event information.
- `events.html` and `tickets.html`: catalogue and ticket tier pages; both read the same event JSON.
- `join.html`: membership form and existing Google Form fallback.
- `checkin.html`: volunteer-only direct link, deliberately absent from public navigation and marked noindex. The backend—not link hiding—enforces its code and opening window.
- `volunteers.html`, `donate.html`, `about.html`, `contact.html`: volunteer profiles/application, donation explanation, story/rules/social links, and partnership enquiries/FAQ.
- `404.html`: lost-page recovery. Its labelled `<base href="/">` supports nested missing URLs on a root/custom-domain site; change it to `/REPOSITORY-NAME/` for a GitHub Pages project site before deployment.
- `css/style.css`: theme variables at the top, then shared components and responsive layouts.
- `js/home.js`: reads JSON safely and updates the countdown.
- `js/content.js`: shared JSON reader, safe ticket URLs and India-date event grouping.
- `js/events.js`: event cards, ticket tiers, calendar links and retry handling.
- `js/forms.js`: signup/check-in validation, confirmed receipts, retry and double-click prevention.
- `js/photos.js`: lazy-loaded community photo panels selected through JSON.
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
- `AGENTS.md`: rules for future coding sessions.
- `CONTRIBUTING.md`: branch, review and code-style instructions.
- `.gitignore`: excludes credentials and local temporary files.
- `apps-script/`: backend, detailed deployment guide and dependency-free mock Sheet checks.
- `.github/workflows/` will be added in Phase 5.

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

Announcements have `date`, `title`, and `text`. Social URLs must start with `https://`; empty URLs show a coming-soon label. Do not guess official social handles. Phase 1 has static event fallback text in `index.html` for failed downloads; update that fallback too if you replace the sample event before Phase 2.

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

Home, Events and Join use three selected group photographs from your local archive. Responsive JPEG copies range from roughly 50–232 KB instead of multi-megabyte downloads; image metadata is not carried into the web copies. The JSON selects each photo and its caption/alt text. These are real past memories, not images of the sample Halloween event. Confirm participant permission before public release. Originals remain untouched and local; include only `/assets/images/web` when publishing manually.

To replace a photo, save small 480px and 960px wide copies in `assets/images/web`, using a photo tool you already have. Aim for about 250 KB or less per copy. Set its `src`, `small`, `width`, `height`, `alt` and `caption` in `data/photos.json`; the width/height describe the large copy. Keep the record's `id` unchanged to reuse the current panel. Give alt text a concise description of the scene; do not identify members by name without permission. Whole frames are displayed to avoid cropping people out.

## Free hosting and custom domain

For GitHub Pages: create a GitHub repository, push these files, open Settings → Pages, select deployment from the main branch and root folder, then save. No build command is needed. Relative asset URLs support a repository subdirectory.

For Cloudflare Pages or Netlify: connect the repository, select a static site with no build command, and publish the repository root. Exact provider screens can change; confirm current provider guidance during Phase 5 deployment.

For a custom domain, add the domain in the hosting dashboard, copy the DNS records it supplies into your domain registrar, and wait for DNS and HTTPS activation. Domain registration may cost money even when hosting is free. Do not invent DNS records. Phase 5 will add the confirmed canonical domain to metadata, sitemap and robots.txt.

## Add a page

Copy the Home HTML structure into a new `.html` file. Replace the main content, title and description; keep the skip link, shared CSS, header/footer and labelled navigation. Set `aria-current="page"` only on the current page link. Use relative URLs and add the new page to both desktop and mobile navigation. Add editable content to `/data` and explain it here. Do this only in the page's approved phase.

## Testing checklist

- Serve over HTTP and open Home at 360px, 768px and desktop widths; check for horizontal scrolling.
- Tab through the page; confirm visible focus and the skip link. Verify all targets are easy to tap.
- Confirm Home links work and unfinished navigation explains the phase preview.
- Change an announcement or social link in JSON, refresh and confirm the change appears.
- Confirm countdown text refers to the sample date. Test invalid/past dates with the runnable check below.
- Temporarily block a JSON request in browser developer tools; verify retry messaging and readable fallback content.
- Disable JavaScript: the event fallback and preview explanation remain readable.
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
- The static fallback duplicates the sample event text; later event rendering must keep failure messaging accurate.
- Full browser/Lighthouse validation and CI are still pending; no score claim is made.

## Phase 1 verification record

Passed: JSON parsing, JavaScript syntax, Home local-file/anchor references, countdown future/past/invalid inputs, HTTPS-only social links, content loading over the preview HTTP server, and offline retry states. Logic checks used the existing Node runtime and a small DOM stub; they do not replace browser layout or accessibility testing. No dependencies were installed. Browser inspection was unavailable in this coding session, so 360px/desktop visual checks, keyboard behavior and Lighthouse remain manual checks for review.

Git was initialized for this project. If no author identity is configured, the first agent commit uses the command-scoped author `Codex <codex@localhost>`; this does not change your global Git settings. Future maintainers should set their own name and email before committing.

## Phase 2 verification record

Passed: JavaScript syntax, local page links and anchors, current-page navigation labels, India calendar-day boundaries, all-day and timed calendar URL generation, safe ticket URLs, three editable ticket tiers, unavailable event IDs, offline retry messaging and recovery. Checks ran against the actual scripts with a minimal DOM stub, not a browser. Browser layout, keyboard interaction and a real Google Calendar preview still require manual review. No dependencies were added.

## Phase 3 verification record

Passed against local mocks: membership validation and formula escaping, phone normalization, duplicate registration/attendance prevention, closed/expired-window rejection, wrong-code rejection before reading Members, event authorization, unknown-member results and busy-lock handling. Frontend checks covered entry retention, retry ID reuse, double-submit prevention, matching receipts and incorrect-receipt rejection. All page references and JSON/JavaScript syntax passed; no public check-in links were found. Three photos were compressed with Windows' built-in image APIs, preserving originals and requiring no dependencies. Browser layout and a live Google Sheet/CORS deployment remain unverified.

## Phase 4 verification record

Passed: all ten pages' local file links, anchors and unique IDs; JSON/JavaScript syntax; absence of public check-in links; backend validation and retry deduplication for all four actions; application/enquiry frontend retries and receipt success using mock DOM/fetch; literal volunteer text; safe local image paths; and disabled/verified/revoked donation rendering. Regression checks covered existing membership and attendance backend behavior. No dependencies were added. Visual browser, keyboard FAQ behavior, live Google Sheet submissions and hosting-specific missing-path handling still require manual checks. Phase 5 is not started.

## Handover guide

Give the next team repository access, hosting/domain ownership details and the list of official social links. Transfer Google Sheet and Apps Script ownership privately, never through commits. Explain which sample values still need confirmation. Walk through one JSON edit, one local preview and the testing checklist together. Review access when a student leaves. Record the approved phase and outstanding work in this README so the next maintainer can continue safely.
