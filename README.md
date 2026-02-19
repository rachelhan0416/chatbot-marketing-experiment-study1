# chatbot-marketing-experiment-study1

AI-consumer chatbot experiment (Study1).

## Study1 Overview

This project runs a hybrid chatbot experiment with two role-framing conditions:

- `collaborator`
- `expert`

The chatbot flow is controlled and consistent across conditions, with one LLM call at the final response stage.

## Experiment Structure

- Domain: sleep issues
- Bot name: `HealthyLifeAI`
- Backend model: `gpt-5-mini`
- Architecture:
  - Scripted turns for fixed structure
  - Final adaptive response from LLM only

## Conversation Flow

1. Scripted greeting (condition-specific)
2. Participant input (sleep issue)
3. Scripted efforts question
4. Participant input (efforts)
5. One LLM call for empathy + suggestions
6. Scripted closing question

## Blinding and Condition Assignment

- Without `condition` URL parameter: researcher view (unblinded)
- With `condition` URL parameter: respondent view (blinded + locked)

Condition URLs:

- `https://YOUR_FRONTEND_DOMAIN/?condition=collaborator`
- `https://YOUR_FRONTEND_DOMAIN/?condition=expert`

## Run Locally

From the repository root:

```bash
export OPENAI_API_KEY="YOUR_KEY_HERE"
python3 study1/server_v2.py
```

Open frontend locally:

- `study1/index.html`

## Deployment

- Frontend: GitHub Pages / Netlify / Vercel
- Backend: Render (or equivalent) running `study1/server_v2.py`

Set frontend proxy URL to your backend base URL, for example:

- `https://YOUR_RENDER_SERVICE.onrender.com`

## Repository Structure

- `study1/index.html`
- `study1/app.js`
- `study1/styles.css`
- `study1/server_v2.py`
- `study1/DEPLOYMENT.md`
- `study1/PROLIFIC_SETUP.md`

## Troubleshooting

- `400 Unsupported parameter: temperature`:
  - Use `server_v2.py` (not `server.py`).
- `429 insufficient_quota`:
  - Billing/quota issue on API account/project.
- `Failed to connect to backend`:
  - Backend is not running or proxy URL is incorrect.
