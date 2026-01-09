#!/usr/bin/env python3
import json, os, sys

root = os.getcwd()
print(f"Validating repo at: {root}")

# 1. hacs.json
hacs_path = os.path.join(root, 'hacs.json')
if not os.path.isfile(hacs_path):
    print('ERROR: hacs.json not found')
    sys.exit(1)
try:
    with open(hacs_path,'r',encoding='utf-8') as f:
        hacs = json.load(f)
except Exception as e:
    print('ERROR: could not parse hacs.json:', e)
    sys.exit(1)
print('✓ hacs.json parsed')

# 2. content_type
ct = hacs.get('content_type')
if ct:
    print('content_type:', ct)
else:
    print('content_type: (not set)')

# 3. dist JS file
dist_dir = os.path.join(root, 'dist')
if not os.path.isdir(dist_dir):
    print('ERROR: dist/ directory missing')
    sys.exit(1)
js_files = [f for f in os.listdir(dist_dir) if f.endswith('.js')]
if not js_files:
    print('ERROR: no .js files in dist/')
    sys.exit(1)
print('✓ found .js files in dist/:', js_files)

# 4. repo name vs file name
repo_name = os.path.basename(root)
expected = f"{repo_name}.js"
if expected in js_files:
    print(f"✓ JS file matches repo name: {expected}")
else:
    print(f"WARNING: expected {expected} in dist/; found {js_files}")

# 5. check no custom_components dir
if os.path.isdir(os.path.join(root, 'custom_components')):
    print('WARNING: custom_components/ exists — may be detected as integration')
else:
    print('✓ no custom_components/ (good)')

# Summarize
issues = False
if not os.path.isfile(hacs_path): issues = True
if not js_files: issues = True
if issues:
    print('\nRepository is NOT compliant for HACS Plugin (Dashboard)')
    sys.exit(2)
print('\nRepository looks compliant for a HACS Plugin (Dashboard) — next: create a GitHub release or ensure dist/ is accessible to HACS')
sys.exit(0)
