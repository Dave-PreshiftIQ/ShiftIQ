# ShiftIQ™ — PreShiftIQ Platform

Fiduciary transportation technology matching platform.

## Structure
- `frontend/` — Next.js app (deploys to Vercel, serves `app.preshiftiq.com`)
- `backend/` — Express API + pg-boss worker (deploys to Railway, serves `api.app.preshiftiq.com`)

## Quick start (local)
```bash
npm install
psql $DATABASE_URL < backend/db/schema.sql
psql $DATABASE_URL < backend/db/migrations/002_vendor_audit_questions.sql
psql $DATABASE_URL < backend/db/migrations/003_vendor_lead_card_view.sql
psql $DATABASE_URL < backend/db/seeds/001_client_assessment.sql
psql $DATABASE_URL < backend/db/seeds/002_vendor_audit.sql
npm run dev
```
