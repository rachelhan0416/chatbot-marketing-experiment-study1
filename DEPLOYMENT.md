# Deployment Guide - Study1

## Required Components

1. Frontend static files:
- `index.html`
- `app.js`
- `styles.css`

2. Backend API proxy:
- `server_v2.py`
- environment variable: `OPENAI_API_KEY`

## Recommended Hosting

- Frontend: Netlify, Vercel, or GitHub Pages
- Backend: Render, Railway, Fly.io, or your own server

## Deployment Steps

1. Push Study1 files to GitHub.
2. Deploy frontend static site and get public URL.
3. Deploy `server_v2.py` as backend and get public API URL.
4. Set `OPENAI_API_KEY` in backend environment.
5. In researcher view, set Proxy URL to backend base URL (HTTPS).
6. Test both respondent condition links.

## Production URLs

- Researcher: `https://YOUR_DOMAIN/`
- Respondent collaborator: `https://YOUR_DOMAIN/?condition=collaborator`
- Respondent expert: `https://YOUR_DOMAIN/?condition=expert`

## Prelaunch Checklist

1. Backend `/chat` returns 200.
2. Researcher view shows controls.
3. Respondent URLs hide condition controls.
4. Final response appears in both conditions.
5. Transcript export includes condition metadata.

## Security

- Keep API key server-side only.
- Do not embed API key in frontend code.
- Use HTTPS for frontend and backend in production.
