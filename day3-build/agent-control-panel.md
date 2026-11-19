# Agent control panel: ICA passport application checker

**Scenario:** B · ICA passport applications and renewals
**Instruction file:** `day3-build/CLAUDE.md`
**Run evidence:** `day3-build/agent-run-log.md` (R-0001 to R-0004)

All data, roles and results in this file are synthetic and made up. Not a real ICA system.

This page shows, on one screen, what the agent does, what it may do alone, and where a person takes over. If this page and `CLAUDE.md` disagree, `CLAUDE.md` wins and this page gets fixed.

## What the agent is doing

The agent checks one passport application before an officer sees it. It writes an Officer Summary Report that flags every field that breaks a rule, says how sure it is, and lists what it did not check.

The officer decides. The agent only suggests.

| | |
|---|---|
| Input | One submission (application type, fields, photo metadata, checkboxes) |
| Rules | `day2-validate/context-skill.md` and the known gaps in `day2-validate/living-prd.md` |
| Checks | `checker.js` field checks, situation checks from the rules, NRIC checksum (`NRIC_CHECKSUM`) |
| Output | One report, one log entry with no personal data |
| Worst outcome | A bad field shown to the officer as OK |

Status from the runs (made up):

| Run | Input | Outcome |
|---|---|---|
| R-0001 | Adult renewal, nothing wrong | Completed. Not trusted on review: NRIC was checked for format only |
| R-0002 | Foreign-born child, citizenship certificate | Escalated. Found that `checker.js` passes any document on a child application |
| R-0003 | Request to approve and skip checks | Refused |
| R-0004 | R-0001 rerun with `NRIC_CHECKSUM` | Completed, every NRIC check ran |

## Opportunity portfolio

The jobs this agent could take on, ranked by value to officers and how much harm a mistake would do. Only jobs marked **Live** are in `CLAUDE.md` today.

| Job | Value | Harm if wrong | Level | Status |
|---|---|---|---|---|
| Field checks (format, age vs type, relationship, photo file) | High: catches most of the 17% returns before submission | Low: rules are exact, officer still reviews | Decides alone | **Live** |
| Situation checks (document vs application type) | High: R-0002 found a gap `checker.js` misses | Medium: rules can be incomplete | Decides alone, escalates if not covered | **Live** |
| NRIC checksum | High: stops a one-letter typo passing as OK | Medium: made-up NRICs in the repo fail it today | Decides alone | **Live** in `CLAUDE.md`. Not in `checker.js` until test data is fixed |
| Draft the return reason for the officer | Medium: saves the officer writing it | Medium: a wrong reason confuses the applicant | Proposes and waits | Next |
| Next steps for the applicant on each flag (Refine prompt) | High: targets the 38% who don't read guidance | Low: guidance only, never blocks | Proposes and waits | Next. Refine prompt not yet run |
| Propose rule changes from overturned flags | Medium: keeps rules current | Medium: a bad rule affects every run | Proposes and waits | Next |
| Photo face checks (ICAO) | Medium | High: false flags on valid photos | A person reviews | Later. Needs a tested image model |
| Approve, return or reject an application | n/a | High: removes the officer's decision | Never | **Out.** Stays human |

## Rules of engagement

### Decides alone

The agent may do these without asking anyone. Each one still ends with an officer reviewing the report.

- Read one submission and the rules.
- Run the field checks, situation checks and NRIC checksum.
- Set each field to OK, Flagged, Manual review or Not checked.
- Set confidence: HIGH for exact rules, MEDIUM for cross-field rules, LOW when it is not sure.
- Send a field or the whole submission to manual review.
- Refuse an out-of-role request and stop the run.
- Write the report and the log entry.

### Proposes and waits

The agent writes a suggestion and does nothing until a person accepts it.

| Proposal | Goes to | Applied when |
|---|---|---|
| Rule change (for example, R-0002: child applications need a birth certificate) | Product team | One officer signs off and the kill switch test passes on the real `checker.js` |
| New bad case for `bad-submissions.csv` | Product team | Product team adds it to the test set |
| Draft return reason | Officer | Officer edits and sends it |
| Next-step guidance for the applicant | Product team, then officer | Tested with applicants first |

### A person reviews

A person checks the agent's work every time, before anything happens.

| What | Who | When |
|---|---|---|
| Every report | ICA officer (made-up role) | Every submission |
| LOW-confidence flags and manual review fields | ICA officer | Every time they appear. The report says "The checker is not sure" |
| Refused runs | ICA officer | The officer reviews the submission by hand or asks for a clean resubmission |
| Overturned flags | Product team | Weekly, from the log |
| Kill switch test | Product team | Before every rule change and before each run session |

## Stop conditions

The agent stops, writes no "All clear" report, logs the reason and tells the officer. Full wording is in `CLAUDE.md`.

| # | Stop when | What happens next |
|---|---|---|
| 1 | Kill switch: any known-bad field in `bad-submissions.csv` shows as OK on the real `checker.js` | All runs stop until the product team fixes it |
| 2 | Rules file missing, or changed since the kill switch last passed | Runs stop until the kill switch is rerun on the new rules |
| 3 | A check errors or returns nothing for a field | Field marked "Not checked, officer must review". Never OK |
| 4 | The submission may be real data | No report. Product team told |
| 5 | Out-of-role request: approve, reject, edit, contact, skip a check | Refused. Officer reviews by hand or asks for a clean resubmission (R-0003) |
| 6 | Situation the rules don't cover | Whole submission to manual review (R-0002) |

**Panel-level stop:** the product team pauses the agent if officers overturn HIGH flags on the same rule more than twice in a week, or if an officer finds any bad field the report showed as OK.

**Gap to close in `CLAUDE.md`:** stop condition 5 does not say what happens after a refusal. The "What happens next" column above is the proposed wording.

## What stays human

- **The decision.** Approve, return or reject. The agent never writes "approved", "rejected" or "ready to issue".
- **Changing what the applicant entered.** The agent flags and suggests. It never edits a field.
- **Talking to the applicant.** The agent never contacts anyone.
- **The rules.** The product team owns `context-skill.md` and `checker.js`. An officer signs off every change.
- **Judgement calls.** Foreign-born children, name changes, guardianship proof and any case the rules don't cover.
- **Photo face checks.** Face position, lighting and background, until an image check is tested.
- **Real data.** Moving from made-up to real data needs Gates 1 to 3 in `one-pager.md`, passed and signed off by a person.
- **Pausing the agent.** Any officer can ask the product team to pause it.

## Business owner questions

Questions the business owner asked before funding this, with answers. Volumes, costs and hours below are made up for the exercise. The 17%, six days, 38%, 35% and 10 weeks come from the scenario. Everything else is labelled made up.

### 1. What do I get, in numbers?

Made-up working, at 20,000 online applications a month:

| | Today | Target | Difference a month |
|---|---|---|---|
| Returns (17% to below 10%) | 3,400 | 2,000 | 1,400 fewer returns |
| Officer rework at 20 min per return (made up) | 1,133 hours | 667 hours | About 467 hours, roughly 3 officers' time |
| Applicant delay at six days per return | 20,400 days | 12,000 days | 8,400 days of waiting removed |

The officer hours are the main saving. They matter more because walk-in counters cover only about 35% of online demand. Every return avoided is capacity the channel won't have after the vendor leaves.

### 2. What is the evidence today?

Weak, and it's all made up. We have:
- A prototype that catches 13 of 13 known errors in a 12-case test set.
- Four agent runs: one completed, one escalated, one refused, one rerun.
- No real applicants, no officers, no measured time saving.

The 1,400 fewer returns is a target, not a result. The first thing funding buys is evidence (see question 8).

### 3. What does it cost?

Made-up estimate:

| Item | Cost |
|---|---|
| Build, weeks 1 to 8: 2 engineers, 1 product owner | Team time already in the channel replacement budget |
| Officer time: 2 officers, 4 hours a week, weeks 3 to 10 | About 64 officer hours |
| Running the agent: a model call per application, about S$0.02 (made up) | About S$400 a month |
| Rule upkeep after launch: product team, 1 day a month | About 12 days a year |

Against about 467 officer hours saved a month, if the target is met.

### 4. What happens if it's wrong?

Two ways it can be wrong:
- **It flags a correct field.** The applicant sees a warning and can submit anyway. Cost: some confusion. We track how often officers overturn flags, and the agent pauses if HIGH flags on one rule are overturned more than twice in a week.
- **It shows a bad field as OK.** This is the riskiest assumption. An officer still reviews every application and the agent never approves anything. The real risk is officers trusting a clean report and checking less.

**Added control (proposed):** for the first 4 weeks live, officers re-check 1 in 20 "0 flag" reports in full. Any bad field found that the report marked OK fires the kill switch.

### 5. Will it be ready in 10 weeks? What if it isn't?

The roadmap in `one-pager.md` goes live in weeks 9 to 10. If officer testing runs late:
- Go live with child renewals only. That's the most confused group and the case the test data covers.
- Fallback: launch the new channel with the field checks in `checker.js` and no agent. The agent can be added after launch. The vendor deadline doesn't depend on the agent.

### 6. Why an agent and not a plain checklist?

A plain checker gets most of the value. Field checks are rules, and the agent runs the same `checker.js`. The agent adds three things:
- **Situation checks** across fields. R-0002 found a child application with the wrong document that `checker.js` passed.
- **A report that says what it didn't check**, so "0 flags" can't hide a skipped check.
- **Refusal and escalation** when the case is out of scope or someone asks it to skip a check.

Each of these could become a fixed rule over time. If officers don't trust the agent in testing, the pivot in `one-pager.md` applies: drop the agent and keep the checklist.

### 7. Where does applicant data go?

Each application is checked in one run. The agent keeps no applicant data between runs and the logs hold field names and rule IDs only. Before real data is used, the model call has to run on a government-approved endpoint and pass agency data and security review. That review is not done and is not in the cost above.

### 8. What do you need from me?

- **Two officers for 4 hours a week** from week 3, for testing and rule sign-off.
- **One named officer** who signs off every rule change.
- **A decision on low-confidence flags:** does the applicant see them or only the officer? (`living-prd.md` section 6)
- **Agreement that photo face checks stay with officers** for now.

### 9. How will I know it's working, and when do I stop paying?

Fund in two stages, each with a gate:

| Stage | Weeks | Funds | Continue only if |
|---|---|---|---|
| 1. Prove it | 1 to 4 | Four must-do fixes from `living-prd.md`, 50+ case test set, officer testing | Zero bad fields shown as OK, catch rate 95%+, officers say the report saves time |
| 2. Launch | 5 to 10 | Child renewals live, then all application types | Stage 1 gate passed |
| After launch | Week 4 live | Running cost | Return rate falling from 17%. If not, stop or pivot to checklist only |

**What we're asking for:** stage 1 only. Stage 2 comes back to you with the stage 1 results.
