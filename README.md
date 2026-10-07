<!-- Purpose: beginner setup, editing, testing and handover guide for the OAC website. -->
# Odisha Anime Community website

A lightweight website for anime and pop-culture fans in Bhubaneswar, Odisha. It uses HTML, CSS and JavaScript directly: no packages, framework or build step.

## Current status

Phase 1 provides the Home page, original artwork, design system, responsive navigation, editable noticeboard and sample-event countdown. Navigation for unfinished pages leads to an explicit preview notice. Registration, check-in and payments are not available yet.

Planned phases: 2 — Events/Tickets; 3 — Join/Check-in/Google Apps Script; 4 — Volunteers/Donate/About/Contact/404; 5 — SEO/accessibility/performance/CI/final handover.

## Folder guide

- `index.html`: Home structure and static fallback event information.
- `css/style.css`: theme variables at the top, then shared components and responsive layouts.
- `js/home.js`: reads JSON safely and updates the countdown.
- `js/config.js`: the one clearly labelled place for the public Apps Script URL; currently empty.
- `data/events.json`: editable sample event and ticket details.
- `data/announcements.json`: Home noticeboard content.
- `data/links.json`: verified community social URLs; currently placeholders.
- `assets/favicon.svg`: small original wheel motif. Home artwork uses inline SVG and CSS, requiring no image downloads.
- `AGENTS.md`: rules for future coding sessions.
- `CONTRIBUTING.md`: branch, review and code-style instructions.
- `.gitignore`: excludes credentials and local temporary files.
- `apps-script/` and `.github/workflows/` will be added in their approved phases.

## Run locally

JSON loading needs an HTTP server; double-clicking `index.html` is not enough. If Python is already installed, open a terminal in this folder and run:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Stop the server with Ctrl+C. Python is an optional local utility, not a website dependency. If it isn't installed, ask for approval before installing any tool; an existing editor preview server can also serve this folder.

## Edit events, announcements and links

Open the corresponding file in `/data`, change the text inside quotes, save, then refresh the website. Keep commas between entries and never add a trailing comma. `_comment` explains the file and is not displayed. Prices are numbers without a rupee symbol. Dates use the formats shown in the sample.

The Halloween event is entirely editable SAMPLE data: 31 October 2026, Esplanade One, Bhubaneswar, horror cosplay and a chill party, early bird from ₹249. Confirm all details before release. `countdownDate` uses midnight in India to count toward the date; it does not claim an event start time. `startTime` stays null until confirmed. Event/ticket pages and calendar links are scheduled for Phase 2.

Announcements have `date`, `title`, and `text`. Social URLs must start with `https://`; empty URLs show a coming-soon label. Do not guess official social handles. Phase 1 has static event fallback text in `index.html` for failed downloads; update that fallback too if you replace the sample event before Phase 2.

## Volunteers

Phase 4 will add `data/volunteers.json` with names, roles, short descriptions and optional photos. Until then no volunteer information is collected or published. Obtain permission before publishing someone's photo or personal details.

## Google Sheet and Apps Script

Phase 3 will supply `/apps-script/` code and exact deployment steps after the existing Members tab, signup/check-in forms and column names are confirmed. Do not publish member records in this repository. The public endpoint will go in `js/config.js`; credentials never belong there. Live success/error testing requires a deployed endpoint and a test Sheet.

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

## Known limitations

- Phase 1 has no live forms, payment collection or member lookup.
- Social links, event information and tickets are placeholders; do not treat them as confirmed.
- A static site cannot protect check-in using a hidden page or client-side password. Phase 3 must document and enforce backend access controls and their limits before member lookup goes live.
- Google Fonts requires an external request; system fonts work if it fails. No analytics are installed.
- JSON needs an HTTP connection. Failed downloads show a refresh/retry message; offline caching is not implemented.
- The static fallback duplicates the sample event text; later event rendering must keep failure messaging accurate.
- Full browser/Lighthouse validation and CI are still pending; no score claim is made.

## Phase 1 verification record

Passed: JSON parsing, JavaScript syntax, Home local-file/anchor references, countdown future/past/invalid inputs, HTTPS-only social links, content loading over the preview HTTP server, and offline retry states. Logic checks used the existing Node runtime and a small DOM stub; they do not replace browser layout or accessibility testing. No dependencies were installed. Browser inspection was unavailable in this coding session, so 360px/desktop visual checks, keyboard behavior and Lighthouse remain manual checks for review.

Git was initialized for this project. If no author identity is configured, the first agent commit uses the command-scoped author `Codex <codex@localhost>`; this does not change your global Git settings. Future maintainers should set their own name and email before committing.

## Handover guide

Give the next team repository access, hosting/domain ownership details and the list of official social links. Transfer Google Sheet and Apps Script ownership privately, never through commits. Explain which sample values still need confirmation. Walk through one JSON edit, one local preview and the testing checklist together. Review access when a student leaves. Record the approved phase and outstanding work in this README so the next maintainer can continue safely.
