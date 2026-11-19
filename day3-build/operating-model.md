# Operating model: ICA passport application checker agent

**Scenario:** B · ICA passport applications and renewals
**Built from:** `SCENARIO-PICK.md`, `one-pager.md`, `day3-build/agent-control-panel.md`, `day3-build/ai-prd.md`

All roles in this file are made up for the exercise. Roles only, no names.

This file says who decides what about the agent once it is built. The agent decides nothing on its own beyond what `ai-prd.md` Permissions allows. Every decision below belongs to a person.

## Roles

| Role | Who they are | What they own |
|---|---|---|
| Business owner | ICA lead for the online channel (made-up role) | Funding, go-live and retiring the agent. Accountable for the 17% return rate |
| Product owner | Owns the AI PRD and the control panel | Scope, permissions, vendor and model, the open decisions in `ai-prd.md` |
| Product team | Builds and runs the agent day to day | `context-skill.md`, test data, weekly log review |
| Engineering lead | Leads the build | The harness, `checker.js`, storage. Advises on the model and endpoint |
| Sign-off officer | One named ICA officer (open decision 14 in `ai-prd.md`) | Incidents: pause, fix and restart. Signs off every rule change against current policy |
| Vetting officers | ICA officers who review applications | The decision on every application. Report errors and false flags |
| Security and data protection officer | Agency security and data role | Data handling, endpoint approval, data incidents |
| Applicants | People applying for or renewing a passport | Their own application. They see warnings and choose to fix or submit |

## Decision rights

| Decision | Harness part | Who decides | Who is consulted | Who is told |
|---|---|---|---|---|
| **Scope:** what jobs the agent does, and launch scope | Instructions (`CLAUDE.md` Goal) and the opportunity portfolio | Product owner | Business owner, sign-off officer, engineering lead | Vetting officers, product team |
| **Permissions:** the setting (auto, confirm or block) for each action | Tools and Permissions table (`ai-prd.md`), enforced by the harness | Product owner | Sign-off officer, engineering lead, security and data protection officer | Vetting officers, business owner |
| **Vendor and model:** which model, on which endpoint | Model and endpoint | Product owner | Engineering lead, security and data protection officer, business owner (cost) | Product team |
| **Go-live:** move from made-up data to real applications | Gates 1 to 3 (`one-pager.md`) and the kill switch test | Business owner | Product owner, engineering lead, sign-off officer, security and data protection officer | Vetting officers, applicants (through the new channel) |
| **Incident:** pause, fix and restart after a stop condition, a bad field shown as OK, or a data issue | Stop conditions, kill switch and logs | Sign-off officer | Product owner, engineering lead, security and data protection officer (if data is involved) | Business owner, vetting officers |
| **Retire:** stop the agent or pivot to a checklist | Stop and pivot triggers (`one-pager.md`) and the metrics plan | Business owner | Product owner, vetting officers, engineering lead | Product team, applicants (if the channel changes) |

**How the rows work in practice:**
- **Scope:** a scope change that needs more money goes to the business owner as a funding decision.
- **Permissions:** the agent stops itself on stop conditions 1 to 6 without waiting for anyone. This row covers what a person changes afterwards.
- **Vendor and model:** the engineering lead advises on fit and cost. Security must approve the endpoint before the product owner can choose it.
- **Incident:** any vetting officer can ask the sign-off officer to pause the agent. The sign-off officer decides whether to pause, what fix is needed, and when to restart.
- **Applications:** none of this changes who decides an application. A vetting officer decides every one.
