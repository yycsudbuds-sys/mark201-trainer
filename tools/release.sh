#!/usr/bin/env bash
# One-command pre-deploy pipeline (run from the repo root with the local server on :8791):
#   bash tools/release.sh            # validate + build + every test suite
#   bash tools/release.sh --quick    # validate + build + node tests + verifier only
# Exits non-zero on the first failure. Deploy afterwards with: git commit, merge to main, push, tag.
set -euo pipefail
cd "$(dirname "$0")/.."
export PYTHONIOENCODING=utf-8
echo "== validate FIN 201 chapters"
for n in 08 09 10 11 12 13; do python tools/validate_fin201.py "$n" | tail -1; done
echo "== bundle"
python tools/build_fin201.py
python tools/build.py
echo "== node tests"
node tools/engine_test.mjs > /dev/null && echo "engine_test ok"
node tools/nobleed_test.mjs | tail -1
echo "== independent solver"
python tools/verify_fin201.py 8 | tail -1
if [ "${1:-}" = "--quick" ]; then echo "quick pipeline passed"; exit 0; fi
echo "== browser suites (local server must be running on 127.0.0.1:8791)"
python tools/username_test.py | tail -1
python tools/sync_test.py | tail -1
python tools/smoke_test.py | tail -1
python tools/checklist.py | tail -1
python tools/probe_fin201.py | tail -1
echo "release pipeline passed"
