# UX08 visual polish — 2026-11-03

Only the independent experimental website and local source were updated. No GitHub push/PR/remote file update and no Figma edit were performed. All UX07 functionality remains.

- Report: reduced from a 40px-high button to 28px, with 13px text and baseline alignment with Alerts. The live form flow is unchanged; opening and cancelling were checked.
- From the circle: stronger sage background `#D2E2C5`, while Group Chats retains its original warm background. Removed both the feed surface border and the final post's bottom border; intermediate post separators remain.
- Ask Mew placeholder: increased from 12px to 13px. At viewport widths up to 375px it uses 12.5px and slightly tighter spacing so the full text still fits. Typed text remains 16px.
- Personal cat rings: the same 64px outer diameter, 4px colour band and 2px cream inset as Care. TNR-completed rings now use Care's pale sage `#E2EADB`; the existing pale peach `#F7DDD0` remains for TNR not recorded as completed. No counts or status data changed.

## Validation

- All 78 existing tests passed; no new tests added for these reversible styling changes. Build and formatting check passed.
- 390 × 844 and 360 × 640 browser previews checked; the entire placeholder fits at 360px after focusing the input into view.
- Report measured 65 × 28px with baseline alignment.
- Compared Care and personal-page rings in the browser: matching 64px size, 4px padding, cream inset border and pale-sage colour.
- Feed background was confirmed in rendered styles; the feed container and last post both have a 0px bottom border.

Published by direct local-file deployment to `prj_8ennCAToI4d6FiFzmsOznsrFeBNo` as `dpl_4wxfBCxpgBmfQYvMk5pg1mPHD9TH` at https://mewlink-experiments.vercel.app/. The source remains uncommitted locally on base `1e14df94accae64fbb6f3f8dc2f4969234999877`, together with the deferred UX07 changes. Figma synchronization remains deferred.
