# Rafiqq (Hajj & Umrah Pilgrim Companion) — Project Context

> This file is the persistent context for this project. Attach/reference it in any new
> conversation to pick up where planning left off — no code has been written yet, this is
> still the pre-implementation planning phase.

## Vision

A mobile app for Hajj and Umrah pilgrims that acts as a multilingual local guide in their
pocket, built around a voice AI agent (no typing/menus). Pilgrims speak naturally in their
own language and the agent understands and responds conversationally. Three capabilities,
all in scope for v1 (not sequenced as "ship one, ignore the rest"):

1. **Navigation** — real-time directions around the holy sites (Masjid al-Haram, Mina,
   Arafat, Muzdalifah, Jabal al-Rahmah, etc.), since pilgrims get lost in dense crowds and
   language barriers make asking locals for help hard.
2. **Historical/spiritual guide** — when a pilgrim is near or asks about a site (e.g. Jabal
   al-Nour, the Kaaba), the agent shares its Islamic history and significance.
3. **Health companion** — manual symptom/profile reporting plus the pilgrim's own phone
   sensors (motion/fall detection) as the primary signal, with emergency escalation for
   critical conditions. A connected wearable (Apple Watch, smart ring, etc.) is an optional
   secondary enhancement for pilgrims who have one, not a requirement.

The goal: make the pilgrimage experience both logistically easier and spiritually richer.

Built with Claude Code. This is the first version / MVP.

## Key decisions made so far

- **Languages (v1):** English and Arabic only, working end-to-end. Architecture should
  make adding more languages (Urdu, Indonesian, Turkish, French, Swahili, local dialects —
  all named as eventual targets) a config/data change, not a rewrite.
- **Platform:** React Native + TypeScript (cross-platform default). Rationale: one
  codebase for iOS + Android (pilgrims split across both roughly evenly by source
  country), on-device phone sensors (expo-sensors, for the primary fall/motion-detection
  path) plus optional wearable health data (react-native-health / HealthKit, Google Fit, as
  a secondary enhancement), and audio I/O, and a TypeScript backend keeps the Claude API
  integration in one language across the stack.
- **No Google Maps / react-native-maps:** dropped after scoping it out — Android requires a
  Google Cloud billing account to activate the Maps SDK (a card-verification charge even
  though usage itself is free), not worth it here. `NavigationScreen.tsx` now uses
  `LeafletMapView.tsx`: real OpenStreetMap tiles fetched live over the internet, rendered via
  Leaflet.js inside a `react-native-webview` WebView — free, no API key, no billing account.
  Three example pins (Masjid al-Haram, Mina, Arafat) use real coordinates. Tradeoffs: (1)
  needs an internet connection to load tiles, which cuts against the offline-first
  requirement noted below — fine for now, not a solution for Hajj-scale connectivity; (2)
  only renders in a real native build (Expo Go on a device/simulator), not in Snack's
  browser-based web preview, since WebView is a native module. `SchematicSiteMap.tsx` (the
  earlier zero-dependency, no-internet-needed version) is kept in the repo unused as a
  candidate for an offline fallback later, not deleted.
- **Snack web preview map fix:** `snack-preview.js`'s `NavigationScreen` used to fall back to
  the old percentage-based schematic pin layout unconditionally, since it can't use
  `react-native-webview`. It now branches on `Platform.OS === 'web'` (true in Snack's browser
  preview) and renders a raw `React.createElement('iframe', { src:
  'https://www.openstreetmap.org/export/embed.html?...' })` instead — a plain HTML iframe
  works fine there because Snack's web preview runs on `react-native-web`/real DOM, unlike
  WebView which is native-only. Shows real OpenStreetMap tiles of the Makkah/Mina/Arafat
  corridor with a marker, plus a row of site-select pill buttons underneath (the iframe can't
  receive click events for custom pins the way the native WebView setup does). Falls back to
  the old percentage-pin layout when `Platform.OS !== 'web'` (i.e. a phone opened via Snack's
  Expo Go QR code, where iframes don't render).
- **Build order:** The voice conversation loop (STT → Claude → TTS, English/Arabic) is
  the shared foundation every other module sits on top of, so it's built first
  mechanically. Navigation, historical guide, and health are then built as parallel
  modules wired into that same voice interface — not fully finishing one before starting
  the next. This is a sequencing-for-dependencies decision, not a prioritization decision:
  all three matter equally for v1.
- **Emergency escalation model (health module):** Hybrid pattern, chosen because it has
  the lowest combined error rate of the options considered — modeled on how Apple Watch
  already handles fall detection:
  1. Detect a possible critical condition (from manual symptom/profile input, or from the
     phone's own motion sensors — e.g. a hard fall followed by no movement).
  2. Surface a loud, hard-to-miss alert with pre-filled info.
  3. Start a confirmation countdown window.
  4. If the pilgrim (or a linked companion) confirms or cancels, respect that.
  5. If there's no response within the window **and** the phone's motion sensors still
     indicate distress, auto-escalate — call for help and share location. If the pilgrim
     has optionally connected a wearable, its vitals (heart rate) can corroborate the
     signal, but the phone-sensor/manual path works fully without one.
  This avoids both failure modes of the simpler options: pure "require a tap" fails if the
  person is incapacitated (false negative); pure "fully automatic" over-triggers at Hajj
  scale (false positive risk to real emergency services).
- **Wearable integration is secondary, not primary:** manual reporting (the Health Profile
  card) and the phone's own sensors (motion/fall detection, always available since nearly
  every pilgrim carries a phone) are the main path. Apple Watch (HealthKit) and other
  consumer wearables are an **optional add-on** for pilgrims who happen to have one — the
  module must work fully for pilgrims without any wearable, which in practice is most of
  them, especially elderly pilgrims. This reverses an earlier framing that treated wearables
  as first-class/required.

## Open questions / blockers (need answers before real implementation of that module)

- **Maps/positioning data:** No source identified yet for floor plans, GPS boundaries, or
  POIs for the holy sites. GPS is unreliable inside Masjid al-Haram (multi-level, dense,
  reflective) and degrades in Mina/Arafat from sheer crowd density even outdoors — indoor
  positioning (BLE/WiFi) or a coarser "zone/gate" fallback needs a decision once data
  access is known. See `data/maps/README.md`.
- **Historical/spiritual content source:** No vetted, scholarly-reviewed corpus identified
  yet. This must ground the guide module's answers (RAG) rather than letting the model
  generate religious/historical content freely, given accuracy and sensitivity concerns.
  See `data/content/README.md`.
- **Network conditions:** ~2M+ pilgrims in a small area saturates cellular networks during
  Hajj. The app needs to be offline-first (cached maps, cached content, queued
  sync) rather than assuming live connectivity — affects navigation and voice-response
  caching design.
- **Emergency services integration — partially resolved:** the Health screen now has a
  direct-dial "Call Emergency — 999" button (`Linking.openURL('tel:999')` in
  `HealthScreen.tsx` and `snack-preview.js`; 999 is Saudi Arabia's police/general emergency
  number). This only opens the phone's own dialer pre-filled — the pilgrim still taps call
  themselves in the OS UI, deliberately not a silent auto-dial, given the real-world risk of
  a demo/test build accidentally placing a real emergency call. What's still missing: this
  isn't wired into the alert → confirm → escalate state machine's auto-escalate step (see
  the escalation model above) — that still needs a real Red Crescent/dispatch API
  integration with location sharing, not just a bare phone number, before it's real.
- **Voice stack specifics:** STT/TTS vendor(s) for Arabic + English not yet chosen: needs
  low latency and solid Arabic dialect coverage; still to be decided.
- ~~**Backend hosting/infra:**~~ **Resolved for v1** — Render free tier, deployed from
  GitHub. See "Backend hosting (decided)" below and `render.yaml` at the project root.
- ~~**Identity/auth provider:**~~ **Resolved for v1** — real backend email/password + JWT
  auth is now wired up (see "Auth (decided)" below). Phone OTP and/or Nafath (Saudi national
  digital identity) remain candidates for a stronger identity provider post-Kenz, given the
  target audience, but weren't feasible before the submission deadline (needs an SMS
  provider account/cost).

## Folder structure

```
/
├── CLAUDE.md              # this file — project context, read this first
├── render.yaml            # Render Blueprint — deploys backend/ (see Backend hosting)
├── .gitignore             # root-level; node_modules, .env, .claude/settings.local.json, etc.
├── app/                   # Expo React Native (TypeScript) mobile app — v1 scaffold exists
│   ├── App.tsx            # one scrollable page: all 5 modules (Voice / Navigation / Guide /
│   │                      # Health / Account) stacked, top bar with a ☰ jump-menu + EN/AR switcher
│   ├── snack-preview.js   # flattened single-file copy for pasting into snack.expo.dev
│   └── src/
│       ├── theme.ts       # design tokens (cream/teal palette, serif headings, spacing)
│       ├── hooks/         # useResponsive (tablet breakpoint + content max-width)
│       ├── components/    # Card, SectionHeader, PillButton, FloatingMicButton, StepSlider,
│       │                  # SchematicSiteMap, Illustration (MosqueMark/KaabaEmblem/MountainMark)
│       ├── screens/       # VoiceScreen, NavigationScreen, GuideScreen, HealthScreen, AccountScreen
│       ├── i18n/          # en/ar strings + rtl.ts (isRTL helper)
│       └── api/           # backend API client
├── backend/               # Express + TypeScript backend — v1 scaffold exists
│   └── src/
│       ├── server.ts
│       ├── config.ts      # env var loading (Gemini key, JWT secret)
│       ├── middleware/    # requireAuth.ts — verifies the JWT bearer token
│       ├── services/      # geminiClient.ts (dialogue), userStore.ts (flat-file auth store)
│       └── routes/        # auth.ts (real), voice.ts, navigation.ts (placeholder),
│                          # guide.ts (placeholder), health.ts
└── data/
    ├── maps/              # holy site maps/floor plans/geofences — currently empty, blocker
    ├── content/           # vetted Islamic history/significance corpus — currently empty, blocker
    └── translations/      # en/ar strings, extensible to more languages
```

## Voice stack (decided — revised, on-device STT/TTS, no ElevenLabs)

- **Superseded decision:** v1 originally used ElevenLabs (cloud) for both STT and TTS.
  Switched to on-device speech instead, so pilgrims (and this project) don't need an
  ElevenLabs account/API key/billing at all. `backend/src/services/elevenLabsClient.ts` was
  deleted; `ELEVENLABS_*` env vars and the `multer`/`/api/voice/audio` file-upload path are
  gone.
- **STT:** `@react-native-voice/voice` — wraps the phone's own OS speech recognition
  (`SFSpeechRecognizer` on iOS, Android's `SpeechRecognizer`). Free, no API key, but it's a
  **native module** — see the Expo Go tradeoff below.
- **TTS:** `expo-speech` — wraps the OS's built-in text-to-speech. Free, no API key, and
  (unlike the STT half) works fine in plain Expo Go since it ships inside the Expo Go
  client.
- **Reasoning/dialogue — superseded again: Gemini, not Claude.** v1 originally used the
  Anthropic API (`@anthropic-ai/sdk`, `claudeClient.ts`) for reasoning. Swapped to Google's
  Gemini API (Google AI Studio's free tier — `@google/genai`,
  `backend/src/services/geminiClient.ts`) because the Anthropic API has no permanent free
  tier and the project owner didn't want to pay for API credits ahead of the Kenz
  submission. Chosen over Groq (the other free-tier option considered) for generally
  stronger multilingual/Arabic quality. Important distinction: this is Google **AI
  Studio**'s free tier, a separate product from Google Cloud/Maps Platform billing (the
  thing dropped for maps, see the "No Google Maps" decision above) — no billing card
  required for this one, as of when this was wired up. Model used: `gemini-3.5-flash`
  (`gemini-2.5-flash`, the first choice, turned out to be no longer available to new API
  keys — Google returned a live 404 for it; verify against
  https://ai.google.dev/gemini-api/docs/models if this breaks again in the future, model
  availability shifts over time). Separate English/Arabic system prompts, same as the
  Claude version had.
- **Flow:** app listens via `Voice.start(locale)` → on-device transcript →
  `POST /api/voice/text { text, language }` → Gemini reply (text only, no backend audio
  handling anymore) → `Speech.speak(reply, { language })` plays it back on-device.
  Implemented in `app/src/screens/VoiceScreen.tsx`, `app/src/api/client.ts`
  (`sendVoiceText`), and `backend/src/routes/voice.ts`.
- Required env var (see `backend/.env.example`): `GEMINI_API_KEY` (get one free at
  https://aistudio.google.com/apikey) and `JWT_SECRET` (see Auth below).
- **Expo Go tradeoff (important):** `@react-native-voice/voice` requires native linking, so
  the Voice screen's mic **no longer works in plain Expo Go** — it needs a custom dev build
  (`eas build --profile development`, free Expo account) or a local Xcode/Android Studio
  build. `app/app.json` now declares the `@react-native-voice/voice` config plugin plus iOS
  `NSMicrophoneUsageDescription`/`NSSpeechRecognitionUsageDescription` and the Android
  `RECORD_AUDIO` permission, which only take effect through `expo prebuild`/EAS, not Expo
  Go. TTS (`expo-speech`) has no such restriction. `app/snack-preview.js` was already
  Expo-Go/Snack-safe before this change (its Voice screen simulates a canned request rather
  than using the mic) and needed no edits.

## Auth (decided — real backend email/password + JWT, no OTP/Nafath yet)

- **Chosen over phone OTP/Nafath for v1** because it's buildable and testable before the
  Kenz deadline with no external cost or account — no SMS provider, no government identity
  API integration. OTP/Nafath remain the natural next step post-submission (see the
  Identity/auth provider note above).
- **Backend:** `backend/src/routes/auth.ts` — `POST /api/auth/signup`, `POST
  /api/auth/login` (bcrypt-hashed passwords via `bcryptjs`, chosen over `bcrypt` since it's
  pure JS with no native build step to fail on a host's build server), `GET /api/auth/me`
  and `PATCH /api/auth/me` (both behind `backend/src/middleware/requireAuth.ts`, which
  verifies a `Bearer` JWT). Sessions are a signed JWT (`JWT_SECRET` env var, 30-day expiry),
  not a server-side session store.
- **User storage:** `backend/src/services/userStore.ts` — a flat JSON file
  (`backend/data/users.json`, gitignored), not a real database. Deliberately simple for a
  hackathon timeline; swap for a real DB before this needs to survive redeploys long-term
  (Render's free-tier disk is ephemeral — see "Backend hosting" below).
- **App:** `app/src/api/client.ts` adds `signup`/`login`/`logout`/`fetchCurrentUser`/
  `updateProfile`, storing the JWT via `@react-native-async-storage/async-storage` so a
  session survives an app restart. `app/src/screens/AccountScreen.tsx` was rewritten from
  the old local-only fake form to call these — it now has a real login/signup toggle, error
  display, and a session-restore check on mount. `app/snack-preview.js`'s `AccountScreen`
  was updated in parallel to call the same backend endpoints directly via `fetch` (kept
  dependency-light for Snack — the JWT lives in React state only, not AsyncStorage, so a
  Snack page reload logs you out; this is a Snack-preview-only limitation, not a real app
  one).

## Backend hosting (decided — Render free tier, deployed from GitHub)

- **Why this was needed:** Expo Snack runs in the cloud and cannot reach `localhost` on a
  developer's laptop — that's the literal cause of Snack's "cannot reach the backend"
  error. A phone off the same WiFi as the dev laptop has the same problem. The backend needs
  a public URL.
- **Render free tier** chosen over Railway/Fly.io mainly for its free-tier simplicity and a
  `render.yaml` Blueprint (see project root) that lets it auto-configure from the repo.
  Tradeoff accepted for the Kenz demo: the free instance spins down after ~15 min idle (a
  cold request after that takes ~30-60s to wake — worth mentioning if demoing live), and see
  the user-storage ephemeral-disk caveat above.
- **Flow:** push this repo to GitHub → Render **New + → Blueprint** picks up
  `render.yaml` → set `GEMINI_API_KEY` in the Render dashboard (`JWT_SECRET` is
  auto-generated by the blueprint) → Render gives a public URL → put that URL in
  `app/.env`'s `EXPO_PUBLIC_API_URL` and in `app/snack-preview.js`'s `API_BASE` constant.
  Full steps in `backend/README.md`.
- **Live as of this writing:** deployed at `https://rafiqq-backend.onrender.com`, already
  wired into `app/.env.example`'s default `EXPO_PUBLIC_API_URL` and
  `app/snack-preview.js`'s `API_BASE`. First deploy attempt failed
  (`npm error notarget @google/genai@^0.21.0` — a guessed version that was never published;
  fixed by checking the real latest version, `2.12.0`, against the npm registry). If this
  service is ever redeployed under a different URL, both of those need updating again.

## Development environment (important — no local Node install on this machine)

- **This dev machine's `C:` drive is nearly full** (was down to ~80MB free as of this
  writing), which made a local Node.js install fail outright (installer error 1603,
  `OutOfDiskSpace`). Practically nothing in `app/` or `backend/` has been run locally as a
  result — no `npm install`, no local `expo start`, no local backend `npm run dev`. Code has
  been written and reviewed by hand, not executed, until this is resolved.
- **Chosen workaround: do real installs/builds in the cloud, not on this machine.** Push to
  GitHub (already git-initialized at the project root — see `.gitignore`), then either (a)
  GitHub Codespaces for a full terminal with Node preinstalled and real disk (`npm install`
  for both `app/` and `backend/`, `expo start` with a tunnel to test on a phone, and later
  `eas build` for a custom dev client — see the Voice stack Expo Go tradeoff above), or (b)
  Render building the backend directly from the GitHub repo (see "Backend hosting" above),
  which needs no local Node at all. Expo Snack was already a cloud-side install for the app
  half and needed no change on this front — only its hardcoded `API_BASE` did.
- If disk space on this machine is freed up later, local Node install and the usual
  `npm install` workflow described in "Status" below becomes the simpler path again — the
  cloud workaround exists because of the disk constraint, not as a permanent architecture
  choice.

## Visual design (decided)

UI restyled to match the reference screenshots in `Aseels_screenshoots/` (a design your
partner built, e.g. via Lovable): warm cream background (`#FAF3E7`), deep teal-green accent
(`#3C7F63`), serif headings paired with a small outline icon per section (see
`src/components/SectionHeader.tsx`), rounded white cards (`src/components/Card.tsx`),
fully-rounded pill buttons in primary/secondary/outline variants
(`src/components/PillButton.tsx`), and a persistent floating mic button
(`src/components/FloatingMicButton.tsx`) rendered once at the app level so voice is always
one tap away no matter how far down the page you've scrolled; tapping it scrolls back up to
the Voice section. The Health screen was also
extended with a fatigue slider, age/conditions inputs, and a mobility-assistance toggle
(matching the reference's "Health Profile" card), on top of the existing alert → confirm →
escalate test buttons. All tokens live in `src/theme.ts` — change them there to retheme
everything at once. No new native dependencies were added (custom `StepSlider` instead of
`@react-native-community/slider`, `Switch` from RN core) to avoid installs we can't verify
on this machine yet.

**Elderly-readability pass:** target users skew elderly, so navigation favors legibility over
cleverness: pilgrimage-specific icons per destination (🎙️ Voice, 🧭 Navigation, 📖 Guide,
❤️ Health, 👤 Account, up from default icon-pack glyphs), a tinted pill behind the active
item, and big always-visible labels (17px in the menu — see below). `NavigationScreen.tsx`
got a bigger high-contrast placeholder-data banner, a schematic pin map (see
`SchematicSiteMap.tsx`), and clear "which site is selected" feedback — small, genuinely
useful affordances that don't depend on the still-missing real geodata.

**Navigation: one continuous scrollable page, with a hamburger (☰) menu of jump links —
not separate screens.** Went through three earlier shapes before landing here: a bottom tab
bar, an always-visible top tab row, then a hamburger menu that still *swapped* one full
screen for another — all three still meant only one module was visible/reachable at a time,
which didn't match "one page layout containing all the functionalities." `App.tsx` now
renders every module (Voice, Navigation, Guide, Health, Account) stacked in a single shared
`ScrollView`, each as its own `Card`-based section, in that order top to bottom. The minimal
top bar (brand mark + app name + ☰) stays fixed; tapping ☰ opens a `Modal`-based dropdown
(core React Native, no new dependency) listing all five destinations plus the EN/AR switcher.
Picking one doesn't mount a different component — each section records its own vertical
offset via `onLayout`, and the menu item calls `scrollTo({ y })` on the shared `ScrollView`
ref to jump there, then closes itself. Because every module is always mounted, each screen
component lost its own full-screen wrapper (`flex: 1`, its own background, its own
`FloatingMicButton`) in favor of being a plain stacked section — the page's `SafeAreaView`
owns the background and there's exactly one app-level floating mic button now, not five.
`NavigationScreen.tsx`'s map switched from `flex: 1` to a fixed height for the same reason
(a `flex: 1` child can't size itself inside `ScrollView` content). This also removes the
earlier `@react-navigation/bottom-tabs`-driven top bar, which fought the library's own
tab-bar height measurement and made the bar visibly jump between the very top and bottom of
the screen — plain `useState`/`useRef` avoids that class of bug entirely.
`@react-navigation/*` packages are still listed in `app/package.json` but are no longer
imported anywhere; left in place rather than removed since nothing has been `npm install`ed
yet. Kept nav/guide/health from merging, since they're locked as equally in-scope for v1 (see
Key decisions above); one page holds all five sections without cutting any of them.

**Small illustrations, no image assets or new dependencies:** `src/components/Illustration.tsx`
draws `MosqueMark` (dome + minaret brand mark, next to "Rafiqq" in the top bar), `KaabaEmblem`
(a dark cube with a gold band — the conventional respectful abstract stylization, not a
photographic/figurative image, which also suits the aniconic sensibility around depicting the
Kaaba) and `MountainMark` (a simple peak, for Jabal al-Nour). All three are plain nested
`View`s with border-radius/border-triangle tricks — no `react-native-svg`, no downloaded
image files, so nothing to verify-installs for. Used as a hero accent on the Voice screen and
as list-row icons on the Guide screen instead of bare text rows.

**Responsive:** `src/hooks/useResponsive.ts` exposes `contentMaxWidth` (640) and `isTablet`
(width ≥ 700). Every screen's outer card/content wrapper caps at `contentMaxWidth` and
centers itself, so layouts don't stretch edge-to-edge on tablets/web; on phones the cap is a
no-op.

**Arabic RTL:** translated strings already existed, but layout stayed left-to-right
regardless of language. `src/i18n/rtl.ts` exports `isRTL(language)`; every screen and shared
component (`SectionHeader`, `PillButton`, `FloatingMicButton`) now accepts an `rtl` prop that
flips row directions (`row-reverse`), text alignment, and `writingDirection`, and mirrors
side-anchored elements (floating mic button, `NavigationScreen`'s location chip/recenter
button) to the opposite edge. This is manual per-component mirroring rather than
`I18nManager.forceRTL()`, since that native API requires an app reload to take effect and
can't support switching languages live in-session.

**Account module (new, placeholder auth):** `AccountScreen.tsx` is a fifth tab — login form
(email/password, accepts anything locally) that reveals an editable profile (name, phone)
and an **Emergency Contact** card (name/phone) once "logged in". The emergency contact field
is the concrete home for the "linked companion" mentioned in the health module's escalation
model (see Key decisions above) — previously undefined where that contact would be entered.
Clearly marked as placeholder, matching the Navigation/Guide/Health convention: no real
identity provider is wired up (see new open question below), so this is local component
state only, not persisted or sent to the backend.

**Viewing the current UI (no local install, since Node.js isn't installed on this
machine):** `app/snack-preview.js` is a flattened, dependency-light copy of the restyled
app kept in sync with `app/App.tsx` + `app/src/`. To preview: open snack.expo.dev, set the
SDK version dropdown to 51.0.0, open `App.js`, select all, and paste in
`app/snack-preview.js`'s contents — it renders immediately in Snack's built-in web preview,
no login or install needed. (An anonymous Snack session can't be saved/shared without
logging into an Expo account, and this assistant won't do that on your behalf — so this
paste-it-yourself step is the fastest path, not a limitation of the code itself.) A shorter
version of this exact file was confirmed to compile with "No errors" in Snack; the full
current version wasn't re-verified live in-session because the automated browser tab hung
on the paste — that's a tooling constraint, not a known code issue.

**Confirmed again in a later session:** automated browser testing of snack.expo.dev
consistently fails from this assistant's side — screenshot/zoom calls time out (30s) and
the Monaco editor never receives typed/clipboard-injected content (clipboard-write is
denied by browser permissions, and `React.createElement`-driven typing into the editor
produced zero rendered lines). This looks like a rendering/permissions issue specific to
Snack's page, not a one-off. Don't keep retrying automated Snack testing in future
sessions — paste `snack-preview.js` in manually instead and report results back.

## Status

**A first-version scaffold now exists** for all three modules plus the voice loop:

- Voice loop (`app/src/screens/VoiceScreen.tsx` + `backend/src/routes/voice.ts`): fully
  wired end-to-end (on-device STT → Claude → on-device TTS → playback, see Voice stack
  above), just needs `GEMINI_API_KEY` and, for the mic specifically, a custom dev build
  instead of plain Expo Go (see the Expo Go tradeoff note above).
- Navigation (`app/src/screens/NavigationScreen.tsx` + `backend/src/routes/navigation.ts`):
  live OpenStreetMap tiles via `LeafletMapView.tsx` (WebView + Leaflet.js, free, no API key —
  see Key decisions above) with three real-coordinate example pins (Masjid al-Haram, Mina,
  Arafat), plus a stub route-steps response. Needs real holy-site POI/indoor-positioning data
  (see `data/maps/`) and an offline-tile strategy before this is Hajj-ready — live internet
  tiles won't hold up under the connectivity conditions described below.
- Guide (`app/src/screens/GuideScreen.tsx` + `backend/src/routes/guide.ts`): explicit
  placeholder — two example sites (Kaaba, Jabal al-Nour) with clearly-marked non-vetted
  placeholder text. Needs the real vetted content corpus (see `data/content/`).
- Health (`app/src/screens/HealthScreen.tsx` + `backend/src/routes/health.ts`): implements
  the alert → confirm → auto-escalate state machine in-memory. Manual reporting (the Health
  Profile card) and phone motion sensors are the primary path; a wearable is an optional,
  clearly-secondary toggle. No real phone-sensor fall detection, wearable vitals feed, or
  emergency-dispatch integration are wired up yet — those are the next real blockers.
- Account (`app/src/screens/AccountScreen.tsx`): real backend auth — signup/login/logout,
  editable profile and Emergency Contact card, all persisted via `backend/src/routes/auth.ts`
  + `userStore.ts` (see "Auth (decided)" above). No longer a local-only fake form.

**Environment note:** Node.js is still not installed on the development machine this
scaffold was written on (a local install attempt failed — the `C:` drive is nearly out of
space, see "Development environment" above), so none of this has been run/installed/tested
*locally* yet — it's been written and reviewed by hand, not generated by
`create-expo-app`/`npm install`. The plan is to install/build/test in the cloud instead
(GitHub Codespaces + Render) rather than wait on freeing local disk space. Before running:

1. Install Node.js LTS (v18+) — locally if there's disk space, otherwise in a cloud
   environment (GitHub Codespaces) per "Development environment" above.
2. `cd backend && npm install`, copy `.env.example` to `.env` and fill in
   `GEMINI_API_KEY` and `JWT_SECRET`, then `npm run dev`. For a public URL (needed for
   Snack or a phone off the same WiFi), deploy instead — see `backend/README.md`
   "Deploying" and "Backend hosting (decided)" above.
3. `cd app && npm install`, copy `.env.example` to `.env` (set `EXPO_PUBLIC_API_URL` to your
   machine's LAN IP for same-WiFi phone testing, or the deployed backend URL for Snack/
   off-WiFi/submission), then either `npm start` for Navigation/Guide/Health/Account (Expo Go
   works for those), or `eas build --profile development` (or a local `expo prebuild` +
   Xcode/Android Studio build) if you want the Voice screen's mic to actually work, since
   `@react-native-voice/voice` is a native module Expo Go can't load (see Voice stack above).

Next step after that first run: source real data for the two remaining blockers (holy-site
maps, vetted Islamic content corpus) and a wearable/emergency-dispatch integration target.
For the Kenz submission specifically: push to GitHub, deploy the backend on Render, update
`EXPO_PUBLIC_API_URL`/`snack-preview.js`'s `API_BASE` with that URL, and get a real device
test done (Expo Go for map/navigation/guide/health/account; a custom dev build for the
voice mic) — see "Development environment" above for how to do this without local disk
space.
