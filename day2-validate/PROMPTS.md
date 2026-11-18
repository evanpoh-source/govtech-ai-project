# Prompt chain

**Scenario:** B · ICA passport applications
**Prototype today:** A single-page form that checks passport application inputs against patterns learned from a database of correct submissions.

All data is synthetic and labelled as made up.

## 1. Expand

**Prompt:** let the user fill it up and the officer to vet, introduce singpass for basic queries

**Business rules:**
- double check as much as possible to ensure accuracy

**Edge cases:**
- i key in a information that is not mine,

**Result:**

What worked:
- Singpass MyInfo pre-fill locks name, NRIC, and DOB from a trusted source, removing manual typing errors on those fields.
- Officer vetting tab gives the officer a queue of submissions with all checker flags and Singpass mismatches, plus approve/return buttons.
- Singpass fields are locked after retrieval, which prevents the "information that is not mine" edge case by design rather than detection.

What broke:
- Only two mock Singpass profiles (one adult, one child). A real system would query by the logged-in user.
- Singpass fields are locked, so the mismatch detection only triggers if someone fills the form manually first. The lock prevents the edge case but doesn't detect attempts.
- Officer queue resets on page refresh (no persistence).

## 2. Behavior

**Prompt:** show the confidence interval that it might be wrong

**Forced failure:** flag it out to the officer that the ai is not confident

**Business rules:**
- show clearly if not sure

**Edge cases:**

**Result:**

What worked:
- Every warning now shows a confidence tag: HIGH (red), MEDIUM (orange), or LOW (amber). The applicant can see how sure the checker is.
- Low-confidence warnings get distinct amber styling so they look different from hard errors.
- Officer report shows confidence tags per field. Low-confidence flags appear in a separate amber "AI not confident, manual review required" section in the officer queue.
- Forced failure triggers correctly: enter a child application with NRIC starting with S instead of T. The checker flags it as LOW confidence, admits it might be wrong (foreign-born children may have other prefixes), and escalates to the officer for manual review.

What broke:
- Confidence levels are hardcoded per rule, not calculated from the data. A real system would compute confidence from how many correct submissions match the pattern.
- Only one rule is LOW confidence (child NRIC T-prefix). A real system would have more ambiguous rules that need the low-confidence path.
- The confidence tag text (HIGH/MEDIUM/LOW) appears in the officer report alongside the warning text, which can look cluttered with many flags.

## 3. Refine

**Prompt:** clear next steps on where the user should fill up

**Business rules:**

**Edge cases:**

**Result:** _Not yet run._
