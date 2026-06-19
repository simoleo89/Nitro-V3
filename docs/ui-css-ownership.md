# UI CSS Ownership

This project keeps shared window chrome in one place and lets feature CSS own only the parts that are truly feature-specific.

## Shared Card Chrome

`src/css/nitrocard/NitroCardView.css` owns the standard Nitro card look:

- `.nitro-card-shell`
- `.nitro-card-header-shell`
- `.nitro-card-title`
- `.nitro-card-close-button`
- `.nitro-card-content-shell`
- `.nitro-card-tabs-shell`
- `.nitro-card-tab-item`

Feature windows should use `NitroCardView`, `NitroCardHeaderView`, `NitroCardContentView`, and the shared tab components instead of restyling these selectors locally.

## Feature CSS

Feature CSS can own:

- window dimensions and responsive fit
- internal grids, lists, panels, rows, and buttons
- feature-specific artwork and sprites
- content spacing inside the card body
- functional tab layout when a feature needs unusual sizing

Feature CSS should not repaint standard card chrome with local backgrounds, borders, shadows, title styles, close-button styles, hover states, or active tab colors.

## Global CSS

`src/css/index.css` owns app-wide resets, root layout, and global utilities. It should not contain generic Nitro card chrome. The current intentional global card exception is `.nitro-wired`, because wired windows have a separate tool-like shell.

## Widget CSS

Static widget styles belong in `src/css/<area>/` and are imported from `src/index.tsx`. Avoid static `<style>` tags inside React components; they make ownership hard to audit and duplicate styles at render time.

Dynamic style tags are acceptable when the CSS is generated from runtime data, such as prefix/effect keyframes.

## Guardrails

CSS ownership is covered by:

- `src/css/nitrocard/NitroCardView.css.test.ts`
- `src/css/ui-css-ownership.test.ts`
