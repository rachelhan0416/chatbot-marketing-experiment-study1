# Prolific Setup - Study1

Use neutral respondent links so condition labels are not visible in URL.

- Collaborator link: `https://YOUR_FRONTEND_DOMAIN/study1/go-collab.html`
- Expert link: `https://YOUR_FRONTEND_DOMAIN/study1/go-expert.html`

These pages set condition internally in session storage, then redirect to `study1/index.html`.

## Recommended setup

1. Create 2 Prolific studies (balanced n per condition).
2. Use the collaborator neutral link in one study.
3. Use the expert neutral link in the other study.
4. Keep eligibility and compensation identical.

## Validation before launch

1. Open each link in a fresh incognito window.
2. Confirm condition controls are hidden.
3. Complete one conversation in each condition.
4. Confirm transcript export includes `scenarioId` and `conditionSource`.
