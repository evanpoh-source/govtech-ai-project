# AI user flow: the person filling up the application is prompted when an input is incorrect or could be inaccurate

**Scenario:** A · ServiceSG enquiry response

All data in this file is synthetic.

## The moment

the person filling up the application is prompted when an input is incorrect or could be inaccurate

## The iceberg

### Above the line: what the user sees

a small danger button to prompt that the inout could be wrong or inaccurate

### Below the line

- Data: a repository of what accurate and correct fields look like
- Model: A language model that drafts the reply and cites the passage it used.
- Rules: do not reject an application, allow users to input anyway, but inform them if the AI feels it's incorrect
- Handoffs: Enquiries below the confidence threshold go to an officer with no draft.

## The flow

1. **Trigger:** A user enters the flow to fill up the ICA application
   - Trust gap: none
2. **AI step:** premptievely checks the users inputs and prompts the user which it feels are incorrect. at the end it should generate a report to the officer from the other end to summarise and call out the portions
   - Trust gap: Hallucination. the ai flags issues that are correct
3. **Human check:** The officer reads the suggestions, edits it, then approves. the user sees the flags and can decide whether to proceed or not
   - Trust gap: Black box. humans can make mistakes despite
4. **Outcome:** residents get prompted and fill information more accurately, officers can process applications faster and with less errors
   - Trust gap: none

## Fallback when the AI is unsure (Advanced)

Below the confidence threshold, don't  prompt. The enquiry goes to an officer to review.

## How we measure trust (Expert)

95% of all applications are called out correctly.
