# Prototype: ICA passport application pre-submission checker

All data is synthetic and made up. Not a real ICA system.

## What it does

A single-page form that checks passport application inputs against patterns learned from a database of correct submissions. Covers all four application types: new and renewal for adults (16+) and children (below 16). When an input deviates from what correct submissions look like, an inline warning appears next to the field. Warnings explain what's expected but never block the applicant from continuing.

On submit, an officer summary report is generated listing every field as OK or flagged, with a pass/fail verdict.

## What it tests

1. Whether inline warnings reduce errors before submission (targeting the 17% return rate).
2. Whether the officer summary report saves review time.
3. Whether the checker avoids false positives (the riskiest assumption: marking bad inputs as OK).

## How to run

Open `index.html` in a browser. No server or install needed.

To run the false positive test, open `test-false-positives.html` and click "Run all 12 tests."

## Files

| File | Purpose |
|---|---|
| `index.html` | Application form with inline checker and officer report |
| `checker.js` | Validation logic: format, cross-field, document combinations, ICA photo rules |
| `test-false-positives.html` | Runs 12 known-bad submissions through the checker, flags any false positives |
| `data/correct-submissions.csv` | 20 synthetic correct child renewal submissions |
| `data/bad-submissions.csv` | 12 synthetic bad submissions for testing |

## What the checker validates

- Name in BLOCK LETTERS (uppercase, matching NRIC)
- NRIC format (9 characters, correct prefix per application type)
- Age vs application type (child below 16, adult 16+)
- Email and phone format (SG mobile, 8 digits)
- Parent/guardian NRIC differs from child's (child apps)
- Relationship (only mother, father, or legal guardian for child apps)
- Legal guardian proof required
- Photo format (JPG, JPEG, PNG, HEIC, HEIF), size (max 8 MB), dimensions (400x514 px)
- Photo recency and no-filters confirmation
- Document type matches application type (birth cert required for child apps)
- Declaration confirmed

## Known gap

Foreign-born children with Singapore citizenship may have NRIC prefixes other than T. The checker currently warns on all non-T prefixes for child applications.
