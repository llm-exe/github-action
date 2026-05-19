#!/usr/bin/env bash
set -euo pipefail

tag="${1:-}"

if [[ -z "$tag" ]]; then
  echo "Usage: npm run release -- v1"
  echo "       npm run release -- v1.0.0"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This directory is not a git repository yet."
  echo "Initialize it, add the GitHub remote, then run this script again."
  exit 1
fi

npm ci
npm run verify
npm run build

git add \
  .gitignore \
  README.md \
  action.yml \
  dist/index.js \
  jest.config.cjs \
  package-lock.json \
  package.json \
  .prettierignore \
  .prettierrc.json \
  scripts/release.sh \
  src \
  tsconfig.json

if git diff --cached --quiet; then
  echo "No staged changes to commit."
else
  git commit -m "Release ${tag}"
fi

if git rev-parse "$tag" >/dev/null 2>&1; then
  tag_sha="$(git rev-parse "$tag")"
  head_sha="$(git rev-parse HEAD)"

  if [[ "$tag_sha" != "$head_sha" ]]; then
    echo "Tag already exists on a different commit: $tag"
    echo "  tag:  $tag_sha"
    echo "  HEAD: $head_sha"
    exit 1
  fi

  echo "Tag already exists on HEAD: $tag"
else
  git tag "$tag"
fi

git push origin HEAD
git push origin "$tag"

echo "Published ${tag}."
