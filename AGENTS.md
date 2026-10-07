<!-- Purpose: project instructions for future coding assistants and student maintainers. -->
# OAC project rules

- Read the full user brief and existing code before changing anything.
- Plain HTML, CSS and vanilla JavaScript only; no build step. Ask the user before adding any dependency, framework or tool.
- Use Ponytail simplicity, but NEVER remove or reduce required comments or README documentation.
- Every file begins with a purpose comment. JSON uses `_comment` because JSON cannot contain comments. Every function has a plain-English comment explaining inputs, output and purpose.
- Mark actual shortcuts with `ponytail:` comments describing limits and the upgrade path.
- Keep community content in `/data` JSON. Never place secrets in front-end files.
- Design at 360px first. Use semantic HTML, keyboard support, labels, visible focus, at least 44px tap targets and reduced-motion support.
- Keep README setup, testing, limitations and handover guidance current with every phase.
- Build only the approved phase. After each phase, verify, commit, summarize and provide testing instructions. Wait for approval before the next phase.
- Do not claim live form integration, Lighthouse scores or browser testing without evidence.
