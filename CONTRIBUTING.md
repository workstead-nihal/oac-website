<!-- Purpose: beginner contribution workflow and readable code conventions. -->
# Contributing to OAC

1. Start from the latest main branch: `git switch main`, then `git pull`.
2. Create a branch: `git switch -c update/event-details`.
3. Make one focused change. Content edits normally belong in `/data`.
4. Follow the README testing checklist, then inspect `git diff` for mistakes or secrets.
5. Commit: `git add .` then `git commit -m "Update Halloween event details"`.
6. Push your branch and open a pull request. Ask another student to review before merging.

Use short commit messages that say what changed: “Fix mobile event spacing”, not “stuff”.

## Code style

Use two-space indentation, descriptive names and ordinary functions. Start every file with its purpose and comment every function with its inputs, output and reason for existing. Explain surprising choices. Use `_comment` in JSON. Keep the README updated. Never add tools or dependencies without approval. Never commit passwords, member data or credentials.

Test at 360px and desktop, with keyboard navigation and reduced motion. Check JSON syntax, links and the browser console. If Node is already available, run `node checks/site-check.cjs --external` and `node apps-script/checks.cjs` before merging. GitHub Actions runs those checks on every push and pull request, using the runner's existing Node runtime and the official checkout action. No npm install or build command is required.

The site checker enforces whitespace, syntax, local links, selected accessibility basics, known contrast pairs and image/JavaScript budgets. It is not a full HTML/CSS validator, screen-reader test or Lighthouse audit. A public link's successful response proves reachability, not that a form submission works. Fix actual failures before merging; recheck a temporary network outage rather than removing its check.

Before the first public release, replace every `https://example.invalid/` value with the final HTTPS site URL (including a repository path if needed), set the deployed Apps Script endpoint, then run `node checks/site-check.cjs --release`. This configuration check does not replace a real test submission and browser review. Never change `no-cors` or treat an unconfirmed network response as success.
