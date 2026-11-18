# Context skill: ICA passport application validation

**Scenario:** B · ICA passport applications and renewals

All examples and data in this file are synthetic and made up.

## Purpose

Give the checker enough context to validate whether a complete application makes sense for the applicant's situation, not just whether individual fields match a format. The riskiest assumption is that the checker marks a bad input as OK and the officer trusts the report. Format checks alone cannot catch situation-level errors (wrong document for the application type, mismatched relationships, incomplete sets of required fields). This context skill fills that gap.

## Sources

- ICA passport application requirements (ica.gov.sg)
- ICA photo guidelines (ica.gov.sg/photo-guidelines)
- Synthetic database of 20 correct submissions (`data/correct-submissions.csv`)
- Synthetic database of 12 known-bad submissions (`data/bad-submissions.csv`)
- Common return reasons documented by officers (synthetic, based on scenario brief)

## Rules

### Application type determines required fields

| Application type | Required documents | Who can apply |
|---|---|---|
| New passport (adult, 16+) | Photo, NRIC | The applicant themselves |
| Renewal (adult, 16+) | Photo, NRIC | The applicant themselves |
| New passport (child, below 16) | Photo, child's NRIC or birth cert number, birth certificate, parent/guardian NRIC | Parent or legal guardian only |
| Renewal (child, below 16) | Photo, child's NRIC, birth certificate (if name differs or first renewal), parent/guardian NRIC | Parent or legal guardian only |

### Document combination rules

- Birth certificate is required for all child applications.
- Deed poll is required only if the applicant's current name differs from the name on the birth certificate or NRIC.
- Marriage certificate is required only if the name changed due to marriage.
- Adoption order is required only if the child was adopted and the applying parent is the adoptive parent.
- Citizenship certificate is required only for naturalised citizens applying for the first time.
- Selecting "no additional documents" on a child application is always wrong.

### Cross-field validation rules

- If the application is for a child, the applicant (parent/guardian) must be a different person. Parent NRIC must differ from child NRIC.
- If the relationship is "legal guardian", proof of guardianship (court order or letter) is required.
- Only mother, father, or legal guardian can apply for a child. Siblings, grandparents, and others cannot.
- The applicant's date of birth must match the application type: under 16 for child applications, 16 or above for adult applications.
- Child NRIC for Singapore-born children starts with T. Foreign-born children with citizenship may start with other prefixes.

### Photo rules (from ICA photo guidelines)

- Digital colour photo, taken within the last 3 months.
- Accepted formats: JPG, JPEG, PNG, HEIC, HEIF.
- Dimensions for online upload: 400 x 514 pixels.
- Maximum file size: 8 MB.
- No filters, enhancements, or altered facial features.
- Must meet ISO/ICAO specifications.

## Good example 1: Adult renewal, no complications (made up)

| Field | Value |
|---|---|
| Application type | Renewal (age 16 and above) |
| Full name | CHEN MEI LING |
| NRIC | S8345678E |
| Date of birth | 1983-07-14 |
| Email | meiling.chen@example.com |
| Phone | 91234567 |
| Photo | JPG, 400x514, taken 2 weeks ago, no filters |
| Supporting document | No additional documents needed |
| Declaration | Confirmed |

**Why this is correct:** Adult renewal, name unchanged, all fields filled, format valid, photo meets ICA guidelines, no additional documents needed because the name matches the NRIC.

## Good example 2: Child new passport, parent applying (made up)

| Field | Value |
|---|---|
| Application type | New passport (below 16) |
| Full name | TAN JUN HAO |
| NRIC | T2345678B |
| Date of birth | 2019-03-22 |
| Email | sarah.tan@example.com |
| Phone | 81234567 |
| Parent NRIC | S7912345A |
| Relationship | Mother |
| Photo | JPG, 400x514, taken 1 month ago, no filters |
| Supporting document | Birth certificate |
| Declaration | Confirmed |

**Why this is correct:** Child application with parent applying. Child NRIC starts with T (Singapore-born). Parent NRIC is different from child's. Mother is an accepted relationship. Birth certificate provided (required for child applications). Photo meets all ICA guidelines.

## Bad example: Child renewal, multiple errors (made up)

| Field | Value |
|---|---|
| Application type | Renewal (below 16) |
| Full name | tan wei lin |
| NRIC | S8234567A |
| Date of birth | 2017-09-09 |
| Email | test@example.com |
| Phone | 91234567 |
| Parent NRIC | S8234567A |
| Relationship | Grandparent |
| Photo | BMP, 300x400, taken 6 months ago, beauty filter applied |
| Supporting document | No additional documents needed |
| Declaration | Not confirmed |

**What's wrong and what the checker should flag:**

| Field | Error | Should the checker flag this? |
|---|---|---|
| Full name | Lowercase, not BLOCK LETTERS | Yes |
| NRIC | Starts with S, not T (child born in SG should be T) | Yes |
| Parent NRIC | Same as child's NRIC | Yes |
| Relationship | Grandparent cannot apply for a child | Yes |
| Photo format | BMP not accepted (only JPG, JPEG, PNG, HEIC, HEIF) | Yes |
| Photo dimensions | 300x400, should be 400x514 | Yes |
| Photo recency | Taken 6 months ago, must be within 3 months | Yes (via checkbox) |
| Photo editing | Beauty filter applied, ICA prohibits enhancements | Yes (via checkbox) |
| Supporting document | Child application without birth certificate | Yes |
| Declaration | Not confirmed | Yes |

**If the checker marks any of these as OK in the officer report, the kill switch fires.**

## Owner

The product team owns this context skill. Officers review it when rules change.

## Review trigger

Review and update this context skill when:

- ICA changes passport application requirements or document rules.
- ICA updates photo guidelines.
- Officers report a new category of return that the checker does not catch.
- The false positive test (`test-false-positives.html`) fails after a rule change.
- Quarterly, at minimum, to confirm rules are still current.

## Test questions and expected answers

All questions and answers below are synthetic and made up.

### Q1: I'm renewing my 8-year-old son's passport. What documents do I need?

**Expected answer:** You need a passport-sized digital colour photo of your child (JPG/JPEG/PNG/HEIC/HEIF, 400x514 px, taken within the last 3 months, no filters), your child's birth certificate, your child's NRIC, and your own NRIC. As the parent, you can apply on their behalf. The child's passport will be valid for 5 years.

### Q2: I'm the child's grandmother. Can I submit the application?

**Expected answer:** No. Only a parent (mother or father) or a legal guardian with proof of guardianship (court order or letter) can apply on behalf of a child below 16. A grandparent is not accepted. The child's parent or legal guardian must submit the application.

### Q3: My child's name on the birth certificate is different from the name we use now. What do I need?

**Expected answer:** You need to provide a deed poll in addition to the birth certificate. The deed poll shows the legal name change. In the application, select "Deed poll" as the supporting document type and explain the reason for the name difference.

### Q4: I'm an adult renewing my own passport. My name hasn't changed. Do I need any supporting documents?

**Expected answer:** No additional supporting documents are needed for a standard adult renewal with no name change. You need your NRIC and a passport photo that meets ICA guidelines (400x514 px, JPG/JPEG/PNG/HEIC/HEIF, taken within the last 3 months, no filters or enhancements).

### Q5: I uploaded a PNG photo that is 800x1028 pixels. Will it be accepted?

**Expected answer:** PNG is an accepted format, but the dimensions are wrong. ICA requires online uploads to be exactly 400 x 514 pixels. Resize the photo to 400x514 using image editing software without applying enhancements or filters, then upload again.
