# v1.0.9 manifest integration

This patch folds the **manifest loader** into your v1.0.9 "full recipes + images" build to prevent
"Could not load grocery list" errors due to case-sensitive filenames or caching on GitHub Pages.

## Files
- `data/manifest.json`  — maps weekdays to JSON files
- `script.js`           — replaces your current loader with manifest-based loader (cache-busted)

## Install
1) Upload/overwrite **data/manifest.json** and **script.js** in your repository root.
2) Ensure these files exist with exact lowercase names in `/data/`:
   - monday_grocery.json
   - tuesday_grocery.json
   - wednesday_grocery.json
   - thursday_grocery.json
   - friday_grocery.json
   - saturday_grocery.json
   - sunday_grocery.json
3) Wait ~1 minute for GitHub Pages to refresh. Hard-refresh or add `?v=manifest` to your site URL once.

No other changes are required; all previous features (settings, image style toggle, onboarding, etc.) remain intact.
