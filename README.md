# Resona

Psychometric matchmaking MVP (South Africa first). Compatibility is driven by assessment + AI scoring — photos are optional only after a mutual match.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- **Firebase** Auth (email/password), Firestore, Storage (post-match photos)
- Prisma/SQLite kept as an optional offline legacy path (`npm run db:*`)

## Quick start

```bash
cp .env.example .env.local
# Fill NEXT_PUBLIC_FIREBASE_* from Firebase console (Web app config)
# Place a service account JSON at ./secrets/resona123-admin.json (gitignored)
#   or set FIREBASE_SERVICE_ACCOUNT_PATH / FIREBASE_SERVICE_ACCOUNT_KEY

npm install
npm run firebase:seed
npm run dev   # http://127.0.0.1:3000
```

Demo login: `you@resona.app` / `demo1234`

## Firebase project

- Project ID: `resona123`
- Console: https://console.firebase.google.com/project/resona123/overview
- CLI: always `npx -y firebase-tools@latest …` (never bare `firebase`)
- Active project: `npx -y firebase-tools@latest use resona123`

### Console enablement checklist

1. **Authentication** → Sign-in method → Email/Password → Enable  
   (also deployable via `firebase.json` `auth.providers.emailPassword` + `deploy --only auth`)
2. **Firestore** → Create database (Native mode). Rules live in `firestore.rules`.
3. **Storage** → Get Started (requires billing on the Firebase/GCP project). Rules in `storage.rules`.  
   Until Storage is enabled, post-match photo uploads fall back to `public/uploads/`.

Deploy rules:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules --project resona123
# after Storage is enabled:
npx -y firebase-tools@latest deploy --only storage --project resona123
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run firebase:seed` | Seed Auth + Firestore demo users |
| `npm run firebase:deploy-rules` | Deploy Firestore/Storage rules |
| `npm run db:seed` | Legacy Prisma/SQLite seed |

## Repo

https://github.com/tenderbriefing/get_married
