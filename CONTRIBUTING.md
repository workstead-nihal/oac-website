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

Test at 360px and desktop, with keyboard navigation and reduced motion. Check JSON syntax, links and the browser console. Automated CI is scheduled for Phase 5; until then these checks are manual.
