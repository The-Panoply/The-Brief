# The Brief — Edition Archive

Each edition is a **frozen content snapshot** in `archive/editions/`. The current website loads that JSON into the current reader layout; old CSS and old website versions are not saved. Existing snapshots must never be overwritten.

- `index.json` is the catalog of saved editions. Entries are marked `published` or `preview`. The initial October 26, 2026 design study is a **preview**, not a historically published issue.
- Published issues contain their original `news` entries, `reddit` entries, source URLs, headlines, summaries, publisher order and editorial dates. Article links may become unavailable on the publisher's site.
- For each genuinely completed edition, prepare a validated JSON file with `type: "published"`, `displayDate`, `year`, `news` and `reddit` arrays (the fields used by the current `edition.json`). Optional `title` and `publishedDate` can also be supplied.
- Run `node scripts/archive-edition.mjs path/to/published-edition.json YYYY-MM-DD` locally. It refuses to archive design previews or replace an existing date, writes `archive/editions/issue-YYYY-MM-DD.json`, and appends its metadata to `archive/index.json`.
- Review both changes and commit/push to GitHub. Nothing is scheduled or automatically published by the helper.
- An archived issue has a stable URL like `#archive/issue-2026-10-27`. The active design and story interactions are reused. The Archive tab returns to its index, and Latest Edition returns to the current `edition.json`.
- A future edition becomes an archive entry only through an explicit saved snapshot and catalog update. Do not claim past issues exist if no such files were saved.

This archive is separate from the currently displayed `edition.json`. Updating the latest edition doesn't alter snapshots.
