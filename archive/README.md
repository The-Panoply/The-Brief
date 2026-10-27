# The Brief — Edition Archive

Each edition is a **frozen content snapshot** in `archive/editions/`. The current website loads that JSON into the current reader layout; old CSS and old website versions are not saved. Existing snapshots must never be overwritten.

- `index.json` is the catalog of saved editions. Entries are marked `published` or `preview`. The initial October 26, 2026 design study is a **preview**, not a historically published issue.
- Published issues can preserve their original `news` entries and companion `reddit` entries under the same issue ID, including source URLs, headlines, original Reddit post text, publisher order and editorial dates. The current Archive reader displays the news entries; a paired historical Reddit Home reader is a proposed enhancement, not yet enabled. Article links may become unavailable on the publisher's site.
- News dropdowns favor the `openingParagraph` string when a permitted source-provided lead/excerpt is available. If that field is absent, the existing `summary` array continues to render. Keep original publisher attribution and links. Editorial value is story selection and prioritization; no generated mini-analysis is required for each article. A private-use intention does not by itself make publicly hosted GitHub Pages content private.
- For each genuinely completed edition, prepare a validated JSON file with `type: "published"`, `displayDate`, `year`, `news` and `reddit` arrays (the fields used by the current `edition.json`). Optional `title` and `publishedDate` can also be supplied.
- Run `node scripts/archive-edition.mjs path/to/published-edition.json YYYY-MM-DD [issue-label]` locally. The optional label distinguishes multiple requests on the same day (for example, `morning` and `evening`). It refuses to archive design previews or replace an existing issue, writes `archive/editions/issue-YYYY-MM-DD[-issue-label].json`, and appends metadata to `archive/index.json`.
- Review both changes and commit/push to GitHub. Nothing is scheduled or automatically published by the helper.
- An archived issue has a stable URL like `#archive/issue-2026-10-27`. The active design and story interactions are reused. The Archive tab returns to its index, and Latest Edition returns to the current `edition.json`.
- A future edition becomes an archive entry only through an explicit saved snapshot and catalog update. Do not claim past issues exist if no such files were saved.

This archive is separate from the currently displayed `edition.json`. Updating the latest edition doesn't alter snapshots.

## Possible paired Reddit Home editions

The existing JSON snapshot format retains Reddit posts next to the news stories from a given editorial session. This is deliberate future compatibility, not a change to the current visible reader. If a linked Reddit Home archive is approved, show the saved posts for that **same issue**, not the current live Reddit panel. Editorial selection of posts does not require generated summaries of their content. Treat separate requests as separate issue IDs; do not assume different requests made on the same date are the same session. Separate later-saved companion snapshots may be appropriate when the news and Reddit selections occur at different times; do not overwrite older immutable snapshots to add them.
