# bl/agents/

Register **Agents Under Test (AUT)**. An agent is identified by **(a) a phone number we
dial** and **(b) a free-text description** of what it does — that's all the user gives us.
We never see the user's bot's prompt, deployment, or platform.

## Files

- `createAgent.ts` — validate + persist `{ name, phone_number, description }`. Then
  trigger `bl/suite.generateFromDescription` so the user lands on a ready-to-run suite.
- `updateAgentDescription.ts` — change the description; offer a "regenerate suite"
  follow-up so the tests stay aligned with the bot's purpose.
- `getAgent.ts` / `listAgents.ts` — read helpers; `getAgent` includes a suite summary
  (test count, last-run status) for the agent-detail page.

The phone number is the only thing the tester dials. We do not provision it, validate
ownership, or care which platform sits behind it.
