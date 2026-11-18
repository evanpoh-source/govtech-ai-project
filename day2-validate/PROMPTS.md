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

**Result:** _fill in after you run it: what worked, what broke._

## 2. Behavior

**Prompt:** show the confidence interval that it might be wrong

**Forced failure:** flag it out to the officer that the ai is not confident

**Business rules:**
- show clearly if not sure

**Edge cases:**

**Result:** _fill in after you run it: what worked, what broke._

## 3. Refine

**Prompt:** clear next steps on where the user should fill up

**Business rules:**

**Edge cases:**

**Result:** _fill in after you run it: what worked, what broke._
