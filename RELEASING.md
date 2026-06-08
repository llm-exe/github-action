# Releasing

This Action is released with the same draft-then-publish flow as the [`llm-exe`](https://github.com/llm-exe/llm-exe) SDK. Consumers pin a floating major (`uses: llm-exe/github-action@v1`) or minor (`@v1.4`) tag and automatically get the latest patch; the immutable `vX.Y.Z` tag is also available for exact pins.

## What ships

A GitHub Action runs the committed `dist/index.js`, not `src/`. CI rebuilds the bundle on every PR and fails if `dist/` drifts from source, so the bundle must be built and committed before a release. Build it with `npm run build`.

## Versioning

`package.json` `version` is the single source of truth. The floating tags follow:

- `v1.4.5` immutable, one per release, gets a GitHub Release.
- `v1.4` moves to the latest `v1.4.x`.
- `v1` moves to the latest `v1.x.x`.

Pre-releases (`v2.0.0-beta.0`) get an immutable tag and a GitHub pre-release, but never move the floating `v2` / `v2.0` tags.

## Steps

1. Open a PR into `main` that bumps `package.json` `version` to the next version and includes a freshly built `dist/` (`npm run build`).
2. On the PR, two gates must pass:
   - **CI / Tests** runs `npm run verify` on Node 20 and 22 and checks `dist/` is in sync.
   - **Release / Check Semver** confirms `package.json` version is greater than the latest stable `vX.Y.Z` tag.
3. Merge the PR. **Release / Create Draft** builds a draft GitHub Release tagged `vX.Y.Z` with cleaned, auto-generated notes.
4. Review the draft release notes, then click **Publish**.
5. **Release / Publish** checks out the released tag, re-verifies `dist/`, and re-points the floating `v1` and `v1.4` tags to the released commit. If anything fails, the release is reverted to draft.

## First release

There are no `vX.Y.Z` tags yet (only a legacy `v1`), so the semver check treats the latest stable version as `0.0.0`. Set `package.json` `version` to your first release (for example `1.0.0`) in step 1. Publishing it creates `v1.0.0` and moves the existing `v1` tag onto that commit.

## Local fallback

`npm run release -- v1.4.5` (see `scripts/release.sh`) builds, commits, tags, and pushes from your machine. It does not create a GitHub Release or move the floating tags, so prefer the workflow flow above for normal releases.
