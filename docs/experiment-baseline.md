# Independent experiment baseline — 2026-11-03

The user requested an independent experimental copy of GitHub, Vercel and Figma, preserving the currently accepted versions as backups. No application feature, style or record fixture was changed in this copy operation.

## Active experiment targets

Update on 2026-11-03: the same repository was renamed to `mewlink-prototype-v4` (ID unchanged). Its current URL is https://github.com/zby336/mewlink-prototype-v4. The links and verification below describe the initial copy checkpoint.

- Repository: https://github.com/zby336/mewlink-experiments (ID `1444108864`), branch `main`.
- Vercel project: `mewlink-experiments`, ID `prj_8ennCAToI4d6FiFzmsOznsrFeBNo`.
- Website: https://mewlink-experiments.vercel.app/.
- Figma: https://www.figma.com/design/7fVfuvgTh5E7zMGg2sDwKj, named MewLink — Experiments.

Only use these targets for subsequent experimental changes. Do not rename, archive, delete, push to, or redeploy the backups unless separately instructed.

## Preserved backups

- Repository: https://github.com/zby336/mewlink-prototype-v3 (ID `1436038417`), baseline `d4b1faa5a79b9a79b642b4cfe71f52f275007120`.
- Website: https://mewlink-design-copy.vercel.app/.
- Vercel project: `prj_fS9ASrBNwGmu1zLARZQzYWWerC0u`.
- Approved deployment: `dpl_G7w2fPbaZ1fZk7S5AZHg2cZguow3`.
- Figma: https://www.figma.com/design/mjKHxlL2JUoyMlluQcqZls.

The November 2 baseline commit changes only the public URL in README. All application files still correspond to accepted release commit `92bcca3fa87758afa969ae18495cd73071599327`. The new repository retains this history.

## Copy boundaries

- The entire Figma file was duplicated natively, preserving editable content, local components, styles and the existing screen map. Its earlier design-to-website synchronization gap is retained, not silently declared resolved.
- The prototype has no shared backend. Browser-local notes, drafts, onboarding and preferences belong to each website origin. The new origin starts with its own browser state and does not overwrite the backup's local records. Seed dates and locally accumulated counts can therefore differ despite identical code.
- Shared original image URLs remain external image references.
- Figma edits do not automatically become website code. Website code and Figma must still be updated together for future changes.

## Baseline verification

- The new repository was imported from the original with all Git history.
- All 69 automated tests passed; the local rebuild matches all 60 SHA-1 entries in `docs/approved-2026-10-30-files.json` (1,065,079 bytes).
- The experimental website was deployed from this new GitHub repository to production. Every public file was fetched and checked: 52 files are byte-identical, and the other eight differ only at the gzip operating-system header byte. Their uncompressed content is identical. No application content differs.
- All 60 public backup files were also fetched and remain byte-identical to the accepted manifest.
