# Work update — 2026-06-16 (deps bump + Biome + ESLint pass)

Handoff note for continuing this work locally/offline. Everything below is
already committed and pushed to **`origin/chore/deps-bump`** (draft PR **#9**
→ base `simoleo89:Dev`). Nothing is lost if the cloud chat can't be resumed.

## How to resume offline

```bash
# in your local clone of Nitro-V3
git fetch origin
git checkout chore/deps-bump          # all the work below is here
yarn install                          # deps changed: in-range bump + Biome added

# renderer SDK as a sibling (needed for `yarn typecheck`):
cd .. && git clone https://github.com/duckietm/Nitro_Render_V3
cd Nitro_Render_V3 && yarn install && cd ../Nitro-V3

# sanity
yarn test          # expect 545/545
yarn typecheck     # needs the renderer sibling above
yarn lint:hooks    # CI gate — expect 0 errors
yarn format:check  # Biome
```

Then just run `claude` in the repo — it reads `CLAUDE.md` automatically. The
chat history won't carry over, but this file + the commit messages are the
context.

## What was done this session

### 1. PR housekeeping (separate from this branch)
- Closed **PR #7** (`feat/toolbar-habbo` → `simoleo89:main`); the cloud session
  can't write to the upstream repo (out of scope), so the user opened
  **duckietm/Nitro-V3#250** (`feat/toolbar-habbo` → `duckietm:Dev`) manually.
  English title/description were prepared for it.
- Diagnosed a `tsgo` **TS2305** on `feat/toolbar-habbo`: `VaultView.tsx` imports
  earnings packets (`RequestEarningsCenterComposer`, `EarningsCenterEvent`,
  `EarningsClaimResultEvent`, `IEarningsEntry`, `IEarningsReward`, …) that the
  local renderer doesn't export → must be added to the renderer SDK, not the client.

### 2. Dependencies (commit `659c23e`)
- `yarn upgrade` → all in-range bumps (lockfile only; `package.json` ranges
  unchanged). Notable: dompurify 3.4.8→3.4.10, @radix-ui/react-slider 1.3.6→1.4.1,
  eslint 10.4.1→10.5.0, typescript-eslint 8.60.1→8.61.1, sass 1.100→1.101,
  `@typescript/native-preview` (tsgo) → 20260616 build.
- **Held back the majors deliberately:** `@babel/runtime` 8 and `vitest` 4.

### 3. Formatter → Biome (commit `c57bac6`)
- Adopted **Biome 2.5.0** (`biome.json`, formatter-only; linter disabled; CSS/JSON
  excluded — they keep `@/` Vite aliases in `url()` that Biome's CSS parser rejects).
- Migrated all of `src/` from **Allman → 1TBS, 4-space indent** (the project's
  eslint config previously declared `brace-style: allman`).
- Removed the now-redundant stylistic rules from `eslint.config.mjs` (`indent`,
  `quotes`, `semi`, `brace-style`, `object-curly-spacing`, `no-multi-spaces`,
  `no-trailing-spaces`, `linebreak-style`) — **ESLint now covers correctness only.**
- New scripts: `yarn format` / `yarn format:check`.
- ⚠️ This touches ~1100 files → **will conflict with other open branches**
  (incl. #250). Merge/close or rebase those before landing this.

### 4. ESLint correctness pass (commits `fc32e65`, `312a625`, `a4d5c34`)
ESLint went from **1731 → 520** problems. Fixed for real:
- `no-unsafe-function-type` (15): `Function` → explicit signatures.
- `no-unused-expressions` (16): `cond && expr` → `if`/optional-chaining calls.
- `no-base-to-string` (~14): narrowed FormData.get + `Record<string,unknown>`
  furnidata fields to string; dropped object fallbacks in App error logging.
- `no-redundant-type-constituents` (ban.ts): `(string & {})` keeps literal autocomplete.
- `no-unescaped-entities` (1), `prefer-promise-reject-errors` (1).
- `no-empty-object-type` (264): `FC<{}>`→`FC`, empty interfaces → `type` aliases /
  `Record<string, never>`.

### 5. CI fixes (commits `0ad1342`, `dc4b5a8`)
- `tsgo` (newer, stricter build) flagged a real latent type hole: the
  backwards-compat fallback `select ? select(event) : event` in
  `createNitroQuery.ts` / `awaitMessageEvent.ts` → cast to the result type
  (`event as unknown as TData`/`R`).
- Biome reflow broke an `eslint-disable-next-line` in
  `useSessionSnapshots.test.tsx` (the intentional rules-of-hooks crash test) →
  switched to a `/* eslint-disable */ … /* eslint-enable */` block.

## Open items / next steps
- **CI:** as of last push (`dc4b5a8`) typecheck + lint:hooks + vitest all pass
  locally; confirm the GitHub run is green.
- **Remaining ESLint (~520, all left ON PURPOSE):**
  - react-hooks family (`set-state-in-effect` ~324, `exhaustive-deps` ~60,
    `react-compiler` ~70): **high behavioral risk**, many are intentional
    event-driven patterns; do by hand with in-app verification, NOT in bulk.
  - ~17 `no-redundant-type-constituents` reported as "acts as any": **sandbox
    false positives** from the absent renderer; valid on a real build — leave them.
- **Majors:** evaluate `@babel/runtime` 8 and `vitest` 4 separately.
- **Brace style discussion:** considered Stroustrup vs 1TBS; landed on **1TBS via
  Biome** (modern default, lets ESLint stop doubling as a formatter).
