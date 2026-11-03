# UX07 — focused experimental website update, 2026-11-03

Scope: local code and `https://mewlink-experiments.vercel.app/` only. Do not synchronize GitHub or Figma until the user explicitly approves that later step. The accepted backup website and original projects remain untouched.

## Changes

1. Care recommendation buttons and profile Add update actions have a short press scale, colour and shadow response. Profile actions now use the existing dark brown with cream text. Reduced motion keeps colour feedback without scaling. All existing record entry and save behavior remains.
2. The Alerts heading has a red `Report` button with cream text. Select one current alert, describe the problem, and save. Reports retain the alert/source-record IDs, title, time and text under `mewlink-alert-reports-v1`. The form supports validation, cancel, a scrollable body, safe-area footer and storage failure recovery. A report never edits a care record, changes alert status or publishes a social post. There is no backend review queue or administrator notification; success explicitly says it was saved on this device.
3. Generic profile photos use content-aware landscape crops rather than top crops. Milo and Biscuit retain their full portrait source with individually checked CSS framing, since automatic entropy crops favoured their bodies. Original photo identities and user-supplied/data URLs are preserved. All twelve current profiles were visually checked.
4. Crown selection uses valid, deduplicated care in the existing Singapore 30-day window. Choose the highest count, then the latest valid care timestamp; identical timestamps use a stable ID tie-break. Avatar ordering stays shuffled. An eligible visible winner is kept inside the maximum-five avatar stack. Existing privacy rules remain: a hidden or private winning identity is not exposed or replaced by a promoted runner-up. All twelve default profiles showed exactly one crown in browser checks.
5. From the circle has a soft sage background; Group Chats keeps the original warm background. Pull down from the top to refresh, or use the refresh icon. Touch and mouse paths have a release threshold, horizontal/short/cancel/retraction handling, repeated-refresh protection and cleanup. Refresh rereads existing saved local posts; it preserves likes, comments, unfinished comment text and explicit sharing. It never fabricates new posts or resets the whole page. Group Chats remains below the feed and opens normally.

## Validation

- 78 automated tests passed, 0 failed, including original record-save/privacy/identity/sharing behavior and new report, crown and pull-refresh cases.
- Production build: 60 files, 1,078,057 bytes. Formatting check passed.
- Browser: all twelve profiles checked; Kopi, Milo and Biscuit face framing explicitly confirmed; each default avatar stack had one crown.
- Care and profile Add update enter the existing flow with the right cat target (Tiger and Kopi checked).
- Report selection, text entry, submit and success checked; at 360 × 640 the Save report button bottom was 624px, fully above the viewport edge.
- Community inspected at a 390 × 844 mobile viewport and in a desktop browser. Actual mouse pull triggered Refreshing; refresh-button feedback and opening #general below the feed passed.
- Gesture unit tests cover touch-equivalent vertical movement, horizontal motion, short pulls, retraction, cancellation, current-scroll position and concurrent refreshes. A physical phone touch test has not been performed.

## Synchronization

- Local base commit: `1e14df94accae64fbb6f3f8dc2f4969234999877`.
- Production deployment: `dpl_2dvFEjLdxM7oFq8NhHjpx7GVA8an`, direct static-file deployment to project `prj_8ennCAToI4d6FiFzmsOznsrFeBNo`.
- No GitHub push, PR or remote file changes; no Figma edits.
- Modified source, tests and rebuilt dist remain in this checkout for later synchronization. Browser-local reports and posts are not part of the source repository.
