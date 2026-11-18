# Prototype: ICA passport renewal pre-submission checker

All data is synthetic and made up. Not a real ICA system.

## What this tests

Whether inline warnings trained on a database of correct submissions reduce errors before an application reaches an officer. Focused on parents renewing a passport for a child under 16 (the most confused group).

## How it works

1. The applicant fills in the form fields.
2. On each field, the checker compares the input against patterns learned from `data/correct-submissions.csv` (200 synthetic correct submissions).
3. If the input deviates from what correct submissions look like, a warning appears inline. The warning does not block the user.
4. On submit, an officer summary report lists every field as OK or flagged.

## How to run

Open `index.html` in a browser. No server or install needed.

## Files

- `index.html` — the form page
- `checker.js` — validates inputs against patterns from the correct submissions database
- `data/correct-submissions.csv` — 20 synthetic correct child renewal submissions
