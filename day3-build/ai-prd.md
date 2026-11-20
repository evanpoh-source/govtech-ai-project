# AI PRD: ICA passport application checker agent

**Scenario:** B · ICA passport applications and renewals
**Status:** Draft. Every setting under Permissions is **Proposed**, not decided. Open decisions are listed for the product owner.
**Built from:** `SCENARIO-PICK.md`, `day2-validate/living-prd.md`, `day3-build/CLAUDE.md`, `day3-build/agent-control-panel.md`, and the runs in `day3-build/agent-run-log.md`.
**Missing input:** `day2-validate/handoff-note.md` does not exist yet. Check this PRD against it once it is written.

All data, names, NRICs, roles, volumes and costs in this file are synthetic and made up. Not a real ICA system.

## Problem and user

**Problem.** Officers return 17% of passport submissions for errors or missing documents. Each return adds about six days. Only 38% of applicants read the guidance before they apply. Most returns could have been avoided before submission. The vendor running the online channel leaves in 10 weeks, and walk-in counters cover only about 35% of online demand.

**Users.**

| User | What they need | What they get from the agent |
|---|---|---|
| Applicant (parents renewing for a child are the most confused group) | To know before submitting what a complete application looks like for their situation | Warnings on fields that break a rule, with what a correct input looks like. Never blocked |
| ICA officer (made-up role) | To review faster without missing errors | An Officer Summary Report: every field marked, confidence shown, checks not run listed |
| Product team | To keep the rules current and the agent safe | Logs with rule IDs, overturned flags and proposed rule changes |

**Riskiest assumption.** The agent shows a bad field as OK, the officer trusts the report and stops checking, and a bad application goes through. This is worse than today, because today the officer checks every field by hand.

## Instructions

The agent follows `day3-build/CLAUDE.md`. In short:

- **Job:** check one submitted application against `day2-validate/context-skill.md` and write an Officer Summary Report.
- **The officer decides. The agent only suggests.**
- Every field gets one status: OK, Flagged, Manual review or Not checked.
- "OK" means "passed every check run", never "correct". The report lists the checks that did not run.
- Every flag names the rule, the confidence (HIGH, MEDIUM or LOW) and what a correct input looks like.
- When unsure, flag at LOW and send to manual review. Showing a bad field as OK is the worst outcome, worse than too many flags.

## Tools

| Tool | What it does | Exists today? |
|---|---|---|
| `read_submission` | Reads one submission as JSON | No. Prototype holds the form in the browser |
| `read_rules` | Reads `context-skill.md` and returns its commit ID | No. File exists, tool does not |
| `run_checks` | Calls `validate(submission)` in `checker.js` and returns flags with rule IDs and confidence | No. `validate()` does not exist yet (`living-prd.md` fix #1). Runs used a test harness calling `submitForm()` |
| `write_report` | Writes the Officer Summary Report | Partly. `checker.js` builds the report in the browser |
| `write_log` | Adds one entry to the run log | No. Runs were logged by hand in `agent-run-log.md` |

The agent works out the NRIC checksum itself (`NRIC_CHECKSUM` in `CLAUDE.md`). There is no tool for it.

The agent has no tool to approve, return, reject, edit a field, contact anyone, call Singpass or reach the internet.

## Context and memory

**Read every run:**
- `day2-validate/context-skill.md`: rules, good and bad examples, review triggers.
- The known-gaps list in `CLAUDE.md`, from the "Technical reality" section of `living-prd.md`.

**Known gaps the report must disclose:**
- Photo face position, lighting and background (ICAO) are not checked. They rely on two applicant checkboxes.
- HEIC and HEIF photos skip the pixel size check.
- Names with `S/O`, `D/O`, brackets or commas are valid. `checker.js` accepts them since 20 Nov (open decision 8).
- Parent NRICs starting with M break the current rules but are valid. They go to manual review at LOW, not HIGH.
- M-prefix NRICs skip the checksum and go to manual review.

**Within a run:** the submission, the rules and results stay in working context only.

**Between runs:** no applicant data. No names, NRICs, dates of birth, contact details or photos. The agent may keep the rules commit ID, rule IDs and counts (flags per rule, LOW flags overturned).

## Permissions

**Tiers:**
- **Read:** looks at something. Changes nothing.
- **Draft:** creates something a person sees before it takes effect.
- **Write:** changes a record or state inside the system.
- **Send:** something leaves the agent and reaches a person or another system.

**Settings:**
- **Auto:** the agent does it without asking.
- **Confirm:** a person approves each one before it happens.
- **Block:** the agent never does it.

Every setting below is **Proposed**. The "Why proposed" column gives the source, so you can see what each one rests on. Final settings are an open decision.

### Checking an application

| # | Action | Tier | Setting | Why proposed |
|---|---|---|---|---|
| 1 | Read one submission | Read | Auto (Proposed) | Core job. `CLAUDE.md` Tools |
| 2 | Read `context-skill.md` and its commit ID | Read | Auto (Proposed) | Needed every run. `CLAUDE.md` Context |
| 3 | Read the known-gaps list | Read | Auto (Proposed) | Needed to disclose what is not checked |
| 4 | Run the kill switch test on the real `checker.js` before a run session | Read | Auto (Proposed) | Stop condition 1 depends on it |
| 5 | Run field checks through `checker.js` | Read | Auto (Proposed) | Core job |
| 6 | Run situation checks from `context-skill.md` | Read | Auto (Proposed) | Caught the R-0002 gap |
| 7 | Work out the NRIC checksum | Read | Auto (Proposed) | `NRIC_CHECKSUM` rule. Closes the R-0001 trust gap |
| 8 | Set each field's status and confidence | Draft | Auto (Proposed) | Part of the report. Officer reviews every report |
| 9 | Draft the Officer Summary Report | Draft | Auto (Proposed) | Core job |

### Delivering results

| # | Action | Tier | Setting | Why proposed |
|---|---|---|---|---|
| 10 | Put the report in the officer's queue | Send | Auto (Proposed) | Officer reviews every report before any decision |
| 11 | Show HIGH and MEDIUM warnings to the applicant inline | Send | Auto (Proposed) | Prototype does this. Warnings never block |
| 12 | Show LOW warnings to the applicant inline | Send | Auto (Proposed) | Matches the code. Conflicts with the One Pager's earlier "do not prompt below the threshold" (open decision 1) |
| 13 | Put LOW flags in the officer's manual review box | Write | Auto (Proposed) | `CLAUDE.md` Human checkpoints |
| 14 | Send a whole submission to manual review | Write | Auto (Proposed) | Stop condition 6. R-0002 |
| 15 | Mark a field "Not checked, officer must review" when a check errors | Write | Auto (Proposed) | Stop condition 3. Never default to OK |

### Stopping and refusing

| # | Action | Tier | Setting | Why proposed |
|---|---|---|---|---|
| 16 | Stop all runs when the kill switch fails | Write | Auto (Proposed) | Stop condition 1. Must not wait for a person |
| 17 | Stop when rules changed since the kill switch last passed | Write | Auto (Proposed) | Stop condition 2 |
| 18 | Refuse an out-of-role request and stop the run | Write | Auto (Proposed) | Stop condition 5. R-0003 |
| 19 | Tell the officer why a run stopped or was refused | Send | Auto (Proposed) | R-0003. `CLAUDE.md` does not yet say what happens next (open decision 4) |
| 20 | Tell the product team when a submission may be real data | Send | Auto (Proposed) | Stop condition 4 |

### Logging and learning

| # | Action | Tier | Setting | Why proposed |
|---|---|---|---|---|
| 21 | Write one log entry per run (field names and rule IDs only) | Write | Auto (Proposed) | `CLAUDE.md` Logs |
| 22 | Keep rule IDs and counts between runs | Write | Auto (Proposed) | No personal data. Feeds the weekly review |
| 23 | Draft a proposed rule change | Draft | Auto (Proposed) | Draft only. R-0002 proposed one |
| 24 | Draft a new bad test case | Draft | Auto (Proposed) | Draft only |

### Not live yet (from the opportunity portfolio)

| # | Action | Tier | Setting | Why proposed |
|---|---|---|---|---|
| 25 | Draft a return reason for the officer | Draft | Confirm (Proposed) | Officer edits and sends it. Control panel: "Next" |
| 26 | Show next-step guidance to the applicant on each flag | Send | Confirm (Proposed) | Product team approves the wording first. Refine prompt not yet run |
| 27 | Run photo face checks (ICAO) | Read | Block (Proposed) | No tested image check. Control panel: "Later" |

### Never

| # | Action | Tier | Setting | Why proposed |
|---|---|---|---|---|
| 28 | Approve, return or reject an application | Write | Block (Proposed) | Final decisions stay with ICA officers |
| 29 | Send a return or decision to the applicant | Send | Block (Proposed) | Officer's decision and officer's message |
| 30 | Edit, correct or fill in a field value | Write | Block (Proposed) | Agent flags and suggests only |
| 31 | Block the applicant from submitting | Write | Block (Proposed) | One Pager guardrail: inform, never block |
| 32 | Contact the applicant or anyone outside the officer queue | Send | Block (Proposed) | `CLAUDE.md` Permissions |
| 33 | Change `context-skill.md` or `checker.js` | Write | Block (Proposed) | Product team owns the rules. Officer signs off |
| 34 | Apply its own proposed rule change | Write | Block (Proposed) | Needs sign-off and a passing kill switch test |
| 35 | Keep applicant data between runs | Write | Block (Proposed) | Sensitive personal data |
| 36 | Put field values in the log | Write | Block (Proposed) | Logs hold field names and rule IDs only |
| 37 | Call Singpass | Read | Block (Proposed) | No tool. Singpass is a mock in the prototype |
| 38 | Reach the internet | Read | Block (Proposed) | No tool |
| 39 | Write "approved", "rejected" or "ready to issue" in a report | Draft | Block (Proposed) | Report must not read as a decision |

## Human checkpoints

| Checkpoint | Who | When | What they do |
|---|---|---|---|
| Officer review | ICA officer (made-up role) | Every submission | Reads the report, checks flagged and manual-review fields, decides |
| Manual review box | ICA officer | Every LOW flag, check error or known-gap field | Checks the field by hand |
| Refused or stopped run | ICA officer | Every refusal (R-0003) | Reviews by hand or asks for a clean resubmission |
| Spot check of clean reports | ICA officer | First 4 weeks live, 1 in 20 "0 flag" reports (proposed in the control panel, not in `CLAUDE.md`) | Re-checks the whole application. Any bad field marked OK fires the kill switch |
| Overturned flags | Product team | Weekly, from the log | Fixes or retires the rule |
| Rule change | Product team, signed off by one named officer | Before any change goes live | Reruns the kill switch test on the real `checker.js` |
| Moving to real data | Product team | Before any real data | Passes Gates 1 to 3 in `one-pager.md` |

## Stop conditions

The agent stops, writes no "All clear" report, logs the reason and tells the officer.

| # | Stop when | What happens next |
|---|---|---|
| 1 | Any known-bad field in `bad-submissions.csv` shows as OK on the real `checker.js` | All runs stop until the product team fixes it |
| 2 | `context-skill.md` is missing, empty, has no Rules section, or changed since the kill switch last passed | Runs stop until the kill switch is rerun |
| 3 | A check errors or returns nothing for a field | Field marked "Not checked, officer must review" |
| 4 | The submission may be real data | No report. Product team told |
| 5 | Someone asks it to approve, reject, edit, contact or skip a check | Refused. Officer told (next step wording is open decision 4) |
| 6 | The rules don't cover the case | Whole submission to manual review |
| 7 | The submission is empty | No report. Officer told. No real-data alert |

**Pause for the whole agent (from the control panel):** the sign-off officer pauses the agent if officers overturn HIGH flags on one rule more than twice in a week, or an officer finds a bad field the report showed as OK.

## Logs

**Each run logs:** run ID and time, rules and checker commit IDs, application type, each flag (field, rule ID, confidence, status), fields not checked and why, stop condition hit, outcome. The officer adds the decision and any overturned flag.

**Never logged:** names, NRICs, dates of birth, email, phone, photos or any field value.

**Who reads them:** the product team, weekly. A pattern of overturned flags on one rule is a rule to fix.

**Example:** see R-0001 to R-0004 in `day3-build/agent-run-log.md`.

## Business rules

From `context-skill.md`, the One Pager and `CLAUDE.md`.

**Application type**
- Adults (16 and above): photo and NRIC. The applicant applies for themselves.
- Children (below 16): photo, child's NRIC, birth certificate, parent or guardian NRIC.
- Date of birth must match the application type.

**Who can apply for a child**
- Only the mother, father or a legal guardian. Siblings, grandparents and others cannot.
- A legal guardian must provide proof (court order or letter of guardianship).
- The parent's NRIC must differ from the child's.

**Documents**
- Birth certificate is required for every child application. "No additional documents" on a child application is always wrong.
- Deed poll only if the name differs from the birth certificate or NRIC. A reason must be given.
- Marriage certificate only for a name change after marriage.
- Adoption order only for an adopted child applied for by the adoptive parent.
- Citizenship certificate only for naturalised citizens applying for the first time.

**Identity fields**
- Name in BLOCK LETTERS, matching the NRIC.
- NRIC: one letter, 7 digits, one letter. Checksum letter must match (S, T, F, G).
- Child NRIC usually starts with T. Foreign-born children may have other prefixes, so a non-T prefix is LOW confidence.

**Photo**
- Digital colour, taken within the last 3 months.
- JPG, JPEG, PNG, HEIC or HEIF. Maximum 8 MB. 400 x 514 px for online upload.
- No filters, enhancements or altered features. Must meet ISO / ICAO specifications.

**How the agent treats the rules**
- Warnings inform. They never block.
- "OK" means passed every check run.
- Final decisions stay with ICA officers.
- Rules change only with one officer's sign-off and a passing kill switch test.

## What engineering decides

These are build choices. They need to meet the rules above but don't need a product decision.

- **Shape of `validate(submission)`:** a pure function in `checker.js` that the form, the test page and the agent all call. Returns flags with rule IDs and confidence.
- **Rule IDs:** naming and where they live. The runs made them up (`CHILD_NEEDS_BIRTH_CERT`, `NRIC_CHECKSUM`).
- **Where checks run:** browser, server or both. Browser checks can be bypassed.
- **Harness:** how the tool loop, stop conditions and blocked actions are enforced in code, not just in instructions.
- **Escaping:** how submitted values are made safe before they go into report HTML (`living-prd.md` security bug).
- **Storage:** where submissions, decisions and logs are kept, and the audit trail.
- **Singpass MyInfo integration** and the fallback for applicants who can't use it.
- **NRIC checksum code:** moving `NRIC_CHECKSUM` from the agent's working into `checker.js`.
- **Age at the 16th birthday:** calendar-correct, not 365.25-day years.
- **HEIC and HEIF pixel checks.**
- **Test harness:** running the kill switch set on the real `checker.js` automatically before each session.
- **Latency:** how fast a warning appears after the applicant leaves a field.

## Open decisions

For the product owner. Each lists the options found in the files. None are decided here.

1. **Do applicants see LOW-confidence warnings?**
   - Options: show to applicant and officer (current code); officer only (earlier One Pager wording).
   - Affects: Permissions #12, `living-prd.md` section 6.

2. **Final setting for each action under Permissions.**
   - Every setting is Proposed. Confirm, change or block each one.

3. **Spot check of clean reports.**
   - Options: adopt the proposed 1 in 20 for 4 weeks; a different rate or length; none.
   - If adopted, it needs adding to `CLAUDE.md`.

4. **What happens after a refusal.**
   - Options: officer reviews by hand; officer asks for a clean resubmission; either, officer's choice.
   - `CLAUDE.md` stop condition 5 doesn't say yet.

5. **Next-step guidance to applicants.**
   - Options: Confirm (product team approves wording first), Auto, or not in scope for launch.
   - Refine prompt not yet run.

6. **Draft return reasons for officers.**
   - Options: in scope for launch; after launch; not at all.

7. **Launch scope.**
   - Options: all four application types; child renewals first; field checks only with no agent at launch.

8. **Names with `S/O`, `D/O`, brackets or commas, and M-prefix parent NRICs.**
   - Options: change the rules to accept them; keep them at LOW and manual review.
   - Names: decided on 20 Nov. The rules now accept them (eval case P1). Rule sign-off by the sign-off officer still needed.
   - M-prefix parent NRICs: still open.

9. **Landline numbers in the contact field.**
   - Options: accept 6xxx numbers; relabel the field; reject landlines with a clear message.

10. **Made-up NRICs that fail the checksum.**
    - Options: fix them in the mocks, `context-skill.md` and test data before `NRIC_CHECKSUM` goes into `checker.js`; or ship the rule first.

11. **"Trained on correct submissions".**
    - Options: build rules or confidence from the data; remove the claim from the code and docs.

12. **Pause threshold for the whole agent.**
    - Options: keep "more than twice in a week on one rule"; set a different number.

13. **Log retention.**
    - How long logs are kept, and who can read them. Not set in any file.

14. **Who the sign-off officer is.**
    - The role is set in `operating-model.md`: an ICA officer who decides incidents and signs off rule changes.
    - Which officer holds it is not set.

15. **Funding.**
    - Options: stage 1 only (control panel ask); stages 1 and 2 together.
    - The volumes and costs in the control panel are made up and need real figures.

16. **Model and endpoint.**
    - Product owner decides (`operating-model.md`). Engineering lead advises.
    - Must be a government-approved endpoint and pass agency data and security review.

17. **Agent or checklist.**
    - Options: continue with the agent; pivot to the checklist if officers don't trust it in testing (One Pager pivot trigger).
