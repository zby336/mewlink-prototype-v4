# MewLink — approved experimental prototype

This repository contains the complete source, tests, build scripts and built website for the UX11 version approved on 2026-11-03.

- Website: https://mewlink-experiments.vercel.app/
- Repository: https://github.com/zby336/mewlink-prototype-v4 (formerly `mewlink-experiments`; repository ID `1444108864` is unchanged).
- Experimental Figma copy: https://www.figma.com/design/7fVfuvgTh5E7zMGg2sDwKj. The recent website refinements have **not** been applied to Figma; existing design differences remain.
- Approved website snapshot: `dpl_4jFh3aALVjU74WFduQvmdPJFcjfS`, Vercel project `prj_8ennCAToI4d6FiFzmsOznsrFeBNo`.

See [the accepted release and verification](docs/approved-ux11.md) and [the 60-file website manifest](docs/approved-ux11-files.json). Source is in `src/` and `public/`; `dist/` contains the exact accepted Windows build. Immutable fonts and vendor resources are included in the portable bundle. No dependency install is needed for the current scripts.

```sh
npm test
npm run build
npm run dev
```

Node.js 22 or later is required. Vercel builds with `npm run build` and serves `dist/`, as configured in `vercel.json`. Gzip OS header bytes may differ between Windows and Linux; decoded application contents remain the same.

## Current functionality

- Care: compact zone needs, notifications, recommendations, sourced alerts and Care Basics.
- Twelve cat profiles, corrected photo framing, fixed **+ Add update**, fading caregivers, privacy preferences and a single visible eligible crown.
- Sage **Offer to check** for sourced next-visit requests; persistent offers appear in Follow-up, support Undo and do not count as completed care.
- Existing complete care-record flow: drafts, editable review, explicit cat confirmation, final-save-only state updates and separate optional sharing.
- Ask Mew and next-care suggestions share local source retrieval, dates, uncertainty handling and selected care references.
- Community: muted sage feed, local likes/comments/sharing and pull-to-refresh, with existing Group Chats below.
- Compact alert-report form, responsive footer/safe-area behavior, consistent avatar rings and reduced-motion support.

## Prototype boundaries

Care notes, posts, drafts, offers, reports and preferences are stored in the browser; they are not shared across devices or users. Fixture data is sample data, not verified real-world events. There is no account backend, database, operator report-review service or generative LLM/RAG service. Ask Mew and suggestions use local rules and sourced retrieval. Browser-local records are not included in GitHub.

The accepted backup repository `zby336/mewlink-prototype-v3`, backup website `mewlink-design-copy.vercel.app`, original Netlify and earlier Figma remain separate and untouched.

## Development history

The experiment was copied from the accepted backup on 2026-11-03, preserving its Git history. This approved synchronization includes all subsequent UX07–UX11 code changes. Earlier delivery reports describe historical states; their notes about deferred GitHub synchronization are superseded by this release. Figma synchronization remains deferred.

- [Original experiment baseline](docs/experiment-baseline.md)
- [UX07 delivery notes](docs/ux07-delivery.md)
- [UX08 delivery notes](docs/ux08-delivery.md)

The sections below describe earlier accepted versions and their boundaries at that time.

## Approved website release — 2026-10-28

This source and committed `dist/` match all 56 public files in the user-approved Vercel release `dpl_7Ub1ipNbsmFuRNfouwpsciMaJ65g`. GitHub synchronization was explicitly authorized after website acceptance. The existing repository was renamed from `mewlink-design-copy` to `mewlink-prototype-v3` (repository ID 1436038417).

Feature & UX Update 02 adds shared local care records, sourced rule-based Ask Mew retrieval and next-care suggestions, a Community social feed, and final-save-only feeding through the existing CareUpdate flow. The final UI polish aligns Cat profile with Like/Comment, places the caregiver stack on the right below the cat photo, removes visible demo badges and suppresses the duplicate stock observation disclaimer. See docs/approved-release.md for the accepted release and docs/feature-update-02.md for the earlier validation checkpoint.

## Feature Update 01 retained

- Compact caregiver avatar stacks on every available cat profile, using each person's latest valid care record and Singapore calendar dates.
- Four fading bands: 0–7 days 98%, 8–14 days 76%, 15–21 days 54%, 22–30 days 32%. More than 30 days is excluded. Counts are deduplicated; sightings, observations alone and offers to help are excluded.
- Stable per-browser shuffled order, at most five public avatars, and a +N overflow indicator.
- Caregiver details, individual/all-avatar display preferences, and a local demo identity-privacy switch. Private identities are omitted from presentation data and the expanded list while still counted.
- A viewport-bounded feeding sheet with a scrollable body, fixed action footer, bottom safe-area padding, keyboard containment and hidden underlying navigation.
- Profiles for the other existing cats reuse the current visual style and data. Tiger's observations, handover notes, photo diary and care update action remain.

## Data and privacy boundaries

All care records are demo data or locally saved prototype actions. There is no real account system, database, verified camera capture or cross-user privacy enforcement. Initials avatars match the existing circle's style; the four named demo caregivers are Aisha, Ravi, Wei and Mei Ling.

The demo fixture is timestamped once on the first visit and stored in the browser. It ages naturally instead of resetting its dates on every render. Only final confirmation appends a structured care record. Another cat requires an explicit selection; Not sure stores an unmatched record and does not change a cat's feeding state. Saving a note never publishes a feed post; sharing is a separate explicit action.

Hiding one or all avatars changes only this viewer's display settings. The own-identity switch simulates privacy only on this browser. Visible demo badges were removed at the user's request; the data and privacy boundaries remain documented here.

No LLM endpoint, vector database, AI API or backend is configured. Ask Mew and next-care suggestions use deterministic local record retrieval and curated guidance with dated sources. The draft action groups the user's own sentences. None of these are a live generative AI service.

## Work locally

Node.js 22 or newer; no runtime dependencies.

~~~sh
npm ci
npm test
npm run build
npm run dev
~~~

The local preview listens at http://127.0.0.1:4173.

- `src/*.dc.html`: readable original screen logic and templates.
- `public/caregiver-model.js`: recency, filtering, deduplication, stable order and local persistence.
- `public/caregiver-ui.js`: avatar/details components and reusable profiles.
- `public/care-knowledge.js`: shared saved-care store, drafts, identity confirmation, sharing, local retrieval and suggestions.
- `public/knowledge-ui.js`: observation cards/logs, sourced suggestions and Community feed.
- `public/update02.css`: focused Feature Update 02 styles.
- `public/feature-update.css`: feeding-sheet layout.
- `scripts/build.mjs`: builds the portable original runtime and assets into `dist/`.
- `dist/`: committed static deployment output.

The original bundled runtime, fonts, React vendor files and cat photos are preserved. Immutable font/vendor resources remain packed in vendor/ and are rebuilt without network access; UI source stays readable in src/. Photos remain the original Unsplash prototype references.

## Validation

27 automated tests cover caregiver recency/privacy, Singapore dates, drafts, identity selection, unmatched notes, final-save-only feeding, duplicate saves, sharing separation, knowledge retrieval, sources and failure to persist. All passed again when synchronizing this approved release to GitHub.

Browser tests completed the Tiger feeding flow at 360×640, 375×667, 390×844 and 1280×720. A 360×420 case also confirmed inner scrolling with an unobstructed footer. Existing Today, Cats, Community, Ask Mew and care-entry flows are checked separately.

Figma is an editable design reference. Website updates require code changes and a new deployment; editing Figma alone does not update the site.
