# backend/

Express + TypeScript backend for Rafiqq. See `/CLAUDE.md` at the project root for full context.

```
src/
├── server.ts              # Express app, mounts all routers
├── config.ts               # env var loading
├── middleware/
│   └── requireAuth.ts      # JWT bearer-token verification
├── services/
│   ├── geminiClient.ts     # Gemini API (Google AI Studio free tier) conversation orchestration
│   └── userStore.ts        # flat-file JSON user store (auth)
└── routes/
    ├── auth.ts              # signup / login / me — real (bcrypt + JWT)
    ├── voice.ts              # text -> Claude reply (STT/TTS are on-device in the app)
    ├── navigation.ts         # PLACEHOLDER route-steps stub
    ├── guide.ts               # PLACEHOLDER site history stub
    └── health.ts              # alert -> confirm -> escalate state machine (in-memory)
```

## Local development

```
npm install
cp .env.example .env   # fill in GEMINI_API_KEY and JWT_SECRET
npm run dev
```

Runs on `http://localhost:4000` by default (see `PORT` in `.env`).

## Deploying (needed so Expo Snack / a real phone can reach this backend)

Snack runs in the cloud and a physical phone off your home WiFi cannot reach
`localhost` on your laptop — the backend needs a public URL. Render's free
tier works well for a hackathon demo:

1. Push this repo to GitHub (see project root for git setup).
2. On [render.com](https://render.com), **New +** → **Web Service** → connect
   the GitHub repo.
3. Root directory: `backend`. Build command: `npm install && npm run build`.
   Start command: `npm start`.
4. Add environment variables in the Render dashboard: `GEMINI_API_KEY` (free,
   no billing card — get one at https://aistudio.google.com/apikey),
   `JWT_SECRET` (a long random string — see `.env.example` for how to
   generate one, or let the `render.yaml` Blueprint auto-generate it).
   Render sets `PORT` itself.
5. Deploy. Render gives you a public URL like
   `https://rafiqq-backend.onrender.com` — put that in `app/.env`'s
   `EXPO_PUBLIC_API_URL` (and in `app/snack-preview.js`'s `API_BASE`) to fix
   Snack/the app being unable to reach the backend.

A `render.yaml` at the project root lets Render auto-detect this service via
"New + → Blueprint" instead of the manual steps above.

**Free-tier caveats for the demo:** the instance spins down after ~15 minutes
idle (first request after that takes ~30-60s to wake up — mention this if
demoing live), and the user data file (`backend/data/users.json`) is on
ephemeral disk, so accounts created before a redeploy won't survive it. Fine
for a hackathon demo; swap `userStore.ts` for a real database before this
needs to survive redeploys long-term.
