# Living PRD: ICA passport application pre-submission checker

**Scenario:** B · ICA passport applications and renewals
**Source of truth:** the code in `day2-validate/prototype/` at commit `b4f6416` (main, 18 Nov 2026)
**Status:** Prototype. Expand and Behavior prompts run. Refine not yet run.

All data, names, NRICs and results in this file are synthetic and made up. Not a real ICA system.

This PRD describes what the code does today, not what we planned. Where the code and the One Pager disagree, the gap is called out. Update this file whenever the prototype changes (see "How to keep this living" at the end).

## 1. Product overview

A single-page passport application form with an inline checker. It covers four application types: new and renewal, for adults (16 and above) and children (below 16).

What it does today:
- Checks each field when the applicant leaves it (on blur or change) and shows a warning under the field. Warnings never block submission.
- Tags every warning with a confidence level: HIGH, MEDIUM or LOW.
- Pre-fills name, NRIC and date of birth from a mock Singpass MyInfo profile and locks those fields.
- Shows a segmented progress bar: grey (empty), green (valid), red (flagged).
- On submit, builds an Officer Summary Report on the applicant tab and adds the submission to an Officer Vetting queue on a second tab.
- The officer can Approve or Return to applicant. The decision is shown on screen only.

Files:

| File | What it is |
|---|---|
| `index.html` | The form, the officer report and the officer queue (two tabs) |
| `checker.js` | All validation rules, Singpass mock, progress bar, report and queue logic (611 lines) |
| `test-false-positives.html` | Kill switch test: 12 known-bad submissions |
| `data/correct-submissions.csv` | 20 made-up correct child renewals |
| `data/bad-submissions.csv` | 12 made-up bad submissions, each with expected flags |

Runs by opening `index.html` in a browser. No server, no install, no network calls.

## 2. Problem and riskiest assumption

**Problem (from the One Pager):** Officers return 17% of submissions for errors or missing documents. Each return adds about six days. Only 38% of applicants read the guidance before they apply. Parents renewing for a child are the most confused group. The vendor running the online channel leaves in 10 weeks.

**Riskiest assumption:** The checker marks a bad input as OK, and the officer trusts the report and stops checking. This is a value risk: the system becomes worse than the status quo because it removes the manual check.

**Kill switch:** Any known-bad field shown as OK in the officer report during testing. Stop and fix before going further.

**What the code shows today:**

| Test | Result |
|---|---|
| 12 bad submissions through `test-false-positives.html` | 13 of 13 expected flags caught |
| Same 12 submissions through the real `checker.js` (run headless for this PRD) | 13 of 13 caught, so the shipped checker passes too |
| Invalid NRIC checksum (`S1234567Z`, made up) | **Shown as OK.** The checker tests the format only, not the checksum letter |
| Landline number (`61234567`) in a field labelled "Singapore mobile" | Shown as OK |

The NRIC checksum case is a known-bad input that reaches the officer as OK. By our own kill switch definition, this should fire. It is not in the 12-case test set, which is why the test still passes.

## 3. User flow and screen map

### Applicant flow

1. Open the form. Applicant View tab is active. Progress bar shows "0 of N fields complete".
2. Choose an application type. Child types reveal the Parent / guardian section.
3. (Optional) Click **Retrieve MyInfo**. If no type is chosen, a browser alert asks for one first. Name, NRIC and DOB are filled from the mock profile (adult or child) and locked.
4. Fill the rest. Each field is checked when the applicant leaves it. A warning with a confidence tag appears under the field, or a green "valid" message.
5. Choosing **Legal guardian** reveals the guardianship proof field. Choosing **Deed poll** or **Marriage certificate** reveals the name change reason field.
6. Tick the two photo confirmations and the declaration.
7. Click **Submit application**. Every check runs again. The Officer Summary Report appears below the form with a badge ("All clear" or "N issues") and a verdict ("Ready for review" or "Needs applicant action").
8. Submission is always accepted, even with flags.
9. **Clear form** resets every field, warning, Singpass lock and the report.

### Officer flow

1. Switch to the **Officer Vetting** tab.
2. Each submission shows every field value, marked flagged or mismatch.
3. Flags appear in three boxes: Checker flags (HIGH and MEDIUM), "AI not confident, manual review required" (LOW), and Singpass mismatch.
4. Click **Approve** or **Return to applicant**. Both buttons lock and a verdict line appears.

### Screen map

```
index.html
├── Prototype banner (red, "all data is synthetic")
├── ICA header
├── Tabs: [Applicant View] [Officer Vetting]
│
├── Applicant View
│   ├── Progress card (segmented bar, "X of N fields complete")
│   ├── Form card
│   │   ├── Singpass box (Retrieve MyInfo, locked-fields notice)
│   │   ├── Info box (passport validity, what you need)
│   │   ├── Application type
│   │   ├── Applicant's particulars: name, NRIC, DOB, email, phone
│   │   ├── Parent / guardian (child apps only)
│   │   │   └── Guardianship proof (legal guardian only)
│   │   ├── Passport photo: guidelines, file upload, 2 confirmations
│   │   ├── Supporting documents
│   │   │   └── Name change reason (deed poll or marriage cert only)
│   │   ├── Declaration
│   │   └── Submit / Clear form
│   └── Officer Summary Report (after submit): field-by-field table, badge, verdict, disclaimer
│
└── Officer Vetting
    └── Queue: one card per submission
        ├── Field values
        ├── Checker flags / Low-confidence box / Singpass mismatch box
        └── Approve / Return, verdict

test-false-positives.html (internal test page, not user-facing)
└── Run all 12 tests → pass/fail summary, per-case table
```

## 4. Success metrics

From the One Pager, with what the prototype can measure today:

| Metric | Baseline | Target | Can the prototype measure it? |
|---|---|---|---|
| Submissions returned for errors or missing documents | 17% | Below 10% | No. No real submissions, no tracking |
| Applicants who engage with guidance | 38% | Above 60% | No. The code records no events |
| Known-bad fields shown as OK in officer report | 0 in the 12-case set | 0 | Yes, but the set misses the NRIC checksum case (section 2) |
| Catch rate on known-bad submissions | 100% (13/13, made up) | 95%+ | Yes, on 12 cases. Gate 2 asks for 50+ |
| Officer review time per application | Not measured | Decrease | No. Needs officer testing with a timer |

Metrics to add because the code now has the features:
- **Correct inputs flagged** (false alarms). The One Pager tracks missed errors but not false alarms. The code raises HIGH-confidence warnings on some valid names (section 5). A false alarm at HIGH confidence teaches applicants to ignore warnings.
- **Share of flags at LOW confidence that officers overturn.** This tells us if the LOW path is set at the right level.
- **Singpass retrieval rate.** Locked fields remove typing errors, so higher retrieval should mean fewer returns on name, NRIC and DOB.

## 5. Technical reality

What the code is, as opposed to what the docs say.

**The checker is fixed rules, not a trained model.** `checker.js` line 2 says "trained on correct-submissions.csv", but no code reads the CSV. Every rule is a hand-written regex or list in the `RULES` object (`checker.js:8-24`). The One Pager's "compares each input against a repository of correct past submissions" is not what runs.

**The "correct" data fails the checker's own rules.** All 20 rows in `correct-submissions.csv` use mixed-case names ("Tan Wei Lin"), which the checker flags as not BLOCK LETTERS. After uppercasing, 3 of 20 still flag because they use a deed poll with no name change reason. The CSV also covers child renewals only, 1 of 4 application types.

**Confidence levels are hardcoded per rule.** Of 28 warning calls, one is LOW (child NRIC not starting with T, `checker.js:235`) and one is MEDIUM (parent NRIC same as child's, `checker.js:283`). Everything else defaults to HIGH. Empty fields and unticked boxes carry no confidence level.

**The kill switch test does not test the shipped code.** `test-false-positives.html` has its own copy of `RULES` and its own `validate()` function. If someone changes `checker.js`, the test still passes. It also marks guardianship proof as missing whenever "legal guardian" is chosen, without looking at the proof value. Photo and declaration are not tested.

**Valid inputs that get HIGH-confidence warnings** (made-up examples, tested against `checker.js`):
- Names with `S/O`, `D/O`, brackets or commas, for example `RAJ S/O KUMAR`. The name regex allows only letters, spaces, `'`, `@` and `-`.
- Parent NRIC starting with M. The applicant NRIC rule allows M (`nricFormat`), the parent rule does not (`adultNricPrefix`).

**Singpass is a mock with two fixed profiles** (`checker.js:27-30`). Locked fields mean the mismatch check (`checker.js:65-81`) cannot fire after a Singpass retrieval. It only matters if code later unlocks the fields.

**No persistence.** The officer queue is an in-memory array (`checker.js:399`). A refresh loses every submission and decision. Approve and Return change the screen only.

**User input goes into the officer queue as raw HTML.** `renderOfficerQueue` builds cards with `innerHTML` from submitted values (`checker.js:446`) without escaping. A name field containing HTML would run in the officer's view. Harmless in a local prototype, a security bug in any shared version.

**Photo checks are format, size and pixel dimensions only.** HEIC and HEIF skip the dimension check (`checker.js:317`). Face position, lighting and background (ICAO) rely on two checkboxes.

**Age is approximate.** Age uses 365.25-day years (`checker.js:247`), so a DOB within about a day of the 16th birthday can land on the wrong side.

## 6. Assumptions and risks

| Assumption or risk | Type | Evidence today | What would prove it wrong |
|---|---|---|---|
| The checker never shows a bad input as OK | Value (riskiest) | 13/13 on the 12-case set; fails on NRIC checksum | Any known-bad field shown as OK in an expanded test set |
| Applicants act on warnings that don't block them | Value | None. No user testing yet | Return rate stays near 17% after launch |
| HIGH-confidence warnings are right | Value | Wrong on S/O names and M-prefix parents | Officers or applicants overturn HIGH flags |
| Officers read the LOW-confidence box and don't skip it | Usability | None | Officers approve LOW-flagged cases without checking |
| The officer report saves time and doesn't add a step | Value | None | Review time per application goes up |
| Hardcoded rules stay accurate as ICA rules change | Feasibility | `context-skill.md` has review triggers; code has no link to it | A policy change ships and the checker still uses old rules |
| Singpass covers most applicants | Feasibility | Mock only | Large share of applicants without Singpass or applying for someone else |
| The 10-week deadline holds scope | Business | Fixed date | Officer testing runs over 2 weeks |

**Conflict between spec and code:** The One Pager and AI UX flow say "below the confidence threshold, do not prompt; send to an officer without suggestions." The code does the opposite: LOW-confidence warnings are shown to the applicant (in amber) and also sent to the officer. One of the two needs to change. The current behaviour is more transparent, so the spec may be the one to update.

## 7. In and out of scope

**In scope (built and working):**
- Four application types with child-only and conditional sections
- 28 field-level rules: name, NRIC format, age vs type, email, phone, parent NRIC, relationship, guardian proof, photo format, size and dimensions, photo confirmations, document type vs application type, name change reason, declaration
- Confidence tags (HIGH, MEDIUM, LOW) with distinct styling
- Mock Singpass pre-fill with locked fields
- Progress bar
- Officer Summary Report and Officer Vetting queue with Approve and Return
- 12-case kill switch test page

**Out of scope for the prototype:**
- Real Singpass, real ICA systems, real data of any kind
- Saving submissions or officer decisions
- Sending a returned application back to the applicant
- ICAO face checks on photos
- NRIC checksum validation (should move into scope, see section 8)
- Loading or learning from `correct-submissions.csv`
- Usage tracking for the success metrics
- Login, roles, audit trail
- Accessibility review and languages other than English

**Not started:** the Refine prompt ("clear next steps on where the user should fill up") in `PROMPTS.md`.

## 8. Engineering recommendation

**Continue to officer testing, after four small fixes.** The interaction pattern works and the shipped checker catches every case in the current test set. The fixes below close the gaps that would undermine the kill switch or officer trust.

**Before officer testing (must do):**
1. **Point the kill switch test at the real checker.** Move the rules into a pure `validate(submission)` function in `checker.js` that takes data and returns flags. Have the form and `test-false-positives.html` both call it. Today the test can pass while the shipped code is broken.
2. **Add the NRIC checksum check.** This closes the one known-bad input that reaches the officer as OK. Add the checksum case and a landline-in-mobile case to `bad-submissions.csv`.
3. **Stop false alarms on valid names and parent NRICs.** Allow `/`, `(`, `)` and `,` in names. Allow the M prefix for parents, matching the applicant rule.
4. **Escape user input before it goes into `innerHTML`** in the officer queue and report.

**Before Gate 2 (should do):**
5. **Make the data match the claim.** Either load `correct-submissions.csv` and derive rules or confidence from it, or remove "trained on" from the code and docs. Fix the CSV either way: BLOCK LETTER names, a reason on every deed poll row, and adult and new-application rows.
6. **Settle the low-confidence behaviour.** Pick "show to applicant and officer" (current code) or "officer only" (current spec), and update the other.
7. **Expand the bad set to 50+ cases** across all four application types, including photo and declaration cases, and add a set of correct inputs to measure false alarms.
8. **Run the Refine prompt** and record the result in `PROMPTS.md`.

**Before go-live (production work, not prototype work):**
- Run validation on the server as well as the browser. Browser checks can be bypassed.
- Store submissions and officer decisions with an audit trail. Handle personal data under the Data rule and agency policy.
- Real Singpass MyInfo integration, with a path for applicants who can't use it.
- Usage events for the guidance-engagement and return-rate metrics.
- Link rule changes to `context-skill.md` so a policy update has one place to change.
- Use calendar-correct age at the 16th birthday.

## How to keep this living

Update this file when:
- `checker.js`, `index.html` or the test data changes
- A prompt in `PROMPTS.md` is run
- The kill switch test result changes
- Officers report a new error type or a false alarm

When you update it, change the commit on the "Source of truth" line and re-run the 12-case test against `checker.js`.
