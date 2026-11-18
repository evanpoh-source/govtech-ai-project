# One Pager

Use case: B · ICA passport applications and renewals

All quotes and metrics are synthetic and labelled as made up.

## Problem and user

Walk-in counters cover about 35% of today's online demand. The vendor running the online channel is withdrawing in 10 weeks, and that date will not move. Officers return 17% of submissions for errors or missing documents; each return adds about six days. Only 38% of applicants read the guidance before they apply. Most returns could have been avoided before submission. Applicants did not know what a complete application looked like for their situation. Parents renewing for a child were the most confused group.

## Strategy kernel

**Diagnosis:** Walk-in counters cover about 35% of today's online demand. Officers return 17% of submissions for errors or missing documents; each return adds about six days. Only 38% of applicants read the guidance before they apply.

**Guiding policy:** Officers will use this, less return submissions and time saved.

**Coherent actions:**
1. Build a checker that validates the right information.
2. Create an interface that is easy to use for the public that is using it with samples of what is right.
3. Prompt when a wrong submission is put in.

## Opportunity and evidence

Officers return 17% of submissions for errors or missing documents. The target is to reduce this number. Only 38% of applicants read the guidance before they apply. The target is to increase this number.

Synthetic user quote: "I take too much time reassessing submissions."

Officers will save time because there will be fewer inaccurate submissions. The checker compares each input against a repository of correct past submissions and flags deviations at the point of input, before the applicant submits.

## Experience and trust

The applicant fills in the application and is prompted inline when an input is incorrect or could be inaccurate. A warning appears next to the field explaining what correct inputs look like, but does not block the user from continuing.

Above the line (what the user sees): a warning prompt next to each field that could be wrong or inaccurate, with samples of what is right.

Below the line: a repository of correct submissions, a checker trained on those patterns, rules that never reject an application (only inform), and a handoff to the officer with a summary report.

Trust gaps addressed:
- Hallucination: the AI could flag issues that are actually correct. Mitigated by training on verified correct submissions.
- Black box: officers and applicants can see every flag and its reasoning.
- Below the confidence threshold, the system does not prompt. The application goes to an officer without suggestions.

## Risks (market, technical, team)

**Riskiest assumption:** The AI validates false positives and allows bad inputs to be submitted. At the same time, it tells the officer checking that the submission is correct. No one checks further, and the bad application proceeds. This is a value risk: the system causes more harm than the status quo because officers stop manually reviewing fields the report marks as OK.

**Risk type:** Value (build a landing page first).

**Kill switch:** If the checker marks a known-bad input as "OK" in the officer summary report during testing, stop. Do not deploy until the false-positive path is eliminated. Run a test set of deliberately bad submissions. If any bad field appears as "OK" in the officer report, the kill switch fires.

**Kill-switch signal:** Any known-bad field shown as OK in the officer report.

**Success signal:** On a test set of 12+ deliberately bad submissions, the checker catches 95% or more of the errors. Zero known-bad inputs are marked as "OK" in the officer summary report.

## Build plan and handoff

**Prototype built:** A single-page HTML form simulating passport applications (adult and child, new and renewal) with an inline checker trained on a synthetic database of correct submissions. The checker validates format, cross-field logic, document combinations, and photo requirements per ICA guidelines. An officer summary report is generated on submit.

**Files:**
- `day2-validate/prototype/index.html` (form)
- `day2-validate/prototype/checker.js` (validation logic)
- `day2-validate/prototype/data/correct-submissions.csv` (20 synthetic correct submissions)
- `day2-validate/prototype/data/bad-submissions.csv` (12 synthetic bad submissions)
- `day2-validate/prototype/test-false-positives.html` (kill switch test)

**Handoff:** The prototype tests the interaction pattern. Before real deployment, the checker needs to be connected to ICA's actual rules database and trained on real (anonymised) correct submissions. Officers need to validate the rules in `context-skill.md` against current policy.

## Agent role and guardrails

The assistant validates passport application inputs against a repository of correct submissions. It flags deviations inline but never rejects an application. Final decisions stay with ICA officers. The system must be clear about what officers decide versus what the system only suggests.

Guardrails:
- Applications contain identity documents and sensitive personal data. The system must not store or expose this data beyond the session.
- Do not reject an application. Allow users to input anyway, but inform them if the checker finds a deviation.
- Below the confidence threshold, do not prompt. The application goes to an officer to review without suggestions.
- Must stay accurate as rules change. The context skill (`context-skill.md`) has a review trigger: update when ICA changes requirements, when officers report a new return category, or quarterly at minimum.

## Roles and operating model

**Product team:** Owns the context skill and validation rules. Updates rules when ICA policy changes.

**Officers:** Review the officer summary report. Final decision authority on every application. Provide feedback when the checker misses errors or flags correct inputs.

**Applicants:** Use the form. See inline warnings. Decide whether to fix flagged fields or proceed.

**Review cycle:** When ICA changes passport application requirements, when officers report a new category of return not caught by the checker, when the false positive test fails, and quarterly at minimum.

## Strategy and roadmap

**Week 1-2:** Validate the interaction pattern with the prototype. Run the false positive test. Confirm zero known-bad inputs pass as OK.

**Week 3-4:** Connect the checker to ICA's actual rules. Replace synthetic data with real (anonymised) correct submission patterns. Officer user testing.

**Week 5-8:** Expand from child renewals to all application types. Integrate with the replacement online channel. Officer training.

**Week 9-10:** Go live before the vendor withdrawal deadline. Monitor return rate and officer feedback.

## Metrics plan and stop line

| Metric | Current | Target | Stop line |
|---|---|---|---|
| Submissions returned for errors/missing docs | 17% | Below 10% | If return rate does not decrease after 4 weeks of live use, pivot |
| Applicants who read/engage with guidance | 38% | Above 60% | If engagement does not increase, the interaction pattern is wrong |
| False positives in officer report | Untested | 0 | Any false positive in testing triggers the kill switch |
| Checker catch rate on known-bad submissions | Untested | 95%+ | Below 90% means the rules are incomplete |
| Officer review time per application | Baseline TBD | Decrease | If officers spend more time reviewing the report than reviewing manually, the report is adding friction not saving time |

## Evals and gates

**Gate 1 (before connecting to real data):** Run `test-false-positives.html` with 12 synthetic bad submissions. All 12 must be caught. Zero false positives in the officer report.

**Gate 2 (before officer testing):** Expand the bad submissions set to 50+ cases covering all application types. Catch rate must stay above 95%. Rules in `context-skill.md` validated by at least one officer.

**Gate 3 (before go-live):** Officer user testing with 20+ real (anonymised) application scenarios. Officers confirm the summary report is accurate and saves review time. No false positives.

**Gate 4 (post-launch, week 2):** Return rate measured against 17% baseline. If no decrease, investigate whether applicants are ignoring warnings or whether the checker is missing error types.

## Decision: continue, pivot or stop

**Current status:** Prototype built and tested against synthetic data. 29 of 30 context-skill rules pass. One gap (foreign-born child NRIC prefix) identified and fixable.

**Decision: Continue.** The prototype demonstrates the interaction pattern works. The false positive test passes. The 10-week deadline requires moving to real data and officer testing immediately.

**Pivot trigger:** If officers do not trust the checker's suggestions after testing, pivot to a simpler approach (pre-submission checklist without AI, surfacing the existing guidance more prominently).

**Stop trigger:** If the false positive test fails and cannot be fixed, or if the return rate does not decrease after 4 weeks of live use.

## Open issues

1. Foreign-born children with Singapore citizenship may have NRIC prefixes other than T. The checker currently warns on all non-T prefixes for child apps. Needs a softer message or an override.
2. The checker uses pattern matching, not a language model. Moving to a model-based approach would catch more subtle errors but introduces hallucination risk.
3. Officer summary report needs real-world validation. Does it actually save review time, or does it add a step?
4. Photo validation cannot programmatically check ICAO compliance (face position, lighting, background). Relies on checkbox confirmation.
5. The 10-week deadline is fixed. If officer testing takes longer than 2 weeks, the go-live scope may need to shrink (child renewals only first, expand later).
