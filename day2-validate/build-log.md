# Build log

**Scenario:** B · ICA passport applications and renewals

All data in this file is synthetic and made up.

## Riskiest assumption

The AI validates false positives and allows bad inputs to be submitted. At the same time, it tells the officer checking that the submission is correct. No one checks further, and the bad application proceeds.

This is the worst outcome: the system does not just fail to catch errors, it actively reassures the officer that everything is fine. The applicant thinks they submitted correctly, the officer trusts the report, and a bad application moves through the pipeline undetected.

### Risk type

Value risk. The system causes more harm than the status quo. Without the checker, officers at least review each field manually. With a checker that produces false positives, officers may stop reviewing fields the report marks as "OK", trusting the system. The 17% return rate could drop not because errors decreased, but because errors stopped being caught.

### Kill switch

If the checker marks a known-bad input as "OK" in the officer summary report during testing, stop. Do not deploy until the false-positive path is eliminated.

Concrete trigger: run a test set of deliberately bad submissions (wrong NRIC format, mismatched age vs application type, missing documents, invalid names). If any bad field appears as "OK" in the officer report, the kill switch fires.

### Success signal

On a test set of 10+ deliberately bad submissions, the checker catches 95% or more of the errors. Zero known-bad inputs are marked as "OK" in the officer summary report. Officers reviewing the flagged report can identify every error without needing to re-examine the raw submission.
