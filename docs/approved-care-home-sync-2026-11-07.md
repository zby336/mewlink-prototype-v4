# Approved Care Home v1.7 synchronization

The user approved the public experimental website and requested GitHub and Figma synchronization. The application source checkpoint is `29170df88da502c3e0d56a92b122cddbdc86b6d9`. This release includes all subsequent Care redesign refinements since UX11, complete source, tests, portable build resources, screenshots and historical release documentation.

- Repository: https://github.com/zby336/mewlink-prototype-v4.
- Public website: https://mewlink-experiments.vercel.app/.
- Approved immutable website: https://mewlink-experiments-f8rlko74w-zby336.vercel.app/ (`dpl_DEXU7gP58dMPubWcDDJ3fJWdfJT9`). No application or production deployment change was made during synchronization.
- Build: 63 files, 1,144,653 bytes. The source/build checkpoint was verified against all production hashes; [exact manifest](care-header-refresh-2026-11-07-files.json).
- Verification rerun during synchronization: all 119 tests passed.
- Backup branch: https://github.com/zby336/mewlink-prototype-v4/tree/backup/ux11-before-care-redesign-2026-11-07, still at `3faca356d68470fafcc3dd213736ed28fcffbfe5`.

## Figma — partial, not complete

The current Care page was captured into the experimental Design file at https://www.figma.com/design/7fVfuvgTh5E7zMGg2sDwKj?node-id=4006-85. Figma confirmed the capture import. The next structural inspection and screenshot requests were rejected because the Starter plan MCP tool-call quota was exhausted. Consequently, the import's layer structure, image content, fonts and visual match have not been verified or refined, and the remaining current screens and flows have not been synchronized. The original frames and backup files were retained.

This release therefore does not claim full Figma/code parity. When access is available again, continue from imported node `4006:85`, inspect it, build/refine editable components and synchronize the other current screens. Do not recapture or replace this work without checking the file first.

Browser-local care records, posts, drafts, profile photos and preferences are not uploaded to GitHub. The app remains a frontend prototype with local source retrieval; no shared backend or generative LLM service was added.
