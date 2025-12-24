# Friends and Family Web App Template

A "blank canvas" Next.js template for building private, invite-only web apps for friends and family.
Features strict admin-controlled user management and SMS-based "magic link" authentication via custom JWTs.

## Architecture

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend Services**: Supabase (Auth, DB), Twilio (SMS).
- **Admin**: Python scripts (`backend/`) for inviting users.
- **Auth Flow**:
  1. Admin runs script -> Creates Invite -> Sends SMS with link.
  2. User clicks link (`/activate?code=...`).
  3. Frontend validates code -> API mints Custom JWT (1 year expiry) -> Session established.

## Prerequisites

- Node.js 18+
- Python 3.11+ (with `uv` installed)
- Supabase Project
- Twilio Account

## Setup

### 1. Supabase Setup

1. Create a new Supabase project.
2. Go to SQL Editor and run the schema in `supabase/schema.sql`.
3. Go to Project Settings -> API and get:
   - Project URL
   - Anon Key
   - Service Role Key (Keep secret!)
   - JWT Secret (Settings -> API -> JWT Settings)

### 2. Environment Variables

**Frontend (`.env.local`)**:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_PROJECT_ID=your_project_id
```

**Backend (`backend/.env`)**:

```bash
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### 3. Install Dependencies

**Frontend**:

```bash
yarn install
```

**Backend**:

```bash
cd backend
uv sync
```

## Usage

### Inviting Users (Admin)

Use the Python script to invite users. This will create the user in Supabase (if needed), create an invite record, and optionally send the SMS.

```bash
cd backend
# Create invite and print link (no SMS)
uv run python admin.py invite "+15551234567" --url "http://localhost:3000"

# Create invite and SEND SMS
uv run python admin.py invite "+15551234567" --send --url "https://your-production-url.com"
```

### Running the Website

```bash
yarn dev
```

Visit `http://localhost:3000/activate?code=...` to test the flow.

## Deployment (Vercel)

1. Push to GitHub.
2. Import project in Vercel.
3. Add Environment Variables (same as `.env.local`).
4. Deploy.

## Notes

- **Session Expiry**: The custom JWT is set to expire in 1 year.
- **Security**: The `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` are sensitive. Never expose them to the client (they are only used in Server Components/API Routes).
- **Types**: Run `yarn update-types` to refresh TypeScript definitions from your Supabase project (requires Supabase CLI and `SUPABASE_PROJECT_ID` env var).
