# The-Brief

## Home Screen application and appearance

- `manifest.webmanifest` uses relative identity, start URL and scope for this GitHub Pages project.
- `icons/` contains opaque 180, 192 and 512 pixel adaptations of the existing navy/gold favicon. The browser favicon is unchanged.
- On iPhone/iPad, open the published HTTPS site in Safari and use Share → Add to Home Screen; enable Open as Web App if offered.
- Appearance follows `prefers-color-scheme`; no manual switch or saved theme override is introduced.
- No service worker or offline content cache is registered. Content continues through the existing online publication workflow; there is no app cache to version or clear.
- Keep the manifest identity and project path stable when publishing updates. A future move needs a separate migration plan.

## Current-edition-only policy (November 21, 2026)

- At the reader's request, this website maintains only the live `edition.json`; the historical archive and archive-navigation feature have been retired and deleted from the current branch.
- A new daily edition replaces the previous live edition. Same-day requests to add more stories append to the current edition without removing existing selections.
- Do not generate a new archive snapshot, archive index, or automatic historical backup during publication. The separate Kindle EPUB is optional delivery, not a mandatory preserved edition.
- Earlier publishing instructions that require archive snapshots are historical on this point; the reader's November 21 direction controls.

## Website held as a clean prototype (November 22, 2026)

At the reader’s express request, `index.html` currently displays only the existing masthead/header and a blank main element. The prior current-edition material was cleared from `edition.json` (empty arrays); no editorials, archive, or Reddit panel is rendered. `app.js`, styles, icons, manifest and other design assets are preserved for an optional later test of displaying Kindle EPUB content on the website. Send to Kindle EPUB is the primary deliverable, not automatic web publication. Earlier website material remains recoverable through Git history. No new scheduled publishing or deletion of repository history was authorized.
