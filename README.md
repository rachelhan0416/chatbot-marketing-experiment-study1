# chatbot-marketing-experiment-study1
AI-Consumer Chatbot Experiment Study1

# HealthyLifeAI Sleep Chatbot - Study1
Study1 is a hybrid chatbot experiment with two role-framing conditions:

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

## Conditions

### Collaborator

HealthyLifeAI introduces itself as a collaborator working side by side with the participant.

### Expert

HealthyLifeAI introduces itself as a sleep advisor/expert providing evidence-based guidance.

## Blinding and URL Assignment

- Without `condition` URL parameter: researcher view (unblinded)
- With `condition` URL parameter: respondent view (blinded + locked)

Local URLs:

- Researcher:  
  `file:///Users/rachel/Documents/Research/Research%20Start/Experiment/Experiment1_Chatbot/Study1/index.html`
- Respondent collaborator:  
  `file:///Users/rachel/Documents/Research/Research%20Start/Experiment/Experiment1_Chatbot/Study1/index.html?condition=collaborator`
- Respondent expert:  
  `file:///Users/rachel/Documents/Research/Research%20Start/Experiment/Experiment1_Chatbot/Study1/index.html?condition=expert`

## Run Locally

Start backend:

```bash
export OPENAI_API_KEY="YOUR_KEY_HERE"
python3 "/Users/rachel/Documents/Research/Research Start/Experiment/Experiment1_Chatbot/Study1/server_v2.py"
```

Then open one of the URLs above.

## Files

- `/Users/rachel/Documents/Research/Research Start/Experiment/Experiment1_Chatbot/Study1/index.html`
- `/Users/rachel/Documents/Research/Research Start/Experiment/Experiment1_Chatbot/Study1/app.js`
- `/Users/rachel/Documents/Research/Research Start/Experiment/Experiment1_Chatbot/Study1/styles.css`
- `/Users/rachel/Documents/Research/Research Start/Experiment/Experiment1_Chatbot/Study1/server_v2.py`
- `/Users/rachel/Documents/Research/Research Start/Experiment/Experiment1_Chatbot/Study1/DEPLOYMENT.md`
- `/Users/rachel/Documents/Research/Research Start/Experiment/Experiment1_Chatbot/Study1/PROLIFIC_SETUP.md`

## Troubleshooting

- `400 Unsupported parameter: temperature`:
  - Use `server_v2.py` (not `server.py`).
- `429 insufficient_quota`:
  - Billing/quota issue on API account/project.
- `Failed to connect to 127.0.0.1:8787`:
  - Backend is not running.
